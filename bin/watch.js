#!/usr/bin/env node
const config = require('../config')
const { aggregate } = require('../lib/aggregate')
const { latestRunId } = require('../lib/runs')
const leaderboard = require('../lib/leaderboard')

const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'
const DIM    = '\x1b[2m'
const CYAN   = '\x1b[36m'
const GREEN  = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED    = '\x1b[31m'
const CLEAR  = '\x1b[2J\x1b[H'

function scoreColor(v, max) {
  if (v == null) return DIM
  const ratio = v / max
  if (ratio >= 0.9) return GREEN
  if (ratio >= 0.7) return YELLOW
  return RED
}

function fmtCell(row) {
  if (!row) return null
  const score = row.score != null ? row.score.toFixed(1).padStart(4) : '   —'
  const tps   = row.tps   != null ? String(row.tps).padStart(4) + 'tps' : '      —'
  return score + ' / ' + tps   // fixed 14 chars: "86.5 /  12tps" or "   — /       —"
}

function renderLeaderboard(lines) {
  const rows = leaderboard.read()
  if (!rows.length) return

  const hwIds  = [...new Set(rows.map(r => r.hardware))]
  const models = [...new Set(rows.map(r => r.model))]
  const colW = 22
  const hwW  = 17   // fits 14-char cell + 3 padding

  lines.push('')
  lines.push(DIM + '─'.repeat(colW + hwIds.length * hwW) + RESET)
  lines.push(BOLD + 'Leaderboard' + RESET + DIM + '  score /  tps  per hardware' + RESET)
  lines.push(DIM + ' '.repeat(colW) + hwIds.map(h => h.padStart(hwW)).join('') + RESET)

  for (const model of models) {
    const cells = hwIds.map(hw => {
      const row = rows.find(r => r.model === model && r.hardware === hw)
      const cell = fmtCell(row)
      if (!cell) return DIM + '—'.padStart(hwW) + RESET
      const col = row.score != null ? scoreColor(row.score, 90) : DIM
      return col + cell.padStart(hwW) + RESET
    })
    lines.push(model.padEnd(colW) + cells.join(''))
  }
}

function render() {
  const data = aggregate(config, latestRunId(config))
  const lbRows = leaderboard.read()
  const lines = [CLEAR]

  const ts = new Date().toLocaleTimeString()
  const hw = config.hardware?.tag || '?'
  lines.push(`${BOLD}${CYAN}COMPARITRON${RESET}  ${DIM}hw: ${hw}  responses: ${data.responseCount}  scores: ${data.scoreCount}  ${ts}${RESET}`)
  lines.push('')

  const COL = { model: 22, score: 7, speed: 6, votes: 7 }
  const sceneCols = data.scenarios.map(s => s.slice(0, 9).padStart(10))

  const header = [
    'Model'.padEnd(COL.model),
    'Score'.padStart(COL.score),
    't/s'.padStart(COL.speed),
    ...sceneCols,
    'Votes'.padStart(COL.votes),
    'SelfΔ'.padStart(7),
  ]
  lines.push(DIM + header.join('  ') + RESET)
  lines.push(DIM + '-'.repeat(header.join('  ').length) + RESET)

  for (const r of data.rows) {
    const score = r.peer != null ? r.peer.toFixed(1) : '-'
    // prefer leaderboard TPS (reflects latest benchmark) over stale response cache value
    const lbTps = lbRows.find(lb => lb.model === r.model)?.tps ?? null
    const speed = (lbTps ?? r.avgSpeed) != null ? `${lbTps ?? r.avgSpeed}` : '-'
    const delta = r.delta != null ? (r.delta >= 0 ? '+' : '') + r.delta.toFixed(1) : '-'
    const sceneStrs = r.sceneCols.map((v, i) => {
      const s = v != null ? v.toFixed(1) : '-'
      const flag = r.sceneVotes && r.sceneVotes[i] < data.maxVotesPerScene ? DIM + '*' + RESET : ' '
      return scoreColor(v, data.maxScore) + s.padStart(9) + RESET + flag
    })
    const col = scoreColor(r.peer, data.maxScore)
    lines.push([
      r.model.padEnd(COL.model),
      col + score.padStart(COL.score) + RESET,
      speed.padStart(COL.speed),
      ...sceneStrs,
      String(r.votes).padStart(COL.votes),
      delta.padStart(7),
    ].join('  '))
  }

  lines.push('')
  lines.push(DIM + `Score max: ${data.maxScore}  Votes=total jury evaluations  —=no data  *=incomplete prompt coverage  SelfΔ=self_score−peer_score` + RESET)

  renderLeaderboard(lines)

  process.stdout.write(lines.join('\n') + '\n')
}

render()
setInterval(render, 2000)
