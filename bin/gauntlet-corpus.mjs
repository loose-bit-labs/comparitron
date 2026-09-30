#!/usr/bin/env node
// Gauntlet corpus builder: extract REAL human tasks from Claude Code session
// transcripts (~/.claude/projects, or any harvested tree via --root). House class style;
// raw data kept, filtering owned by code. The Grafin approved this source 2026-09-22;
// nothing leaves the box from here until she reads gauntlet-tasks.json and runs the judge.
//
// Two smart layers (added after the blip run showed "status?"-grade junk getting picked):
//   1. regex, always on: continuation-speak, in-flight status pings, compaction
//      summaries — breeds of message that can never be a standalone task.
//   2. classifier gate, optional: "could a fresh assistant, zero history, no machine
//      access, act on this single message?" Backends: --llm http://host:port (local
//      /chat/completions — runs on tbona) or --jev (TypeSafe System One — runs
//      anywhere, even blip). Verdicts cached per corpus file; reruns are cheap.
// Doctrine: the classifier picks the TEST SET only; it never scores answers. The judge
// of answers stays jev, blind, pairwise — soft overlap noted in the jury spec.
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { homedir, hostname } from 'node:os';
import http from 'node:http';
import https from 'node:https';
import { GauntletRedactor } from './gauntlet-redact.mjs';

class GauntletCorpus {
  // human-message filters: real typed tasks, not tool noise, skill paths, or harness caveats
  static MIN_LEN = 80;
  static MAX_LEN = 1500;
  static BAD_PREFIXES = ['<', 'Caveat:', 'Invoke ', 'Base directory'];
  // Continuation-speak: replies that only make sense mid-conversation. A fresh brain
  // has nothing to act on "I mean again... we are on chonko, not aid".
  static CONT_OPENERS = /^(yeah\b|yup\b|no\b|no,|yes\b|yes,|ok\b|okay\b|hmm\b|nah\b|cool\b|great\b|nice\b|wow\b|right\b|ah\b|oh\b|wait\b|i mean|i think so|to be clear|let.?s back up|back to|how about this instead|go on\b|go ahead\b|but\b)/i;
  static CONT_ANYWHERE = /(the one we|as i (?:said|mentioned)|like i said|the other session|what we (?:were|had|discussed|talked)|are we done|is it (?:done|working|ready|still)|did (?:it|that|this) work|any (?:progress|update)s?\b|how far (?:are|is)|still (?:not|no|failing|broken|the same)|did you (?:get|change|try|check|run)|why (?:is|are|was) this not|\bfix it\b|that script|that repo|this session|the previous (?:one|session|run)|same thing happens|it works now|\blately\b|\bhow do you feel\b|(?:have|has) been (?:work|go|run|do|shape|progress|improve)\w*|how are (?:things|it|the)\b)/i;
  // prompt schema version — classifier caches are keyed to it; a stricter prompt invalidates old verdicts
  static PROMPT_VERSION = 4;

  constructor({ max = 40, dry = false, root, out, host, llm, jev, firstOnly = false, ctxTurns = 6 }) {
    this.max = max;
    this.dry = dry;
    this.firstOnly = firstOnly;
    // CONTEXT REPLAY (v2): a message was a task because of the room around it — repos,
    // tools mid-flight, the last few exchanges. We lift the transcript's own record of
    // that moment into the task: the next assistant/user/tool_result turns before it,
    // plus the session's working directory. Continuation-speak is legal WITH context.
    this.ctxTurns = ctxTurns;
    this.root = root || join(homedir(), '.claude', 'projects');
    this.out = out || join(homedir(), 'tmp', 'locatesta', 'gauntlet-tasks.json');
    // origin stamp: explicit --host, else the harvest dir's name, else this machine
    this.host = host || (root ? basename(root) : hostname());
    this.llm = llm ? llm.replace(/\/+$/, '') : null; // e.g. http://127.0.0.1:11311
    this.jev = !!jev; // TypeSafe System One as classifier — spends the wallet, gently
    this.JEV_CHUNK = 10;
    this.clsCacheFile = this.out + '.cls.jsonl';
    // one shared redaction map, sitting next to the corpora — same file merge/judge use
    this.mapFile = join(dirname(this.out), 'gauntlet-redact.json');
  }

  isHumanTask(msg) {
    if (typeof msg === 'string') return this.sane(msg) ? msg : null;
    if (!Array.isArray(msg)) return null;
    if (msg.some((b) => b.type && b.type !== 'text')) return null; // tool_result / images: not a typed task
    const texts = msg.filter((b) => b.type === 'text').map((b) => b.text || '');
    if (!texts.length) return null;
    const t = texts.join('\n');
    return this.sane(t) ? t : null;
  }

  answerable(t) {
    // a task a fresh brain can answer STANDALONE: asks something, commands something,
    // or states a wish. Continuation replies already died in sane().
    if (t.includes('?')) return true;
    const s = t.toLowerCase();
    return /^(please )?(make|fix|add|write|check|review|create|build|update|run|test|what|why|how|can you|could you|would you|let.s|i want|i need|i think we|should|help)/.test(s);
  }

  sane(t) {
    if (!t || typeof t !== 'string') return false;
    const s = t.trim();
    if (s.length < GauntletCorpus.MIN_LEN || s.length > GauntletCorpus.MAX_LEN) return false;
    if (GauntletCorpus.BAD_PREFIXES.some((p) => s.startsWith(p))) return false;
    if (s.includes('<system-reminder>') || s.includes('<command-name>')) return false;
    // compaction summaries ride the transcript as type=user — they are not tasks
    if (/^This session is being continued from a previous conversation/.test(s)) return false;
    // continuation-speak
    if (GauntletCorpus.CONT_OPENERS.test(s)) return false;
    if (GauntletCorpus.CONT_ANYWHERE.test(s)) return false;
    // mostly-code pastes (fenced blocks dominating) are prompts of a different kind — out
    const fenced = (s.match(/```/g) || []).length;
    if (fenced >= 2 && s.length / (fenced / 2) < 400) return false;
    return true;
  }

  filesIn(dir) {
    let out = [];
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      const st = statSync(p);
      if (st.isDirectory()) { if (!e.includes('subagents')) out = out.concat(this.filesIn(p)); }
      else if (e.endsWith('.jsonl')) out.push(p);
    }
    return out;
  }

  // transcript -> light readable records: who said what, what they ran, what came back.
  parseRecords(f, lines) {
    const out = [];
    for (const line of lines) {
      if (!line.startsWith('{')) continue;
      let rec; try { rec = JSON.parse(line); } catch { continue; }
      if (rec.type !== 'user' && rec.type !== 'assistant') continue; // queue/system noise
      if (this.firstOnly && out.some((r) => r.kind === 'assistant')) break; // opening messages only
      const m = rec.message;
      if (!m || !m.content) continue;
      const blocks = Array.isArray(m.content) ? m.content : [{ type: 'text', text: String(m.content) }];
      const texts = blocks.filter((b) => b.type === 'text' && b.text).map((b) => b.text);
      const r = { kind: rec.type, cwd: rec.cwd || '', texts };
      const bits = [];
      for (const b of blocks) {
        if (b.type === 'tool_use' && b.input) {
          const i = b.input;
          bits.push(`[ran ${b.name}: ${String(i.command || i.file_path || i.pattern || i.prompt || JSON.stringify(i)).slice(0, 160)}]`);
        } else if (b.type === 'tool_result') {
          const c = typeof b.content === 'string' ? b.content
            : (Array.isArray(b.content) ? b.content.filter((x) => x.type === 'text').map((x) => x.text).join(' ') : '');
          if (c.trim()) bits.push(`[output: ${c.replace(/\s+/g, ' ').slice(0, 160)}]`);
        }
      }
      if (!texts.length && !bits.length) continue;
      r.all = [...texts, ...bits].join('\n');
      out.push(r);
    }
    return out;
  }

  // the room at the moment: last turns of talk, tools and outputs, plus the working dir
  contextOf(recs, j) {
    const parts = [];
    if (recs[j].cwd) parts.push(`Workdir: ${recs[j].cwd}`);
    for (let k = Math.max(0, j - this.ctxTurns); k < j; k++) {
      const r = recs[k];
      if (!r.all) continue;
      parts.push(`${r.kind === 'assistant' ? 'Assistant' : 'Her'}: ${r.all.replace(/\s+/g, ' ').slice(0, 400)}`);
    }
    return parts.join('\n');
  }

  collect() {
    const seen = new Set();
    const byProject = {};
    for (const f of this.filesIn(this.root)) {
      const project = f.slice(this.root.length + 1).split('/')[0];
      let lines;
      try { lines = readFileSync(f, 'utf8').split('\n'); } catch { continue; }
      const recs = this.parseRecords(f, lines);
      for (let j = 0; j < recs.length; j++) {
        const rec = recs[j];
        if (rec.kind !== 'user' || !rec.texts.length) continue; // tool_results alone are not her typing
        const t = rec.texts.join('\n');
        if (!this.saneCtx(t)) continue;
        const key = t.toLowerCase().replace(/\W+/g, ' ').slice(0, 72); // fuzzy dedupe
        if (seen.has(key)) continue;
        seen.add(key);
        const clean = t.trim();
        const context = recs.length > 1 ? this.contextOf(recs, j) : '';
        (byProject[project] ||= []).push({ project, text: clean, context, charLen: clean.length, ctxLen: context.length, answerable: this.answerable(clean) });
      }
    }
    return byProject;
  }

  // contextualized sanity: only the structural rejects survive (length, prefixes,
  // compaction pasts, code-paste dominance). Continuation-speak is LEGAL with context.
  saneCtx(t) {
    if (!t || typeof t !== 'string') return false;
    const s = t.trim();
    if (s.length < 4 || s.length > GauntletCorpus.MAX_LEN) return false;
    if (GauntletCorpus.BAD_PREFIXES.some((p) => s.startsWith(p))) return false;
    if (s.includes('<system-reminder>') || s.includes('<command-name>')) return false;
    if (/^This session is being continued from a previous conversation/.test(s)) return false;
    const fenced = (s.match(/```/g) || []).length;
    if (fenced >= 2 && s.length / (fenced / 2) < 400) return false;
    return true;
  }

  // ---- classifier backends ------------------------------------------------
  sortPrompt(t) {
    return `Sort this one message. The assistant has only the recorded SITUATION block — no other history, no machine access. Could it ANSWER — not role-play an answer — without inventing facts?
SITUATION: ${t.context || '(none)'}
THE TEST: before deciding, list what you would have to ASSUME about the writer's world — ongoing projects, named devices or agents, prior events — just to answer. PASS requires situation+message to fully pin down what is asked; FAIL the moment an unstated assumption is still needed. A generic-kernel answer that ignores what the writer actually meant is not a pass.
FAIL example: "The mages and the minions have been working steadily. How do you feel about their rate of progress and quality of work lately?" — nobody who meets this text cold can know who they are.
MESSAGE: ${t.text}
Answer exactly one word: PASS or FAIL.`;
  }

  httpPost(baseUrl, path, body) {
    return new Promise((resolve, reject) => {
      const u = new URL(path, baseUrl);
      const payload = JSON.stringify(body);
      const req = http.request(
        { hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          agent: false },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            if (res.statusCode >= 400) return reject(new Error(`http ${res.statusCode}`));
            try { resolve(JSON.parse(d)); } catch { reject(new Error('bad json')); }
          });
        }
      );
      req.setTimeout(120000, () => req.destroy(new Error('classifier timeout')));
      req.on('error', reject);
      req.write(payload); req.end();
    });
  }

  jevAsk(questionsMap) {
    const key = JSON.parse(readFileSync(join(homedir(), '.config', 'api-keys', 'keys.json'), 'utf8')).typesafe;
    const body = JSON.stringify({
      state: 'You sort messages for a task dataset. Be strict about messages that depend on unseen conversation.',
      model: 'jev-latest',
      questions: questionsMap,
    });
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.typesafe.ai', path: '/v1/systemone', method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'content-length': Buffer.byteLength(body) },
      }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch { reject(new Error(`bad json (${res.statusCode}): ${d.slice(0, 150)}`)); }
        });
      });
      req.setTimeout(0, () => {}); // long-horizon model: no short timeout, ever
      req.on('error', reject);
      req.write(body); req.end();
    });
  }

  loadCache() {
    const cache = {};
    if (existsSync(this.clsCacheFile))
      for (const line of readFileSync(this.clsCacheFile, 'utf8').split('\n'))
        // only verdicts from the CURRENT prompt schema count; stricter prompts invalidate older lines
        try { const r = JSON.parse(line); if (r.pv === GauntletCorpus.PROMPT_VERSION) cache[r.text] = r.verdict; } catch { /* partial line */ }
    return cache;
  }

  sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async llmFilter(tasks) {
    if (!this.jev && !this.llm) return; // no classifier configured — regex+syntax picks stand
    const cache = this.loadCache();
    const todo = [];
    for (const t of tasks) {
      if (!t.answerable) continue;
      if (cache[t.text] !== undefined) t.answerable = cache[t.text];
      else todo.push(t);
    }
    console.log(`classifier: ${todo.length} to sort, ${Object.keys(cache).length} cached`);
    if (this.jev) return this.jevFilter(todo, cache);
    return this.localFilter(todo, cache);
  }

  async localFilter(todo, cache) {
    let model = null;
    try {
      const m = await this.httpPost(this.llm, '/v1/models', {});
      model = (m.data && m.data[0] && m.data[0].id) || null;
    } catch { /* endpoint down */ }
    if (!model) { console.log(`classifier: endpoint ${this.llm} unreachable — regex-layer picks stand`); return; }
    console.log(`classifier (local ${model} @ ${this.llm}): ${todo.length} to sort`);
    let pass = 0, fail = 0;
    for (const t of todo) {
      let verdict = true;
      try {
        const r = await this.httpPost(this.llm, '/v1/chat/completions', {
          model, stream: false, max_tokens: 4,
          messages: [{ role: 'user', content: this.sortPrompt(t) }],
        });
        const c = ((r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content) || '').toUpperCase();
        verdict = /PASS/.test(c) && !/FAIL/.test(c);
      } catch (e) { console.log(`classifier call failed (${e.message}) — keeping candidate unjudged`); }
      appendFileSync(this.clsCacheFile, JSON.stringify({ text: t.text, verdict, pv: GauntletCorpus.PROMPT_VERSION }) + '\n');
      t.answerable = verdict;
      verdict ? pass++ : fail++;
    }
    console.log(`classifier: ${pass} pass, ${fail} fail`);
  }

  async jevFilter(todo, cache) {
    if (!todo.length) { console.log('classifier (jev): nothing left to sort'); return; }
    console.log(`classifier (jev-latest): ${todo.length} to sort, ${this.JEV_CHUNK}/call`);
    for (let i = 0; i < todo.length; i += this.JEV_CHUNK) {
      const chunk = todo.slice(i, i + this.JEV_CHUNK);
      const qmap = Object.fromEntries(chunk.map((t, j) => [`cls-${i + j}`, {
        type: 'choice',
        instructions: `Could an assistant with ONLY the SITUATION block below (no other history, no machine access) ANSWER the MESSAGE — concretely and on-target — without inventing facts?\nTHE TEST: PASS only when situation+message together pin down what is asked; FAIL when the assistant would still be guessing — unstated assumptions about the writer's world that neither block answers.\nSITUATION: ${t.context || '(none)'}\nMESSAGE: ${t.text}`,
        criteria: { pass: "the text alone pins down what is asked; no assumptions about the writer's world needed", fail: 'answering requires unstated assumptions: ongoing work the reader cannot have seen, entities or processes the reader cannot know, unseen conversation, fragment' },
      }]));
      let r = null;
      for (let attempt = 1; !r && attempt <= 3; attempt++) {
        try { r = await this.jevAsk(qmap); }
        catch (e) { console.log(`jev chunk failed (attempt ${attempt}): ${e.message}`); await this.sleep(30000); }
      }
      if (!r) { console.log(`giving up on this chunk — rerun me, cached verdicts persist`); break; }
      for (const [qid, a] of Object.entries((r && r.answers) || {})) {
        const t = chunk[Number(qid.replace('cls-', '')) - i];
        if (!t) continue;
        const verdict = a && a.choice === 'pass';
        appendFileSync(this.clsCacheFile, JSON.stringify({ text: t.text, verdict, pv: GauntletCorpus.PROMPT_VERSION }) + '\n');
        t.answerable = verdict;
      }
      console.log(`jev chunk ${i / this.JEV_CHUNK + 1}/${Math.ceil(todo.length / this.JEV_CHUNK)} sorted`);
    }
    const pass = todo.filter((t) => t.answerable).length;
    console.log(`classifier: ${pass} pass, ${todo.length - pass} fail`);
  }

  stratify(byProject) {
    // round-robin across projects so one long era's sessions can't monopolize the file;
    // answerable first within each project, strays only as fallback filler
    for (const arr of Object.values(byProject)) arr.sort((x, y) => y.answerable - x.answerable);
    const names = Object.keys(byProject).sort();
    const picked = [];
    let round = 0;
    while (picked.length < this.max) {
      let any = false;
      for (const n of names) {
        if (byProject[n][round]) { picked.push(byProject[n][round]); any = true; }
      }
      if (!any) break;
      round++;
    }
    return picked.slice(0, this.max).map((t, i) => ({ id: i + 1, origin: this.host, ...t }));
  }

  slugProjectName(slug) {
    // '-home-vgvm-src-me-comparitron' -> 'comparitron'; 'weird.jsonl' -> 'weird'
    let s = slug.replace(/\.jsonl$/, '');
    const me = s.search(/-me-/);
    if (me >= 0) return s.slice(me + 4);
    const seg = s.split('-').filter(Boolean);
    return seg[seg.length - 1] || s;
  }

  async main() {
    const byProject = this.collect();
    const counts = Object.entries(byProject).map(([k, v]) => `${k}: ${v.length}`).join('\n  ');
    console.log(`candidates per project:\n  ${counts}`);
    const tasks = this.stratify(byProject);

    // REDACT before anything else touches the text — classifier included. Raw strings
    // never leave the box; the map file is persistent so box-1/proj-1 stay consistent.
    const redactor = new GauntletRedactor({ mapFile: this.mapFile });
    redactor.addHosts([this.host]);
    redactor.addProjects(Object.keys(byProject).map((p) => this.slugProjectName(p)));
    for (const t of tasks) redactor.addUsers(redactor.userCandidates(t.text));
    for (const t of tasks) { t.text = redactor.redact(t.text); t.context = redactor.redact(t.context || ''); t.charLen = t.text.length; }
    redactor.save();
    console.log(`redactor (${this.mapFile}): ${redactor.stats()}`);

    if (!this.dry) await this.llmFilter(tasks);
    const answerable = tasks.filter((t) => t.answerable).length;
    console.log(`picked ${tasks.length} tasks (${answerable} answerable, max ${this.max})`);
    if (this.dry) {
      for (const t of tasks) console.log(`\n#${t.id} ${t.charLen}c\n  ${t.text.replace(/\n/g, '\n  ').slice(0, 240)}`);
      console.log('\n(dry run — nothing written)');
      return;
    }
    writeFileSync(this.out, JSON.stringify({ builtAt: new Date().toISOString(), host: this.host, max: this.max, tasks }, null, 2));
    console.log(`-> ${this.out}\nREAD IT AND EDIT BEFORE THE JUDGE RUNS — these exact strings go to the arbiter.`);
  }
}

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--dry') { args.dry = true; continue; }
  if (a === '--jev') { args.jev = true; continue; }
  if (a === '--first-only') { args.firstOnly = true; continue; }
  if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1]; i++; }
}
new GauntletCorpus({
  max: Number(args.max || process.env.MAXN || 40),
  dry: !!args.dry,
  root: args.root,
  out: args.out,
  host: args.host,
  llm: args.llm,
  jev: !!args.jev,
  firstOnly: !!args.firstOnly,
}).main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
