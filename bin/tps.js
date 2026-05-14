#!/usr/bin/env node
// Quick tokens-per-second benchmark across all candidates.
// Usage: node bin/tps.js [--runs N] [--unload] [model1 model2 ...]
// Defaults: 2 runs per model, models from config.candidates (excludes embed/vision)

const config = require('../config')
const OllamaClient = require('../lib/ollama')
const leaderboard = require('../lib/leaderboard')

const SKIP = ['nomic-embed-text', 'llava']
const PROMPT = 'Explain how neural networks learn using a detailed analogy involving a chef learning to cook. Be thorough and use vivid, concrete details.'

function parseArgs() {
  const args = process.argv.slice(2)
  let runs = 2, unload = false, hardware = null
  const models = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runs') runs = parseInt(args[++i], 10)
    else if (args[i] === '--unload') unload = true
    else if (args[i] === '--hardware') hardware = args[++i]
    else models.push(args[i])
  }
  return { runs, unload, hardware, models }
}

function pad(s, n) { return String(s).padEnd(n) }
function lpad(s, n) { return String(s).padStart(n) }

async function bench(ollama, model, runs) {
  process.stdout.write(`  WARM  ${model} ... `)
  const warmStart = Date.now()
  await ollama.chat(model, [{ role: 'user', content: 'Hi' }], { temperature: 0 })
  const loadMs = Date.now() - warmStart
  console.log(`loaded in ${loadMs}ms`)

  const results = []
  for (let i = 0; i < runs; i++) {
    process.stdout.write(`  RUN   ${model} [${i + 1}/${runs}] ... `)
    try {
      const r = await ollama.chat(model, [{ role: 'user', content: PROMPT }], { temperature: 0.7 })
      results.push(r)
      console.log(`${r.tokensPerSec ?? '?'} t/s  (${r.responseTokens ?? '?'} tokens, ${r.latencyMs}ms)`)
    } catch (err) {
      console.log(`ERR: ${err.message}`)
    }
  }

  const valid = results.filter(r => r.tokensPerSec != null)
  const avgTps = valid.length ? Math.round(valid.reduce((s, r) => s + r.tokensPerSec, 0) / valid.length) : null
  const avgTokens = valid.length ? Math.round(valid.reduce((s, r) => s + (r.responseTokens ?? 0), 0) / valid.length) : null
  return { model, avgTps, loadMs, avgTokens, runs: valid.length }
}

async function main() {
  const { runs, unload, hardware, models: cliModels } = parseArgs()
  const ollama = new OllamaClient(config.ollamaHost, config.chatTimeoutMs)

  const candidates = cliModels.length
    ? cliModels
    : config.candidates.filter(m => !SKIP.some(s => m.startsWith(s)))

  console.log(`\n[tps] ${candidates.length} models × ${runs} runs each`)
  console.log(`[tps] host: ${config.ollamaHost}\n`)

  const summary = []
  for (const model of candidates) {
    try {
      const result = await bench(ollama, model, runs)
      summary.push(result)
      if (unload) {
        await ollama.unload(model)
        console.log(`  EVICT ${model}`)
      }
    } catch (err) {
      console.log(`  FAIL  ${model}: ${err.message}`)
      summary.push({ model, avgTps: null, loadMs: null, avgTokens: null, runs: 0 })
    }
    console.log()
  }

  summary.sort((a, b) => (b.avgTps ?? -1) - (a.avgTps ?? -1))

  console.log('─'.repeat(62))
  console.log(`${pad('MODEL', 28)} ${lpad('T/S', 6)}  ${lpad('LOAD', 8)}  ${lpad('AVG_TOK', 8)}`)
  console.log('─'.repeat(62))
  for (const r of summary) {
    const tps = r.avgTps != null ? lpad(r.avgTps, 6) : lpad('ERR', 6)
    const load = r.loadMs != null ? lpad(`${r.loadMs}ms`, 8) : lpad('-', 8)
    const tok = r.avgTokens != null ? lpad(r.avgTokens, 8) : lpad('-', 8)
    console.log(`${pad(r.model, 28)} ${tps}  ${load}  ${tok}`)
  }
  console.log('─'.repeat(62))

  const hw = hardware || config.hardware?.tag
  if (hw) {
    const date = new Date().toISOString().slice(0, 10)
    for (const r of summary) {
      if (r.avgTps == null) continue
      leaderboard.upsert({ model: r.model, hardware: hw, lastTested: date, tps: r.avgTps })
    }
    console.log(`\n[tps] leaderboard updated (${summary.filter(r => r.avgTps != null).length} models, hw=${hw})`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
