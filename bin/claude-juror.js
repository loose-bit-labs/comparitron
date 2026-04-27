#!/usr/bin/env node

// Runs claude-sonnet-4-6 as a juror, scoring all cached candidate responses
// via the Anthropic API. Writes to the same results/scores/ cache format as
// lib/jury.js so the aggregator picks it up automatically.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... node bin/claude-juror.js
//   ANTHROPIC_API_KEY=sk-... node bin/claude-juror.js --dry-run

const https = require('node:https')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const cache = require('../lib/cache')
const { parseJudgeResponse } = require('../lib/parse-judge')

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'
const API_KEY = process.env.ANTHROPIC_API_KEY
const DRY_RUN = process.argv.includes('--dry-run')

if (!API_KEY && !DRY_RUN) { console.error('ANTHROPIC_API_KEY not set (use --dry-run to estimate cost)'); process.exit(1) }

const JUDGE_SYSTEM = `You are a strict, impartial technical evaluator.

RULES — read carefully:
- You do NOT know which AI model produced the response you are scoring. Do not guess.
- Do NOT favor responses that resemble your own writing style, structure, or vocabulary.
- "Familiar" feeling responses are a bias signal, not a quality signal.
- A different approach is not automatically wrong.
- Score 5 only for genuinely excellent work. Be aggressive about identifying flaws.
- Score each dimension independently against the rubric — do not let overall impression override it.`

function buildJudgePrompt(prompt, response) {
  const truncated = response.length > config.maxJudgeResponseChars
    ? response.slice(0, config.maxJudgeResponseChars) + '\n\n[... truncated for evaluation ...]'
    : response
  return `## Prompt given to the model:
${prompt}

## Model's response:
${truncated}

## Evaluate step by step:
1. What exactly did the prompt ask for?
2. Did the response fulfill it completely? What is missing or incorrect?
3. Is it concise, or does it pad with preamble / repetition / filler?
4. Is the output format correct for this task?

## Then score these dimensions (1–5 each):
- instruction_following: Did it do exactly what was asked?
- correctness: Is the content accurate and correct?
- conciseness: No padding, unnecessary preamble, or repetition?
- format_compliance: Correct output format for this task?

Return your evaluation as JSON on the final line. No markdown fences.
{"reasoning": "<2-3 sentence summary of evaluation>", "scores": {"instruction_following": N, "correctness": N, "conciseness": N, "format_compliance": N}}`
}

function callClaude(userPrompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: JUDGE_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
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
  const juror = MODEL
  const responsesDir = path.join(config.resultsDir, 'responses')

  if (!fs.existsSync(responsesDir)) {
    console.error('[claude-juror] no responses cached — run runner first'); process.exit(1)
  }

  const responses = fs.readdirSync(responsesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => cache.read(path.join(responsesDir, f)))
    .filter(Boolean)

  const pending = responses.filter(r => {
    const cp = cache.scorePath(config.resultsDir, r.scenario, r.promptId, r.model, juror)
    return !cache.read(cp)
  })

  console.log(`[claude-juror] juror: ${juror}`)
  console.log(`[claude-juror] ${responses.length} responses total, ${pending.length} pending`)

  if (!pending.length) { console.log('[claude-juror] all cached, nothing to do'); return }

  // cost estimate: ~500 input tokens + ~200 output tokens per score
  const estInputTokens = pending.length * 500
  const estOutputTokens = pending.length * 200
  console.log(`[claude-juror] estimated tokens: ~${estInputTokens} input / ~${estOutputTokens} output`)
  console.log(`[claude-juror] (actual cost depends on current Anthropic pricing — check console.anthropic.com)`)

  if (DRY_RUN) { console.log('[claude-juror] dry run — exiting'); return }

  let scored = 0, errors = 0
  for (const r of pending) {
    const { scenario, promptId, model: candidate, prompt, content } = r
    const scorePath = cache.scorePath(config.resultsDir, scenario, promptId, candidate, juror)
    const isSelfJudge = candidate === juror

    process.stdout.write(`  SCORE ${candidate}/${promptId}${isSelfJudge ? ' [self]' : ''} ... `)
    try {
      const start = Date.now()
      const data = await callClaude(buildJudgePrompt(prompt, content))
      const latencyMs = Date.now() - start
      const text = data.content[0].text
      const parsed = parseJudgeResponse(text)
      const tokensPerSec = data.usage?.output_tokens && latencyMs
        ? Math.round(data.usage.output_tokens / (latencyMs / 1000))
        : null

      cache.write(scorePath, {
        scenario, promptId, candidate, juror, isSelfJudge,
        reasoning: parsed.reasoning,
        scores: parsed.scores,
        tokensPerSec,
      })
      const scoreStr = Object.values(parsed.scores).join('/')
      console.log(`[${scoreStr}]  ${latencyMs}ms`)
      scored++
    } catch (err) {
      console.log(`ERR: ${err.message}`)
      errors++
    }
  }

  console.log(`\n[claude-juror] done — ${scored} scored, ${errors} errors`)
}

run().catch(err => { console.error(err.message); process.exit(1) })
