#!/usr/bin/env node
// bench-parallel.js — llama-server load bench v2.2 (zero-dep, Node 18+, CJS)
//
// Home of the load-bench engine (v2.1 features carried over from the original
// 2×V620 Vulkan rig build; this is the shared, box-agnostic home for it now).
// Works against any llama-server on the LAN; GPU stats auto-detect rocm-smi (AMD) or
// nvidia-smi (NVIDIA). With --hardware <id>, clean legs are upserted into the
// cross-hardware leaderboard (results/leaderboard.json) via lib/perf.js.
//
// What it does:
//   - SSE streaming  -> TTFT (send->first token) and ITL (inter-token) percentiles
//   - per-request timestamps + in-flight timeline -> queueing is visible
//   - total_slots guard: warns when concurrency > server slots (the 6-vs-8 gotcha)
//   - warmup wave (excluded from stats) -> cold-start drops out of the numbers
//   - sweep mode: --concurrency 1,2,4,8 in one invocation
//   - roofline: achieved GB/s per card (--gguf-bytes --cards, % of --bus-gbps)
//   - honest GPU labels: "VRAM occ" is occupancy, not bandwidth
//   - JSON dump: full per-request detail + run metadata
//
// Modes (explicit flags override mode presets):
//   --mode smoke   c=1, rounds=1, warmup=1, 256 tokens   (~1-2 min; post-swap sanity)
//   --mode full    c=1,2,4,8, rounds=5, warmup=1         (the real sweep)
//   --selftest     plumbing check only: /props + /slots + GPU sampler, NO inference
//
// Env tracking: reads /props (model_path, alias, ftype, total_slots, build),
// resolves --model-path symlink locally (best-effort), warns on mismatch (stale service),
// auto-fills --gguf-bytes from the file size. A /slots canary samples per-slot
// is_processing/n_tokens at 1Hz and flags CONTAMINATED if the server processes
// tasks this bench did not send (e.g. a live agent session sharing the endpoint).
//
// Leaderboard: pass --hardware <id> to upsert the CLEAN legs only (per-leg contamination
// gate — a contaminated leg is never written, and a dirty c=1 means no c1Tps).
// The full bench JSON always lands in results/ (gitignored portion of the repo).
//
// Usage:
//   node bin/bench-parallel.js --mode full --cards 2 --bus-gbps 819 --hardware v620x2 --alias qwen3.8:27b-q8_k_xl
//   node bin/bench-parallel.js --mode smoke
//   node bin/bench-parallel.js --selftest

const { performance } = require('node:perf_hooks')
const { execFile } = require('node:child_process')
const { writeFileSync, realpathSync, statSync, mkdirSync } = require('node:fs')
const path = require('node:path')

const RESULTS_DIR = path.join(__dirname, '..', 'results')

// ---------- args ----------
const argv = process.argv.slice(2)
const A = {
  url: 'http://localhost:11311/v1/chat/completions',
  model: 'Qwen38-27B',
  concurrency: [1, 2, 4, 8],
  rounds: 5,
  warmup: 1,
  maxTokens: 1024,
  parallel: 0,        // fallback server slot count (live /props total_slots preferred)
  ggufBytes: 0,       // auto-filled from model file size unless given
  cards: 2,
  busGbps: 0,         // per-card theoretical bandwidth, for % (0 = skip)
  out: '',
  settle: 5,
  temperature: 0.6,
  modelPath: '',         // local path to the served GGUF (enables the stale-service realpath check)
  mode: 'full',
  selftest: false,
  alias: null,        // leaderboard model name (overrides the /props alias for naming)
  hardware: null,     // hardware ID for the leaderboard (v620x2, r9700, rtx4060, ...)
}
const explicit = new Set()
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--selftest') { A.selftest = true; explicit.add('selftest'); continue }
  if (!a.startsWith('--')) continue
  const k = a.slice(2), v = argv[++i]
  explicit.add(k)
  switch (k) {
    case 'url': A.url = v; break
    case 'model': A.model = v; break
    case 'concurrency': A.concurrency = v.split(',').map(Number); break
    case 'rounds': A.rounds = Number(v); break
    case 'warmup': A.warmup = Number(v); break
    case 'max-tokens': A.maxTokens = Number(v); break
    case 'parallel': A.parallel = Number(v); break
    case 'gguf-bytes': A.ggufBytes = Number(v); break
    case 'cards': A.cards = Number(v); break
    case 'bus-gbps': A.busGbps = Number(v); break
    case 'out': A.out = v; break
    case 'settle': A.settle = Number(v); break
    case 'temperature': A.temperature = Number(v); break
    case 'model-path': A.modelPath = v; break
    case 'mode': A.mode = v; break
    case 'alias': A.alias = v; break
    case 'hardware': A.hardware = v; break
    default: console.error(`[bench] unknown flag --${k}`); process.exit(2)
  }
}
// mode presets fill only what was not set explicitly
const setIf = (k, v) => { if (!explicit.has(k)) A[k] = v }
if (A.mode === 'smoke') {
  setIf('concurrency', [1]); setIf('rounds', 1); setIf('warmup', 1); setIf('max-tokens', 256)
} else if (A.mode !== 'full') {
  console.error(`[bench] unknown --mode ${A.mode} (smoke|full)`)
  process.exit(2)
}

const PROMPTS = [
  'Write a full Python implementation of an LRU Cache with O(1) ops and unit tests.',
  'Implement an asynchronous Redis client wrapper in Python using asyncio from scratch.',
  'Write a Rust function that parses and validates a JSON string with detailed error reporting.',
  'Create a C++20 thread pool implementation using std::jthread and std::condition_variable.',
]

const log = (m) => console.log(`[bench] ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function pct(arr, p) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const i = Math.min(s.length - 1, Math.floor((p / 100) * s.length))
  return s[i]
}
const f2 = (x) => x.toFixed(2)

// ---------- request pool (client-side queue) ----------
class Pool {
  constructor(limit) { this.limit = limit; this.active = 0; this.queued = 0; this.wake = [] }
  async run(fn) {
    this.queued++
    const tQ = performance.now()
    while (this.active >= this.limit) await new Promise((r) => this.wake.push(r))
    this.active++; this.queued--
    const queuedMs = performance.now() - tQ
    try { return await fn(queuedMs) }
    finally { this.active--; this.wake.shift()?.() }
  }
}

// ---------- one streamed chat completion ----------
async function sendChat(id, prompt, queuedMs) {
  const ac = new AbortController()
  const killer = setTimeout(() => ac.abort(), 600_000)
  const tSend = performance.now()
  try {
    const res = await fetch(A.url, {
      method: 'POST',
      signal: ac.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: A.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: A.maxTokens,
        temperature: A.temperature,
        stream: true,
        stream_options: { include_usage: true },
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`)
    }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = '', ttft = null, steps = 0, usage = null, text = ''
    const itl = []
    let lastTok = 0, tEnd = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let nl
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') continue
        let j
        try { j = JSON.parse(payload) } catch { continue }
        if (j.usage) usage = j.usage
        const delta = j.choices?.[0]?.delta?.content
        if (delta != null) {
          const now = performance.now()
          if (ttft == null) { ttft = now - tSend; lastTok = now }
          else { itl.push(now - lastTok); lastTok = now }
          steps++
          text += delta
        }
      }
    }
    tEnd = performance.now()
    const tokens = usage?.completion_tokens ?? steps
    const totalMs = tEnd - tSend
    const decodeMs = Math.max(1, totalMs - (ttft ?? 0))
    const rec = {
      id, queuedMs, ttftMs: ttft ?? totalMs,
      itlMs: itl, tokens, steps, sample: text.slice(0, 240),
      totalMs, tpsTotal: tokens / (totalMs / 1000),
      tpsDecode: tokens / (decodeMs / 1000),
      ok: true,
    }
    log(`[done] #${id} ${f2(totalMs / 1000)}s | ${tokens} tok | TTFT ${f2((ttft ?? 0) / 1000)}s | ${f2(rec.tpsDecode)} t/s dec | queued ${f2(queuedMs / 1000)}s`)
    return rec
  } catch (e) {
    const tEnd = performance.now()
    log(`[fail] #${id} after ${f2((tEnd - tSend) / 1000)}s: ${e.message}`)
    return { id, queuedMs, ttftMs: 0, itlMs: [], tokens: 0, steps: 0, sample: '', totalMs: tEnd - tSend, tpsTotal: 0, tpsDecode: 0, ok: false, error: String(e.message) }
  } finally {
    clearTimeout(killer)
  }
}

// ---------- GPU monitor (rocm-smi AMD / nvidia-smi NVIDIA; "VRAM occ" is occupancy) ----------
class GpuMonitor {
  constructor(intervalMs = 500) { this.samples = []; this.timer = null; this.intervalMs = intervalMs; this.alive = false; this.warned = false }
  async exec(cmd, args) {
    return new Promise((resolve) =>
      execFile(cmd, args, { timeout: 3000, maxBuffer: 1 << 20 },
        (e, so) => resolve(e ? null : so)))
  }
  async pollRocmJson() {
    const out = await this.exec('rocm-smi', ['--json'])
    if (!out) return null
    try {
      const j = JSON.parse(out)
      const cards = []
      for (const [k, v] of Object.entries(j)) {
        if (!k.startsWith('card')) continue
        const num = (keys) => {
          for (const kk of keys) if (kk in v) { const n = parseFloat(String(v[kk]).replace(/[^0-9.-]/g, '')); if (!isNaN(n)) return n }
          return 0
        }
        cards.push({
          name: v['Card series'] ?? v['Card model'] ?? k,
          util: num(['GPU use (%)']),
          vramOcc: num(['GPU Memory Allocated (VRAM%)', 'GPU memory use (%)']),
          powerW: num(['Average Graphics Package Power (W)', 'Current Socket Graphics Package Power (W)']),
          tempC: num(['Temperature (Sensor edge) (C)', 'Temperature (Sensor junction) (C)']),
        })
      }
      return cards.length ? cards : null
    } catch { return null }
  }
  async pollRocmTable() {
    const out = await this.exec('rocm-smi', ['--showuse', '--showmeminfo', 'vram', '--showpower', '--showtemp'])
    if (!out) return null
    const cards = {}
    for (const line of out.split('\n')) {
      const m = line.match(/^GPU\[(\d+)\]\s*:\s*([^:]+?):\s*(-?[\d.]+)/)
      if (!m) continue
      const [, gi, metric, val] = m
      const v = parseFloat(val)
      const c = cards[gi] ??= { name: `GPU[${gi}]`, util: 0, vramOcc: 0, powerW: 0, tempC: 0 }
      if (/use \(%\)/i.test(metric) && !/memory/i.test(metric)) c.util = v
      else if (/memory use \(%\)/i.test(metric)) c.vramOcc = v
      else if (/power \(W\)/i.test(metric)) c.powerW = v
      else if (/sensor edge/i.test(metric)) c.tempC = v
    }
    const arr = Object.values(cards)
    return arr.length ? arr : null
  }
  async pollNvidia() {
    const out = await this.exec('nvidia-smi',
      ['--query-gpu=name,utilization.gpu,memory.used,memory.total,power.draw,temperature.gpu',
       '--format=csv,noheader,nounits'])
    if (!out) return null
    const cards = out.trim().split('\n').filter(Boolean).map((line) => {
      const parts = line.split(',').map((s) => s.trim())
      const [name, util, memUsed, memTotal, power, temp] = parts
      const used = parseFloat(memUsed), total = parseFloat(memTotal)
      return {
        name: name || 'GPU',
        util: parseFloat(util) || 0,
        vramOcc: total > 0 ? (used / total) * 100 : 0,
        powerW: parseFloat(power) || 0,
        tempC: parseFloat(temp) || 0,
      }
    })
    return cards.length ? cards : null
  }
  async poll() {
    const cards = await this.pollRocmJson().catch(() => null)
      ?? await this.pollRocmTable().catch(() => null)
      ?? await this.pollNvidia().catch(() => null)
    if (!cards && !this.warned) {
      this.warned = true
      log('WARN: no GPU sampler succeeded (tried rocm-smi --json, rocm-smi table, nvidia-smi) — GPU stats disabled')
    }
    return cards
  }
  start() {
    this.alive = true
    const tick = async () => {
      if (!this.alive) return
      const cards = await this.poll()
      if (cards) this.samples.push({ t: performance.now(), cards })
      if (this.alive) this.timer = setTimeout(tick, this.intervalMs)
    }
    tick()
    log(`gpu: sampling @ ${this.intervalMs / 1000}s (rocm-smi json+table, nvidia-smi fallback)`)
  }
  stop() { this.alive = false; clearTimeout(this.timer) }
  summary() {
    if (!this.samples.length) return { note: 'no GPU samples', totalSamples: 0, cards: [] }
    const per = []
    this.samples[0].cards.forEach((c, i) => {
      const g = this.samples.map((s) => s.cards[i]).filter(Boolean)
      const m = (f) => g.reduce((a, x) => a + (x[f] ?? 0), 0) / g.length
      const pctl = (arr, p) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))] }
      per.push({
        name: c.name,
        utilMean: m('util'), utilPeak: Math.max(...g.map((x) => x.util ?? 0)),
        vramOccMean: m('vramOcc'), vramOccPeak: Math.max(...g.map((x) => x.vramOcc ?? 0)),
        powerMean: m('powerW'), powerPeak: Math.max(...g.map((x) => x.powerW ?? 0)),
        tempMean: m('tempC'), tempP95: pctl(g.map((x) => x.tempC ?? 0), 95),
        tempPeak: Math.max(...g.map((x) => x.tempC ?? 0)),
        samples: g.length,
      })
    })
    return { cards: per, totalSamples: this.samples.length }
  }
}

// ---------- contamination canary (live /slots @ 1Hz) ----------
class SlotCanary {
  constructor(url, intervalMs = 1000) { this.base = url.replace(/\/v1\/chat\/completions$/, ''); this.samples = []; this.timer = null; this.intervalMs = intervalMs; this.alive = false }
  async poll() {
    try {
      const r = await fetch(this.base + '/slots', { signal: AbortSignal.timeout(2500) })
      return r.ok ? await r.json() : null
    } catch { return null }
  }
  start(expectedInFlightFn) {
    this.alive = true
    const tick = async () => {
      if (!this.alive) return
      const slots = await this.poll()
      if (slots && Array.isArray(slots)) {
        this.samples.push({
          t: performance.now(),
          expected: expectedInFlightFn(),
          slots: slots.map((s) => ({ id: s.id, n: s.n_tokens ?? 0, proc: !!s.is_processing })),
        })
      }
      if (this.alive) this.timer = setTimeout(tick, this.intervalMs)
    }
    tick()
  }
  stop() { this.alive = false; clearTimeout(this.timer) }
  summary() {
    if (!this.samples.length) return { available: false }
    let ext = 0
    const bySlot = {}
    for (const s of this.samples) {
      const procCount = s.slots.filter((x) => x.proc).length
      if (procCount > s.expected) ext++
      for (const sl of s.slots) {
        const e = bySlot[sl.id] ??= { min: sl.n, max: sl.n, procSamples: 0 }
        e.min = Math.min(e.min, sl.n); e.max = Math.max(e.max, sl.n)
        if (sl.proc) e.procSamples++
      }
    }
    return { available: true, samples: this.samples.length, externalProcessingSamples: ext, contaminated: ext > 0, bySlot }
  }
}

// ---------- in-flight timeline ----------
class Timeline {
  constructor(pool, intervalMs = 250) { this.samples = []; this.timer = null; this.pool = pool; this.intervalMs = intervalMs }
  start() { this.timer = setInterval(() => { this.samples.push({ t: performance.now(), active: this.pool.active, queued: this.pool.queued }) }, this.intervalMs) }
  stop() { clearInterval(this.timer) }
  summary() {
    if (!this.samples.length) return {}
    return {
      peakInFlight: Math.max(...this.samples.map((s) => s.active)),
      saturatedFrac: this.samples.filter((s) => s.active === this.pool.limit).length / this.samples.length,
      peakClientQueue: Math.max(...this.samples.map((s) => s.queued)),
    }
  }
}

// ---------- one concurrency leg ----------
async function leg(C, c1Decode, totalSlots) {
  if (totalSlots && C > totalSlots) {
    log(`WARN: c=${C} > server total_slots=${totalSlots} -> ${C - totalSlots} request(s)/wave sit in the CLIENT queue; the "${C}" column is really ${totalSlots}-batch+queue`)
  }
  const total = A.rounds * C
  const pool = new Pool(C)
  const gpu = new GpuMonitor()
  const tl = new Timeline(pool)
  const canary = new SlotCanary(A.url)
  gpu.start(); tl.start(); canary.start(() => pool.active)

  const spawn = (n, offset) => {
    const out = []
    for (let i = 0; i < n; i++) {
      const id = offset + i
      out.push(pool.run((q) => sendChat(id, PROMPTS[id % PROMPTS.length], q)))
    }
    return out
  }

  log(`deploy c=${C}: ${total} requests (${A.rounds} rounds) + ${A.warmup * C} warmup`)
  if (A.warmup > 0) await Promise.all(spawn(A.warmup * C, 10_000))
  const tWall = performance.now()
  const recs = await Promise.all(spawn(total, 0))
  const wallMs = performance.now() - tWall

  gpu.stop(); tl.stop(); canary.stop()
  const tlSum = tl.summary()
  const cs = canary.summary()

  const ok = recs.filter((r) => r.ok)
  const totalTokens = ok.reduce((a, r) => a + r.tokens, 0)
  const wallS = wallMs / 1000
  const aggTps = totalTokens / wallS
  const itlAll = ok.flatMap((r) => r.itlMs)
  const ttftAll = ok.map((r) => r.ttftMs)
  const perStream = ok.length ? ok.reduce((a, r) => a + r.tpsDecode, 0) / ok.length : 0
  const latAll = ok.map((r) => r.totalMs / 1000)
  const avgLat = latAll.length ? latAll.reduce((a, b) => a + b, 0) / latAll.length : 0
  const achievedGbS = A.ggufBytes ? (aggTps * A.ggufBytes) / A.cards / 1e9 : null

  const summary = {
    concurrency: C, requests: total, okRequests: ok.length, failed: recs.length - ok.length,
    wallS: f2(wallS), totalTokens,
    aggTps: f2(aggTps), perStreamTps: f2(perStream),
    effVsC1: C === 1 ? '100% (baseline)' : (c1Decode ? f2((perStream / c1Decode) * 100) + '%' : 'n/a (no c=1 in this run)'),
    ttftP50s: f2(pct(ttftAll, 50) / 1000), ttftP95s: f2(pct(ttftAll, 95) / 1000),
    itlP50ms: f2(pct(itlAll, 50)), itlP95ms: f2(pct(itlAll, 95)), itlP99ms: f2(pct(itlAll, 99)),
    avgLatS: f2(avgLat),
    achievedGBsPerCard: achievedGbS ? f2(achievedGbS) : 'n/a (gguf-bytes unknown)',
    busPct: achievedGbS && A.busGbps ? f2((achievedGbS / A.busGbps) * 100) + '%' : 'n/a',
    contamination: cs.available ? (cs.contaminated ? `CONTAMINATED (${cs.externalProcessingSamples}/${cs.samples} samples)` : 'clean') : 'n/a (/slots unavailable)',
    inFlight: tlSum, gpu: gpu.summary(), canary: cs,
  }

  console.log('-'.repeat(78))
  console.log(`c=${C} | wall ${summary.wallS}s | ${totalTokens} tok | agg ${summary.aggTps} t/s | per-stream ${summary.perStreamTps} t/s | eff ${summary.effVsC1}`)
  console.log(`     TTFT p50/p95 ${summary.ttftP50s}/${summary.ttftP95s}s | ITL p50/p95/p99 ${summary.itlP50ms}/${summary.itlP95ms}/${summary.itlP99ms}ms | avg req ${summary.avgLatS}s`)
  console.log(`     roofline: ${summary.achievedGBsPerCard} GB/s per card (${summary.busPct} of bus) | in-flight peak ${tlSum.peakInFlight ?? '?'} (saturated ${tlSum.saturatedFrac ? f2(tlSum.saturatedFrac * 100) + '%' : '?'}, client queue peak ${tlSum.peakClientQueue ?? '?'})`)
  console.log(`     contamination: ${summary.contamination}`)
  if (cs.available && cs.contaminated) console.log(`     per-slot: ${JSON.stringify(cs.bySlot)}`)
  for (const c of (summary.gpu.cards ?? [])) {
    console.log(`     [gpu] ${c.name}: util ${f2(c.utilMean)}% (peak ${c.utilPeak}%) | VRAM occ ${f2(c.vramOccMean)}% (peak ${c.vramOccPeak}%) — occupancy, NOT bandwidth | ${f2(c.powerMean)}W (peak ${c.powerPeak}W) | temp ${f2(c.tempMean)}C avg / ${c.tempP95}C p95 / ${c.tempPeak}C peak`)
  }
  if (summary.gpu.note) console.log(`     [gpu] ${summary.gpu.note} (monitor failed — check rocm-smi/nvidia-smi)`)
  const firstSample = ok.find((r) => r.sample)?.sample
  if (firstSample) console.log(`     sample: ${firstSample.slice(0, 100).replace(/\s+/g, ' ')}...`)

  return {
    summary,
    requests: recs.map(({ itlMs, ...r }) => ({ ...r, sample: r.sample?.slice(0, 240), itlP50ms: f2(pct(itlMs, 50)), itlP95ms: f2(pct(itlMs, 95)), itlP99ms: f2(pct(itlMs, 99)) })),
    timeline: tl.samples.filter((_, i) => i % 4 === 0),
  }
}

// ---------- env probe: what are we actually testing? ----------
async function probeEnv() {
  const env = { modelPath: A.modelPath, modelResolved: null, modelSizeBytes: 0, modelMtime: null, server: {} }
  if (A.modelPath) {
    try {
      env.modelResolved = realpathSync(A.modelPath)
      const st = statSync(env.modelResolved)
      env.modelSizeBytes = st.size; env.modelMtime = st.mtime.toISOString()
    } catch (e) {
      log(`WARN: cannot resolve ${A.modelPath}: ${e.message}`)
    }
  }
  let props = null
  try {
    const base = A.url.replace(/\/v1\/chat\/completions$/, '')
    const r = await fetch(base + '/props', { signal: AbortSignal.timeout(3000) })
    if (r.ok) props = await r.json()
  } catch { /* server not up */ }
  if (props) {
    env.server = {
      modelPath: props.model_path ?? null,
      alias: props.model_alias ?? null,
      ftype: props.model_ftype ?? null,
      totalSlots: props.total_slots ?? null,
      build: props.build_info ?? null,
      sleeping: props.is_sleeping ?? false,
      sampling: {
        temperature: props.default_generation_settings?.params?.temperature,
        top_p: props.default_generation_settings?.params?.top_p,
        top_k: props.default_generation_settings?.params?.top_k,
        min_p: props.default_generation_settings?.params?.min_p,
      },
    }
    if (env.server.alias) A.model = env.server.alias
    if (props.model_path && !explicit.has('gguf-bytes')) {
      // Only fall back to the server path if the local resolve failed above — the
      // server reports the unresolved -m arg (the llm.gguf symlink), which would
      // name every result file "-llm". Keep the resolved local path for output names.
      try {
        const st = statSync(props.model_path)
        A.ggufBytes = st.size; env.modelSizeBytes = st.size
        if (!env.modelResolved) env.modelResolved = realpathSync(props.model_path)
      } catch { /* ok */ }
    }
    if (env.server.modelPath && env.modelResolved && !explicit.has('gguf-bytes')) {
      // Both sides resolved: /props reports the unresolved -m arg, so raw string
      // comparison would warn on every fresh service.
      let serverReal = env.server.modelPath
      try { serverReal = realpathSync(env.server.modelPath) } catch { /* ok */ }
      if (path.normalize(serverReal) !== path.normalize(env.modelResolved)) {
        log(`WARN: server model ${env.server.modelPath} -> (${serverReal}) != local ${A.modelPath} -> (${env.modelResolved}) — stale service? restart before trusting results`)
      }
    }
  }
  return { env, props }
}

// ---------- main ----------
async function main() {
  const t0 = performance.now()
  const { env, props } = await probeEnv()
  log(`bench-parallel v2.2 — node ${process.version} — mode=${A.mode}`)
  log(`env: ${env.server.alias ?? A.model} [${env.server.ftype ?? '?'}] ${env.server.modelPath ?? env.modelResolved ?? A.modelPath} (${A.ggufBytes ? (A.ggufBytes / 1e9).toFixed(1) + ' GB' : '? GB'}), slots=${env.server.totalSlots ?? A.parallel ?? '?'}, build=${env.server.build ?? '?'}, samp=t${env.server.sampling?.temperature} p${env.server.sampling?.top_p} k${env.server.sampling?.top_k}`)
  if (env.server.sleeping) { log('server is SLEEPING — wake it before benchmarking'); process.exit(1) }

  if (A.selftest) {
    log('selftest: probing /slots + GPU sampler (no inference)')
    const gpu = new GpuMonitor(500)
    const canary = new SlotCanary(A.url, 500)
    gpu.start(); canary.start(() => 0)
    await sleep(8000)
    gpu.stop(); canary.stop()
    const g = gpu.summary()
    const c = canary.summary()
    log(`selftest gpu:   ${g.note ? 'FAIL — ' + g.note : `ok — ${g.cards.length} cards, ${g.totalSamples} samples: ` + g.cards.map((x) => `${x.name} util=${f2(x.utilMean)}% occ=${f2(x.vramOccMean)}% ${f2(x.powerMean)}W`).join(' | ')}`)
    log(`selftest slots: ${c.available ? `ok — ${Object.keys(c.bySlot).length} slots visible, per-slot ${JSON.stringify(c.bySlot)}` : 'FAIL — /slots unreachable'}`)
    const ok = g.totalSamples > 0 && c.available
    log(ok ? 'selftest: PASS' : 'selftest: FAIL')
    process.exit(ok ? 0 : 1)
  }

  log(`sweep c=[${A.concurrency.join(', ')}] rounds=${A.rounds} warmup=${A.warmup} max_tokens=${A.maxTokens} model=${A.model} url=${A.url}`)

  const results = []
  let c1Decode = null
  const totalSlots = env.server.totalSlots ?? A.parallel
  for (let i = 0; i < A.concurrency.length; i++) {
    const C = A.concurrency[i]
    if (i > 0) { log(`settle: ${A.settle}s cooldown`); await sleep(A.settle * 1000) }
    const r = await leg(C, c1Decode, totalSlots)
    if (C === 1) c1Decode = Number(r.summary.perStreamTps)
    results.push(r)
  }

  const out = {
    meta: {
      tool: 'bench-parallel.js v2.2', mode: A.mode,
      started: new Date().toISOString(), durationS: f2((performance.now() - t0) / 1000),
      url: A.url, model: A.model, maxTokens: A.maxTokens, temperature: A.temperature,
      rounds: A.rounds, warmup: A.warmup,
      env,
      ggufBytes: A.ggufBytes || null, cards: A.cards, busGbps: A.busGbps || null,
      serverProps: props,
    },
    runs: results,
  }

  // Dump next to the leaderboard (results/ is gitignored except the two tracked files).
  // Name after the alias — stable and meaningful on any box, unlike a symlink hop name.
  const nameBase = (A.alias || A.model || 'model').replace(/[^\w.-]/g, '_')
  const outPath = A.out || path.join(RESULTS_DIR, `bench-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-${nameBase}.json`)
  mkdirSync(path.dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(out, null, 2))
  log(`full run data -> ${outPath}`)

  if (A.hardware) {
    const perf = require(path.join(__dirname, '..', 'lib', 'perf'))
    const entry = perf.buildPerfEntry(out, { hardware: A.hardware, alias: A.alias || A.model })
    if (entry) {
      perf.upsertPerf(entry)
      const scalars = Object.keys(entry).filter((k) => /^c\d+Tps$/.test(k)).sort()
      log(`leaderboard: ${entry.model} @ ${A.hardware} upserted — clean legs [${entry.perf.legs.map((l) => 'c' + l.concurrency).join(', ')}]${scalars.length ? ` (${scalars.map((k) => `${k} ${entry[k]}`).join(', ')})` : ''}`)
    } else {
      log('leaderboard: SKIPPED — no clean legs (per-leg contamination gate)')
    }
  }

  log(`sweep complete in ${f2((performance.now() - t0) / 1000)}s`)
}

main().catch((e) => { console.error('[bench] fatal:', e); process.exit(1) })
