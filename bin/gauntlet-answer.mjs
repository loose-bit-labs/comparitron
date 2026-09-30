#!/usr/bin/env node
// Gauntlet responder: one seat answers every approved task, once, non-streaming.
// node:http on purpose — undici's 300 s headersTimeout is law-dead on this fleet (see memory),
// and cpp-httplib servers want keepAlive off. Sampling params are NOT sent: the server's own
// production settings (t=1 p0.95 k20) answer equally to every seat — comparability by construction.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import http from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';

class GauntletAnswerer {
  // Budget is a knob because thinking brains spend it before they answer: 1500 starved 5/60
  // on seat F. The ladder is UNIFORM — every seat gets the same three tiers, in order, and the
  // tier that produced the answer is recorded in `budget` (that is a cost datum for the ledger,
  // not just a retry counter). Round-1 evidence for the third tier: seat H (dense 27B, thinks
  // ~9k chars median) died at the 6000 cap on 31/88 items with 12k-27k reasoning chars burned
  // mid-thought — a clipped brain is a failed pass, never a done one.
  MAX_TOKENS = Number(process.env.MAX_TOKENS || 1500);
  RETRY_TOKENS = Number(process.env.RETRY_TOKENS || 6000);
  RETRY2_TOKENS = Number(process.env.RETRY2_TOKENS || 12000);
  // 40 min/request: a 12k-token generation at this rig's ~14 t/s decode is ~15 min of thinking
  // and must die on BUDGET arithmetic, not on a socket timer that predates the third tier.
  REQ_TIMEOUT_MS = Number(process.env.REQ_TIMEOUT_MS || 2400000);

  constructor({ seat, url, tasksFile, out, limit }) {
    if (!seat || !url || !tasksFile || !out) {
      console.error('usage: gauntlet-answer.mjs --seat F --url http://127.0.0.1:11311 --tasks FILE --out FILE [--limit N]');
      process.exit(2);
    }
    Object.assign(this, { seat, url, tasksFile, out, limit: Number(limit || 0) });
  }

  httpJson(method, path, body) {
    return new Promise((resolve, reject) => {
      const u = new URL(path, this.url);
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: u.hostname, port: u.port, path: u.pathname, method,
          headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
          agent: false, // keepAlive off — cpp-httplib quirk
        },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            if (res.statusCode >= 400) return reject(new Error(`http ${res.statusCode}: ${d.slice(0, 200)}`));
            try { resolve(JSON.parse(d)); } catch { reject(new Error(`bad json: ${d.slice(0, 200)}`)); }
          });
        }
      );
      req.setTimeout(this.REQ_TIMEOUT_MS, () => req.destroy(new Error('request timeout')));
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  async modelId() {
    const m = await this.httpJson('GET', '/v1/models');
    const d = (m.data && m.data[0]) || (m.models && m.models[0]);
    return d.id || d.name || d.model;
  }

  async ask(model, task, maxTokens) {
    const t0 = Date.now();
    const r = await this.httpJson('POST', '/v1/chat/completions', {
      model, messages: [{ role: 'user', content: task.context
        ? `You are the on-call assistant for this homelab. The situation, as recorded just before her message:\n<<<SITUATION\n${task.context}\nSITUATION>>>\nHer message:\n${task.text}`
        : task.text }],
      stream: false, max_tokens: maxTokens,
    });
    const elapsedS = (Date.now() - t0) / 1000;
    const choice = (r.choices && r.choices[0]) || {};
    const msg = choice.message || {};
    const usage = r.usage || {};
    // thinking brains answer in `content` and think in `reasoning_content`; the cap is paid
    // out of BOTH, so a long think can spend all of max_tokens before a single content token
    // exists — that is what "empty answer (finish=length)" was (5/60 on seat F, 2026-09-24).
    return {
      answer: (msg.content || '').trim(),
      reasoningChars: ((msg.reasoning_content || msg.reasoning) || '').length,
      finish: choice.finish_reason,
      elapsedS,
      // what the server says it generated — the only way to know what a clipped attempt cost,
      // since its text is never returned. Absent on servers without usage; treat as unknown.
      genTokens: usage.completion_tokens !== undefined ? usage.completion_tokens : null,
    };
  }

  doneIds() {
    // ONLY real answers count as done — a recorded failure must be retryable on resume,
    // or the resumable design freezes the failures in place forever (2026-09-24).
    if (!existsSync(this.out)) return new Set();
    const s = new Set();
    for (const line of readFileSync(this.out, 'utf8').split('\n')) {
      try { const r = JSON.parse(line); if (r.answer) s.add(r.id); } catch { /* partial line — resume-safe */ }
    }
    return s;
  }

  async main() {
    const { tasks } = JSON.parse(readFileSync(this.tasksFile, 'utf8'));
    const model = await this.modelId();
    console.log(`seat ${this.seat}: serving model id "${model}" — ${tasks.length} tasks`);
    const done = this.doneIds();
    let answered = 0, failed = 0;
    for (const task of tasks) {
      if (done.has(task.id)) continue;
      if (this.limit && answered >= this.limit) break;
      // Wall cost is the SUM of every generation spent on the item, never just the last one:
      // a brain that burned two capped attempts and then answered briskly is still the slow
      // one on the invoice. Rounds 1+2 recorded only the final ask, which under-costs every
      // seat that needed a retry (G on 63 of 87 items, H on 56 of 79) — those seconds are gone.
      let cap = this.MAX_TOKENS;
      let spent = 0, thinkChars = 0, genTokens = 0, attempts = 0, r = null;
      try {
        // Uniform budget ladder, every seat the same: a starved generation gets one wider
        // try per tier, so no seat ever gets a cap the others did not.
        r = await this.ask(model, task, cap);
        spent += r.elapsedS; thinkChars += r.reasoningChars; attempts++;
        if (r.genTokens !== null) genTokens += r.genTokens;
        for (const tier of [this.RETRY_TOKENS, this.RETRY2_TOKENS]) {
          if (r.answer || r.finish !== 'length') break;
          console.log(`#${task.id} think-spent (${r.reasoningChars} reasoning chars, no answer) — retry at ${tier}`);
          cap = tier;
          r = await this.ask(model, task, cap);
          spent += r.elapsedS; thinkChars += r.reasoningChars; attempts++;
          if (r.genTokens !== null) genTokens += r.genTokens;
        }
        if (!r.answer) throw new Error(`empty answer (finish=${r.finish}, reasoning ${r.reasoningChars} chars, cap ${cap})`);
        appendFileSync(this.out, JSON.stringify({ seat: this.seat, model, id: task.id, project: task.project, promptChars: task.charLen, answerChars: r.answer.length, reasoningChars: thinkChars, budget: cap, attempts, genTokens: genTokens || null, elapsedS: +spent.toFixed(1), answer: r.answer }) + '\n');
        console.log(`#${task.id} ok in ${spent.toFixed(0)}s (${r.answer.length} chars${attempts > 1 ? `, ${attempts} attempts` : ''})`);
        answered++;
      } catch (e) {
        // a failed item still spent wall time — record what it cost, or the ledger is a lie
        appendFileSync(this.out, JSON.stringify({ seat: this.seat, model, id: task.id, project: task.project, attempts, elapsedS: +spent.toFixed(1), reasoningChars: thinkChars, error: String(e.message).slice(0, 300) }) + '\n');
        console.log(`#${task.id} FAIL after ${spent.toFixed(0)}s: ${e.message}`);
        failed++;
      }
    }
    console.log(`seat ${this.seat}: ${answered} answered, ${failed} failed, ${done.size} were already done -> ${this.out}`);
  }
}

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i].replace(/^--/, '');
  args[k] = process.argv[i + 1];
}
if (args.tasks !== undefined) args.tasksFile = args.tasks; // --tasks -> tasksFile
const g = new GauntletAnswerer(args);
g.main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
