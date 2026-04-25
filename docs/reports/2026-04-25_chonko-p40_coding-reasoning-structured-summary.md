# Comparitron — 2026-04-25_chonko-p40_coding-reasoning-structured-summary

**Date:** Sat, 25 Apr 2026 10:22:00 GMT  
**Hardware:** chonko — Tesla P40 24GB  
**Gauntlet:** 4 scenarios · 8 prompts · 9 candidates  
**Jurors:** gemma4:26b, phi4-reasoning:plus, qwen2.5:14b, qwen2.5:7b

---

## Rankings

| Model | Score | gen t/s | prefill t/s | coding | reasoning | structure | summary | adversari | Votes | Self Δ |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gemma4:31b | **40.85** | 5 | — | 43.64 | 41.00 | 38.30 | 40.11 | — | 39 | — |
| qwen3.6:27b | **39.61** | 12 | — | 40.60 | 43.50 | 39.00 | 39.50 | — | 31 | +5.26 |
| phi4-reasoning:plus | **39.13** | 22 | — | 41.82 | 39.38 | 36.63 | 41.00 | — | 31 | +5.67 |
| gemma4:26b | **38.85** | 43 | — | 39.42 | 41.67 | 37.50 | 40.89 | — | 34 | +6.15 |
| claude-sonnet-4-6 | **38.19** | 72 | — | 40.20 | 40.00 | 34.67 | 38.83 | — | 21 | — |
| qwen3.5:27b | **37.95** | 12 | — | 42.82 | 41.60 | 26.22 | 40.10 | — | 39 | +6.05 |
| qwen2.5:14b | **37.58** | 28 | — | 30.09 | 40.11 | 38.60 | 39.00 | — | 31 | -4.58 |
| qwen2.5:32b | **37.03** | 4 | — | 31.88 | 40.50 | 37.20 | 39.22 | — | 40 | — |
| qwen3.5:9b | **35.25** | 34 | — | 31.18 | 43.10 | 24.56 | 41.50 | — | 40 | — |
| qwen2.5:7b | **34.50** | 53 | — | 27.09 | 39.60 | 38.60 | 36.56 | — | 32 | +3.63 |

> **gen t/s** = generation speed (eval phase). **prefill t/s** = prompt ingestion speed. Both from a single run — treat as directional, not precise.

---

## Jury Matrix

> Row = candidate · Col = juror · Cell = median raw score (1–5) · [bracketed] = self-score

| Candidate / Juror | qwen3.6 | qwen3.5 | qwen3.5 | qwen2.5 | qwen2.5 | qwen2.5 | gemma4 | phi4-reasoning | gemma4 | claude-sonnet-4-6 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| qwen3.6:27b | **[5.0]** | 4.5 | — | — | 4.0 | 4.3 | 5.0 | 4.9 | — | — |
| qwen3.5:27b | 5.0 | **[4.8]** | — | — | 3.6 | 4.3 | 5.0 | 5.0 | — | — |
| qwen3.5:9b | 4.9 | 2.8 | — | — | 3.8 | 4.3 | 5.0 | 4.8 | — | — |
| qwen2.5:32b | 5.0 | 3.3 | — | — | 3.5 | 3.6 | 5.0 | 4.9 | — | — |
| qwen2.5:14b | 5.0 | 2.8 | — | — | **[3.9]** | 3.9 | 5.0 | 4.9 | — | — |
| qwen2.5:7b | 4.9 | 2.8 | — | — | 3.5 | **[4.3]** | 5.0 | 4.3 | — | — |
| gemma4:26b | 5.0 | 3.9 | — | — | 3.9 | 3.6 | **[5.0]** | 5.0 | — | — |
| phi4-reasoning:plus | 5.0 | 3.5 | — | — | 3.5 | 4.3 | 5.0 | **[5.0]** | — | — |
| gemma4:31b | 5.0 | 4.8 | — | — | 4.0 | 4.1 | 5.0 | 4.8 | — | — |
| claude-sonnet-4-6 | — | — | — | — | 3.8 | 4.3 | 5.0 | 5.0 | — | — |

---

## Dimension Breakdown

> **Weights:** Following ×2 · Correct ×4 · Concise ×1 · Format ×2 · max = 45

| Model | Scenario | Following | Correct | Concise | Format | Weighted |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| gemma4:31b | coding | 4.91 | 5.00 | 4.18 | 4.82 | 43.64 |
|  | reasoning | 4.56 | 4.56 | 3.89 | 4.89 | 41.00 |
|  | structured | 4.00 | 4.00 | 4.90 | 4.70 | 38.30 |
|  | summary | 4.22 | 4.44 | 4.78 | 4.56 | 40.11 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| qwen3.6:27b | coding | 4.90 | 4.20 | 4.20 | 4.90 | 40.60 |
|  | reasoning | 4.80 | 5.00 | 4.30 | 4.80 | 43.50 |
|  | structured | 4.11 | 4.00 | 5.00 | 4.89 | 39.00 |
|  | summary | 4.10 | 4.40 | 4.50 | 4.60 | 39.50 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| phi4-reasoning:plus | coding | 4.64 | 4.91 | 3.64 | 4.64 | 41.82 |
|  | reasoning | 4.13 | 4.88 | 3.13 | 4.25 | 39.38 |
|  | structured | 3.50 | 4.50 | 3.13 | 4.25 | 36.63 |
|  | summary | 4.22 | 4.89 | 4.11 | 4.44 | 41.00 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| gemma4:26b | coding | 4.58 | 4.17 | 3.75 | 4.92 | 39.42 |
|  | reasoning | 4.67 | 4.78 | 3.89 | 4.67 | 41.67 |
|  | structured | 4.00 | 4.00 | 4.90 | 4.30 | 37.50 |
|  | summary | 4.33 | 4.56 | 4.44 | 4.78 | 40.89 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| claude-sonnet-4-6 | coding | 4.40 | 4.40 | 4.20 | 4.80 | 40.20 |
|  | reasoning | 4.00 | 5.00 | 3.00 | 4.50 | 40.00 |
|  | structured | 3.50 | 3.50 | 5.00 | 4.33 | 34.67 |
|  | summary | 4.17 | 4.33 | 4.17 | 4.50 | 38.83 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| qwen3.5:27b | coding | 4.73 | 4.73 | 4.64 | 4.91 | 42.82 |
|  | reasoning | 4.60 | 4.70 | 4.20 | 4.70 | 41.60 |
|  | structured | 2.78 | 2.78 | 3.33 | 3.11 | 26.22 |
|  | summary | 4.30 | 4.50 | 4.30 | 4.60 | 40.10 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| qwen2.5:14b | coding | 3.18 | 2.91 | 3.00 | 4.55 | 30.09 |
|  | reasoning | 4.22 | 4.67 | 3.44 | 4.78 | 40.11 |
|  | structured | 4.20 | 4.10 | 4.80 | 4.50 | 38.60 |
|  | summary | 4.22 | 4.33 | 4.11 | 4.56 | 39.00 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| qwen2.5:32b | coding | 3.64 | 2.82 | 3.70 | 4.82 | 31.88 |
|  | reasoning | 4.40 | 4.70 | 3.70 | 4.60 | 40.50 |
|  | structured | 4.00 | 4.00 | 4.80 | 4.20 | 37.20 |
|  | summary | 4.11 | 4.56 | 4.11 | 4.33 | 39.22 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| qwen3.5:9b | coding | 3.36 | 2.73 | 3.91 | 4.82 | 31.18 |
|  | reasoning | 4.70 | 5.00 | 4.10 | 4.80 | 43.10 |
|  | structured | 2.67 | 2.56 | 3.44 | 2.78 | 24.56 |
|  | summary | 4.40 | 4.60 | 4.70 | 4.80 | 41.50 |
|  | adversarial | — | — | — | — | — |
|  |  |  |  |  |  |  |
| qwen2.5:7b | coding | 2.55 | 2.27 | 4.00 | 4.45 | 27.09 |
|  | reasoning | 4.20 | 4.70 | 3.40 | 4.50 | 39.60 |
|  | structured | 4.20 | 4.10 | 5.00 | 4.40 | 38.60 |
|  | summary | 3.89 | 3.56 | 5.00 | 4.78 | 36.56 |
|  | adversarial | — | — | — | — | — |

### gemma4:31b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.91 | 5.00 | 4.18 | 4.82 | **43.64** |
| reasoning | 4.56 | 4.56 | 3.89 | 4.89 | **41.00** |
| structured | 4.00 | 4.00 | 4.90 | 4.70 | **38.30** |
| summary | 4.22 | 4.44 | 4.78 | 4.56 | **40.11** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.42** | **4.50** | **4.44** | **4.74** | **40.85** |

### qwen3.6:27b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.90 | 4.20 | 4.20 | 4.90 | **40.60** |
| reasoning | 4.80 | 5.00 | 4.30 | 4.80 | **43.50** |
| structured | 4.11 | 4.00 | 5.00 | 4.89 | **39.00** |
| summary | 4.10 | 4.40 | 4.50 | 4.60 | **39.50** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.48** | **4.40** | **4.50** | **4.80** | **39.61** |

### phi4-reasoning:plus

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.64 | 4.91 | 3.64 | 4.64 | **41.82** |
| reasoning | 4.13 | 4.88 | 3.13 | 4.25 | **39.38** |
| structured | 3.50 | 4.50 | 3.13 | 4.25 | **36.63** |
| summary | 4.22 | 4.89 | 4.11 | 4.44 | **41.00** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.12** | **4.79** | **3.50** | **4.40** | **39.13** |

### gemma4:26b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.58 | 4.17 | 3.75 | 4.92 | **39.42** |
| reasoning | 4.67 | 4.78 | 3.89 | 4.67 | **41.67** |
| structured | 4.00 | 4.00 | 4.90 | 4.30 | **37.50** |
| summary | 4.33 | 4.56 | 4.44 | 4.78 | **40.89** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.40** | **4.38** | **4.25** | **4.67** | **38.85** |

### claude-sonnet-4-6

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.40 | 4.40 | 4.20 | 4.80 | **40.20** |
| reasoning | 4.00 | 5.00 | 3.00 | 4.50 | **40.00** |
| structured | 3.50 | 3.50 | 5.00 | 4.33 | **34.67** |
| summary | 4.17 | 4.33 | 4.17 | 4.50 | **38.83** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.02** | **4.31** | **4.09** | **4.53** | **38.19** |

### qwen3.5:27b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 4.73 | 4.73 | 4.64 | 4.91 | **42.82** |
| reasoning | 4.60 | 4.70 | 4.20 | 4.70 | **41.60** |
| structured | 2.78 | 2.78 | 3.33 | 3.11 | **26.22** |
| summary | 4.30 | 4.50 | 4.30 | 4.60 | **40.10** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.10** | **4.18** | **4.12** | **4.33** | **37.95** |

### qwen2.5:14b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.18 | 2.91 | 3.00 | 4.55 | **30.09** |
| reasoning | 4.22 | 4.67 | 3.44 | 4.78 | **40.11** |
| structured | 4.20 | 4.10 | 4.80 | 4.50 | **38.60** |
| summary | 4.22 | 4.33 | 4.11 | 4.56 | **39.00** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **3.96** | **4.00** | **3.84** | **4.59** | **37.58** |

### qwen2.5:32b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.64 | 2.82 | 3.70 | 4.82 | **31.88** |
| reasoning | 4.40 | 4.70 | 3.70 | 4.60 | **40.50** |
| structured | 4.00 | 4.00 | 4.80 | 4.20 | **37.20** |
| summary | 4.11 | 4.56 | 4.11 | 4.33 | **39.22** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **4.04** | **4.02** | **4.08** | **4.49** | **37.03** |

### qwen3.5:9b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 3.36 | 2.73 | 3.91 | 4.82 | **31.18** |
| reasoning | 4.70 | 5.00 | 4.10 | 4.80 | **43.10** |
| structured | 2.67 | 2.56 | 3.44 | 2.78 | **24.56** |
| summary | 4.40 | 4.60 | 4.70 | 4.80 | **41.50** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **3.78** | **3.72** | **4.04** | **4.30** | **35.25** |

### qwen2.5:7b

| Scenario | Following | Correct | Concise | Format | **Weighted** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| coding | 2.55 | 2.27 | 4.00 | 4.45 | **27.09** |
| reasoning | 4.20 | 4.70 | 3.40 | 4.50 | **39.60** |
| structured | 4.20 | 4.10 | 5.00 | 4.40 | **38.60** |
| summary | 3.89 | 3.56 | 5.00 | 4.78 | **36.56** |
| adversarial | — | — | — | — | **—** |
| **Overall** | **3.71** | **3.66** | **4.35** | **4.53** | **34.50** |

---

## Contested Results

> Jury disagreement σ > 1.0 — these scores should be interpreted cautiously.

- `structured:project_extract:qwen3.5:27b` — σ = 1.58 (5 jurors)
- `structured:project_extract:phi4-reasoning:plus` — σ = 1.46 (4 jurors)
- `summary:code_summary:qwen3.5:27b` — σ = 1.07 (5 jurors)

---

## Self-Preference Index

> Positive Δ = model scores itself higher than peers do. > +0.5 is flagged as self-serving.

| Model | Peer | Self | Δ | Flag |
| :--- | ---: | ---: | ---: | :--- |
| qwen3.6:27b | 39.61 | 44.88 | +5.26 | ⚠ self-serving |
| phi4-reasoning:plus | 39.13 | 44.80 | +5.67 | ⚠ self-serving |
| gemma4:26b | 38.85 | 45.00 | +6.15 | ⚠ self-serving |
| qwen3.5:27b | 37.95 | 44.00 | +6.05 | ⚠ self-serving |
| qwen2.5:14b | 37.58 | 33.00 | -4.58 | self-deprecating |
| qwen2.5:7b | 34.50 | 38.13 | +3.63 | ⚠ self-serving |
