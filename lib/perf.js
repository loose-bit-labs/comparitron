// lib/perf.js — bench-JSON -> leaderboard entry builder + upsert.
//
// Shared by bin/bench-parallel.js (end-of-run upsert) and bin/import-bench.js
// (backfill from existing bench JSONs): one schema, one gate.
//
// The gate is per-leg: only legs whose contamination verdict is exactly "clean"
// are written. A contaminated leg never reaches the leaderboard, and a dirty
// c=1 means no c1Tps scalar (the scalar must stay comparable to tps-vllm.js).

const path = require('node:path')
const fs = require('node:fs')
const leaderboard = require('./leaderboard')

const RESULTS_DIR = path.join(__dirname, '..', 'results')

function isClean(leg) {
  return leg && leg.summary && leg.summary.contamination === 'clean'
}

// Build a leaderboard entry from a bench_parallel JSON object ({meta, runs[]}).
// Returns null when no leg is clean (caller should log the skip, not crash).
function buildPerfEntry(bench, { hardware, alias, note } = {}) {
  if (!hardware) throw new Error('buildPerfEntry: hardware is required')
  const meta = bench.meta || {}
  const runs = (bench.runs || []).filter(isClean)
  if (!runs.length) return null

  const c1 = runs.find((r) => Number(r.summary.concurrency) === 1)
  const num = (v) => { const n = Number(v); return isNaN(n) ? null : n }

  const legs = runs.map((r) => ({
    concurrency: Number(r.summary.concurrency),
    aggTps: num(r.summary.aggTps),
    perStreamTps: num(r.summary.perStreamTps),
    ttftP50s: num(r.summary.ttftP50s),
    ttftP95s: num(r.summary.ttftP95s),
    itlP50ms: num(r.summary.itlP50ms),
    itlP95ms: num(r.summary.itlP95ms),
    itlP99ms: num(r.summary.itlP99ms),
  }))

  const entry = {
    model: alias || meta.model || 'unknown',
    hardware,
    lastTested: (meta.started || new Date().toISOString()).slice(0, 10),
    perf: {
      tool: meta.tool || null,
      started: meta.started || null,
      ggufBytes: meta.ggufBytes || null,
      cards: meta.cards || null,
      busGbps: meta.busGbps || null,
      achievedGBsPerCard: c1 ? num(c1.summary.achievedGBsPerCard) : null,
      legs,
      gpu: ((c1 && c1.summary.gpu && c1.summary.gpu.cards) || []).map((c) => ({
        name: c.name,
        utilMean: c.utilMean,
        powerMean: c.powerMean,
        tempP95: c.tempP95,
      })),
    },
  }
  // Flat per-concurrency scalars for the clean legs (c1Tps, c2Tps, ...) —
  // c1Tps is the solo-stream value comparable to the tps-vllm/tps.js rows.
  // perf.legs above keeps the full percentile detail.
  for (const l of legs) entry[`c${l.concurrency}Tps`] = Math.round(l.aggTps)
  if (note) entry.notes = note
  return entry
}

// Upsert into results/leaderboard.json (shallow merge per existing row).
function upsertPerf(entry) {
  leaderboard.upsert(entry)
  return entry
}

// Convenience: build + upsert from a file on disk.
function importFile(file, opts) {
  const bench = JSON.parse(fs.readFileSync(file, 'utf8'))
  const entry = buildPerfEntry(bench, opts)
  if (entry) upsertPerf(entry)
  return entry
}

module.exports = { RESULTS_DIR, isClean, buildPerfEntry, upsertPerf, importFile }
