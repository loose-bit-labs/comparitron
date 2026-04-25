const path = require('path')
const fs = require('fs')

function makeRunId(config) {
  const d = new Date()
  const date = d.toISOString().slice(0, 10)
  const time = d.toTimeString().slice(0, 5).replace(':', '-')
  const hw = (config.hardware?.tag || 'unknown').replace(/[^a-z0-9-]/gi, '-')
  const scenarios = config.capabilities.join('-')
  return `${date}_${time}_${hw}_${scenarios}`
}

function runDir(config, runId) {
  return path.join(config.resultsDir, 'runs', runId)
}

function latestRunId(config) {
  const runsDir = path.join(config.resultsDir, 'runs')
  if (!fs.existsSync(runsDir)) return null
  const dirs = fs.readdirSync(runsDir)
    .filter(f => fs.statSync(path.join(runsDir, f)).isDirectory())
    .sort()
  return dirs.length ? dirs[dirs.length - 1] : null
}

function writeMeta(config, runId) {
  const dir = runDir(config, runId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({
    runId,
    date: new Date().toISOString(),
    hardware: config.hardware || {},
    candidates: config.candidates,
    jurors: config.jurors ?? config.candidates,
    scenarios: config.capabilities,
  }, null, 2))
}

function writeTiming(config, runId, scenario, promptId, model, data) {
  const dir = runDir(config, runId)
  fs.mkdirSync(dir, { recursive: true })
  const p = path.join(dir, 'timings.json')
  let t = {}
  try { t = JSON.parse(fs.readFileSync(p, 'utf8')) } catch {}
  t[`${scenario}:${promptId}:${model}`] = data
  fs.writeFileSync(p, JSON.stringify(t, null, 2))
}

function readMeta(config, runId) {
  try { return JSON.parse(fs.readFileSync(path.join(runDir(config, runId), 'meta.json'), 'utf8')) } catch { return null }
}

function readTimings(config, runId) {
  if (!runId) return {}
  try { return JSON.parse(fs.readFileSync(path.join(runDir(config, runId), 'timings.json'), 'utf8')) } catch { return {} }
}

module.exports = { makeRunId, runDir, latestRunId, writeMeta, writeTiming, readMeta, readTimings }
