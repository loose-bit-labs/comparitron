#!/usr/bin/env node
const https = require('node:https')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const cache = require('../lib/cache')

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'
const API_KEY = process.env.ANTHROPIC_API_KEY

if (!API_KEY) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1) }

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300)
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function run() {
  console.log(`[claude-runner] model: ${MODEL}`)

  for (const scenario of config.capabilities) {
    const prompts = JSON.parse(fs.readFileSync(path.join(config.capabilitiesDir, `${scenario}.json`), 'utf8'))
    console.log(`\n[claude-runner] ${scenario}: ${prompts.length} prompts`)

    for (const prompt of prompts) {
      const cachePath = cache.responsePath(config.resultsDir, scenario, prompt.id, MODEL)
      if (cache.read(cachePath)) {
        console.log(`  SKIP  ${MODEL}/${prompt.id} (cached)`)
        continue
      }
      process.stdout.write(`  RUN   ${MODEL}/${prompt.id} ... `)
      try {
        const start = Date.now()
        const data = await callClaude(prompt.prompt)
        const latencyMs = Date.now() - start
        const content = data.content[0].text
        const responseTokens = data.usage?.output_tokens ?? null
        const promptTokens = data.usage?.input_tokens ?? null
        const tokensPerSec = responseTokens && latencyMs
          ? Math.round(responseTokens / (latencyMs / 1000))
          : null

        cache.write(cachePath, {
          scenario, promptId: prompt.id, model: MODEL,
          prompt: prompt.prompt, content,
          latencyMs, tokensPerSec, promptTokens, responseTokens,
        })
        console.log(`${tokensPerSec ?? '?'}t/s  ${latencyMs}ms  (${responseTokens} tokens)`)
      } catch (err) {
        console.log(`ERR: ${err.message}`)
      }
    }
  }
  console.log('\n[claude-runner] done — run jury to score')
}

run().catch(err => { console.error(err.message); process.exit(1) })
