const fs = require('fs')
const path = require('path')
const cache = require('./cache')
const runs = require('./runs')

const WEIGHTS = { instruction_following: 2, correctness: 4, conciseness: 1, format_compliance: 2 }
const MAX_SCORE = Object.values(WEIGHTS).reduce((a, b) => a + b, 0) * 5  // 45

const median = (arr) => {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const stddev = (arr) => {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}

function weightedScore(scoreObjs) {
  if (!scoreObjs.length) return null
  const dims = Object.keys(WEIGHTS)
  const means = Object.fromEntries(dims.map(dim => {
    const vals = scoreObjs.map(s => s[dim]).filter(v => v != null)
    return [dim, vals.length ? vals.reduce((a, b) => a + b) / vals.length : 0]
  }))
  return dims.reduce((total, dim) => total + means[dim] * WEIGHTS[dim], 0)
}

function aggregate(config, runId = null) {
  const scoresDir = path.join(config.resultsDir, 'scores')
  const responsesDir = path.join(config.resultsDir, 'responses')

  const allScores = fs.existsSync(scoresDir)
    ? fs.readdirSync(scoresDir).filter(f => f.endsWith('.json'))
        .map(f => cache.read(path.join(scoresDir, f))).filter(s => s?.scores)
    : []

  const allResponses = fs.existsSync(responsesDir)
    ? fs.readdirSync(responsesDir).filter(f => f.endsWith('.json'))
        .map(f => cache.read(path.join(responsesDir, f))).filter(Boolean)
    : []

  const modelSet = new Set(allResponses.map(r => r.model))
  // config.candidates controls order; any model with responses on disk is included
  const ordered = config.candidates.filter(m => modelSet.has(m))
  const extras = [...modelSet].filter(m => !config.candidates.includes(m)).sort()
  const models = [...ordered, ...extras]

  // prefer run timings (hardware-specific); fall back to response file values
  const runTimings = runs.readTimings(config, runId)
  const speedMap = {}
  const prefillMap = {}
  for (const r of allResponses) {
    const key = `${r.scenario}:${r.promptId}:${r.model}`
    const t = runTimings[key]
    const tps = t?.tokensPerSec ?? r.tokensPerSec
    const per = t?.promptEvalRate ?? r.promptEvalRate
    if (tps) (speedMap[r.model] ??= []).push(tps)
    if (per) (prefillMap[r.model] ??= []).push(per)
  }

  // Group scores by (candidate, scenario, promptId) so each prompt counts once
  // regardless of how many jurors scored it — prevents models with more votes
  // from being unfairly weighted vs. models where a juror timed out mid-run.
  // Use | as separator — model names contain : (e.g. qwen3.6:27b).
  const pk = s => `${s.candidate}|${s.scenario}|${s.promptId}`
  const byPromptPeer = {}    // pk → [scoreObjs] (peer only)
  const byPromptSelf = {}    // pk → [scoreObjs] (self only)
  const matrixObjs = {}

  for (const s of allScores) {
    ;(matrixObjs[`${s.candidate}|${s.juror}`] ??= []).push(s.scores)
    if (s.candidate === s.juror) {
      ;(byPromptSelf[pk(s)] ??= []).push(s.scores)
    } else {
      ;(byPromptPeer[pk(s)] ??= []).push(s.scores)
    }
  }

  // Average juror scores per-prompt, then collect prompt-level scores per model
  const peerObjs = {}   // model → [per-prompt weighted scores]
  const selfObjs = {}   // model → [per-prompt weighted scores]
  const byScenario = {} // `${model}|${scenario}` → [per-prompt weighted scores]

  for (const [key, objs] of Object.entries(byPromptPeer)) {
    const [candidate, scenario] = key.split('|')
    const s = weightedScore(objs)
    if (s != null) {
      ;(peerObjs[candidate] ??= []).push(s)
      ;(byScenario[`${candidate}|${scenario}`] ??= []).push(s)
    }
  }
  for (const [key, objs] of Object.entries(byPromptSelf)) {
    const [candidate] = key.split('|')
    const s = weightedScore(objs)
    if (s != null) (selfObjs[candidate] ??= []).push(s)
  }

  const dimMeans = (scoreObjs) => {
    if (!scoreObjs.length) return null
    return Object.fromEntries(Object.keys(WEIGHTS).map(dim => {
      const vals = scoreObjs.map(s => s[dim]).filter(v => v != null)
      return [dim, vals.length ? vals.reduce((a, b) => a + b) / vals.length : null]
    }))
  }

  const rows = models.map(model => {
    const speeds = speedMap[model] || []
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a, b) => a + b) / speeds.length) : null
    const prefills = prefillMap[model] || []
    const avgPrefill = prefills.length ? Math.round(prefills.reduce((a, b) => a + b) / prefills.length) : null
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b) / arr.length : null
    // per-scenario score and vote count (each prompt counts once regardless of juror count)
    const sceneCols = config.capabilities.map(sc => avg(byScenario[`${model}|${sc}`] || []))
    const sceneVotes = config.capabilities.map(sc => (byScenario[`${model}|${sc}`] || []).length)
    // per-scenario per-dimension breakdown (peer scores only, all jurors pooled)
    const sceneDims = config.capabilities.map(sc => {
      const promptKeys = Object.keys(byPromptPeer).filter(k => k.startsWith(`${model}|${sc}|`))
      const allObjs = promptKeys.flatMap(k => byPromptPeer[k])
      return dimMeans(allObjs)
    })
    const peer = avg(peerObjs[model] || [])
    const self = avg(selfObjs[model] || [])
    const delta = peer != null && self != null ? self - peer : null
    const votes = (peerObjs[model] || []).length
    return { model, avgSpeed, avgPrefill, sceneCols, sceneVotes, sceneDims, peer, self, delta, votes }
  }).sort((a, b) => (b.peer ?? 0) - (a.peer ?? 0))

  const matrix = {}
  for (const candidate of models) {
    matrix[candidate] = {}
    for (const juror of models) {
      const objs = matrixObjs[`${candidate}|${juror}`] || []
      const vals = objs.map(s => {
        const vs = Object.keys(WEIGHTS).map(d => s[d]).filter(v => v != null)
        return vs.length ? vs.reduce((a, b) => a + b) / vs.length : null
      }).filter(v => v != null)
      matrix[candidate][juror] = median(vals)
    }
  }

  const grouped = {}
  for (const s of allScores) {
    const key = `${s.scenario}:${s.promptId}:${s.candidate}`
    const vs = Object.keys(WEIGHTS).map(d => s.scores[d]).filter(v => v != null)
    const avg = vs.length ? vs.reduce((a, b) => a + b) / vs.length : null
    if (avg != null) (grouped[key] ??= []).push(avg)
  }
  const contested = Object.entries(grouped)
    .map(([key, vals]) => ({ key, sd: stddev(vals), n: vals.length }))
    .filter(c => c.sd > 1.0)
    .sort((a, b) => b.sd - a.sd)

  // max votes any model has for a single scenario (used to flag incomplete coverage)
  const maxVotesPerScene = Math.max(0, ...rows.flatMap(r => r.sceneVotes || []))

  return {
    models,
    rows,
    matrix,
    contested,
    scenarios: config.capabilities,
    maxScore: MAX_SCORE,
    maxVotesPerScene,
    responseCount: allResponses.length,
    scoreCount: allScores.length,
  }
}

module.exports = { aggregate, weightedScore, WEIGHTS, MAX_SCORE }
