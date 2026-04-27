# Design Notes & Acknowledgements

## Auto-scoring for objective prompts

Some capability prompts have deterministic correct answers — the `adversarial` suite is the primary example (`math_trap`, `state_tracking`). These prompts carry an `answer` field in their JSON definition.

A future improvement would be auto-scoring these without the full jury pass: run a lightweight judge call with the correct answer embedded in the system prompt, or in some cases do direct string matching. This would be faster, cheaper, and immune to LLM-as-judge bias on prompts that are objectively right or wrong.

This is intentionally not implemented yet. The current jury pipeline already handles it consistently and the overhead is acceptable at this scale. Revisit when adding more adversarial prompts.

## Methodology comparison: UGI Leaderboard

The [UGI Leaderboard](https://huggingface.co/spaces/DontPlanToEnd/UGI-Leaderboard) takes a meaningfully different approach worth understanding:

- **Ground-truth scoring** — many of their tasks (recipe scaling, GeoGuesser, weight estimation, show rating prediction) have objective answers measured by error rate. No jury needed and no scoring bias possible.
- **Algorithmic writing metrics** — lexical stuckness, originality, semantic redundancy, length adherence % are computed from the text itself, not judged.
- **Uncensored/willingness focus** — UGI explicitly measures refusal rate and compliance on sensitive prompts as a first-class signal.
- **Private test set** — questions are not published, preventing benchmark contamination.

Comparitron's approach differs by design: we focus on a small, auditable prompt set with transparent LLM-as-jury scoring, hardware-scoped timing, and self-preference bias tracking. The jury approach trades objective ground truth for flexibility — it can evaluate open-ended responses across any capability without needing pre-defined correct answers.

The ground-truth task style (world model probes, recipe/geo/weight estimation) is a good candidate for a future `grounded` capability suite in Comparitron if objective benchmarking becomes a priority.

## Acknowledgements

Comparitron was informed by reviewing several open-source Ollama benchmarking tools. Credit to their authors:

| Repo | Author | What we learned |
|---|---|---|
| [cloudmercato/ollama-benchmark](https://github.com/cloudmercato/ollama-benchmark) | cloudmercato | Judge/hack/load/speed/embedding module structure; adversarial probe ideas (math traps, reasoning traps); explicit model unload pattern |
| [aidatatools/ollama-benchmark](https://github.com/aidatatools/ollama-benchmark) | aidatatools | YAML-driven benchmark configs; RAM-tiered model presets; system info capture in run metadata |
| [LarHope/ollama-benchmark](https://github.com/LarHope/ollama-benchmark) | LarHope | Separating prompt eval rate (prefill t/s) from generation rate; tracking load_duration as a distinct timing field |
| [tabletuser-blogspot/ollama-benchmark](https://github.com/tabletuser-blogspot/ollama-benchmark) | tabletuser-blogspot | CPU governor tuning before benchmarking; N-run averaging |
| [lework/llm-benchmark](https://github.com/lework/llm-benchmark) | lework | Multi-type benchmark structure (chat, completion, instruct, vision) |
| [witness-taco/ollama-benchmark-ui](https://github.com/witness-taco/ollama-benchmark-ui) | witness-taco | Web UI pattern for benchmark results |
| [UGI Leaderboard](https://huggingface.co/spaces/DontPlanToEnd/UGI-Leaderboard) | DontPlanToEnd | Ground-truth scoring via real-world tasks (GeoGuesser, recipe scaling, show recommendation); algorithmic writing quality metrics; willingness/refusal tracking |
