# The Arbitrated Gauntlet — May's jury, rebuilt with a judge that has no family in the house

**Status: BUILT, awaiting corpus approval + terminal run. 2026-09-22.**
**Owner's go:** "This sounds very reasonable. Typesafe can be the arbiter." + roster expansion + harness methodology (all 2026-09-22).

## The question door #8 left standing

Door #8 settled speed (G wins, +100 %/+233 %, `door8-VERDICT-2026-09-22.md`). Quality is still an anecdote
(noul 0.28). The May-era jury (21 prompts, local judges) died before Flash-Next ever entered. This gauntlet
is its replacement — with the one law the fleet learned the hard way: **a judge must have no lineage in the ring**
(a no-live-stakes / conflicted-judge incident already happened once, door #5 era).

## Judging doctrine (agreed with the Grafin)

1. **Arbiter: TypeSafe System One (`jev-latest`)** — external API, no family in the contested ring, blind
   pairwise per task (order seeded, key kept for unblinding). Judge **only** — never a contestant.
2. **Local candidates never judge.** No model scores itself, its family (KAT = vanilla 35B family), or its rival.
3. **The harness slot is graded objectively, not by arbiter.** Anthropic participates the way the Grafin
   specified: *"write a test and have a session work thru it"* — a real agentic session solving real tasks,
   graded by tests passing, not by vibes.
4. **Corpus: her own life.** Tasks are real human messages extracted from this box's session transcripts
   (`~/.claude/projects`), never synthetic trivia. **Human-approved before any send**: the builder writes
   `gauntlet-tasks.json`, the Grafin reads it and edits before the judge runs. These are homelab tasks going
   to a third-party API — by her explicit choice; nothing personal crosses that wire she hasn't waved through.

## Roster (files verified on disk 2026-09-22)

| seat | brain | file | size | ngl | mechanism want |
|---|---|---|---|---|---|
| F | Qwen3.8-Flash-Next (PRODUCTION baseline) | UD-Q2_K_XL split ×3 | 89 GB (partial offload, production argv as-is) | 66 | `Flash` |
| G | Qwen3.6-35B-A3B vanilla | UD-Q5_K_M (hf-cache blob) | 27.1 GB | 99 | `35B-A3B` |
| H | **Qwen3.8-27B dense, Q6_K** — the actual subject of the August quality-lift anecdote | models/Qwen3.8-27B-Q6_K.gguf → hf-cache | ~21 GiB | 99 | `Qwen3.8-27B` |
| I | **KAT-Coder-v2.5-dev** vs vanilla 35B: same base, coding-tuned | models/kat-coder-v2.5-dev-q6_k.gguf (REAL file) | 26.6 GiB | 99 | `kat-coder` |
| A | Anthropic via harness | agentic session(s) working through the harness tasks | objective tests | — | — |

The G-vs-I pairing answers the Grafin's extra question directly: **is the KAT tuning worth anything over
vanilla 35B?** And H is the first-ever face-scores moment for the dense 3.8 — the anecdote's original witness
gets subpoenaed.

## Geometry

Candidates G/H/I boot at gauntlet geometry: `-c 65536 --parallel 2 -fa 1 -ngl 99`, production cache flags kept.
F runs production argv **as-is**. Short ctx by design: this measures *what the brain says*, not what it can hold —
depth behavior is already measured (door #8) and lives in the verdict doc. Boot-fail = that candidate is DEAD
(FIT-CHK law from the door era), not a campaign abort.

## Runs (terminal, no sudo — same iron rule as doors: production restored on every exit path)

1. `~/tmp/locatesta/gauntlet-corpus.mjs` → `gauntlet-tasks.json` (agent-run OK, no GPU).
   **→ human approval pass (the Grafin reads the tasks).**
2. `~/tmp/locatesta/gauntlet-run.sh` (terminal, quiet window, ~40 min + 4 oven costs) — F/G/H/I each serve,
   answer every task once, identity proofed, answers to `gauntlet-artifacts/answers-<seat>.jsonl`.
3. `~/tmp/locatesta/gauntlet-judge.mjs` — jev blind pairwise, pairs F×G F×H F×I G×I (90 calls chunked ×5,
   resumable) → scoreboard per pair. Run from terminal (spends the Typesafe wallet, owner-sized).
4. Harness slot (any agent session, later): `gauntlet-harness.md` tasks, session works through, tests decide.

## Cost shapes

- GPU: 4 boots (incl. restore) + ~4×30 short one-shots ≈ 1 h 15 m of bench-class load, one quiet window.
- Arbiter: ~54 jev systemone calls in the default pair set (30 tasks × pairs/5-chunk); long-horizon model,
  budget is the Grafin's to see when she runs it — resumable if it stalls.

## What this must never be confused with

The gauntlet answers *"does the anecdote survive contact with a jury?"* It does NOT answer *"what is it like to
live on this brain?"* — that verdict stays with the production trial (revision-rate doctrine). The gauntlet is
evidence for the choice; the living is the choice.
