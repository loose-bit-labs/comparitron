const http = require('node:http')
const https = require('node:https')

class OllamaClient {
  constructor(host, timeoutMs) {
    this.host = host
    this.timeoutMs = timeoutMs
  }

  _post(url, body) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url)
      const mod = parsed.protocol === 'https:' ? https : http
      const payload = JSON.stringify(body)
      const req = mod.request({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      }, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300)
            return reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
        })
      })
      req.on('error', reject)
      req.write(payload)
      req.end()
    })
  }

  async unload(model) {
    await this._post(`${this.host}/api/chat`, { model, messages: [], keep_alive: 0 }).catch(() => {})
  }

  async warmup(model) {
    await this.chat(model, [{ role: 'user', content: 'Hi' }], {}).catch(() => {})
  }

  async chat(model, messages, options = {}) {
    const start = Date.now()
    const data = await Promise.race([
      this._post(`${this.host}/api/chat`, { model, messages, stream: false, options }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`chat timeout after ${this.timeoutMs / 1000}s`)), this.timeoutMs)
      ),
    ])
    return {
      content: data.message.content,
      latencyMs: Date.now() - start,
      loadDurationMs: data.load_duration ? Math.round(data.load_duration / 1e6) : null,
      tokensPerSec: data.eval_count && data.eval_duration
        ? Math.round(data.eval_count / (data.eval_duration / 1e9))
        : null,
      promptEvalRate: data.prompt_eval_count && data.prompt_eval_duration
        ? Math.round(data.prompt_eval_count / (data.prompt_eval_duration / 1e9))
        : null,
      promptTokens: data.prompt_eval_count ?? null,
      responseTokens: data.eval_count ?? null,
    }
  }
}

module.exports = OllamaClient
