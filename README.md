# Comparitron

<p align="center">
  <img src="docs/images/comparitron-oracle.png" alt="Comparitron Oracle" width="480">
</p>

A local LLM benchmark tool. Run a set of prompts across multiple Ollama models, score the responses with a jury of peer models, and accumulate results in a persistent cross-hardware leaderboard.

**[Latest results →](docs/reports/2026-05-05_p40.md)**

## Hardware

Results are stored per (model, hardware) tuple in `results/leaderboard.json`. The hardware ID is the short GPU name — `p40`, `p40x2`, `r9700`, `rtx4060`, etc. — set via `config.hardware.tag`.

Hardware metadata (GPU name, VRAM, backend) lives in `results/hardware.json`.

Current primary bench hardware: Tesla P40 24GB (Pascal) via Ollama. No Tensor Cores, no bfloat16 — Q4_K_M only. Large models (32B+) via VRAM+RAM offload.

## How it works

**Runner** — sends each prompt to each candidate model via the Ollama API and caches the response.

**Jury** — for every cached response, each juror model scores it on four dimensions (1–5 each). Scores are cached per `(candidate, prompt, juror)` tuple — safe to interrupt and resume at any point. Adding a new model or juror only runs the missing entries.

**Self-preference tracking** — the jury matrix shows each model's score when judged by itself vs. by peers. The `Self Δ` column flags self-serving bias.

**Leaderboard** — after each report run, results are upserted into `results/leaderboard.json` keyed by `(model, hardware)`. The `lastTested` field tracks when each row was last updated. Run `node comparitron.js leaderboard` to print the cross-hardware table.

**Watch / Server** — a terminal watcher (`watch.js`) and an HTTP server (`server.js`) both read from the same aggregated data and update live.

See [docs/scoring.md](docs/scoring.md) for scoring methodology and weight configuration.

## Quick start

```bash
# 1. Configure candidates and jurors
vi config.js

# 2. Run all candidates against all prompts
node comparitron.js run

# 3. Score all responses
node comparitron.js jury

# 4. Print the report (also updates leaderboard.json)
node comparitron.js report

# Print the cross-hardware leaderboard
node comparitron.js leaderboard

# Watch live (separate terminal)
node bin/watch.js

# Web UI (default port 3773)
node bin/server.js
```

Steps can be run independently or all at once:

```bash
node comparitron.js          # run + jury + report
node comparitron.js run jury # run then jury, skip report
```

## Configuration

`config.js` — all tuneable knobs in one place:

```js
module.exports = {
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  hardware: {
    tag: 'p40',          // short GPU ID — used as leaderboard key
    gpu: 'Tesla P40 24GB',
    vramTotal: 24,
  },
  candidates: [                        // models to benchmark
    'qwen3.6:27b',
    'gemma4:26b',
    // ...
  ],
  jurors: [                            // models that score responses
    'gemma4:26b',
    'qwen3.6:27b',
  ],
  capabilities: ['coding', 'reasoning', 'structured', 'summary', 'adversarial', 'archaeology', 'synthesis'],
  weights: {                           // dimension weights (see docs/scoring.md)
    correctness: 8,
    instruction_following: 4,
    format_compliance: 4,
    conciseness: 2,
  },
  scenarioWeights: {
    coding: 2, reasoning: 2, structured: 2, summary: 2, adversarial: 1, archaeology: 2, synthesis: 2,
  },
  resultsDir: './results',
  candidateTemp: 0.7,
  judgeTemp: 0.1,
  chatTimeoutMs: 1221000,
  serverPort: 3773,
}
```

`candidates` controls what the runner benchmarks and the display order. Any model with response files on disk will appear in the leaderboard regardless — useful for models scored via external runners (e.g. `bin/claude-runner.js`).

## Capability suites

Prompts live in `capabilities/<suite>.json`. Each entry has an `id`, a `prompt`, and an optional `evalHint` that is **not** shown to jurors (it's for your reference only).

| Suite | Tests |
|---|---|
| `coding` | Correctness, edge cases, code quality |
| `reasoning` | Step-by-step logic, causal analysis |
| `structured` | Strict JSON output compliance |
| `summary` | Constraint following (word limits, bullet counts) |
| `adversarial` | Trap prompts — math comparisons, physical state tracking. Reveals failures quality scores hide. |
| `archaeology` | Code reading + KB extraction — entity description, commit insight, API intent. Maps to knowledge-graph ingestion work. |
| `synthesis` | Cross-entity reasoning — find non-obvious connections, extract patterns, generate forward-looking insights. Maps to dreaming/long-rest use cases. |

Add new prompts by editing the JSON files. Add new suites by creating `capabilities/<name>.json` and adding the name to `config.capabilities`.

## Benchmarking a non-Ollama model

Use `bin/claude-runner.js` as a template for any model with an external API. It reads the same prompt files and writes to the same `results/responses/` cache format. The jury and watcher pick up the files automatically.

```bash
ANTHROPIC_API_KEY=sk-... node bin/claude-runner.js
```

The model name does not need to be in `config.candidates` — the aggregator discovers it from disk. The jury will score it; it will not be asked to be a juror (only `config.jurors` models are called for scoring).

## Benchmarking OpenAI-compatible endpoints

For llama.cpp, vLLM, or any OpenAI-compatible server:

```bash
# TPS benchmark only (fast)
node bin/tps-vllm.js --host http://<host>:<port> --alias qwen3.6:35b-a3b --hardware r9700 --runs 5

# Full quality benchmark (slow — runs all capability prompts)
node bin/vllm-runner.js --host http://<host>:<port> --alias qwen3.6:35b-a3b --hardware r9700
node comparitron.js jury       # score the responses
node comparitron.js report     # update leaderboard
```

`--alias` sets the model name stored in the cache and leaderboard. Defaults to the ID returned by `/v1/models`. Pass `--hardware <id>` to tps-vllm.js to upsert the TPS result into the leaderboard.

## Results layout

```
results/
  responses/      <scenario>_<promptId>_<model>.json         — one per (prompt, model)
  scores/         <scenario>_<promptId>_<candidate>_by_<juror>.json  — one per (prompt, candidate, juror)
  leaderboard.json   — persistent (model, hardware) table; updated by report and tps-vllm
  hardware.json      — hardware registry keyed by short GPU ID
```

All files are plain JSON. Safe to delete individual entries to force a re-run.

## Further reading

- [Scoring methodology](docs/scoring.md)
- [Design notes & acknowledgements](docs/design.md)

## npm scripts

```bash
npm run run         # node comparitron.js run
npm run jury        # node comparitron.js jury
npm run report      # node comparitron.js report
npm run report-html # node comparitron.js report-html
npm run leaderboard # node comparitron.js leaderboard
npm start           # node comparitron.js  (run + jury + report)
```
