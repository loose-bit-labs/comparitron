#!/usr/bin/env node
// Gauntlet arbiter: TypeSafe System One (jev-latest), blind pairwise scoring.
// Judge-only — jev never answers; local seats never judge. Pairs default: FxG FxH FxI GxI.
// Resumable: every raw verdict appends to gauntlet-judge-raw.jsonl; existing qids are skipped.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import https from 'node:https';
import { homedir } from 'node:os';
import { GauntletRedactor } from './gauntlet-redact.mjs';
import { join } from 'node:path';

const HOME = homedir();
const KEY = JSON.parse(readFileSync(join(HOME, '.config', 'api-keys', 'keys.json'), 'utf8')).typesafe;

class GauntletJudge {
  CHUNK = Number(process.env.CHUNK || 5);
  RETRIES = 3;

  constructor({ pairs, dir }) {
    this.dir = dir; // gauntlet-artifacts/
    this.tasksFile = join(dir, '..', 'gauntlet-tasks.json');
    this.raw = join(dir, 'gauntlet-judge-raw.jsonl');
    this.keyFile = join(dir, 'gauntlet-blind-key.json');
    this.pairs = (pairs || 'F-G,FxH,FxI,GxI').replace(/x/g, '-').split(',');
    // HARD redaction gate: the arbiter must never see raw identifiers. The map is built
    // at corpus time and shared; absent map = refuse to judge rather than leak.
    this.mapFile = join(dir, '..', 'gauntlet-redact.json');
    if (!existsSync(this.mapFile)) {
      console.error(`FATAL: no redaction map at ${this.mapFile} — build corpora with gauntlet-corpus.mjs (or run the merge) before judging; nothing unredacted leaves this box.`);
      process.exit(2);
    }
    this.redactor = new GauntletRedactor({ mapFile: this.mapFile });
  }

  answers(seat) {
    const f = join(this.dir, `answers-${seat}.jsonl`);
    if (!existsSync(f)) return {};
    const byId = {};
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      try { const r = JSON.parse(line); if (r.answer) byId[r.id] = r.answer; } catch { /* skip */ }
    }
    return byId;
  }

  blindKey() {
    if (existsSync(this.keyFile)) return JSON.parse(readFileSync(this.keyFile, 'utf8'));
    return {};
  }

  // Two ladders, both ascending (jev score criteria are ordered levels, position = value).
  static LADDER_TRUTH = [
    'Contradicts the ground truth, or gets any part of it wrong',
    'Partly right: reaches the ground truth in part, or lands alongside a wrong component',
    'Agrees with the ground truth in full',
  ];
  static LADDER_RUBRIC = [
    'Does not answer what the item asked, or answers it wrongly',
    'Partial: engages the item but misses or distorts part of what the rubric asks',
    'Mostly right: satisfies the rubric with minor gaps or noticeable padding',
    'Exactly what the rubric asks: correct, precise, no padding',
  ];

  scoreQuestions(tasks, seats) {
    const done = this.doneQids();
    const out = [];
    for (const t of tasks) {
      if (t.kind !== 'suite') continue; // only suite items carry a rubric or a ground truth
      const truth = t.groundTruth ? this.redactor.redact(t.groundTruth) : null;
      const rubric = t.rubric ? this.redactor.redact(t.rubric) : '';
      const criteria = truth ? GauntletJudge.LADDER_TRUTH : GauntletJudge.LADDER_RUBRIC;
      for (const seat of Object.keys(seats)) {
        const A = seats[seat][t.id];
        if (!A) continue;
        const qid = `S-${seat}-t${t.id}`;
        if (done.has(qid)) continue;
        // graded blind in the strong sense: nothing here says which seat produced the text
        const dispA = this.redactor.redact(A);
        const dispCtx = t.context ? this.redactor.redact(t.context) : '';
        out.push({
          qid, kind: 'score', seat, taskId: t.id, capability: t.capability, truth: !!truth,
          instructions: `One answer to a capability-test item is graded below. Grade the text in front of you; you do not know who wrote it, and guessing is forbidden.
ITEM:
<<<ITEM
${this.redactor.redact(t.text)}
ITEM>>>${rubric ? `\nWHAT A GOOD ANSWER LOOKS LIKE (the item author's rubric):\n<<<RUBRIC\n${rubric}\nRUBRIC>>>` : ''}${truth ? `\nGROUND TRUTH:\n<<<TRUTH\n${truth}\nTRUTH>>>` : ''}${dispCtx ? `\nSITUATION:\n<<<SITUATION\n${dispCtx}\nSITUATION>>>` : ''}
ANSWER TO GRADE:
<<<ANSWER
${dispA}
ANSWER>>>
Place the answer on the ladder. The middle levels exist to be used — reserve the top level for an answer that would not change if you met it again.`,
          criteria,
        });
      }
    }
    return out;
  }

  doneQids() {
    const done = new Set();
    if (existsSync(this.raw)) for (const line of readFileSync(this.raw, 'utf8').split('\n')) {
      try { done.add(JSON.parse(line).qid); } catch { /* skip */ }
    }
    return done;
  }

  buildQuestions() {
    const { tasks } = JSON.parse(readFileSync(this.tasksFile, 'utf8'));
    const seats = {};
    for (const s of new Set(this.pairs.flatMap((p) => p.split('-')))) seats[s] = this.answers(s);
    const key = this.blindKey();
    const done = this.doneQids();
    const questions = [];
    for (const pair of this.pairs) {
      const [sa, sb] = pair.split('-');
      for (const t of tasks) {
        const qid = `${sa}${sb}-t${t.id}`;
        if (done.has(qid)) continue;
        const A = seats[sa][t.id], B = seats[sb][t.id];
        if (!A || !B) continue; // one side failed to answer — that task doesn't count for this pair
        if (!key[qid]) {
          const flip = (t.id * 7 + this.pairs.indexOf(pair) * 13) % 2 === 1; // seeded, deterministic, unblind key written below
          key[qid] = { labelA: flip ? sb : sa, labelB: flip ? sa : sb };
        }
        // answers pass through the same chokepoint as tasks — arbiter sees only mapped text
        const dispA = this.redactor.redact(key[qid].labelA === sa ? A : B);
        const dispB = this.redactor.redact(key[qid].labelA === sa ? B : A);
        const dispCtx = this.redactor.redact(t.context || '(no recorded context)');
        questions.push({ qid, pair, taskId: t.id, instructions:
`The homelab owner typed this message to her assistant mid-work (real work, not a test). The situation at that moment, as recorded by her session:
<<<SITUATION
${dispCtx}
SITUATION>>>
Her message:
<<<TASK
${t.text}
TASK>>>
Answer A:
<<<A
${dispA}
A>>>
Answer B:
<<<B
${dispB}
B>>>
Which answer is more helpful to her — more correct, more actionable, less wasted motion? Judge substance, not length or polish; if both are roughly equally good (or equally bad), that is a genuine tie.`,
          criteria: { answer_a_better: 'A is meaningfully better', answer_b_better: 'B is meaningfully better', both_equal: 'neither is meaningfully better' } });
      }
    }
    writeFileSync(this.keyFile, JSON.stringify(key, null, 2));
    return { choice: questions, score: this.scoreQuestions(tasks, seats) };
  }

  ask(state, questionsMap) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ state, model: 'jev-latest', questions: questionsMap });
      const req = https.request({
        hostname: 'api.typesafe.ai', path: '/v1/systemone', method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'content-length': Buffer.byteLength(body) },
      }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch { reject(new Error(`bad json (${res.statusCode}): ${d.slice(0, 200)}`)); }
        });
      });
      req.setTimeout(0, () => {}); // long-horizon model: no short timeout, ever
      req.on('error', reject);
      req.write(body); req.end();
    });
  }

  sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async runPass(label, questions, state, type) {
    console.log(`${label}: ${questions.length} open questions (chunked ${this.CHUNK}/call) — arbiter jev-latest`);
    for (let i = 0; i < questions.length; i += this.CHUNK) {
      const chunk = questions.slice(i, i + this.CHUNK);
      // `type` is not optional decoration: without the discriminator on every question the
      // API answers nothing (HTTP 422 union_tag_not_found) and a silent pass looks like a done pass
      const qmap = Object.fromEntries(chunk.map((q) => [q.qid, { type, instructions: q.instructions, criteria: q.criteria }]));
      let ok = false;
      for (let attempt = 1; !ok && attempt <= this.RETRIES; attempt++) {
        try {
          const r = await this.ask(state, qmap);
          for (const [qid, a] of Object.entries(r.answers || {})) {
            const meta = chunk.find((q) => q.qid === qid) || {};
            const rec = type === 'choice'
              ? { qid, kind: 'choice', choice: a.choice, confidence: a.confidence }
              : { qid, kind: 'score', seat: meta.seat, taskId: meta.taskId, capability: meta.capability, truth: meta.truth, score: a.score, confidence: a.confidence };
            appendFileSync(this.raw, JSON.stringify({ ...rec, at: new Date().toISOString() }) + '\n');
          }
          ok = true;
          console.log(`${label} chunk ${i / this.CHUNK + 1}/${Math.ceil(questions.length / this.CHUNK)} judged (${Object.keys(r.answers || {}).length} answers)`);
        } catch (e) {
          console.log(`${label} chunk failed (attempt ${attempt}): ${e.message}`);
          await this.sleep(30000);
        }
      }
      if (!ok) console.log(`giving up on ${label} chunk at ${i} — rerun me, resumable`);
    }
  }

  async main() {
    const { choice, score } = this.buildQuestions();
    const choiceState = `You are the neutral arbiter of a model bake-off on a homelab. The arbiter has no allegiance to any contestant; the contestants are local GGUF models and you only ever see anonymized answers labelled A and B. Score each question on substance for the owner's actual work.`;
    const scoreState = `You are a lone grader for a capability test. You never know whose answer you are holding, and no contestant is your student. Grade against the item, its rubric and — when given — its ground truth. Never grade on length or polish.`;
    await this.runPass('pairwise', choice, choiceState, 'choice');
    await this.runPass('absolute', score, scoreState, 'score');
    this.scoreboard();
  }

  scoreboard() {
    const key = JSON.parse(readFileSync(this.keyFile, 'utf8'));
    const tally = {};
    const prof = {}; // seat -> { capability -> [scores] }
    for (const line of readFileSync(this.raw, 'utf8').split('\n')) {
      let rec; try { rec = JSON.parse(line); } catch { continue; }
      if (rec.kind === 'score' || rec.score !== undefined) {
        const row = ((prof[rec.seat] ||= {})[rec.capability] ||= []);
        row.push({ id: rec.taskId, cap: rec.capability, score: rec.score, truth: !!rec.truth });
        continue;
      }
      const k = key[rec.qid]; if (!k || !rec.choice) continue;
      const seats = [k.labelA, k.labelB].sort();            // pair canonical name
      const row = (tally[seats.join('-')] ||= { wins: 0, losses: 0, ties: 0, conf: [] });
      const winnerSeat = rec.choice === 'both_equal' ? null
        : rec.choice === 'answer_a_better' ? k.labelA : k.labelB;
      if (!winnerSeat) row.ties++;
      else if (winnerSeat === seats[0]) row.wins++;          // wins for the first-named seat
      else row.losses++;
      if (rec.confidence) row.conf.push(rec.confidence);
    }
    console.log('\n== GAUNTLET SCOREBOARD (pair winner column: first-named seat) ==');
    const out = {};
    for (const [pair, r] of Object.entries(tally)) {
      const n = r.wins + r.losses + r.ties;
      const conf = r.conf.length ? (r.conf.reduce((a, b) => a + b, 0) / r.conf.length) : null;
      out[pair] = { ...r, n, meanConfidence: conf };
      console.log(`${pair}: ${r.wins}W-${r.losses}L-${r.ties}T of ${n}${conf ? `  (arbiter conf ${conf.toFixed(2)})` : ''}`);
    }
    // Absolute track: each level position normalized to 0..1 by the ladder length, so a
    // 3-level truth ladder and a 4-level rubric ladder can be averaged together. Read the
    // n before any difference: most capability buckets are 2-6 items wide.
    if (Object.keys(prof).length) {
      const caps = [...new Set(Object.values(prof).flatMap((p) => Object.keys(p)))].sort();
      const seats = Object.keys(prof).sort();
      const profile = {};
      console.log('\n== ABSOLUTE PROFILE (arbiter ladder, normalized; n per bucket) ==');
      console.log(`capability   ${seats.map((s) => String(s).padStart(14)).join('')}  n`);
      const norm = (x) => x.score / (x.truth ? 2 : 3); // each item divides by its own ladder top
      for (const cap of caps) {
        const row = {};
        const ns = new Set();
        for (const s of seats) {
          const items = prof[s][cap];
          if (!items || !items.length) { row[s] = null; continue; }
          row[s] = +(items.reduce((a, b) => a + norm(b), 0) / items.length).toFixed(3);
          ns.add(items.length);
        }
        (profile[cap] ||= {}).means = row;
        profile[cap].n = [...ns].join('/');
        console.log(`${cap.padEnd(13)}${seats.map((s) => (row[s] === null ? '     -    ' : String(row[s]).padStart(14))).join('')}  ${profile[cap].n}`);
      }
      for (const s of seats) {
        const all = Object.values(prof[s]).flat();
        profile[s] = { overall: all.length ? +((all.reduce((a, b) => a + norm(b), 0) / all.length)).toFixed(3) : null, n: all.length };
      }
      console.log(seats.map((s) => `${s} overall ${profile[s].overall} (n=${profile[s].n})`).join('   '));
      out.profile = profile;
      // The table above averages each seat over the items IT happened to answer — with a seat
      // that failed 31 of 88, that is a different (easier) question set per seat, and the seat
      // that answered everything is punished for answering the hard ones. Conditioned below on
      // items every seat answered: same items both sides, so item difficulty cancels. Read the
      // conditioned numbers as the comparison; read the own-set ones as coverage.
      // Every seat's scored records keyed by task id, so the two tables align item by item.
      const byId = {};
      for (const s of seats) byId[s] = new Map(Object.values(prof[s]).flat().map((r) => [r.id, r]));
      const sharedIds = [...byId[seats[0]].keys()].filter((id) => seats.every((s) => byId[s].has(id)));
      if (!sharedIds.length) {
        console.log('\n(no item was answered and scored by every seat — the own-set profile above is NOT a comparison)');
      } else {
        const cond = {};
        const meanOn = (s, ids) => {
          const v = ids.map((id) => norm(byId[s].get(id)));
          return +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3);
        };
        console.log(`\n== ABSOLUTE CONDITIONED on the ${sharedIds.length} items EVERY seat answered (same items both sides) ==`);
        console.log(`capability   ${seats.map((s) => String(s).padStart(14)).join('')}  n`);
        for (const cap of caps) {
          const ids = sharedIds.filter((id) => byId[seats[0]].get(id).cap === cap);
          if (!ids.length) continue;
          const row = {};
          for (const s of seats) row[s] = meanOn(s, ids);
          (cond[cap] ||= {}).means = row;
          cond[cap].n = ids.length;
          console.log(`${cap.padEnd(13)}${seats.map((s) => String(row[s]).padStart(14)).join('')}  ${ids.length}`);
        }
        for (const s of seats) cond[s] = { overall: meanOn(s, sharedIds), n: sharedIds.length };
        console.log(seats.map((s) => `${s} overall ${cond[s].overall} (n=${cond[s].n})`).join('   '));
        out.profileConditioned = cond;
      }
    }
    writeFileSync(join(this.dir, 'gauntlet-scoreboard.json'), JSON.stringify(out, null, 2));
    console.log(`\n-> ${join(this.dir, 'gauntlet-scoreboard.json')} (unblind key: gauntlet-blind-key.json)`);
  }
}

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
new GauntletJudge({ pairs: args.pairs, dir: args.dir || join(HOME, 'tmp', 'locatesta', 'gauntlet-artifacts') })
  .main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
