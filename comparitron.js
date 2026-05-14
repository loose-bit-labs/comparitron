#!/usr/bin/env node
const config = require('./config')
const { makeRunId, latestRunId } = require('./lib/runs')

const args = new Set(process.argv.slice(2))
const all = args.size === 0
const isRunning = all || args.has('run')
const runId = isRunning ? makeRunId(config) : (latestRunId(config) || makeRunId(config))

async function main() {
  if (all || args.has('run')) {
    const { run } = require('./lib/runner')
    console.log(`[comparitron] === RUNNER === (${runId})`)
    await run(runId)
  }
  if (all || args.has('jury')) {
    const { run } = require('./lib/jury')
    console.log('[comparitron] === JURY ===')
    await run()
  }
  if (all || args.has('report')) {
    const { run } = require('./lib/report')
    console.log(`[comparitron] === REPORT === (${runId})`)
    run(runId)
  }
  if (all || args.has('report-html')) {
    const { run } = require('./lib/report-html')
    console.log(`[comparitron] === REPORT HTML === (${runId})`)
    run(runId)
  }
  if (args.has('leaderboard')) {
    const { printTable } = require('./lib/leaderboard')
    printTable()
  }
}

main().then(() => process.exit(0)).catch(err => { console.error(err.message); process.exit(1) })
