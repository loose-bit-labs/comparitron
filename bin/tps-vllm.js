#!/usr/bin/env node
// TPS benchmark against a vLLM (OpenAI-compatible) endpoint.
// Start vLLM first: vllm serve <model> --tensor-parallel-size 2
// Usage: node bin/tps-vllm.js [--host URL] [--model NAME] [--runs N]
//   --host  vLLM base URL (default: http://localhost:8000)
//   --model model name as passed to vllm serve (default: auto-detected from /v1/models)
//   --runs  number of generation passes (default: 3)

const http = require('node:http')
const https = require('node:https')
const path = require('node:path')
const leaderboard = require(path.join(__dirname, '..', 'lib', 'leaderboard'))

const PROMPT = 'Explain how neural networks learn using a detailed analogy involving a chef learning to cook. Be thorough and use vivid, concrete details.'

function parseArgs() {
  const args = process.argv.slice(2)
  let host = 'http://localhost:8000', model = null, alias = null, runs = 3, hardware = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') host = args[++i]
    else if (args[i] === '--model') model = args[++i]
    else if (args[i] === '--alias') alias = args[++i]
    else if (args[i] === '--runs') runs = parseInt(args[++i], 10)
    else if (args[i] === '--hardware') hardware = args[++i]
  }
  return { host, model, alias, runs, hardware }
}

function post(host, path, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(host)
    const mod = parsed.protocol === 'https:' ? https : http
    const payload = JSON.stringify(body)
    const req = mod.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300)
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function get(host, path) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(host)
    const mod = parsed.protocol === 'https:' ? https : http
    mod.get({ hostname: parsed.hostname, port: parsed.port, path }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

function lpad(s, n) { return String(s).padStart(n) }

async function detectModel(host) {
  const data = await get(host, '/v1/models')
  return data.data?.[0]?.id ?? null
}

async function main() {
  const { host, runs, hardware, alias } = parseArgs()
  let { model } = parseArgs()

  if (!model) {
    process.stdout.write(`[tps-vllm] detecting model from ${host}/v1/models ... `)
    model = await detectModel(host)
    if (!model) { console.error('no model found — pass --model explicitly'); process.exit(1) }
    console.log(model)
  }

  console.log(`\n[tps-vllm] model: ${model}`)
  console.log(`[tps-vllm] host:  ${host}`)
  console.log(`[tps-vllm] runs:  ${runs}\n`)

  const results = []
  for (let i = 0; i < runs; i++) {
    process.stdout.write(`  RUN [${i + 1}/${runs}] ... `)
    const start = Date.now()
    try {
      const data = await post(host, '/v1/chat/completions', {
        model,
        messages: [{ role: 'user', content: PROMPT }],
        temperature: 0.7,
        stream: false,
        think: false,
      })
      const latencyMs = Date.now() - start
      const completionTokens = data.usage?.completion_tokens ?? null
      const tps = completionTokens && latencyMs ? Math.round(completionTokens / (latencyMs / 1000)) : null
      results.push({ tps, completionTokens, latencyMs })
      console.log(`${tps ?? '?'} t/s  (${completionTokens ?? '?'} tokens, ${latencyMs}ms)`)
    } catch (err) {
      console.log(`ERR: ${err.message}`)
      results.push({ tps: null })
    }
  }

  const valid = results.filter(r => r.tps != null)
  if (!valid.length) { console.error('\n[tps-vllm] all runs failed'); process.exit(1) }

  const avgTps = Math.round(valid.reduce((s, r) => s + r.tps, 0) / valid.length)
  const avgTokens = Math.round(valid.reduce((s, r) => s + r.completionTokens, 0) / valid.length)
  const avgMs = Math.round(valid.reduce((s, r) => s + r.latencyMs, 0) / valid.length)

  const leaderboardName = alias || model
  console.log('\n' + '─'.repeat(50))
  console.log(`  model:      ${leaderboardName}`)
  console.log(`  avg t/s:    ${avgTps}`)
  console.log(`  avg tokens: ${avgTokens}`)
  console.log(`  avg time:   ${avgMs}ms`)
  if (hardware) console.log(`  hardware:   ${hardware}`)
  console.log('─'.repeat(50))

  if (hardware) {
    const date = new Date().toISOString().slice(0, 10)
    leaderboard.upsert({ model: leaderboardName, hardware, lastTested: date, c1Tps: avgTps })
    console.log(`\n[tps-vllm] leaderboard updated (${leaderboardName} @ ${hardware} = ${avgTps} t/s)`)
  } else {
    console.log('\n[tps-vllm] pass --hardware <id> to update the leaderboard')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
