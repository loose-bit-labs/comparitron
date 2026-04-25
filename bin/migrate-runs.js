#!/usr/bin/env node
// One-shot migration: synthesize a runs/ entry from existing response files.
// Safe to re-run — only writes missing entries.
const fs = require('fs')
const path = require('path')
const config = require('../config')
const cache = require('../lib/cache')
const runs = require('../lib/runs')

const responsesDir = path.join(config.resultsDir, 'responses')
if (!fs.existsSync(responsesDir)) { console.error('No responses dir found'); process.exit(1) }

const responses = fs.readdirSync(responsesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => cache.read(path.join(responsesDir, f)))
  .filter(Boolean)

// Derive a stable runId from the earliest response date embedded in filenames,
// falling back to a fixed legacy tag.
const runId = '2026-04-25_chonko-p40_coding-reasoning-structured-summary'
const dir = runs.runDir(config, runId)

const metaPath = path.join(dir, 'meta.json')
if (!fs.existsSync(metaPath)) {
  runs.writeMeta(config, runId)
  // patch the date to match the actual run date
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  meta.date = '2026-04-25T10:22:00.000Z'
  meta.note = 'Synthesized from existing response files by migrate-runs.js'
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
  console.log(`[migrate] wrote meta.json → ${metaPath}`)
} else {
  console.log(`[migrate] meta.json already exists, skipping`)
}

const timingsPath = path.join(dir, 'timings.json')
if (!fs.existsSync(timingsPath)) {
  const timings = {}
  for (const r of responses) {
    if (r.tokensPerSec || r.latencyMs) {
      timings[`${r.scenario}:${r.promptId}:${r.model}`] = {
        tokensPerSec: r.tokensPerSec ?? null,
        latencyMs: r.latencyMs ?? null,
      }
    }
  }
  fs.writeFileSync(timingsPath, JSON.stringify(timings, null, 2))
  console.log(`[migrate] wrote timings.json (${Object.keys(timings).length} entries) → ${timingsPath}`)
} else {
  console.log(`[migrate] timings.json already exists, skipping`)
}

console.log(`[migrate] done — runId: ${runId}`)
