#!/usr/bin/env node
// Runs capability prompts against any OpenAI-compatible endpoint.
// Responses are cached in the same format as lib/runner.js so the
// existing jury, aggregator, and watcher pick them up automatically.
//
// Usage:
//   node bin/vllm-runner.js --host http://<host>:<port>
//   node bin/vllm-runner.js --host http://<host>:<port> --alias qwen3.6:35b-a3b
//   node bin/vllm-runner.js --host http://<host>:<port> --model <explicit-name>

const http = require('node:http')
const https = require('node:https')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const cache = require('../lib/cache')

function parseArgs() {
  const args = process.argv.slice(2)
  let host = 'http://localhost:8000', model = null, alias = null, hardware = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') host = args[++i]
    else if (args[i] === '--model') model = args[++i]
    else if (args[i] === '--alias') alias = args[++i]
    else if (args[i] === '--hardware') hardware = args[++i]
  }
  return { host, model, alias, hardware }
}

function request(host, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(host)
    const mod = parsed.protocol === 'https:' ? https : http
    const payload = body ? JSON.stringify(body) : null
    const headers = { 'Content-Type': 'application/json' }
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload)
    const req = mod.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: urlPath,
      method,
      headers,
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
    if (payload) req.write(payload)
    req.end()
  })
}

async function detectModel(host) {
  const data = await request(host, 'GET', '/v1/models')
  return data.data?.[0]?.id ?? null
}

async function chat(host, model, prompt) {
  const start = Date.now()
  const data = await Promise.race([
    request(host, 'POST', '/v1/chat/completions', {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.candidateTemp,
      stream: false,
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`chat timeout after ${config.chatTimeoutMs / 1000}s`)), config.chatTimeoutMs)
    ),
  ])
  const latencyMs = Date.now() - start
  const content = data.choices?.[0]?.message?.content ?? ''
  const responseTokens = data.usage?.completion_tokens ?? null
  const promptTokens = data.usage?.prompt_tokens ?? null
  const tokensPerSec = responseTokens && latencyMs
    ? Math.round(responseTokens / (latencyMs / 1000))
    : null
  return { content, latencyMs, tokensPerSec, promptTokens, responseTokens }
}

const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false })

async function run() {
  const { host, alias, hardware } = parseArgs()
  let { model } = parseArgs()

  if (!model) {
    process.stdout.write(`[vllm-runner] detecting model from ${host}/v1/models ... `)
    model = await detectModel(host)
    if (!model) { console.error('no model found — pass --model explicitly'); process.exit(1) }
    console.log(model)
  }

  const displayName = alias || model
  console.log(`\n[vllm-runner] host:     ${host}`)
  console.log(`[vllm-runner] model:    ${model}`)
  if (alias)    console.log(`[vllm-runner] alias:    ${alias}`)
  if (hardware) console.log(`[vllm-runner] hardware: ${hardware}`)
  console.log('')

  for (const scenario of config.capabilities) {
    const prompts = JSON.parse(fs.readFileSync(path.join(config.capabilitiesDir, `${scenario}.json`), 'utf8'))
    console.log(`\n[vllm-runner] ${scenario}: ${prompts.length} prompts`)

    for (const prompt of prompts) {
      const cachePath = cache.responsePath(config.resultsDir, scenario, prompt.id, displayName)
      if (cache.read(cachePath)) {
        console.log(`  SKIP  ${displayName}/${prompt.id} (cached)`)
        continue
      }
      process.stdout.write(`  ${ts()}  RUN   ${displayName}/${prompt.id} ... `)
      try {
        const result = await chat(host, model, prompt.prompt)
        cache.write(cachePath, {
          scenario, promptId: prompt.id, model: displayName,
          prompt: prompt.prompt, ...result,
          ...(hardware ? { hardware } : {}),
        })
        console.log(`${result.tokensPerSec ?? '?'}t/s  ${result.latencyMs}ms  (${result.responseTokens ?? '?'} tokens)`)
      } catch (err) {
        console.log(`ERR: ${err.message}`)
      }
    }
  }
  console.log('\n[vllm-runner] done — run jury to score')
}

run().catch(err => { console.error(err.message); process.exit(1) })
