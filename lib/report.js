const fs = require('fs')
const path = require('path')
const config = require('../config')
const { aggregate } = require('./aggregate')
const { readMeta, latestRunId } = require('./runs')
const leaderboard = require('./leaderboard')

const fmt = (v, d = 2) => v != null ? v.toFixed(d) : '—'
const pct = (v, max) => v != null ? `${Math.round(v / max * 100)}%` : '—'

function mdTable(headers, rows, aligns) {
  const sep = headers.map((_, i) => aligns?.[i] === 'r' ? '---:' : aligns?.[i] === 'c' ? ':---:' : ':---')
  return [
    '| ' + headers.join(' | ') + ' |',
    '| ' + sep.join(' | ') + ' |',
    ...rows.map(r => '| ' + r.map(c => String(c ?? '—')).join(' | ') + ' |'),
  ].join('\n')
}

function run(runId) {
  const resolvedRunId = runId || latestRunId(config)
  const data = aggregate(config, resolvedRunId)
  if (!data.scoreCount) { console.log('[report] no scores yet'); return }

  const meta = resolvedRunId ? readMeta(config, resolvedRunId) : null
  const { weights, maxScore } = data
  const dims = Object.keys(weights)
  const dimLabels = { correctness: 'Correct', instruction_following: 'Following', format_compliance: 'Format', conciseness: 'Concise' }

  const lines = []

  // build per-model hardware and TPS lookup from response cache + leaderboard
  const dateSlug = (resolvedRunId || new Date().toISOString()).slice(0, 10)
  const hwSlug = config.hardware?.tag || 'unknown'
  const hwCache = {}
  const responsesDir = path.join(config.resultsDir, 'responses')
  if (fs.existsSync(responsesDir)) {
    for (const f of fs.readdirSync(responsesDir)) {
      if (!f.endsWith('.json')) continue
      try {
        const d = JSON.parse(fs.readFileSync(path.join(responsesDir, f), 'utf8'))
        if (d.model && d.hardware && !hwCache[d.model]) hwCache[d.model] = d.hardware
      } catch {}
    }
  }
  const lbRows = leaderboard.read()
  const lbTpsFor = (model) => { const row = lbRows.find(r => r.model === model); return row ? (row.c1Tps ?? row.tps ?? null) : null }

  // collect unique hardware IDs present in this report
  const hwIds = [...new Set(data.rows.map(r => hwCache[r.model] || hwSlug))]
  const hwLabel = hwIds.length > 1 ? hwIds.join(' + ') : hwIds[0] || hwSlug

  // header
  lines.push(`# Comparitron — ${dateSlug} (${hwLabel})`, '')
  if (meta) {
    lines.push(
      `**Date:** ${new Date(meta.date).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })} EST  `,
      `**Hardware:** ${hwLabel}  `,
      `**Gauntlet:** ${meta.scenarios?.length || config.capabilities.length} scenarios · ${data.responseCount / (meta.candidates?.length || 1) | 0} prompts · ${meta.candidates?.length || '?'} candidates  `,
      `**Jurors:** ${(meta.jurors || config.jurors || []).join(', ')}`,
      '',
    )
  }

  // rankings
  lines.push('---', '', '## Rankings', '')
  const rankHeaders = ['Model', 'hw', 'Score', 'c1 t/s', 'prefill t/s', ...config.capabilities.map(s => s.slice(0, 9)), 'Votes', 'Self Δ']
  const rankAligns = ['l', 'l', 'r', 'r', 'r', ...config.capabilities.map(() => 'r'), 'r', 'r']
  const rankRows = data.rows.map(r => {
    const score = r.peer != null ? `**${r.peer.toFixed(2)}**` : '—'
    const hw = hwCache[r.model] || hwSlug
    const speed = (lbTpsFor(r.model) ?? r.avgSpeed) != null ? `${lbTpsFor(r.model) ?? r.avgSpeed}` : '—'
    const prefill = r.avgPrefill != null ? `${r.avgPrefill}` : '—'
    const delta = r.delta != null ? (r.delta >= 0 ? `+${r.delta.toFixed(2)}` : r.delta.toFixed(2)) : '—'
    const sceneFmt = r.sceneCols.map((v, i) => {
      const s = fmt(v)
      const votes = r.sceneVotes?.[i] ?? 0
      return votes < data.maxVotesPerScene ? `${s} *(${votes})` : s
    })
    return [r.model, hw, score, speed, prefill, ...sceneFmt, r.votes, delta]
  })
  lines.push(mdTable(rankHeaders, rankRows, rankAligns), '')
  lines.push(`> **Score** = scenario-weighted average of per-prompt jury scores (max ${data.maxScore}). **c1 t/s** = solo-stream (concurrency 1) generation speed — leaderboard c1Tps, or this run's response cache if absent. **prefill t/s** = prompt ingestion speed. Treat as directional, not precise.  `)
  lines.push(`> **—** = no data. **\\*(n)** = incomplete jury coverage for this scenario (n prompts scored vs ${data.maxVotesPerScene} max) — score is directional only.`, '')

  // jury matrix
  lines.push('---', '', '## Jury Matrix', '')
  lines.push(`> Row = candidate · Col = juror · Cell = median raw score (1–5) · [bracketed] = self-score`, '')
  const matHeaders = ['Candidate / Juror', ...data.models.map(m => m.split(':')[0])]
  const matRows = data.models.map(candidate => {
    const cells = data.models.map(juror => {
      const v = data.matrix[candidate][juror]
      if (v == null) return '—'
      return candidate === juror ? `**[${v.toFixed(1)}]**` : v.toFixed(1)
    })
    return [candidate, ...cells]
  })
  lines.push(mdTable(matHeaders, matRows), '')

  // contested
  if (data.contested.length) {
    lines.push('---', '', '## Contested Results', '')
    lines.push('> Jury disagreement σ > 1.0 — these scores should be interpreted cautiously.', '')
    data.contested.forEach(c => lines.push(`- \`${c.key}\` — σ = ${c.sd.toFixed(2)} (${c.n} jurors)`))
    lines.push('')
  }

  // self-preference
  lines.push('---', '', '## Self-Preference Index', '')
  lines.push('> Positive Δ = model scores itself higher than peers do. > +0.5 is flagged as self-serving.', '')
  const biasRows = data.rows
    .filter(r => r.delta != null)
    .map(r => {
      const tag = Math.abs(r.delta) < 0.2 ? 'calibrated'
        : r.delta > 0.5 ? '⚠ self-serving'
        : r.delta < -0.3 ? 'self-deprecating'
        : ''
      const delta = (r.delta >= 0 ? '+' : '') + r.delta.toFixed(2)
      return [r.model, fmt(r.peer), fmt(r.self), delta, tag]
    })
  lines.push(mdTable(['Model', 'Peer', 'Self', 'Δ', 'Flag'], biasRows, ['l', 'r', 'r', 'r', 'l']), '')

  const md = lines.join('\n')
  const outDir = path.join('docs', 'reports')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${dateSlug}_${hwSlug}.md`)
  fs.writeFileSync(outPath, md)
  console.log(md)
  console.log(`\n[report] saved → ${outPath}`)

  // upsert all ranked models into the leaderboard
  // per-model hardware: read from any cached response file (vllm-runner stores it there)
  const defaultHw = hwSlug
  const date = dateSlug

  for (const r of data.rows) {
    if (r.peer == null) continue
    const hw = hwCache[r.model] || defaultHw
    const entry = {
      model: r.model,
      hardware: hw,
      lastTested: date,
      c1Tps: (lbRows.find(lb => lb.model === r.model && lb.hardware === hw)?.c1Tps ?? lbRows.find(lb => lb.model === r.model && lb.hardware === hw)?.tps ?? r.avgSpeed ?? null),
      prefillTps: r.avgPrefill ?? null,
      score: r.peer,
      votes: r.votes ?? null,
      selfDelta: r.delta ?? null,
      vramTotal: leaderboard.readHardware()[hw]?.vramTotal ?? config.hardware?.vramTotal ?? null,
      vramUsed: null,
    }
    for (let i = 0; i < config.capabilities.length; i++) {
      entry[config.capabilities[i]] = r.sceneCols[i] ?? null
    }
    leaderboard.upsert(entry)
  }
  console.log(`[report] leaderboard updated (${data.rows.length} models)`)
}

module.exports = { run }
