# Comparitron — 2026-04-26_07-42_chonko-p40_coding-reasoning-structured-summary-adversarial

**Date:** Sun, 26 Apr 2026 11:42:15 GMT  
**Hardware:** chonko — Tesla P40 24GB  
**Gauntlet:** 5 scenarios · 14 prompts · 10 candidates  
**Jurors:** gemma4:26b, phi4-reasoning:plus, devstral-small-2, qwen3.6:27b, qwen3.5:9b

---

## Rankings

| Model | Score | gen t/s | prefill t/s | coding | reasoning | structure | summary | adversari | Votes | Self Δ |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| claude-sonnet-4-6 | **43.84** | 72 | — | 43.80 *(2) | 45.00 *(2) | 44.60 *(2) | 45.00 *(2) | 40.80 *(2) | 50 | — |
| gemma4:31b | **43.79** | 5 | 59 | 44.65 *(2) | 44.10 *(2) | 42.80 *(2) | 45.00 *(2) | 43.33 | 71 | — |
| qwen3.6:27b | **43.11** | 12 | 138 | 40.13 *(2) | 44.88 *(2) | 43.25 *(2) | 45.00 *(2) | 42.83 | 57 | +1.82 |
| gemma4:26b | **42.26** | 44 | 416 | 41.70 *(2) | 44.75 *(2) | 42.13 *(2) | 45.00 *(2) | 40.75 | 58 | +1.88 |
| qwen3.5:27b | **40.59** | 12 | 136 | 44.80 *(2) | 44.80 *(2) | 30.60 *(2) | 45.00 *(2) | 39.63 | 70 | +3.41 |
| qwen3.5:9b | **37.20** | 33 | 375 | 31.95 *(2) | 44.63 *(2) | 26.50 *(2) | 45.00 *(2) | 37.50 *(5) | 53 | -2.13 |
| devstral-small-2 | **37.11** | 20 | 2206 | 38.00 *(2) | 40.75 *(2) | 31.63 *(2) | 45.00 *(2) | 34.79 | 56 | +4.04 |
| deepseek-r1:14b | **34.33** | 27 | 352 | 34.20 *(2) | 43.30 *(2) | 30.80 *(2) | 44.10 *(2) | 29.30 | 70 | — |
| deepseek-r1:32b | **34.25** | 4 | 55 | — *(0) | 42.90 *(2) | 32.60 *(2) | 45.00 *(2) | 28.33 | 60 | — |
| deepseek-coder-v2:16b | **32.60** | 85 | 673 | 32.20 *(1) | 37.80 *(2) | 32.20 *(2) | 34.10 *(2) | 30.57 | 65 | — |
| phi4-reasoning:plus | **28.41** | 22 | 1336 | 33.47 *(2) | 37.63 *(2) | 33.88 *(2) | 33.25 *(2) | 20.21 | 57 | +16.32 |

> **Score** = scenario-weighted average of per-prompt jury scores (max 45). **gen t/s** = generation speed (eval phase). **prefill t/s** = prompt ingestion speed. Both from a single run — treat as directional, not precise.  
> **—** = no data. **\*(n)** = incomplete jury coverage for this scenario (n prompts scored vs 6 max) — score is directional only.

---

## Jury Matrix

> Row = candidate · Col = juror · Cell = median raw score (1–5) · [bracketed] = self-score

| Candidate / Juror | qwen3.6 | qwen3.5 | qwen3.5 | gemma4 | phi4-reasoning | gemma4 | devstral-small-2 | deepseek-r1 | deepseek-r1 | deepseek-coder-v2 | claude-sonnet-4-6 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| qwen3.6:27b | **[5.0]** | 4.5 | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| qwen3.5:27b | 5.0 | **[4.8]** | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| qwen3.5:9b | 5.0 | 2.8 | **[5.0]** | 5.0 | 4.8 | — | 5.0 | — | — | — | — |
| gemma4:26b | 5.0 | 3.9 | 5.0 | **[5.0]** | 5.0 | — | 5.0 | — | — | — | — |
| phi4-reasoning:plus | 3.4 | 3.5 | 1.9 | 5.0 | **[5.0]** | — | 2.9 | — | — | — | — |
| gemma4:31b | 5.0 | 4.8 | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| devstral-small-2 | 5.0 | — | 4.4 | 4.6 | 4.4 | — | **[5.0]** | — | — | — | — |
| deepseek-r1:14b | 3.0 | — | 3.4 | 3.6 | 4.3 | — | 4.8 | — | — | — | — |
| deepseek-r1:32b | 3.3 | — | 3.8 | 3.5 | 4.4 | — | 4.4 | — | — | — | — |
| deepseek-coder-v2:16b | 2.8 | — | 3.5 | 3.5 | 3.5 | — | 4.3 | — | — | — | — |
| claude-sonnet-4-6 | 5.0 | — | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |

---

## Dimension Breakdown

> **Weights:** Following ×2 · Correct ×4 · Concise ×1 · Format ×2 · max = 45

| Model | Scenario | Following | Correct | Concise | Format | Weighted |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| claude-sonnet-4-6 | coding | 5.00 | 4.70 | 5.00 | 5.00 | 43.80 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | structured | 5.00 | 4.90 | 5.00 | 5.00 | 44.60 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 4.50 | 4.20 | 5.00 | 5.00 | 40.80 |
|  |  |  |  |  |  |  |
| gemma4:31b | coding | 5.00 | 5.00 | 4.64 | 5.00 | 44.65 |
|  | reasoning | 4.90 | 4.90 | 4.70 | 5.00 | 44.10 |
|  | structured | 4.70 | 4.60 | 5.00 | 5.00 | 42.80 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 4.70 | 4.73 | 5.00 | 5.00 | 43.33 |
|  |  |  |  |  |  |  |
| qwen3.6:27b | coding | 4.67 | 4.00 | 4.33 | 5.00 | 40.13 |
|  | reasoning | 5.00 | 5.00 | 4.88 | 5.00 | 44.88 |
|  | structured | 4.88 | 4.63 | 5.00 | 5.00 | 43.25 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 4.83 | 4.67 | 4.83 | 4.83 | 42.83 |
|  |  |  |  |  |  |  |
| gemma4:26b | coding | 4.90 | 4.50 | 3.90 | 5.00 | 41.70 |
|  | reasoning | 5.00 | 5.00 | 4.75 | 5.00 | 44.75 |
|  | structured | 4.50 | 4.75 | 4.88 | 4.63 | 42.13 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 4.63 | 4.29 | 4.83 | 4.75 | 40.75 |
|  |  |  |  |  |  |  |
| qwen3.5:27b | coding | 5.00 | 5.00 | 4.80 | 5.00 | 44.80 |
|  | reasoning | 5.00 | 5.00 | 4.80 | 5.00 | 44.80 |
|  | structured | 3.40 | 3.30 | 3.80 | 3.40 | 30.60 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 4.17 | 4.47 | 4.57 | 4.43 | 39.63 |
|  |  |  |  |  |  |  |
| qwen3.5:9b | coding | 3.22 | 2.67 | 4.11 | 4.89 | 31.95 |
|  | reasoning | 5.00 | 5.00 | 4.63 | 5.00 | 44.63 |
|  | structured | 3.00 | 2.88 | 3.00 | 3.00 | 26.50 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 4.15 | 4.15 | 4.20 | 4.20 | 37.50 |
|  |  |  |  |  |  |  |
| devstral-small-2 | coding | 4.25 | 3.75 | 4.50 | 5.00 | 38.00 |
|  | reasoning | 4.50 | 4.50 | 4.00 | 4.88 | 40.75 |
|  | structured | 2.63 | 4.38 | 4.88 | 2.00 | 31.63 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 3.38 | 3.50 | 4.96 | 4.54 | 34.79 |
|  |  |  |  |  |  |  |
| deepseek-r1:14b | coding | 3.50 | 3.40 | 4.40 | 4.60 | 34.20 |
|  | reasoning | 4.80 | 4.90 | 4.30 | 4.90 | 43.30 |
|  | structured | 2.70 | 3.90 | 4.60 | 2.60 | 30.80 |
|  | summary | 4.60 | 5.00 | 4.90 | 5.00 | 44.10 |
|  | adversarial | 2.40 | 4.30 | 2.63 | 2.33 | 29.30 |
|  |  |  |  |  |  |  |
| deepseek-r1:32b | coding | — | — | — | — | — |
|  | reasoning | 4.70 | 4.70 | 4.70 | 5.00 | 42.90 |
|  | structured | 2.90 | 3.90 | 5.00 | 3.10 | 32.60 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 2.30 | 3.90 | 2.80 | 2.67 | 28.33 |
|  |  |  |  |  |  |  |
| deepseek-coder-v2:16b | coding | 3.60 | 2.80 | 3.80 | 5.00 | 32.20 |
|  | reasoning | 4.00 | 4.20 | 3.60 | 4.70 | 37.80 |
|  | structured | 3.10 | 3.80 | 4.80 | 3.00 | 32.20 |
|  | summary | 2.50 | 4.90 | 3.10 | 3.20 | 34.10 |
|  | adversarial | 3.07 | 3.57 | 3.50 | 3.33 | 30.57 |
|  |  |  |  |  |  |  |
| phi4-reasoning:plus | coding | 3.89 | 3.89 | 3.22 | 3.56 | 33.47 |
|  | reasoning | 3.75 | 4.88 | 3.38 | 3.63 | 37.63 |
|  | structured | 3.38 | 4.38 | 3.13 | 3.25 | 33.88 |
|  | summary | 3.13 | 4.38 | 3.25 | 3.13 | 33.25 |
|  | adversarial | 1.63 | 3.21 | 1.22 | 1.46 | 20.21 |

### claude-sonnet-4-6

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 4.70 | 5.00 | 5.00 | **43.80** |
| reasoning | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| structured | 5.00 | 4.90 | 5.00 | 5.00 | **44.60** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 4.50 | 4.20 | 5.00 | 5.00 | **40.80** |
| **Overall** | **4.90** | **4.76** | **5.00** | **5.00** | **43.84** |

### gemma4:31b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 5.00 | 4.64 | 5.00 | **44.65** |
| reasoning | 4.90 | 4.90 | 4.70 | 5.00 | **44.10** |
| structured | 4.70 | 4.60 | 5.00 | 5.00 | **42.80** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 4.70 | 4.73 | 5.00 | 5.00 | **43.33** |
| **Overall** | **4.86** | **4.85** | **4.87** | **5.00** | **43.79** |

### qwen3.6:27b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.67 | 4.00 | 4.33 | 5.00 | **40.13** |
| reasoning | 5.00 | 5.00 | 4.88 | 5.00 | **44.88** |
| structured | 4.88 | 4.63 | 5.00 | 5.00 | **43.25** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 4.83 | 4.67 | 4.83 | 4.83 | **42.83** |
| **Overall** | **4.88** | **4.66** | **4.81** | **4.97** | **43.11** |

### gemma4:26b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.90 | 4.50 | 3.90 | 5.00 | **41.70** |
| reasoning | 5.00 | 5.00 | 4.75 | 5.00 | **44.75** |
| structured | 4.50 | 4.75 | 4.88 | 4.63 | **42.13** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 4.63 | 4.29 | 4.83 | 4.75 | **40.75** |
| **Overall** | **4.80** | **4.71** | **4.67** | **4.88** | **42.26** |

### qwen3.5:27b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 5.00 | 4.80 | 5.00 | **44.80** |
| reasoning | 5.00 | 5.00 | 4.80 | 5.00 | **44.80** |
| structured | 3.40 | 3.30 | 3.80 | 3.40 | **30.60** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 4.17 | 4.47 | 4.57 | 4.43 | **39.63** |
| **Overall** | **4.51** | **4.55** | **4.59** | **4.57** | **40.59** |

### qwen3.5:9b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.22 | 2.67 | 4.11 | 4.89 | **31.95** |
| reasoning | 5.00 | 5.00 | 4.63 | 5.00 | **44.63** |
| structured | 3.00 | 2.88 | 3.00 | 3.00 | **26.50** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 4.15 | 4.15 | 4.20 | 4.20 | **37.50** |
| **Overall** | **4.07** | **3.94** | **4.19** | **4.42** | **37.20** |

### devstral-small-2

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.25 | 3.75 | 4.50 | 5.00 | **38.00** |
| reasoning | 4.50 | 4.50 | 4.00 | 4.88 | **40.75** |
| structured | 2.63 | 4.38 | 4.88 | 2.00 | **31.63** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 3.38 | 3.50 | 4.96 | 4.54 | **34.79** |
| **Overall** | **3.95** | **4.22** | **4.67** | **4.28** | **37.11** |

### deepseek-r1:14b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.50 | 3.40 | 4.40 | 4.60 | **34.20** |
| reasoning | 4.80 | 4.90 | 4.30 | 4.90 | **43.30** |
| structured | 2.70 | 3.90 | 4.60 | 2.60 | **30.80** |
| summary | 4.60 | 5.00 | 4.90 | 5.00 | **44.10** |
| adversarial | 2.40 | 4.30 | 2.63 | 2.33 | **29.30** |
| **Overall** | **3.60** | **4.30** | **4.17** | **3.89** | **34.33** |

### deepseek-r1:32b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | — | — | — | — | **—** |
| reasoning | 4.70 | 4.70 | 4.70 | 5.00 | **42.90** |
| structured | 2.90 | 3.90 | 5.00 | 3.10 | **32.60** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 2.30 | 3.90 | 2.80 | 2.67 | **28.33** |
| **Overall** | **3.72** | **4.38** | **4.38** | **3.94** | **34.25** |

### deepseek-coder-v2:16b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.60 | 2.80 | 3.80 | 5.00 | **32.20** |
| reasoning | 4.00 | 4.20 | 3.60 | 4.70 | **37.80** |
| structured | 3.10 | 3.80 | 4.80 | 3.00 | **32.20** |
| summary | 2.50 | 4.90 | 3.10 | 3.20 | **34.10** |
| adversarial | 3.07 | 3.57 | 3.50 | 3.33 | **30.57** |
| **Overall** | **3.25** | **3.85** | **3.76** | **3.85** | **32.60** |

### phi4-reasoning:plus

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.89 | 3.89 | 3.22 | 3.56 | **33.47** |
| reasoning | 3.75 | 4.88 | 3.38 | 3.63 | **37.63** |
| structured | 3.38 | 4.38 | 3.13 | 3.25 | **33.88** |
| summary | 3.13 | 4.38 | 3.25 | 3.13 | **33.25** |
| adversarial | 1.63 | 3.21 | 1.22 | 1.46 | **20.21** |
| **Overall** | **3.15** | **4.14** | **2.84** | **3.00** | **28.41** |

---

## Contested Results

> Jury disagreement σ > 1.0 — these scores should be interpreted cautiously.

- `summary:code_summary:phi4-reasoning:plus` — σ = 1.69 (5 jurors)
- `adversarial:prompt_injection:phi4-reasoning:plus` — σ = 1.60 (5 jurors)
- `adversarial:prompt_injection:qwen3.6:27b` — σ = 1.60 (5 jurors)
- `structured:multi_entity:phi4-reasoning:plus` — σ = 1.58 (5 jurors)
- `adversarial:prompt_injection:qwen3.5:27b` — σ = 1.57 (5 jurors)
- `structured:project_extract:qwen3.5:27b` — σ = 1.55 (5 jurors)
- `structured:project_extract:phi4-reasoning:plus` — σ = 1.50 (4 jurors)
- `coding:deep_merge:phi4-reasoning:plus` — σ = 1.49 (5 jurors)
- `adversarial:false_premise:phi4-reasoning:plus` — σ = 1.47 (5 jurors)
- `adversarial:state_tracking:phi4-reasoning:plus` — σ = 1.46 (5 jurors)
- `adversarial:math_trap:phi4-reasoning:plus` — σ = 1.43 (5 jurors)
- `adversarial:prompt_injection:deepseek-r1:14b` — σ = 1.36 (5 jurors)
- `coding:async_concurrency:phi4-reasoning:plus` — σ = 1.33 (6 jurors)
- `adversarial:prompt_injection:gemma4:26b` — σ = 1.29 (5 jurors)
- `reasoning:rollback_postmortem:phi4-reasoning:plus` — σ = 1.26 (5 jurors)
- `adversarial:word_count:phi4-reasoning:plus` — σ = 1.24 (4 jurors)
- `adversarial:letter_count:phi4-reasoning:plus` — σ = 1.23 (4 jurors)
- `summary:incident_summary:phi4-reasoning:plus` — σ = 1.18 (5 jurors)
- `structured:project_extract:deepseek-coder-v2:16b` — σ = 1.02 (5 jurors)

---

## Self-Preference Index

> Positive Δ = model scores itself higher than peers do. > +0.5 is flagged as self-serving.

| Model | Peer | Self | Δ | Flag |
| :--- | ---: | ---: | ---: | :--- |
| qwen3.6:27b | 43.11 | 44.93 | +1.82 | ⚠ self-serving |
| gemma4:26b | 42.26 | 44.14 | +1.88 | ⚠ self-serving |
| qwen3.5:27b | 40.59 | 44.00 | +3.41 | ⚠ self-serving |
| qwen3.5:9b | 37.20 | 35.08 | -2.13 | self-deprecating |
| devstral-small-2 | 37.11 | 41.14 | +4.04 | ⚠ self-serving |
| phi4-reasoning:plus | 28.41 | 44.73 | +16.32 | ⚠ self-serving |
