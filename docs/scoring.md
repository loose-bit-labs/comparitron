# Scoring Methodology

## Dimensions

Each juror scores every response on four dimensions (1–5 each):

| Dimension | Default Weight | Description |
|---|---|---|
| `correctness` | 8 | Is the content accurate and correct? |
| `instruction_following` | 4 | Did it do exactly what was asked? |
| `format_compliance` | 4 | Correct output format for this task? |
| `conciseness` | 2 | No padding, unnecessary preamble, or repetition? |

**Max per-scenario score:** `(8+4+4+2) × 5 = 90`

Weights are configurable in `config.js` under the `weights` key.

## Scenario weights

Each capability suite has a multiplier that controls its contribution to the overall score:

| Scenario | Default Weight |
|---|---|
| `coding` | 2 |
| `reasoning` | 2 |
| `structured` | 2 |
| `summary` | 2 |
| `adversarial` | 1 |
| `archaeology` | 2 |
| `synthesis` | 2 |

Adversarial is weighted lower because its prompts have deterministic correct answers — a wrong answer is a hard fail, not a quality gradient. The other suites have 2–4 prompts each covering a broader range.

Configurable in `config.js` under the `scenarioWeights` key.

## Aggregation

Scores are aggregated in two steps to prevent juror dropout from unfairly penalizing models:

1. **Per-prompt:** average the scores from all jurors for that `(candidate, scenario, prompt)` tuple. Each prompt produces one score regardless of how many jurors evaluated it.
2. **Per-scenario:** average the per-prompt scores across all prompts in that scenario.
3. **Overall:** take a scenario-weight-adjusted average of per-scenario scores.

This means if a juror times out on a particular prompt, only that prompt loses coverage — other prompts and other models are unaffected.

## Contested results

When multiple jurors disagree (standard deviation > 1.0 on a 1–5 scale), the result is flagged as contested in the report. High disagreement is a signal to read the actual responses rather than trust the score.

## Self-preference bias

Every model that is both a candidate and a juror produces a self-score. The `Self Δ` column is `self_score − peer_score`:

- **Positive** — model scores itself higher than peers do (self-serving)
- **Negative** — model scores itself lower (self-deprecating, unusual)
- Δ > 0.5 is flagged as potentially biased

The jury system prompt explicitly instructs models not to favor responses that resemble their own writing style.

## Report symbols

| Symbol | Meaning |
|---|---|
| `—` | No data — model was not scored for this scenario |
| `*(n)` | Incomplete jury coverage — only n prompts were scored (vs the max for other models). Score is directional; treat cautiously. |
| `⚠ self-serving` | Self Δ > +0.5 — model scores itself meaningfully higher than peers do |
| `self-deprecating` | Self Δ < -0.3 — model scores itself lower than peers (unusual) |

## Interactive HTML report

`npm run report-html` generates `docs/reports/<runId>.html` — a self-contained file with sortable columns and sliders to adjust dimension and scenario weights dynamically. Useful for exploring how weight changes affect rankings without re-running the jury.
