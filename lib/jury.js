const fs = require('fs')
const path = require('path')
const config = require('../config')
const OllamaClient = require('./ollama')
const cache = require('./cache')
const { parseJudgeResponse } = require('./parse-judge')

const JUDGE_SYSTEM = `You are a strict, impartial technical evaluator.

RULES — read carefully:
- You do NOT know which AI model produced the response you are scoring. Do not guess.
- Do NOT favor responses that resemble your own writing style, structure, or vocabulary.
- "Familiar" feeling responses are a bias signal, not a quality signal.
- A different approach is not automatically wrong.
- Score 5 only for genuinely excellent work. Be aggressive about identifying flaws.
- Score each dimension independently against the rubric — do not let overall impression override it.`

function buildJudgePrompt(prompt, response) {
  const truncated = response.length > config.maxJudgeResponseChars
    ? response.slice(0, config.maxJudgeResponseChars) + '\n\n[... truncated for evaluation ...]'
    : response
  return `## Prompt given to the model:
${prompt}

## Model's response:
${truncated}

## Evaluate step by step:
1. What exactly did the prompt ask for?
2. Did the response fulfill it completely? What is missing or incorrect?
3. Is it concise, or does it pad with preamble / repetition / filler?
4. Is the output format correct for this task?

## Then score these dimensions (1–5 each):
- instruction_following: Did it do exactly what was asked?
- correctness: Is the content accurate and correct?
- conciseness: No padding, unnecessary preamble, or repetition?
- format_compliance: Correct output format for this task?

Return your evaluation as JSON on the final line. No markdown fences.
{"reasoning": "<2-3 sentence summary of evaluation>", "scores": {"instruction_following": N, "correctness": N, "conciseness": N, "format_compliance": N}}`
}

async function judgeOne(ollama, juror, responseData) {
  const { scenario, promptId, model: candidate, prompt, content } = responseData
  const cachePath = cache.scorePath(config.resultsDir, scenario, promptId, candidate, juror)
  if (cache.read(cachePath)) return

  try {
    const result = await ollama.chat(
      juror,
      [
        { role: 'system', content: JUDGE_SYSTEM },
        { role: 'user', content: buildJudgePrompt(prompt, content) },
      ],
      { temperature: config.judgeTemp, think: false }
    )
    const parsed = parseJudgeResponse(result.content)
    const isSelfJudge = candidate === juror
    cache.write(cachePath, {
      scenario, promptId, candidate, juror, isSelfJudge,
      reasoning: parsed.reasoning,
      scores: parsed.scores,
      tokensPerSec: result.tokensPerSec,
    })
    const scoreStr = Object.values(parsed.scores).join('/')
    const tag = isSelfJudge ? ' [self]' : ''
    console.log(`  SCORED ${candidate}/${promptId} by ${juror}${tag}: [${scoreStr}]`)
  } catch (err) {
    console.log(`  ERR   ${candidate}/${promptId} by ${juror}: ${err.message}`)
    if (err.message.includes('timeout')) {
      cache.write(cachePath, { scenario, promptId, candidate, juror, skipped: true, reason: err.message })
      console.log(`  SKIP  ${candidate}/${promptId} by ${juror}: tombstoned (delete score file to retry)`)
    }
  }
}

async function run() {
  const ollama = new OllamaClient(config.ollamaHost, config.chatTimeoutMs)
  const responsesDir = path.join(config.resultsDir, 'responses')
  if (!fs.existsSync(responsesDir)) {
    console.log('[jury] no responses cached — run runner first'); return
  }

  const responses = fs.readdirSync(responsesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => cache.read(path.join(responsesDir, f)))
    .filter(Boolean)

  const jurors = config.jurors ?? config.candidates
  console.log(`[jury] ${responses.length} responses × ${jurors.length} jurors`)

  // group by juror to keep each model loaded for its full eval pass
  for (const juror of jurors) {
    const pending = responses.filter(r => {
      const cp = cache.scorePath(config.resultsDir, r.scenario, r.promptId, r.model, juror)
      return !cache.read(cp)
    })
    if (!pending.length) {
      console.log(`\n[jury] juror: ${juror} — all cached, skipping`)
      continue
    }
    console.log(`\n[jury] juror: ${juror} — warming up... (${pending.length} pending)`)
    await ollama.warmup(juror)
    for (const responseData of responses) {
      await judgeOne(ollama, juror, responseData)
    }
    await ollama.unload(juror)
    console.log(`[jury] unloaded ${juror}`)
  }

  console.log('\n[jury] done')
}

module.exports = { run }
