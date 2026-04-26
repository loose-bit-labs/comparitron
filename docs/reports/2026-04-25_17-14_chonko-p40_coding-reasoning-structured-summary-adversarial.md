# Comparitron — 2026-04-25_17-14_chonko-p40_coding-reasoning-structured-summary-adversarial

**Date:** Sat, 25 Apr 2026 21:14:12 GMT  
**Hardware:** chonko — Tesla P40 24GB  
**Gauntlet:** 5 scenarios · 14 prompts · 7 candidates  
**Jurors:** gemma4:26b, phi4-reasoning:plus

---

## Rankings

| Model | Score | gen t/s | prefill t/s | coding | reasoning | structure | summary | adversari | Votes | Self Δ |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gemma4:31b | **41.71** | 5 | 81 | 43.72 | 40.95 | 38.30 | 40.60 | 45.00 | 10 | — |
| qwen3.6:27b | **40.64** | 12 | 156 | 39.77 | 43.13 | 37.17 | 38.13 | 45.00 | 10 | +4.24 |
| claude-sonnet-4-6 | **40.22** | 72 | — | 41.38 | 42.08 | 37.25 | 40.38 | 40.00 | 10 | — |
| qwen3.5:27b | **39.42** | 12 | 155 | 42.70 | 41.60 | 27.70 | 40.10 | 45.00 | 10 | +4.58 |
| gemma4:26b | **39.31** | 43 | 480 | 38.30 | 41.25 | 35.63 | 40.38 | 41.00 | 10 | +4.36 |
| qwen2.5:14b | **38.47** | 28 | — | 30.50 | 40.38 | 40.88 | 42.13 | — *(0) | 8 | -5.47 |
| devstral-small-2 | **38.10** | 18 | 1811 | 43.75 | 41.00 | 35.50 | 45.00 | 25.25 | 10 | — |
| qwen2.5:32b | **37.53** | 4 | — | 32.63 | 40.50 | 37.20 | 39.80 | — *(0) | 8 | — |
| qwen3.5:9b | **36.88** | 34 | 439 | 31.73 | 43.10 | 23.05 | 41.50 | 45.00 | 10 | +8.12 |
| qwen2.5:7b | **35.29** | 53 | — | 24.15 | 39.50 | 40.25 | 37.25 | — *(0) | 8 | +2.84 |
| phi4-reasoning:plus | **33.06** | 22 | 1132 | 41.33 | 39.38 | 36.63 | 36.00 | 12.00 | 10 | +11.65 |

> **gen t/s** = generation speed (eval phase). **prefill t/s** = prompt ingestion speed. Both from a single run — treat as directional, not precise.

---

## Jury Matrix

> Row = candidate · Col = juror · Cell = median raw score (1–5) · [bracketed] = self-score

| Candidate / Juror | qwen3.6 | qwen3.5 | qwen3.5 | gemma4 | phi4-reasoning | gemma4 | devstral-small-2 | claude-sonnet-4-6 | qwen2.5 | qwen2.5 | qwen2.5 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| qwen3.6:27b | **[5.0]** | 4.5 | 5.0 | 5.0 | 5.0 | — | — | — | 4.0 | — | 4.3 |
| qwen3.5:27b | 5.0 | **[4.8]** | 5.0 | 5.0 | 5.0 | — | — | — | 3.6 | — | 4.3 |
| qwen3.5:9b | 4.9 | 2.8 | **[5.0]** | 5.0 | 4.8 | — | — | — | 3.8 | — | 4.3 |
| gemma4:26b | 5.0 | 3.9 | 4.5 | **[5.0]** | 5.0 | — | — | — | 3.9 | — | 3.6 |
| phi4-reasoning:plus | 5.0 | 3.5 | 1.8 | 5.0 | **[5.0]** | — | — | — | 3.5 | — | 4.3 |
| gemma4:31b | 5.0 | 4.8 | 5.0 | 5.0 | 4.9 | — | — | — | 4.0 | — | 4.1 |
| devstral-small-2 | — | — | — | 4.6 | 4.3 | — | — | — | — | — | — |
| claude-sonnet-4-6 | — | — | — | 5.0 | 5.0 | — | — | — | 3.8 | — | 4.3 |
| qwen2.5:14b | 5.0 | 2.8 | — | 5.0 | 4.9 | — | — | — | **[3.9]** | — | 3.9 |
| qwen2.5:32b | 5.0 | 3.3 | — | 5.0 | 4.9 | — | — | — | 3.5 | — | 3.6 |
| qwen2.5:7b | 4.9 | 2.8 | — | 5.0 | 4.3 | — | — | — | 3.5 | — | **[4.3]** |

---

## Dimension Breakdown

> **Weights:** Following ×2 · Correct ×4 · Concise ×1 · Format ×2 · max = 45

| Model | Scenario | Following | Correct | Concise | Format | Weighted |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| gemma4:31b | coding | 4.91 | 5.00 | 4.18 | 4.82 | 43.72 |
|  | reasoning | 4.56 | 4.56 | 3.89 | 4.89 | 40.95 |
|  | structured | 4.00 | 4.00 | 4.90 | 4.70 | 38.30 |
|  | summary | 4.30 | 4.50 | 4.80 | 4.60 | 40.60 |
|  | adversarial | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  |  |  |  |  |  |  |
| qwen3.6:27b | coding | 4.88 | 4.00 | 4.13 | 4.88 | 39.77 |
|  | reasoning | 4.75 | 5.00 | 4.13 | 4.75 | 43.13 |
|  | structured | 3.86 | 3.71 | 5.00 | 4.86 | 37.17 |
|  | summary | 3.88 | 4.25 | 4.38 | 4.50 | 38.13 |
|  | adversarial | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  |  |  |  |  |  |  |
| claude-sonnet-4-6 | coding | 4.57 | 4.43 | 4.43 | 4.86 | 41.38 |
|  | reasoning | 4.43 | 5.00 | 3.86 | 4.71 | 42.08 |
|  | structured | 3.88 | 3.88 | 5.00 | 4.50 | 37.25 |
|  | summary | 4.38 | 4.50 | 4.38 | 4.63 | 40.38 |
|  | adversarial | 4.50 | 4.00 | 5.00 | 5.00 | 40.00 |
|  |  |  |  |  |  |  |
| qwen3.5:27b | coding | 4.70 | 4.70 | 4.70 | 4.90 | 42.70 |
|  | reasoning | 4.60 | 4.70 | 4.20 | 4.70 | 41.60 |
|  | structured | 3.00 | 2.90 | 3.50 | 3.30 | 27.70 |
|  | summary | 4.30 | 4.50 | 4.30 | 4.60 | 40.10 |
|  | adversarial | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  |  |  |  |  |  |  |
| gemma4:26b | coding | 4.50 | 4.00 | 3.50 | 4.90 | 38.30 |
|  | reasoning | 4.63 | 4.75 | 3.75 | 4.63 | 41.25 |
|  | structured | 3.75 | 3.75 | 4.88 | 4.13 | 35.63 |
|  | summary | 4.25 | 4.50 | 4.38 | 4.75 | 40.38 |
|  | adversarial | 5.00 | 4.00 | 5.00 | 5.00 | 41.00 |
|  |  |  |  |  |  |  |
| qwen2.5:14b | coding | 3.00 | 2.78 | 3.00 | 4.67 | 30.50 |
|  | reasoning | 4.13 | 4.63 | 3.63 | 5.00 | 40.38 |
|  | structured | 4.38 | 4.50 | 4.88 | 4.63 | 40.88 |
|  | summary | 4.63 | 4.75 | 4.38 | 4.75 | 42.13 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| devstral-small-2 | coding | 5.00 | 4.67 | 4.67 | 5.00 | 43.75 |
|  | reasoning | 5.00 | 4.67 | 3.67 | 4.67 | 41.00 |
|  | structured | 3.25 | 4.75 | 5.00 | 2.50 | 35.50 |
|  | summary | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  | adversarial | 2.25 | 1.50 | 4.75 | 5.00 | 25.25 |
|  |  |  |  |  |  |  |
| qwen2.5:32b | coding | 3.64 | 2.82 | 3.70 | 4.82 | 32.63 |
|  | reasoning | 4.40 | 4.70 | 3.70 | 4.60 | 40.50 |
|  | structured | 4.00 | 4.00 | 4.80 | 4.20 | 37.20 |
|  | summary | 4.20 | 4.60 | 4.20 | 4.40 | 39.80 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| qwen3.5:9b | coding | 3.36 | 2.73 | 3.91 | 4.82 | 31.73 |
|  | reasoning | 4.70 | 5.00 | 4.10 | 4.80 | 43.10 |
|  | structured | 2.67 | 2.56 | 3.44 | 2.78 | 23.05 |
|  | summary | 4.40 | 4.60 | 4.70 | 4.80 | 41.50 |
|  | adversarial | 5.00 | 5.00 | 5.00 | 5.00 | 45.00 |
|  |  |  |  |  |  |  |
| qwen2.5:7b | coding | 2.11 | 1.67 | 4.11 | 4.33 | 24.15 |
|  | reasoning | 4.25 | 4.63 | 3.50 | 4.50 | 39.50 |
|  | structured | 4.50 | 4.25 | 5.00 | 4.63 | 40.25 |
|  | summary | 4.13 | 3.63 | 5.00 | 4.75 | 37.25 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| phi4-reasoning:plus | coding | 4.56 | 4.89 | 3.44 | 4.56 | 41.33 |
|  | reasoning | 4.13 | 4.88 | 3.13 | 4.25 | 39.38 |
|  | structured | 3.50 | 4.50 | 3.13 | 4.25 | 36.63 |
|  | summary | 3.63 | 4.38 | 3.50 | 3.88 | 36.00 |
|  | adversarial | 1.00 | 2.00 | 1.00 | 1.00 | 12.00 |

### gemma4:31b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.91 | 5.00 | 4.18 | 4.82 | **43.72** |
| reasoning | 4.56 | 4.56 | 3.89 | 4.89 | **40.95** |
| structured | 4.00 | 4.00 | 4.90 | 4.70 | **38.30** |
| summary | 4.30 | 4.50 | 4.80 | 4.60 | **40.60** |
| adversarial | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| **Overall** | **4.55** | **4.61** | **4.55** | **4.80** | **41.71** |

### qwen3.6:27b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.88 | 4.00 | 4.13 | 4.88 | **39.77** |
| reasoning | 4.75 | 5.00 | 4.13 | 4.75 | **43.13** |
| structured | 3.86 | 3.71 | 5.00 | 4.86 | **37.17** |
| summary | 3.88 | 4.25 | 4.38 | 4.50 | **38.13** |
| adversarial | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| **Overall** | **4.47** | **4.39** | **4.53** | **4.80** | **40.64** |

### claude-sonnet-4-6

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.57 | 4.43 | 4.43 | 4.86 | **41.38** |
| reasoning | 4.43 | 5.00 | 3.86 | 4.71 | **42.08** |
| structured | 3.88 | 3.88 | 5.00 | 4.50 | **37.25** |
| summary | 4.38 | 4.50 | 4.38 | 4.63 | **40.38** |
| adversarial | 4.50 | 4.00 | 5.00 | 5.00 | **40.00** |
| **Overall** | **4.35** | **4.36** | **4.53** | **4.74** | **40.22** |

### qwen3.5:27b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.70 | 4.70 | 4.70 | 4.90 | **42.70** |
| reasoning | 4.60 | 4.70 | 4.20 | 4.70 | **41.60** |
| structured | 3.00 | 2.90 | 3.50 | 3.30 | **27.70** |
| summary | 4.30 | 4.50 | 4.30 | 4.60 | **40.10** |
| adversarial | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| **Overall** | **4.32** | **4.36** | **4.34** | **4.50** | **39.42** |

### gemma4:26b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.50 | 4.00 | 3.50 | 4.90 | **38.30** |
| reasoning | 4.63 | 4.75 | 3.75 | 4.63 | **41.25** |
| structured | 3.75 | 3.75 | 4.88 | 4.13 | **35.63** |
| summary | 4.25 | 4.50 | 4.38 | 4.75 | **40.38** |
| adversarial | 5.00 | 4.00 | 5.00 | 5.00 | **41.00** |
| **Overall** | **4.42** | **4.20** | **4.30** | **4.68** | **39.31** |

### qwen2.5:14b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.00 | 2.78 | 3.00 | 4.67 | **30.50** |
| reasoning | 4.13 | 4.63 | 3.63 | 5.00 | **40.38** |
| structured | 4.38 | 4.50 | 4.88 | 4.63 | **40.88** |
| summary | 4.63 | 4.75 | 4.38 | 4.75 | **42.13** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.03** | **4.16** | **3.97** | **4.76** | **38.47** |

### devstral-small-2

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 5.00 | 4.67 | 4.67 | 5.00 | **43.75** |
| reasoning | 5.00 | 4.67 | 3.67 | 4.67 | **41.00** |
| structured | 3.25 | 4.75 | 5.00 | 2.50 | **35.50** |
| summary | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| adversarial | 2.25 | 1.50 | 4.75 | 5.00 | **25.25** |
| **Overall** | **4.10** | **4.12** | **4.62** | **4.43** | **38.10** |

### qwen2.5:32b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.64 | 2.82 | 3.70 | 4.82 | **32.63** |
| reasoning | 4.40 | 4.70 | 3.70 | 4.60 | **40.50** |
| structured | 4.00 | 4.00 | 4.80 | 4.20 | **37.20** |
| summary | 4.20 | 4.60 | 4.20 | 4.40 | **39.80** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.06** | **4.03** | **4.10** | **4.50** | **37.53** |

### qwen3.5:9b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.36 | 2.73 | 3.91 | 4.82 | **31.73** |
| reasoning | 4.70 | 5.00 | 4.10 | 4.80 | **43.10** |
| structured | 2.67 | 2.56 | 3.44 | 2.78 | **23.05** |
| summary | 4.40 | 4.60 | 4.70 | 4.80 | **41.50** |
| adversarial | 5.00 | 5.00 | 5.00 | 5.00 | **45.00** |
| **Overall** | **4.03** | **3.98** | **4.23** | **4.44** | **36.88** |

### qwen2.5:7b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 2.11 | 1.67 | 4.11 | 4.33 | **24.15** |
| reasoning | 4.25 | 4.63 | 3.50 | 4.50 | **39.50** |
| structured | 4.50 | 4.25 | 5.00 | 4.63 | **40.25** |
| summary | 4.13 | 3.63 | 5.00 | 4.75 | **37.25** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **3.75** | **3.54** | **4.40** | **4.55** | **35.29** |

### phi4-reasoning:plus

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.56 | 4.89 | 3.44 | 4.56 | **41.33** |
| reasoning | 4.13 | 4.88 | 3.13 | 4.25 | **39.38** |
| structured | 3.50 | 4.50 | 3.13 | 4.25 | **36.63** |
| summary | 3.63 | 4.38 | 3.50 | 3.88 | **36.00** |
| adversarial | 1.00 | 2.00 | 1.00 | 1.00 | **12.00** |
| **Overall** | **3.36** | **4.13** | **2.84** | **3.59** | **33.06** |

---

## Contested Results

> Jury disagreement σ > 1.0 — these scores should be interpreted cautiously.

- `adversarial:state_tracking:phi4-reasoning:plus` — σ = 1.88 (2 jurors)
- `adversarial:math_trap:phi4-reasoning:plus` — σ = 1.74 (3 jurors)
- `structured:project_extract:qwen3.5:27b` — σ = 1.58 (5 jurors)
- `summary:code_summary:phi4-reasoning:plus` — σ = 1.48 (5 jurors)
- `structured:project_extract:phi4-reasoning:plus` — σ = 1.46 (4 jurors)
- `summary:code_summary:qwen3.5:27b` — σ = 1.07 (5 jurors)

---

## Self-Preference Index

> Positive Δ = model scores itself higher than peers do. > +0.5 is flagged as self-serving.

| Model | Peer | Self | Δ | Flag |
| :--- | ---: | ---: | ---: | :--- |
| qwen3.6:27b | 40.64 | 44.88 | +4.24 | ⚠ self-serving |
| qwen3.5:27b | 39.42 | 44.00 | +4.58 | ⚠ self-serving |
| gemma4:26b | 39.31 | 43.67 | +4.36 | ⚠ self-serving |
| qwen2.5:14b | 38.47 | 33.00 | -5.47 | self-deprecating |
| qwen3.5:9b | 36.88 | 45.00 | +8.12 | ⚠ self-serving |
| qwen2.5:7b | 35.29 | 38.13 | +2.84 | ⚠ self-serving |
| phi4-reasoning:plus | 33.06 | 44.71 | +11.65 | ⚠ self-serving |
