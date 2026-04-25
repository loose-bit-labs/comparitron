module.exports = {
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  hardware: {
    tag: 'chonko-p40',
    host: 'chonko',
    gpu: 'Tesla P40 24GB',
  },
  candidates: [
    'qwen3.6:27b',
    'qwen3.5:27b',
    'qwen3.5:9b',
    'gemma4:26b',
    'phi4-reasoning:plus',
	'gemma4:31b',
	'devstral-small-2',
	/* too old ...

		// 'qwen2.5:72b',  // RAM offload -- slow, add manually when you want it
		'qwen2.5:32b',
		'qwen2.5:14b',
		'qwen2.5:7b',
	*/
  ],
  jurors: [
    'gemma4:26b',
    'phi4-reasoning:plus',
    'qwen3.5:9b',
  ],
  capabilities: ['coding', 'reasoning', 'structured', 'summary', 'adversarial'],
  resultsDir: './results',
  capabilitiesDir: './capabilities',
  candidateTemp: 0.7,
  judgeTemp: 0.1,
  chatTimeoutMs: 666 * 1000,
  maxJudgeResponseChars: 6000,
  serverPort: 3773,
}
