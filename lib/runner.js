const fs = require('fs')
const path = require('path')
const config = require('../config')

const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false })
const OllamaClient = require('./ollama')
const cache = require('./cache')
const runs = require('./runs')

async function run(runId) {
  const ollama = new OllamaClient(config.ollamaHost, config.chatTimeoutMs)
  runs.writeMeta(config, runId)

  for (const scenario of config.capabilities) {
    const prompts = JSON.parse(fs.readFileSync(path.join(config.capabilitiesDir, `${scenario}.json`), 'utf8'))
    console.log(`\n[runner] ${scenario}: ${prompts.length} prompts × ${config.candidates.length} models`)

    for (const candidate of config.candidates) {
      let warmed = false
      for (const prompt of prompts) {
        const cachePath = cache.responsePath(config.resultsDir, scenario, prompt.id, candidate)
        const cached = cache.read(cachePath)
        if (cached) {
          // backfill timing into run even for cached responses
          if (cached.tokensPerSec || cached.latencyMs)
            runs.writeTiming(config, runId, scenario, prompt.id, candidate,
              { tokensPerSec: cached.tokensPerSec, promptEvalRate: cached.promptEvalRate, loadDurationMs: cached.loadDurationMs, latencyMs: cached.latencyMs })
          process.stdout.write(`  SKIP  ${candidate}/${prompt.id}\n`)
          continue
        }
        if (!warmed) {
          process.stdout.write(`  WARM  ${candidate} ... `)
          await ollama.warmup(candidate)
          console.log('ready')
          warmed = true
        }
        process.stdout.write(`  ${ts()}  RUN   ${candidate}/${prompt.id} ... `)
        try {
          const result = await ollama.chat(
            candidate,
            [{ role: 'user', content: prompt.prompt }],
            { temperature: config.candidateTemp, think: false }
          )
          cache.write(cachePath, {
            scenario, promptId: prompt.id, model: candidate,
            prompt: prompt.prompt, ...result,
          })
          runs.writeTiming(config, runId, scenario, prompt.id, candidate,
            { tokensPerSec: result.tokensPerSec, promptEvalRate: result.promptEvalRate, loadDurationMs: result.loadDurationMs, latencyMs: result.latencyMs })
          console.log(`${result.tokensPerSec ?? '?'}t/s  ${result.latencyMs}ms`)
        } catch (err) {
          console.log(`ERR: ${err.message}${err.cause ? ' | cause: ' + err.cause : ''}`)
        }
      }
    }
  }
  console.log('\n[runner] done')
}

module.exports = { run }
