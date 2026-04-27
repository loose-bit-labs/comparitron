# Comparitron — 2026-04-26_15-06_chonko-p40_coding-reasoning-structured-summary-adversarial-archaeology-synthesis

**Date:** Sun, 26 Apr 2026 19:06:22 GMT  
**Hardware:** chonko — Tesla P40 24GB  
**Gauntlet:** 7 scenarios · 21 prompts · 10 candidates  
**Jurors:** gemma4:26b, phi4-reasoning:plus, devstral-small-2, qwen3.6:27b, qwen3.5:9b

---

## Rankings

| Model | Score | gen t/s | prefill t/s | coding | reasoning | structure | summary | adversari | archaeolo | synthesis | Votes | Self Δ |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| qwen3.6:27b | **86.53** | 12 | 167 | 80.25 *(2) | 89.75 *(2) | 86.50 *(2) | 90.00 *(2) | 85.67 | 89.00 *(3) | 84.67 *(3) | 81 | -0.76 |
| gemma4:31b | **85.96** | 5 | 98 | 89.30 *(2) | 88.20 *(2) | 85.60 *(2) | 90.00 *(2) | 86.67 | 85.47 *(3) | 79.60 *(3) | 101 | — |
| claude-sonnet-4-6 | **85.55** | 72 | — | 87.60 *(2) | 90.00 *(2) | 89.20 *(2) | 90.00 *(2) | 83.47 | 86.00 *(3) | 77.47 *(3) | 100 | — |
| gemma4:26b | **85.16** | 43 | 637 | 83.40 *(2) | 89.50 *(2) | 84.25 *(2) | 90.00 *(2) | 81.50 | 87.67 *(3) | 82.00 *(3) | 82 | +4.13 |
| qwen3.5:27b | **82.74** | 12 | 167 | 89.60 *(2) | 89.60 *(2) | 61.20 *(2) | 90.00 *(2) | 79.27 | 85.73 *(3) | 83.60 *(3) | 99 | +5.26 |
| qwen3.5:9b | **78.59** | 34 | 495 | 63.90 *(2) | 89.25 *(2) | 53.00 *(2) | 90.00 *(2) | 76.42 | 90.00 *(3) | 81.50 *(3) | 81 | -5.41 |
| devstral-small-2 | **76.25** | 19 | 1820 | 76.00 *(2) | 81.50 *(2) | 63.25 *(2) | 90.00 *(2) | 69.58 | 83.67 *(3) | 71.67 *(3) | 80 | +9.75 |
| deepseek-r1:32b | **72.91** | 4 | 75 | — *(0) | 85.80 *(2) | 65.20 *(2) | 90.00 *(2) | 56.67 | 81.73 *(3) | 65.47 *(3) | 90 | — |
| deepseek-r1:14b | **71.59** | 27 | 385 | 68.40 *(2) | 86.60 *(2) | 61.60 *(2) | 88.20 *(2) | 58.60 | 80.40 *(3) | 63.47 *(3) | 100 | — |
| deepseek-coder-v2:16b | **63.00** | 81 | 906 | 64.40 *(1) | 75.60 *(2) | 64.40 *(2) | 68.20 *(2) | 61.13 | 66.47 *(3) | 48.13 *(3) | 94 | — |
| phi4-reasoning:plus | **54.18** | 22 | 1039 | 66.95 *(2) | 75.25 *(2) | 67.75 *(2) | 66.50 *(2) | 40.42 | 49.83 *(3) | 32.44 *(3) | 81 | +35.32 |

> **Score** = scenario-weighted average of per-prompt jury scores (max 90). **gen t/s** = generation speed (eval phase). **prefill t/s** = prompt ingestion speed. Both from a single run — treat as directional, not precise.  
> **—** = no data. **\*(n)** = incomplete jury coverage for this scenario (n prompts scored vs 6 max) — score is directional only.

---

## Jury Matrix

> Row = candidate · Col = juror · Cell = median raw score (1–5) · [bracketed] = self-score

| Candidate / Juror | qwen3.6 | qwen3.5 | qwen3.5 | gemma4 | phi4-reasoning | gemma4 | devstral-small-2 | deepseek-r1 | deepseek-r1 | deepseek-coder-v2 | claude-sonnet-4-6 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| qwen3.6:27b | **[5.0]** | 4.5 | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| qwen3.5:27b | 5.0 | **[4.8]** | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| qwen3.5:9b | 5.0 | 2.8 | **[5.0]** | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| gemma4:26b | 5.0 | 3.9 | 5.0 | **[5.0]** | 5.0 | — | 5.0 | — | — | — | — |
| phi4-reasoning:plus | 2.4 | 3.5 | 1.9 | 3.0 | **[5.0]** | — | 2.9 | — | — | — | — |
| gemma4:31b | 5.0 | 4.8 | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |
| devstral-small-2 | 4.8 | — | 4.4 | 4.6 | 4.8 | — | **[5.0]** | — | — | — | — |
| deepseek-r1:14b | 3.0 | — | 3.8 | 4.0 | 4.4 | — | 5.0 | — | — | — | — |
| deepseek-r1:32b | 3.3 | — | 3.8 | 3.5 | 4.8 | — | 5.0 | — | — | — | — |
| deepseek-coder-v2:16b | 2.8 | — | 3.0 | 3.5 | 3.8 | — | 4.3 | — | — | — | — |
| claude-sonnet-4-6 | 5.0 | — | 5.0 | 5.0 | 5.0 | — | 5.0 | — | — | — | — |

---

## Dimension Breakdown

> **Weights:** Correct ×8 · Following ×4 · Format ×4 · Concise ×2 · max = 90

| Model | Scenario | Correct | Following | Format | Concise | Weighted |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| qwen3.6:27b | coding | 4.00 | 4.67 | 5.00 | 4.33 | 80.25 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.88 | 89.75 |
|  | structured | 4.63 | 4.88 | 5.00 | 5.00 | 86.50 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.67 | 4.83 | 4.83 | 4.83 | 85.67 |
|  | archaeology | 5.00 | 4.75 | 5.00 | 5.00 | 89.00 |
|  | synthesis | 4.58 | 4.50 | 5.00 | 5.00 | 84.67 |
|  |  |  |  |  |  |  |
| gemma4:31b | coding | 5.00 | 5.00 | 5.00 | 4.64 | 89.30 |
|  | reasoning | 4.90 | 4.90 | 5.00 | 4.70 | 88.20 |
|  | structured | 4.60 | 4.70 | 5.00 | 5.00 | 85.60 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.73 | 4.70 | 5.00 | 5.00 | 86.67 |
|  | archaeology | 4.87 | 4.60 | 4.53 | 5.00 | 85.47 |
|  | synthesis | 4.27 | 3.87 | 5.00 | 5.00 | 79.60 |
|  |  |  |  |  |  |  |
| claude-sonnet-4-6 | coding | 4.70 | 5.00 | 5.00 | 5.00 | 87.60 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | structured | 4.90 | 5.00 | 5.00 | 5.00 | 89.20 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.47 | 4.63 | 4.87 | 4.87 | 83.47 |
|  | archaeology | 5.00 | 4.53 | 4.53 | 4.87 | 86.00 |
|  | synthesis | 4.40 | 3.80 | 4.47 | 4.60 | 77.47 |
|  |  |  |  |  |  |  |
| gemma4:26b | coding | 4.50 | 4.90 | 5.00 | 3.90 | 83.40 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.75 | 89.50 |
|  | structured | 4.75 | 4.50 | 4.63 | 4.88 | 84.25 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.29 | 4.63 | 4.75 | 4.83 | 81.50 |
|  | archaeology | 5.00 | 4.75 | 4.75 | 4.83 | 87.67 |
|  | synthesis | 4.50 | 4.08 | 4.92 | 5.00 | 82.00 |
|  |  |  |  |  |  |  |
| qwen3.5:27b | coding | 5.00 | 5.00 | 5.00 | 4.80 | 89.60 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.80 | 89.60 |
|  | structured | 3.30 | 3.40 | 3.40 | 3.80 | 61.20 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.47 | 4.17 | 4.43 | 4.57 | 79.27 |
|  | archaeology | 4.93 | 4.57 | 4.57 | 4.93 | 85.73 |
|  | synthesis | 4.47 | 4.47 | 5.00 | 5.00 | 83.60 |
|  |  |  |  |  |  |  |
| qwen3.5:9b | coding | 2.67 | 3.22 | 4.89 | 4.11 | 63.90 |
|  | reasoning | 5.00 | 5.00 | 5.00 | 4.63 | 89.25 |
|  | structured | 2.88 | 3.00 | 3.00 | 3.00 | 53.00 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 4.29 | 4.21 | 4.21 | 4.21 | 76.42 |
|  | archaeology | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | synthesis | 4.33 | 4.42 | 4.83 | 4.92 | 81.50 |
|  |  |  |  |  |  |  |
| devstral-small-2 | coding | 3.75 | 4.25 | 5.00 | 4.50 | 76.00 |
|  | reasoning | 4.50 | 4.50 | 4.88 | 4.00 | 81.50 |
|  | structured | 4.38 | 2.63 | 2.00 | 4.88 | 63.25 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 3.50 | 3.38 | 4.54 | 4.96 | 69.58 |
|  | archaeology | 4.92 | 4.08 | 4.58 | 4.83 | 83.67 |
|  | synthesis | 3.83 | 3.33 | 4.50 | 4.83 | 71.67 |
|  |  |  |  |  |  |  |
| deepseek-r1:32b | coding | — | — | — | — | — |
|  | reasoning | 4.70 | 4.70 | 5.00 | 4.70 | 85.80 |
|  | structured | 3.90 | 2.90 | 3.10 | 5.00 | 65.20 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 90.00 |
|  | adversarial | 3.90 | 2.30 | 2.67 | 2.80 | 56.67 |
|  | archaeology | 4.93 | 4.07 | 4.13 | 4.71 | 81.73 |
|  | synthesis | 3.60 | 3.13 | 4.00 | 4.07 | 65.47 |
|  |  |  |  |  |  |  |
| deepseek-r1:14b | coding | 3.40 | 3.50 | 4.60 | 4.40 | 68.40 |
|  | reasoning | 4.90 | 4.80 | 4.90 | 4.30 | 86.60 |
|  | structured | 3.90 | 2.70 | 2.60 | 4.60 | 61.60 |
|  | summary | 5.00 | 4.60 | 5.00 | 4.90 | 88.20 |
|  | adversarial | 4.30 | 2.40 | 2.33 | 2.63 | 58.60 |
|  | archaeology | 4.60 | 4.07 | 4.47 | 4.71 | 80.40 |
|  | synthesis | 3.33 | 3.20 | 3.93 | 4.13 | 63.47 |
|  |  |  |  |  |  |  |
| deepseek-coder-v2:16b | coding | 2.80 | 3.60 | 5.00 | 3.80 | 64.40 |
|  | reasoning | 4.20 | 4.00 | 4.70 | 3.60 | 75.60 |
|  | structured | 3.80 | 3.10 | 3.00 | 4.80 | 64.40 |
|  | summary | 4.90 | 2.50 | 3.20 | 3.10 | 68.20 |
|  | adversarial | 3.57 | 3.07 | 3.33 | 3.50 | 61.13 |
|  | archaeology | 4.07 | 3.21 | 3.43 | 4.43 | 66.47 |
|  | synthesis | 2.73 | 2.07 | 3.07 | 2.87 | 48.13 |
|  |  |  |  |  |  |  |
| phi4-reasoning:plus | coding | 3.89 | 3.89 | 3.56 | 3.22 | 66.95 |
|  | reasoning | 4.88 | 3.75 | 3.63 | 3.38 | 75.25 |
|  | structured | 4.38 | 3.38 | 3.25 | 3.13 | 67.75 |
|  | summary | 4.38 | 3.13 | 3.13 | 3.25 | 66.50 |
|  | adversarial | 3.21 | 1.63 | 1.46 | 1.22 | 40.42 |
|  | archaeology | 3.58 | 2.25 | 2.00 | 2.08 | 49.83 |
|  | synthesis | 2.42 | 1.50 | 1.17 | 1.18 | 32.44 |

### qwen3.6:27b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.00 | 4.67 | 5.00 | 4.33 | **80.25** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.88 | **89.75** |
| structured | 4.63 | 4.88 | 5.00 | 5.00 | **86.50** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.67 | 4.83 | 4.83 | 4.83 | **85.67** |
| archaeology | 5.00 | 4.75 | 5.00 | 5.00 | **89.00** |
| synthesis | 4.58 | 4.50 | 5.00 | 5.00 | **84.67** |
| **Overall** | **4.70** | **4.80** | **4.98** | **4.86** | **86.53** |

### gemma4:31b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 5.00 | 5.00 | 4.64 | **89.30** |
| reasoning | 4.90 | 4.90 | 5.00 | 4.70 | **88.20** |
| structured | 4.60 | 4.70 | 5.00 | 5.00 | **85.60** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.73 | 4.70 | 5.00 | 5.00 | **86.67** |
| archaeology | 4.87 | 4.60 | 4.53 | 5.00 | **85.47** |
| synthesis | 4.27 | 3.87 | 5.00 | 5.00 | **79.60** |
| **Overall** | **4.77** | **4.68** | **4.93** | **4.91** | **85.96** |

### claude-sonnet-4-6

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.70 | 5.00 | 5.00 | 5.00 | **87.60** |
| reasoning | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| structured | 4.90 | 5.00 | 5.00 | 5.00 | **89.20** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.47 | 4.63 | 4.87 | 4.87 | **83.47** |
| archaeology | 5.00 | 4.53 | 4.53 | 4.87 | **86.00** |
| synthesis | 4.40 | 3.80 | 4.47 | 4.60 | **77.47** |
| **Overall** | **4.78** | **4.71** | **4.84** | **4.90** | **85.55** |

### gemma4:26b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.50 | 4.90 | 5.00 | 3.90 | **83.40** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.75 | **89.50** |
| structured | 4.75 | 4.50 | 4.63 | 4.88 | **84.25** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.29 | 4.63 | 4.75 | 4.83 | **81.50** |
| archaeology | 5.00 | 4.75 | 4.75 | 4.83 | **87.67** |
| synthesis | 4.50 | 4.08 | 4.92 | 5.00 | **82.00** |
| **Overall** | **4.72** | **4.69** | **4.86** | **4.74** | **85.16** |

### qwen3.5:27b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 5.00 | 5.00 | 4.80 | **89.60** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.80 | **89.60** |
| structured | 3.30 | 3.40 | 3.40 | 3.80 | **61.20** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.47 | 4.17 | 4.43 | 4.57 | **79.27** |
| archaeology | 4.93 | 4.57 | 4.57 | 4.93 | **85.73** |
| synthesis | 4.47 | 4.47 | 5.00 | 5.00 | **83.60** |
| **Overall** | **4.59** | **4.51** | **4.63** | **4.70** | **82.74** |

### qwen3.5:9b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 2.67 | 3.22 | 4.89 | 4.11 | **63.90** |
| reasoning | 5.00 | 5.00 | 5.00 | 4.63 | **89.25** |
| structured | 2.88 | 3.00 | 3.00 | 3.00 | **53.00** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 4.29 | 4.21 | 4.21 | 4.21 | **76.42** |
| archaeology | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| synthesis | 4.33 | 4.42 | 4.83 | 4.92 | **81.50** |
| **Overall** | **4.17** | **4.26** | **4.56** | **4.41** | **78.59** |

### devstral-small-2

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.75 | 4.25 | 5.00 | 4.50 | **76.00** |
| reasoning | 4.50 | 4.50 | 4.88 | 4.00 | **81.50** |
| structured | 4.38 | 2.63 | 2.00 | 4.88 | **63.25** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 3.50 | 3.38 | 4.54 | 4.96 | **69.58** |
| archaeology | 4.92 | 4.08 | 4.58 | 4.83 | **83.67** |
| synthesis | 3.83 | 3.33 | 4.50 | 4.83 | **71.67** |
| **Overall** | **4.27** | **3.88** | **4.36** | **4.71** | **76.25** |

### deepseek-r1:32b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | — | — | — | — | **—** |
| reasoning | 4.70 | 4.70 | 5.00 | 4.70 | **85.80** |
| structured | 3.90 | 2.90 | 3.10 | 5.00 | **65.20** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **90.00** |
| adversarial | 3.90 | 2.30 | 2.67 | 2.80 | **56.67** |
| archaeology | 4.93 | 4.07 | 4.13 | 4.71 | **81.73** |
| synthesis | 3.60 | 3.13 | 4.00 | 4.07 | **65.47** |
| **Overall** | **4.34** | **3.68** | **3.98** | **4.38** | **72.91** |

### deepseek-r1:14b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.40 | 3.50 | 4.60 | 4.40 | **68.40** |
| reasoning | 4.90 | 4.80 | 4.90 | 4.30 | **86.60** |
| structured | 3.90 | 2.70 | 2.60 | 4.60 | **61.60** |
| summary | 5.00 | 4.60 | 5.00 | 4.90 | **88.20** |
| adversarial | 4.30 | 2.40 | 2.33 | 2.63 | **58.60** |
| archaeology | 4.60 | 4.07 | 4.47 | 4.71 | **80.40** |
| synthesis | 3.33 | 3.20 | 3.93 | 4.13 | **63.47** |
| **Overall** | **4.20** | **3.61** | **3.98** | **4.24** | **71.59** |

### deepseek-coder-v2:16b

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 2.80 | 3.60 | 5.00 | 3.80 | **64.40** |
| reasoning | 4.20 | 4.00 | 4.70 | 3.60 | **75.60** |
| structured | 3.80 | 3.10 | 3.00 | 4.80 | **64.40** |
| summary | 4.90 | 2.50 | 3.20 | 3.10 | **68.20** |
| adversarial | 3.57 | 3.07 | 3.33 | 3.50 | **61.13** |
| archaeology | 4.07 | 3.21 | 3.43 | 4.43 | **66.47** |
| synthesis | 2.73 | 2.07 | 3.07 | 2.87 | **48.13** |
| **Overall** | **3.72** | **3.08** | **3.68** | **3.73** | **63.00** |

### phi4-reasoning:plus

| Scenario | Correct | Following | Format | Concise | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.89 | 3.89 | 3.56 | 3.22 | **66.95** |
| reasoning | 4.88 | 3.75 | 3.63 | 3.38 | **75.25** |
| structured | 4.38 | 3.38 | 3.25 | 3.13 | **67.75** |
| summary | 4.38 | 3.13 | 3.13 | 3.25 | **66.50** |
| adversarial | 3.21 | 1.63 | 1.46 | 1.22 | **40.42** |
| archaeology | 3.58 | 2.25 | 2.00 | 2.08 | **49.83** |
| synthesis | 2.42 | 1.50 | 1.17 | 1.18 | **32.44** |
| **Overall** | **3.82** | **2.79** | **2.60** | **2.49** | **54.18** |

---

## Contested Results

> Jury disagreement σ > 1.0 — these scores should be interpreted cautiously.

- `summary:code_summary:phi4-reasoning:plus` — σ = 1.69 (5 jurors)
- `adversarial:prompt_injection:claude-sonnet-4-6` — σ = 1.60 (5 jurors)
- `adversarial:prompt_injection:phi4-reasoning:plus` — σ = 1.60 (5 jurors)
- `adversarial:prompt_injection:qwen3.6:27b` — σ = 1.60 (5 jurors)
- `structured:multi_entity:phi4-reasoning:plus` — σ = 1.58 (5 jurors)
- `adversarial:prompt_injection:qwen3.5:27b` — σ = 1.57 (5 jurors)
- `structured:project_extract:qwen3.5:27b` — σ = 1.55 (5 jurors)
- `archaeology:entity_extract:phi4-reasoning:plus` — σ = 1.51 (4 jurors)
- `structured:project_extract:phi4-reasoning:plus` — σ = 1.50 (4 jurors)
- `coding:deep_merge:phi4-reasoning:plus` — σ = 1.49 (5 jurors)
- `adversarial:false_premise:phi4-reasoning:plus` — σ = 1.47 (5 jurors)
- `adversarial:state_tracking:phi4-reasoning:plus` — σ = 1.46 (5 jurors)
- `synthesis:dream_insight:deepseek-r1:14b` — σ = 1.44 (5 jurors)
- `adversarial:math_trap:phi4-reasoning:plus` — σ = 1.43 (5 jurors)
- `adversarial:prompt_injection:deepseek-r1:14b` — σ = 1.36 (5 jurors)
- `synthesis:dream_insight:deepseek-r1:32b` — σ = 1.35 (5 jurors)
- `coding:async_concurrency:phi4-reasoning:plus` — σ = 1.33 (6 jurors)
- `adversarial:prompt_injection:gemma4:26b` — σ = 1.29 (5 jurors)
- `reasoning:rollback_postmortem:phi4-reasoning:plus` — σ = 1.26 (5 jurors)
- `adversarial:word_count:phi4-reasoning:plus` — σ = 1.24 (4 jurors)
- `adversarial:letter_count:phi4-reasoning:plus` — σ = 1.23 (4 jurors)
- `summary:incident_summary:phi4-reasoning:plus` — σ = 1.18 (5 jurors)
- `archaeology:commit_insight:phi4-reasoning:plus` — σ = 1.17 (5 jurors)
- `structured:project_extract:deepseek-coder-v2:16b` — σ = 1.02 (5 jurors)

---

## Self-Preference Index

> Positive Δ = model scores itself higher than peers do. > +0.5 is flagged as self-serving.

| Model | Peer | Self | Δ | Flag |
| :--- | ---: | ---: | ---: | :--- |
| qwen3.6:27b | 86.53 | 85.76 | -0.76 | self-deprecating |
| gemma4:26b | 85.16 | 89.29 | +4.13 | ⚠ self-serving |
| qwen3.5:27b | 82.74 | 88.00 | +5.26 | ⚠ self-serving |
| qwen3.5:9b | 78.59 | 73.18 | -5.41 | self-deprecating |
| devstral-small-2 | 76.25 | 86.00 | +9.75 | ⚠ self-serving |
| phi4-reasoning:plus | 54.18 | 89.50 | +35.32 | ⚠ self-serving |
