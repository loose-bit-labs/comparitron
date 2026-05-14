const fs = require('fs')
const path = require('path')

const RESULTS_DIR = path.join(__dirname, '..', 'results')
const LEADERBOARD_PATH = path.join(RESULTS_DIR, 'leaderboard.json')
const HARDWARE_PATH = path.join(RESULTS_DIR, 'hardware.json')

function read() {
  try { return JSON.parse(fs.readFileSync(LEADERBOARD_PATH, 'utf8')) } catch { return [] }
}

function readHardware() {
  try { return JSON.parse(fs.readFileSync(HARDWARE_PATH, 'utf8')) } catch { return {} }
}

function upsert(entry) {
  if (!entry.model || !entry.hardware) throw new Error('entry must have model and hardware')
  const rows = read()
  const idx = rows.findIndex(r => r.model === entry.model && r.hardware === entry.hardware)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...entry }
  else rows.push(entry)
  rows.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity))
  fs.writeFileSync(LEADERBOARD_PATH, JSON.stringify(rows, null, 2))
}

function printTable(rows) {
  rows = rows || read()
  const hardware = readHardware()

  // collect unique hardware IDs in order of appearance
  const hwIds = [...new Set(rows.map(r => r.hardware))]
  const models = [...new Set(rows.map(r => r.model))]

  const colW = 28
  const hwW = 14

  const header = 'Model'.padEnd(colW) + hwIds.map(h => h.padStart(hwW)).join('')
  const sep = '-'.repeat(colW + hwIds.length * hwW)
  console.log('\n' + sep)
  console.log(header)
  console.log(sep)

  for (const model of models) {
    const cells = hwIds.map(hw => {
      const row = rows.find(r => r.model === model && r.hardware === hw)
      if (!row) return ''.padStart(hwW)
      const score = row.score != null ? row.score.toFixed(1) : '—'
      const tps = row.tps != null ? `${row.tps}t/s` : ''
      const cell = tps ? `${score} ${tps}` : score
      return cell.padStart(hwW)
    })
    console.log(model.padEnd(colW) + cells.join(''))
  }

  console.log(sep)

  // vram info footer
  if (Object.keys(hardware).length) {
    console.log('\nHardware:')
    for (const [id, hw] of Object.entries(hardware)) {
      console.log(`  ${id.padEnd(10)} ${hw.gpu.padEnd(28)} ${hw.vramTotal}GB VRAM  ${hw.backend}`)
    }
  }
  console.log('')
}

module.exports = { read, readHardware, upsert, printTable }
