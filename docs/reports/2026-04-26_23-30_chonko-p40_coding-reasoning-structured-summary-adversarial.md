# Comparitron — 2026-04-26_23-30_chonko-p40_coding-reasoning-structured-summary-adversarial

**Date:** Sun, 26 Apr 2026 03:30:09 GMT  
**Hardware:** chonko — Tesla P40 24GB  
**Gauntlet:** 5 scenarios · 10 prompts · 10 candidates  
**Jurors:** gemma4:26b, phi4-reasoning:plus, devstral-small-2, qwen3.6:27b, qwen3.5:9b

---

## Rankings

| Model | Score | gen t/s | prefill t/s | coding | reasoning | structure | summary | adversari | Votes | Self Δ |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gemma4:31b | **88.69** | 5 | 81 | 89.30 | 88.20 | 89.20 | 90.00 | 84.80 | 10 | — |
| claude-sonnet-4-6 | **88.36** | 72 | — | 87.60 | 90.00 | 89.20 | 90.00 | 81.60 | 10 | — |
| qwen3.6:27b | **87.78** | 12 | 156 | 83.75 | 89.75 | 86.50 | 90.00 | 90.00 | 10 | +2.00 |
| gemma4:26b | **86.09** | 43 | 480 | 83.40 | 89.50 | 84.25 | 90.00 | 80.50 | 10 | +2.58 |
| qwen3.5:27b | **83.29** | 12 | 155 | 89.60 | 89.60 | 61.20 | 90.00 | 88.80 | 10 | +4.71 |
| deepseek-r1:32b | **76.17** | 4 | 72 | — *(0) | 85.80 | 65.20 | 90.00 | 51.20 | 8 | — |
| qwen3.5:9b | **75.64** | 34 | 439 | 63.90 | 89.25 | 53.00 | 90.00 | 88.50 | 10 | -3.64 |
| deepseek-r1:14b | **75.16** | 26 | 385 | 68.40 | 86.60 | 61.60 | 88.20 | 66.80 | 10 | — |
| devstral-small-2 | **74.97** | 18 | 1811 | 76.00 | 81.50 | 63.25 | 90.00 | 53.25 | 10 | +11.92 |
| deepseek-coder-v2:16b | **68.91** | 80 | 798 | 64.40 *(1) | 75.60 | 64.40 | 69.15 | 68.60 | 9 | — |
| phi4-reasoning:plus | **65.18** | 22 | 1132 | 66.95 | 75.25 | 67.75 | 66.50 | 33.75 | 10 | +24.19 |

> **gen t/s** = generation speed (eval phase). **prefill t/s** = prompt ingestion speed. Both from a single run — treat as directional, not precise.

---

## Jury Matrix

> Row = candidate · Col = juror · Cell = median raw score (1–5) · [bracketed] = self-score

| Candidate / Juror | qwen3.6 | qwen3.5 | qwen3.5 | gemma4 | phi4-reasoning | gemma4 | devstral-small-2 | deepseek-r1 | deepseek-r1 | deepseek-coder-v2 | claude-sonnet-4-6 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| qwen3.6:27b | **[5.0]** | 4.5 | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| qwen3.5:27b | 5.0 | **[4.8]** | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| qwen3.5:9b | 5.0 | 2.8 | **[5.0]** | 5.0 | 4.8 | — | 5.0 | — | — | — | — |
| gemma4:26b | 5.0 | 3.9 | 5.0 | **[5.0]** | 5.0 | — | 5.0 | — | — | — | — |
| phi4-reasoning:plus | 4.9 | 3.5 | 1.8 | 5.0 | **[5.0]** | — | 3.6 | — | — | — | — |
| gemma4:31b | 5.0 | 4.8 | 5.0 | 5.0 | 4.9 | — | 5.0 | — | — | — | — |
| devstral-small-2 | 4.3 | — | 3.9 | 4.6 | 4.3 | — | **[5.0]** | — | — | — | — |
| deepseek-r1:14b | 3.6 | — | 4.3 | 4.4 | 4.4 | — | 5.0 | — | — | — | — |
| deepseek-r1:32b | 3.5 | — | 4.5 | 4.0 | 5.0 | — | 4.8 | — | — | — | — |
| deepseek-coder-v2:16b | 2.8 | — | 3.5 | 3.5 | 3.8 | — | 4.5 | — | — | — | — |
| claude-sonnet-4-6 | 5.0 | — | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |

---

## Dimension Breakdown

> **Weights:** Correct ×8 · Following ×4 · Format ×4 · Concise ×2 · max = 90

| Model | Scenario | Correct | Following | Format | Concise | Weighted |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| gemma4:31b | coding | 5.00 | 5.00 | 5.00 | 4.64 | 89.30 |
|  | reasoning | 4.90 | 4.90 | 5.00 | 4.70 | 88.20 |
|  | structured | 4.89 | 5.00 | 5.00 | 5.00 | 89.20 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.60 | 4.50 | 5.00 | 5.00 | 84.80 |
|  |  |  |  |  |  |  |
| claude-sonnet-4-6 | coding | 4.70 | 5.00 | 5.00 | 5.00 | 87.60 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | structured | 4.90 | 5.00 | 5.00 | 5.00 | 89.20 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.20 | 4.50 | 5.00 | 5.00 | 81.60 |
|  |  |  |  |  |  |  |
| qwen3.6:27b | coding | 4.38 | 5.00 | 5.00 | 4.38 | 83.75 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.88 | 89.75 |
|  | structured | 4.63 | 4.88 | 5.00 | 5.00 | 86.50 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  |  |  |  |  |  |  |
| gemma4:26b | coding | 4.50 | 4.90 | 5.00 | 3.90 | 83.40 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.75 | 89.50 |
|  | structured | 4.75 | 4.50 | 4.63 | 4.88 | 84.25 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.00 | 4.63 | 5.00 | 5.00 | 80.50 |
|  |  |  |  |  |  |  |
| qwen3.5:27b | coding | 5.00 | 5.00 | 5.00 | 4.80 | 89.60 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.80 | 89.60 |
|  | structured | 3.30 | 3.40 | 3.40 | 3.80 | 61.20 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 5.00 | 4.90 | 4.90 | 4.80 | 88.80 |
|  |  |  |  |  |  |  |
| deepseek-r1:32b | coding | — | — | — | — | — |
|  | reasoning | 4.70 | 4.70 | 5.00 | 4.70 | 85.80 |
|  | structured | 3.90 | 2.90 | 3.10 | 5.00 | 65.20 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 3.10 | 2.10 | 3.00 | 3.00 | 51.20 |
|  |  |  |  |  |  |  |
| qwen3.5:9b | coding | 2.67 | 3.22 | 4.89 | 4.11 | 63.90 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.63 | 89.25 |
|  | structured | 2.88 | 3.00 | 3.00 | 3.00 | 53.00 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.88 | 4.88 | 5.00 | 5.00 | 88.50 |
|  |  |  |  |  |  |  |
| deepseek-r1:14b | coding | 3.40 | 3.50 | 4.60 | 4.40 | 68.40 |
|  | reasoning | 4.90 | 4.80 | 4.90 | 4.30 | 86.60 |
|  | structured | 3.90 | 2.70 | 2.60 | 4.60 | 61.60 |
|  | summary | 5.00 | 4.60 | 5.00 | 4.90 | 88.20 |
|  | adversarial | 4.30 | 3.30 | 3.30 | 3.00 | 66.80 |
|  |  |  |  |  |  |  |
| devstral-small-2 | coding | 3.75 | 4.25 | 5.00 | 4.50 | 76.00 |
|  | reasoning | 4.50 | 4.50 | 4.88 | 4.00 | 81.50 |
|  | structured | 4.38 | 2.63 | 2.00 | 4.88 | 63.25 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 1.75 | 2.38 | 5.00 | 4.88 | 53.25 |
|  |  |  |  |  |  |  |
| deepseek-coder-v2:16b | coding | 2.80 | 3.60 | 5.00 | 3.80 | 64.40 |
|  | reasoning | 4.20 | 4.00 | 4.70 | 3.60 | 75.60 |
|  | structured | 3.80 | 3.10 | 3.00 | 4.80 | 64.40 |
|  | summary | 4.89 | 2.56 | 3.33 | 3.11 | 69.15 |
|  | adversarial | 3.80 | 3.60 | 3.90 | 4.10 | 68.60 |
|  |  |  |  |  |  |  |
| phi4-reasoning:plus | coding | 3.89 | 3.89 | 3.56 | 3.22 | 66.95 |
|  | reasoning | 4.88 | 3.75 | 3.63 | 3.38 | 75.25 |
|  | structured | 4.38 | 3.38 | 3.25 | 3.13 | 67.75 |
|  | summary | 4.38 | 3.13 | 3.13 | 3.25 | 66.50 |
|  | adversarial | 2.63 | 1.25 | 1.38 | 1.13 | 33.75 |

### gemma4:31b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 5.00 | 5.00 | 4.64 | **89.30** |
| reasoning | 4.90 | 4.90 | 5.00 | 4.70 | **88.20** |
| structured | 4.89 | 5.00 | 5.00 | 5.00 | **89.20** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.60 | 4.50 | 5.00 | 5.00 | **84.80** |
| **Overall** | **4.88** | **4.88** | **5.00** | **4.87** | **88.69** |

### claude-sonnet-4-6

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.70 | 5.00 | 5.00 | 5.00 | **87.60** |
| reasoning | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| structured | 4.90 | 5.00 | 5.00 | 5.00 | **89.20** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.20 | 4.50 | 5.00 | 5.00 | **81.60** |
| **Overall** | **4.76** | **4.90** | **5.00** | **5.00** | **88.36** |

### qwen3.6:27b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.38 | 5.00 | 5.00 | 4.38 | **83.75** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.88 | **89.75** |
| structured | 4.63 | 4.88 | 5.00 | 5.00 | **86.50** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| **Overall** | **4.80** | **4.97** | **5.00** | **4.85** | **87.78** |

### gemma4:26b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.50 | 4.90 | 5.00 | 3.90 | **83.40** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.75 | **89.50** |
| structured | 4.75 | 4.50 | 4.63 | 4.88 | **84.25** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.00 | 4.63 | 5.00 | 5.00 | **80.50** |
| **Overall** | **4.65** | **4.80** | **4.92** | **4.71** | **86.09** |

### qwen3.5:27b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 5.00 | 5.00 | 4.80 | **89.60** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.80 | **89.60** |
| structured | 3.30 | 3.40 | 3.40 | 3.80 | **61.20** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 5.00 | 4.90 | 4.90 | 4.80 | **88.80** |
| **Overall** | **4.66** | **4.66** | **4.66** | **4.64** | **83.29** |

### deepseek-r1:32b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | — | — | — | — | **—** |
| reasoning | 4.70 | 4.70 | 5.00 | 4.70 | **85.80** |
| structured | 3.90 | 2.90 | 3.10 | 5.00 | **65.20** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 3.10 | 2.10 | 3.00 | 3.00 | **51.20** |
| **Overall** | **4.17** | **3.67** | **4.03** | **4.42** | **76.17** |

### qwen3.5:9b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 2.67 | 3.22 | 4.89 | 4.11 | **63.90** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.63 | **89.25** |
| structured | 2.88 | 3.00 | 3.00 | 3.00 | **53.00** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.88 | 4.88 | 5.00 | 5.00 | **88.50** |
| **Overall** | **4.08** | **4.22** | **4.58** | **4.35** | **75.64** |

### deepseek-r1:14b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.40 | 3.50 | 4.60 | 4.40 | **68.40** |
| reasoning | 4.90 | 4.80 | 4.90 | 4.30 | **86.60** |
| structured | 3.90 | 2.70 | 2.60 | 4.60 | **61.60** |
| summary | 5.00 | 4.60 | 5.00 | 4.90 | **88.20** |
| adversarial | 4.30 | 3.30 | 3.30 | 3.00 | **66.80** |
| **Overall** | **4.30** | **3.78** | **4.08** | **4.24** | **75.16** |

### devstral-small-2

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.75 | 4.25 | 5.00 | 4.50 | **76.00** |
| reasoning | 4.50 | 4.50 | 4.88 | 4.00 | **81.50** |
| structured | 4.38 | 2.63 | 2.00 | 4.88 | **63.25** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 1.75 | 2.38 | 5.00 | 4.88 | **53.25** |
| **Overall** | **3.88** | **3.75** | **4.38** | **4.65** | **74.97** |

### deepseek-coder-v2:16b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 2.80 | 3.60 | 5.00 | 3.80 | **64.40** |
| reasoning | 4.20 | 4.00 | 4.70 | 3.60 | **75.60** |
| structured | 3.80 | 3.10 | 3.00 | 4.80 | **64.40** |
| summary | 4.89 | 2.56 | 3.33 | 3.11 | **69.15** |
| adversarial | 3.80 | 3.60 | 3.90 | 4.10 | **68.60** |
| **Overall** | **3.90** | **3.37** | **3.99** | **3.88** | **68.91** |

### phi4-reasoning:plus

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.89 | 3.89 | 3.56 | 3.22 | **66.95** |
| reasoning | 4.88 | 3.75 | 3.63 | 3.38 | **75.25** |
| structured | 4.38 | 3.38 | 3.25 | 3.13 | **67.75** |
| summary | 4.38 | 3.13 | 3.13 | 3.25 | **66.50** |
| adversarial | 2.63 | 1.25 | 1.38 | 1.13 | **33.75** |
| **Overall** | **4.03** | **3.08** | **2.99** | **2.82** | **65.18** |

---

## Contested Results

> Jury disagreement σ > 1.0 — these scores should be interpreted cautiously.

- `summary:code_summary:phi4-reasoning:plus` — σ = 1.69 (5 jurors)
- `structured:multi_entity:phi4-reasoning:plus` — σ = 1.58 (5 jurors)
- `structured:project_extract:qwen3.5:27b` — σ = 1.55 (5 jurors)
- `structured:project_extract:phi4-reasoning:plus` — σ = 1.50 (4 jurors)
- `coding:deep_merge:phi4-reasoning:plus` — σ = 1.49 (5 jurors)
- `adversarial:state_tracking:phi4-reasoning:plus` — σ = 1.46 (5 jurors)
- `adversarial:math_trap:phi4-reasoning:plus` — σ = 1.43 (5 jurors)
- `coding:async_concurrency:phi4-reasoning:plus` — σ = 1.33 (6 jurors)
- `reasoning:rollback_postmortem:phi4-reasoning:plus` — σ = 1.26 (5 jurors)
- `summary:incident_summary:phi4-reasoning:plus` — σ = 1.18 (5 jurors)
- `structured:project_extract:deepseek-coder-v2:16b` — σ = 1.02 (5 jurors)

---

## Self-Preference Index

> Positive Δ = model scores itself higher than peers do. > +0.5 is flagged as self-serving.

| Model | Peer | Self | Δ | Flag |
| :--- | ---: | ---: | ---: | :--- |
| qwen3.6:27b | 87.78 | 89.78 | +2.00 | ⚠ self-serving |
| gemma4:26b | 86.09 | 88.67 | +2.58 | ⚠ self-serving |
| qwen3.5:27b | 83.29 | 88.00 | +4.71 | ⚠ self-serving |
| qwen3.5:9b | 75.64 | 72.00 | -3.64 | self-deprecating |
| devstral-small-2 | 74.97 | 86.89 | +11.92 | ⚠ self-serving |
| phi4-reasoning:plus | 65.18 | 89.38 | +24.19 | ⚠ self-serving |
