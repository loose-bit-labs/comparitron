#!/usr/bin/env node
// import-bench.js — backfill leaderboard rows from existing bench-parallel JSON files.
// Same schema and per-leg contamination gate as the live upsert (lib/perf.js).
//
// Usage:
//   node bin/import-bench.js <bench-*.json> [-- <bench-*.json> ...] --hardware v620x2 --alias qwen3.8:27b-q8_k_xl [--note "text"]
//
// One --alias per invocation (each file is one model). Exit 1 if any file
// yields no clean legs (that model gets no row).

const path = require('node:path')
const perf = require(path.join(__dirname, '..', 'lib', 'perf'))

const args = process.argv.slice(2)
let hardware = null, alias = null, note = null
const files = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--hardware') hardware = args[++i]
  else if (a === '--alias') alias = args[++i]
  else if (a === '--note') note = args[++i]
  else files.push(a)
}

if (!files.length || !hardware || !alias) {
  console.error('usage: node bin/import-bench.js <bench-*.json>... --hardware <id> --alias <model> [--note "text"]')
  process.exit(2)
}

let failed = 0
for (const f of files) {
  const entry = perf.importFile(f, { hardware, alias, note })
  if (entry) {
    const scalars = Object.keys(entry).filter((k) => /^c\d+Tps$/.test(k)).sort()
    console.log(`[import] ${f} -> ${entry.model} @ ${hardware} (clean legs: ${entry.perf.legs.map((l) => 'c' + l.concurrency).join(',')}${scalars.length ? ` — ${scalars.map((k) => `${k} ${entry[k]}`).join(', ')}` : ' — no clean c=1'})`)
  } else {
    failed++
    console.error(`[import] ${f} -> SKIPPED — no clean legs (contamination gate)`)
  }
}
process.exit(failed ? 1 : 0)
