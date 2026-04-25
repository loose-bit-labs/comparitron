// extract judge JSON from model output that may have markdown, preamble, etc.
function parseJudgeResponse(content) {
  const text = content.replace(/```(?:json)?\n?/g, '').replace(/```/g, '')

  // find all top-level { } blocks, return last one with a "scores" key
  const candidates = []
  let depth = 0, start = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++ }
    else if (text[i] === '}') {
      depth--
      if (depth === 0 && start !== -1) { candidates.push(text.slice(start, i + 1)); start = -1 }
    }
  }

  for (const c of [...candidates].reverse()) {
    try {
      const parsed = JSON.parse(c)
      if (parsed.scores && typeof parsed.scores === 'object') return parsed
    } catch {}
  }

  throw new Error('Could not parse judge JSON from response')
}

module.exports = { parseJudgeResponse }
