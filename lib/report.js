const fs = require('fs')
const path = require('path')
const config = require('../config')
const { aggregate, WEIGHTS, MAX_SCORE } = require('./aggregate')
const { readMeta, latestRunId } = require('./runs')

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
  const dims = Object.keys(WEIGHTS)
  const dimLabels = { correctness: 'Correct', instruction_following: 'Following', format_compliance: 'Format', conciseness: 'Concise' }

  const lines = []

  // header
  lines.push(`# Comparitron — ${resolvedRunId || 'latest'}`, '')
  if (meta) {
    lines.push(
      `**Date:** ${new Date(meta.date).toUTCString()}  `,
      `**Hardware:** ${meta.hardware.host || '?'} — ${meta.hardware.gpu || '?'}  `,
      `**Gauntlet:** ${meta.scenarios?.length || config.capabilities.length} scenarios · ${data.responseCount / (meta.candidates?.length || 1) | 0} prompts · ${meta.candidates?.length || '?'} candidates  `,
      `**Jurors:** ${(meta.jurors || config.jurors || []).join(', ')}`,
      '',
    )
  }

  // rankings
  lines.push('---', '', '## Rankings', '')
  const rankHeaders = ['Model', 'Score', 'gen t/s', 'prefill t/s', ...config.capabilities.map(s => s.slice(0, 9)), 'Votes', 'Self Δ']
  const rankAligns = ['l', 'r', 'r', 'r', ...config.capabilities.map(() => 'r'), 'r', 'r']
  const rankRows = data.rows.map(r => {
    const score = r.peer != null ? `**${r.peer.toFixed(2)}**` : '—'
    const speed = r.avgSpeed != null ? `${r.avgSpeed}` : '—'
    const prefill = r.avgPrefill != null ? `${r.avgPrefill}` : '—'
    const delta = r.delta != null ? (r.delta >= 0 ? `+${r.delta.toFixed(2)}` : r.delta.toFixed(2)) : '—'
    const sceneFmt = r.sceneCols.map((v, i) => {
      const s = fmt(v)
      const votes = r.sceneVotes?.[i] ?? 0
      return votes < data.maxVotesPerScene ? `${s} *(${votes})` : s
    })
    return [r.model, score, speed, prefill, ...sceneFmt, r.votes, delta]
  })
  lines.push(mdTable(rankHeaders, rankRows, rankAligns), '')
  lines.push(`> **gen t/s** = generation speed (eval phase). **prefill t/s** = prompt ingestion speed. Both from a single run — treat as directional, not precise.`, '')

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

  // dimension breakdown overview
  lines.push('---', '', '## Dimension Breakdown', '')
  lines.push(`> **Weights:** ${dims.map(d => `${dimLabels[d]} ×${WEIGHTS[d]}`).join(' · ')} · max = ${MAX_SCORE}`, '')

  // overview table
  const overviewHeaders = ['Model', 'Scenario', ...dims.map(d => dimLabels[d]), 'Weighted']
  const overviewRows = []
  for (const r of data.rows) {
    for (let si = 0; si < config.capabilities.length; si++) {
      const sd = r.sceneDims[si]
      overviewRows.push([
        si === 0 ? r.model : '',
        config.capabilities[si],
        ...dims.map(d => sd ? fmt(sd[d]) : '—'),
        fmt(r.sceneCols[si]),
      ])
    }
    overviewRows.push(['', '', '', '', '', '', ''])  // spacer row
  }
  lines.push(mdTable(overviewHeaders, overviewRows.filter((_, i) => i < overviewRows.length - 1)), '')

  // per-model subsections
  for (const r of data.rows) {
    lines.push(`### ${r.model}`, '')
    const subHeaders = ['Scenario', ...dims.map(d => dimLabels[d]), '**Weighted**']
    const subRows = config.capabilities.map((sc, si) => {
      const sd = r.sceneDims[si]
      return [sc, ...dims.map(d => sd ? fmt(sd[d]) : '—'), `**${fmt(r.sceneCols[si])}**`]
    })
    // overall row
    const allDimMeans = dims.map(d => {
      const vals = r.sceneDims.map(sd => sd?.[d]).filter(v => v != null)
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null
    })
    subRows.push(['**Overall**', ...allDimMeans.map(v => `**${fmt(v)}**`), `**${fmt(r.peer)}**`])
    lines.push(mdTable(subHeaders, subRows), '')
  }

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
  const outPath = path.join(outDir, `${resolvedRunId || 'report'}.md`)
  fs.writeFileSync(outPath, md)
  console.log(md)
  console.log(`\n[report] saved → ${outPath}`)
}

module.exports = { run }
