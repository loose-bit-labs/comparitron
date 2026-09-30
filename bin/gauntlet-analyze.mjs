#!/usr/bin/env node
// Post-hoc analysis of a judged gauntlet round. Reads the answer JSONLs, the blind key and
// the arbiter's raw verdicts; writes NOTHING. Three things the printed scoreboard cannot say:
//   1. per-passage pairwise records (transcript vs suite — they measure different things)
//   2. the absolute profile CONDITIONED on the items every seat actually answered
//      (the printed profile averages each seat over its OWN item set — unequal sets, unequal difficulty)
//   3. length-bias diagnostics for both tracks (does the arbiter follow verbosity?)
//   4. the TIME axis: what each answer cost in wall seconds, quality per minute spent, who is
//      still standing inside production's own clock, and what happens at an equal token budget
// Usage: node gauntlet-analyze.mjs [--dir <artifactsDir>] [--seats F,G,H,I]
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

class GauntletAnalyze {
  SEATS = ['F', 'G', 'H', 'I'];

  constructor({ dir, seats }) {
    if (seats) this.SEATS = String(seats).split(',').map((s) => s.trim()).filter(Boolean);
    this.dir = dir;
    this.tasksFile = join(dir, '..', 'gauntlet-tasks.json');
    this.raw = join(dir, 'gauntlet-judge-raw.jsonl');
    this.keyFile = join(dir, 'gauntlet-blind-key.json');
    if (!existsSync(this.raw)) {
      console.error(`FATAL: no arbiter verdicts at ${this.raw} — run gauntlet-judge.mjs first.`);
      process.exit(2);
    }
    this.tasks = JSON.parse(readFileSync(this.tasksFile, 'utf8'));
    this.list = Array.isArray(this.tasks) ? this.tasks : (this.tasks.tasks || Object.values(this.tasks)[0]);
    this.kind = new Map(this.list.map((t) => [t.id, t.kind]));
    this.rec = {}; // seat -> id -> full answer record (last good answer wins)
    for (const s of this.SEATS) this.rec[s] = this.readAnswers(s);
    this.length = {};
    for (const s of this.SEATS) this.length[s] = Object.fromEntries(
      Object.entries(this.rec[s]).map(([id, r]) => [id, r.answer.length]));
    const raw = readFileSync(this.raw, 'utf8').split('\n')
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    this.choice = raw.filter((r) => r.kind === 'choice');
    this.score = raw.filter((r) => r.kind === 'score');
    this.key = JSON.parse(readFileSync(this.keyFile, 'utf8'));
  }

  readAnswers(seat) {
    const f = join(this.dir, `answers-${seat}.jsonl`);
    const out = {};
    if (!existsSync(f)) return out;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      let r; try { r = JSON.parse(line); } catch { continue; }
      if (r && r.answer) out[r.id] = r; // last good answer wins (full record)
    }
    return out;
  }

  answered(seat, id) { return this.length[seat][id] !== undefined; }
  norm(x) { return x.score / (x.truth ? 2 : 3); }
  mean(a) { return a.length ? a.reduce((t, x) => t + x, 0) / a.length : null; }
  pct(a, q) { const v = [...a].sort((x, y) => x - y); return v.length ? v[Math.floor(v.length * q)] : null; }
  f3(x) { return x === null ? '   -   ' : x.toFixed(3).padStart(7); }
  p2(x) { return x === null ? '   -  ' : `${(x * 100).toFixed(0)}%`.padStart(6); }

  // 1. coverage: who actually answered what
  coverage() {
    console.log('== COVERAGE (answers the scoreboard n is built from) ==');
    console.log('seat   transcript ok/fail     suite ok/fail     median len   p90     max   <10 chars');
    for (const s of this.SEATS) {
      const t = this.list.filter((x) => x.kind === 'transcript');
      const u = this.list.filter((x) => x.kind === 'suite');
      const c = (arr, want) => arr.filter((x) => this.answered(s, x.id) === want).length;
      const lens = Object.values(this.length[s]);
      const short = lens.filter((l) => l < 10).length;
      console.log(`${s}   ${String(c(t, true)).padStart(3)}/${String(t.length).padEnd(3)} fail ${String(c(t, false)).padEnd(3)}   `
        + `${String(c(u, true)).padStart(3)}/${String(u.length).padEnd(3)} fail ${String(c(u, false)).padEnd(3)}   `
        + `${String(this.pct(lens, 0.5)).padStart(8)} ${String(this.pct(lens, 0.9)).padStart(7)} ${String(Math.max(...lens)).padStart(7)}   ${String(short).padStart(4)}`);
    }
    console.log('A seat with failures never competed on the items it missed — every unequal n is a');
    console.log('different question set, and pairs with different n are NOT comparable to each other.');
  }

  // 2. pairwise, split by passage and restricted to a common item set
  pairwise() {
    console.log('\n== PAIRWISE (wins for the alphabetically-first seat) ==');
    const rows = {};
    const add = (pair, pass, rec) => {
      const r = (rows[`${pair}|${pass}`] ||= { w: 0, l: 0, t: 0, n: 0, cf: [] });
      const k = this.key[rec.qid]; const seats = [k.labelA, k.labelB].sort();
      r.n++; r.cf.push(rec.confidence || 0);
      if (rec.choice === 'both_equal') { r.t++; return; }
      const winner = rec.choice === 'answer_a_better' ? k.labelA : k.labelB;
      if (winner === seats[0]) r.w++; else r.l++;
    };
    const common = this.list.filter((t) => this.SEATS.every((s) => this.answered(s, t.id)));
    const commonSet = new Set(common.map((t) => t.id));
    for (const rec of this.choice) {
      const k = this.key[rec.qid]; if (!k) continue;
      const id = Number(rec.qid.split('-t')[1]);
      const pair = [k.labelA, k.labelB].sort().join('-');
      add(pair, 'ALL', rec);
      add(pair, this.kind.get(id), rec);
      if (commonSet.has(id)) add(pair, 'SHARED', rec);
    }
    console.log(`shared items (every seat answered): ${common.length} of ${this.list.length}`);
    console.log('pair    passage      W    L    T     n   conf');
    for (const key of Object.keys(rows).sort()) {
      const r = rows[key];
      const conf = r.cf.length ? this.mean(r.cf).toFixed(2) : '-';
      console.log(`${key.split('|')[0].padEnd(7)} ${key.split('|')[1].padEnd(11)} ${String(r.w).padStart(4)}${String(r.l).padStart(5)}${String(r.t).padStart(5)}${String(r.n).padStart(7)}   ${conf}`);
    }
    console.log('\nSign test on decisive verdicts (ties removed; z from (w-l)/sqrt(n)) —');
    console.log('|z|<1.96 means the arbiter did NOT separate the pair at p<0.05:');
    console.log('pair    passage      win%   dec     z      p');
    for (const key of Object.keys(rows).sort()) {
      const r = rows[key];
      const dec = r.w + r.l; if (!dec) continue;
      const z = (r.w - r.l) / Math.sqrt(dec);
      const p = 2 * (1 - this.phi(Math.abs(z)));
      console.log(`${key.split('|')[0].padEnd(7)}${key.split('|')[1].padEnd(12)}${String(((100 * r.w) / dec).toFixed(0) + '%').padStart(6)}${String(dec).padStart(6)}`
        + `${z.toFixed(2).padStart(7)}${(p < 0.001 ? '<0.001' : p.toFixed(3)).padStart(8)}`);
    }
  }

  phi(x) { return 0.5 * (1 + this.erf(x / Math.SQRT2)); } // standard normal CDF
  erf(x) {
    // Abramowitz & Stegun 7.1.26, max abs error 1.5e-7
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const a = [0.319381530, -0.356563782, 1.781477937, -1.820905683, 1.472303759];
    const y = 1 - ((((a[4] * t + a[3]) * t + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-x * x);
    return s * y;
  }

  // 3. absolute track conditioned on a shared item set
  absolute() {
    console.log('\n== ABSOLUTE (arbiter ladder; own-set vs conditioned) ==');
    const bySeat = {};
    for (const s of this.SEATS) bySeat[s] = new Map();
    for (const r of this.score) bySeat[r.seat]?.set(r.taskId, r);
    const suiteIds = this.list.filter((t) => t.kind === 'suite').map((t) => t.id);
    const shared = suiteIds.filter((id) => this.SEATS.every((s) => bySeat[s].has(id)));
    console.log(`suite items ${suiteIds.length}, scored by every seat: ${shared.length}`);
    const mean = (s, ids) => this.mean(ids.map((id) => this.norm(bySeat[s].get(id))));
    console.log('seat      own n   own mean    shared n  conditioned mean');
    for (const s of this.SEATS) {
      const own = [...bySeat[s].keys()];
      console.log(`${s}   ${String(own.length).padStart(6)} ${this.f3(this.mean(own.map((id) => this.norm(bySeat[s].get(id)))))}          `
        + `${String(shared.length).padStart(5)}   ${this.f3(mean(s, shared))}`);
    }
    const caps = [...new Set([...bySeat.F.values()].map((r) => r.capability))].sort();
    console.log(`\ncapability (conditioned on the ${shared.length} shared items only)`);
    console.log('capability   ' + this.SEATS.map((s) => s.padStart(8)).join('') + '   n');
    for (const cap of caps) {
      const ids = shared.filter((id) => bySeat.F.get(id)?.capability === cap);
      if (!ids.length) { console.log(`${cap.padEnd(13)}    (no item every seat answered — ungradeable side by side)`); continue; }
      console.log(cap.padEnd(13) + this.SEATS.map((s) => this.f3(mean(s, ids))).join('') + `   ${ids.length}`);
    }
    // Paired: every difference is computed on the SAME item, so item difficulty cancels.
    const means = Object.fromEntries(this.SEATS.map((s) => [s, mean(s, shared)]));
    const ref = this.SEATS.reduce((a, b) => (means[b] > means[a] ? b : a));
    console.log(`\nPaired differences on the ${shared.length} shared items (best = ${ref} minus each) — same items on both sides:`);
    for (const s of this.SEATS) {
      if (s === ref) continue;
      const d = shared.map((id) => this.norm(bySeat[ref].get(id)) - this.norm(bySeat[s].get(id)));
      const m = this.mean(d);
      const sd = Math.sqrt(this.mean(d.map((x) => (x - m) ** 2)) || 0);
      const se = sd / Math.sqrt(d.length);
      console.log(`  ${ref} - ${s}: ${m >= 0 ? '+' : ''}${m.toFixed(3)}   paired SD ${sd.toFixed(3)}, SE ${se.toFixed(3)}, t≈${se ? (m / se).toFixed(2) : '-'}`);
    }
  }

  // 4. is the arbiter following verbosity?
  lengthBias() {
    console.log('\n== LENGTH BIAS ==');
    const bins = [[1, 1.25], [1.25, 2], [2, 4], [4, 8], [8, Infinity]];
    const stat = bins.map((b) => ({ b, w: 0, n: 0 }));
    for (const rec of this.choice) {
      const k = this.key[rec.qid]; if (!k) continue;
      const id = Number(rec.qid.split('-t')[1]);
      const LA = this.length[k.labelA][id], LB = this.length[k.labelB][id];
      if (!LA || !LB || LA === LB) continue;
      if (rec.choice === 'both_equal') continue;
      const ratio = Math.max(LA, LB) / Math.min(LA, LB);
      const longer = LA > LB ? k.labelA : k.labelB;
      const winner = rec.choice === 'answer_a_better' ? k.labelA : k.labelB;
      for (const s of stat) if (ratio >= s.b[0] && ratio < s.b[1]) { s.n++; if (winner === longer) s.w++; }
    }
    console.log('P(the longer answer wins) by length ratio — flat means the arbiter reads length, not substance:');
    for (const s of stat) {
      if (!s.n) continue;
      console.log(`  ratio ${s.b[0]}-${s.b[1] === Infinity ? '∞' : s.b[1]}: ${(100 * s.w / s.n).toFixed(0)}% of ${s.n}`);
    }
    console.log('\nAbsolute grading vs length (per seat, split at its own median answer length):');
    for (const s of this.SEATS) {
      const rows = this.score.filter((r) => r.seat === s)
        .map((r) => ({ l: this.length[s][r.taskId], v: this.norm(r) }))
        .filter((o) => o.l !== undefined).sort((a, b) => a.l - b.l);
      if (rows.length < 6) continue;
      const h = Math.floor(rows.length / 2);
      const short = this.mean(rows.slice(0, h).map((o) => o.v)), long = this.mean(rows.slice(h).map((o) => o.v));
      console.log(`  ${s}: n=${String(rows.length).padStart(2)}  short half ${short.toFixed(3)}   long half ${long.toFixed(3)}   delta ${(long - short >= 0 ? '+' : '')}${(long - short).toFixed(3)}`);
    }
  }

  elap(seat, id) { const r = this.rec[seat][id]; return r && r.elapsedS !== undefined ? r.elapsedS : null; }

  // Every seat's absolute scores by task id (built once, used by the time views below).
  scoreMaps() {
    const m = {};
    for (const s of this.SEATS) m[s] = new Map();
    for (const r of this.score) m[r.seat]?.set(r.taskId, r);
    return m;
  }

  // 5. the axis the scoreboard never carries: what did the answer COST, and what is the
  // quality available inside production's own clock? A quality edge that only exists after
  // ten minutes of thinking is a different animal from a quality edge that costs nothing.
  timing() {
    console.log('\n== TIME — quality measured WITH its clock ==');
    console.log('elapsedS is the wall time of the FINAL ask only. An item answered above tier 1500 spent at');
    console.log('least one MORE full generation before it, so every second below is a LOWER bound on cost.');
    console.log('\nseat   items  median s    p90 s    max s   total min   retried/stamped   chars/s');
    const seatStats = {};
    for (const s of this.SEATS) {
      const recs = Object.values(this.rec[s]);
      const es = recs.map((r) => r.elapsedS).filter((x) => x !== undefined);
      if (!es.length) continue;
      const retried = recs.filter((r) => r.budget !== undefined && r.budget > 1500).length;
      const withBudget = recs.filter((r) => r.budget !== undefined).length;
      const cps = this.mean(recs.filter((r) => r.elapsedS > 0)
        .map((r) => (r.answer.length + (r.reasoningChars || 0)) / r.elapsedS));
      const tot = es.reduce((a, b) => a + b, 0) / 60;
      seatStats[s] = { med: this.pct(es, 0.5), p90: this.pct(es, 0.9), max: Math.max(...es), tot, retried, withBudget, n: recs.length };
      console.log(`${s}   ${String(recs.length).padStart(5)} ${String(seatStats[s].med).padStart(9)}${String(seatStats[s].p90).padStart(9)}${String(seatStats[s].max).padStart(9)}${tot.toFixed(0).padStart(11)}   ${`${retried}/${withBudget}`.padStart(11)}          ${cps.toFixed(1).padStart(7)}`);
    }
    // Production's own clock: what the baseline takes for a slow-ish answer.
    const fEl = Object.values(this.rec.F || {}).map((r) => r.elapsedS).filter((x) => x !== undefined);
    const fMed = fEl.length ? this.pct(fEl, 0.5) : null;
    const clock = fEl.length ? Math.ceil(this.pct(fEl, 0.9) / 10) * 10 : null;
    console.log(`\nproduction's clock: median ${fMed}s, p90 ${clock}s per item. Everything below that is`);
    console.log('time the baseline spends routinely; above it is time the baseline never spends.');

    const smap = this.scoreMaps();
    const suiteIds = this.list.filter((t) => this.kind.get(t.id) === 'suite').map((t) => t.id);
    const shared = suiteIds.filter((id) => this.SEATS.every((s) => smap[s].has(id)));
    const smean = (s, ids) => this.mean(ids.map((id) => this.norm(smap[s].get(id))));
    const medEl = (s, ids) => this.pct(ids.map((id) => this.elap(s, id)).filter((x) => x !== null), 0.5);

    console.log('\n-- absolute quality CONDITIONED on the shared items, per minute of wall time --');
    console.log('seat   mean score   median s/item   score/min (mean score ÷ median minutes)');
    for (const s of this.SEATS) {
      const m = smean(s, shared), t = medEl(s, shared);
      if (m === null || !t) continue;
      console.log(`${s}   ${this.f3(m)}        ${String(t).padStart(6)}          ${(m / (t / 60)).toFixed(2)}`);
    }
    console.log('(score per minute is a rate, not a ranking — it says who is productive per second');
    console.log('spent, and it is the only column here where a faster brain can beat a better one.)');

    console.log('\n-- who is still standing inside the clock (every seat answered within N seconds) --');
    for (const T of [...new Set([30, 60, 120, clock].filter((x) => x !== null && x !== undefined))]) {
      const ids = shared.filter((id) => this.SEATS.every((s) => {
        const e = this.elap(s, id); return e !== null && e <= T;
      }));
      if (!ids.length) { console.log(`  <=${T}s: no item every seat answered inside the window — ungradeable side by side`); continue; }
      const row = this.SEATS.map((s) => `${s} ${this.mean(ids.map((id) => this.norm(smap[s].get(id)))).toFixed(3)}`).join('   ');
      console.log(`  <=${String(T).padStart(3)}s: n=${String(ids.length).padStart(2)}  ${row}`);
    }

    console.log('\n-- equal TOKEN budget: items every seat answered at tier 1500 (same cost cap for all) --');
    const tier1 = suiteIds.filter((id) => this.SEATS.every((s) => {
      const r = this.rec[s][id]; return r && r.budget === 1500 && smap[s].has(id);
    }));
    if (tier1.length < 3) {
      console.log(`  only ${tier1.length} such items — too few to rank anyone (some seats have no budget`);
      console.log(`  stamp at all: ${this.SEATS.map((s) => `${s} ${seatStats[s]?.withBudget ?? 0}/${seatStats[s]?.n ?? 0}`).join(' ')} records carry one)`);
    } else {
      console.log(`  n=${tier1.length}  ` + this.SEATS.map((s) => `${s} ${this.f3(smean(s, tier1))}`).join('  '));
    }

    console.log('\n-- does spending more time buy score? (per seat, its own fast half vs slow half) --');
    for (const s of this.SEATS) {
      const rows = [...smap[s].values()]
        .map((r) => ({ e: this.elap(s, r.taskId), v: this.norm(r) }))
        .filter((o) => o.e !== null && o.e !== undefined).sort((a, b) => a.e - b.e);
      if (rows.length < 8) continue;
      const h = Math.floor(rows.length / 2);
      const fast = this.mean(rows.slice(0, h).map((o) => o.v)), slow = this.mean(rows.slice(h).map((o) => o.v));
      console.log(`  ${s}: n=${String(rows.length).padStart(2)}  fast half (<=${String(rows[h - 1].e).padStart(5)}s) ${fast === null ? '  -  ' : fast.toFixed(3)}   slow half (>=${String(rows[h].e).padStart(5)}s) ${slow === null ? '  -  ' : slow.toFixed(3)}   delta ${(slow - fast >= 0 ? '+' : '')}${(slow - fast).toFixed(3)}`);
    }

    console.log('\n-- the HARD TAIL: items production itself found slow (F >= its p75) — the items she');
    console.log('   would have noticed the latency on, which is exactly where extra thought should pay --');
    const cut = this.pct(fEl, 0.75);
    const hard = new Set(Object.keys(this.rec.F).filter((id) => (this.elap('F', id) || 0) >= cut).map(Number));
    console.log(`  cut: F >= ${cut}s -> ${hard.size} of ${this.list.length} items are production's slow ones`);
    const hardSuite = shared.filter((id) => hard.has(id));
    const medHard = (s) => this.pct(hardSuite.map((id) => this.elap(s, id)).filter((x) => x !== null), 0.5);
    console.log(hardSuite.length >= 5
      ? `  absolutes on the ${hardSuite.length} scored hard items (same items, every seat):`
      : `  only ${hardSuite.length} of production's hard items was answered AND scored by every seat — the`
        + ' seats cannot be ranked side by side on this subset (n<5, the rows below are noise)');
    for (const s of this.SEATS) {
      const m = this.mean(hardSuite.map((id) => this.norm(smap[s].get(id))));
      const t = medHard(s);
      if (m === null || !t) continue;
      console.log(`   ${s}: ${this.f3(m)}   median ${String(t).padStart(5)}s   per-min ${(m / (t / 60)).toFixed(2)}`);
    }
    const hd = (smap.H && smap.F) ? hardSuite.map((id) => this.norm(smap.H.get(id)) - this.norm(smap.F.get(id))) : [];
    if (hd.length >= 3) {
      const m = this.mean(hd);
      const sd = Math.sqrt(this.mean(hd.map((x) => (x - m) ** 2)) || 0);
      const se = sd / Math.sqrt(hd.length);
      console.log(`   H - F on production's hard items: ${m >= 0 ? '+' : ''}${m.toFixed(3)}  (paired t≈${se ? (m / se).toFixed(2) : '-'} on n=${hd.length})`);
    }
    const hardRows = {};
    for (const rec of this.choice) {
      const k = this.key[rec.qid]; if (!k) continue;
      const id = Number(rec.qid.split('-t')[1]);
      if (!hard.has(id)) continue;
      const seats = [k.labelA, k.labelB].sort();
      const r = (hardRows[seats.join('-')] ||= { w: 0, l: 0, t: 0, n: 0 });
      r.n++;
      if (rec.choice === 'both_equal') { r.t++; continue; }
      const winner = rec.choice === 'answer_a_better' ? k.labelA : k.labelB;
      if (winner === seats[0]) r.w++; else r.l++;
    }
    console.log('  pairwise on production\'s hard items only:');
    for (const pair of Object.keys(hardRows).sort()) {
      const r = hardRows[pair], dec = r.w + r.l;
      if (!dec) continue;
      const z = (r.w - r.l) / Math.sqrt(dec);
      console.log(`   ${pair}: ${r.w}W-${r.l}L-${r.t}T of ${r.n}   win% ${((100 * r.w) / dec).toFixed(0)}  z=${z.toFixed(2)} p=${(2 * (1 - this.phi(Math.abs(z)))).toFixed(3)}`);
    }

    console.log('\n-- does the pairwise chooser follow the SLOWER answer (time analog of the length bias)? --');
    const bins = [[1, 1.5], [1.5, 3], [3, 10], [10, Infinity]];
    const stat = bins.map((b) => ({ b, w: 0, n: 0 }));
    for (const rec of this.choice) {
      const k = this.key[rec.qid]; if (!k || rec.choice === 'both_equal') continue;
      const id = Number(rec.qid.split('-t')[1]);
      const ea = this.elap(k.labelA, id), eb = this.elap(k.labelB, id);
      if (!ea || !eb || ea === eb) continue;
      const ratio = Math.max(ea, eb) / Math.min(ea, eb);
      const slower = ea > eb ? k.labelA : k.labelB;
      const winner = rec.choice === 'answer_a_better' ? k.labelA : k.labelB;
      for (const st of stat) if (ratio >= st.b[0] && ratio < st.b[1]) { st.n++; if (winner === slower) st.w++; }
    }
    for (const st of stat) if (st.n) console.log(`  time ratio ${st.b[0]}-${st.b[1] === Infinity ? '∞' : st.b[1]}: the slower answer wins ${(100 * st.w / st.n).toFixed(0)}% of ${st.n}`);

    console.log('\n-- pairwise restricted to items BOTH seats finished inside production\'s clock --');
    if (clock === null) { console.log('  no production timing data — skipped'); return; }
    const rows = {};
    for (const rec of this.choice) {
      const k = this.key[rec.qid]; if (!k) continue;
      const id = Number(rec.qid.split('-t')[1]);
      const ea = this.elap(k.labelA, id), eb = this.elap(k.labelB, id);
      if (ea === null || eb === null || ea > clock || eb > clock) continue;
      const seats = [k.labelA, k.labelB].sort();
      const r = (rows[seats.join('-')] ||= { w: 0, l: 0, t: 0, n: 0 });
      r.n++;
      if (rec.choice === 'both_equal') { r.t++; continue; }
      const winner = rec.choice === 'answer_a_better' ? k.labelA : k.labelB;
      if (winner === seats[0]) r.w++; else r.l++;
    }
    for (const pair of Object.keys(rows).sort()) {
      const r = rows[pair], dec = r.w + r.l;
      if (!dec) { console.log(`  ${pair}: n=${r.n}, no decisive verdict inside the clock`); continue; }
      const z = (r.w - r.l) / Math.sqrt(dec);
      const p = 2 * (1 - this.phi(Math.abs(z)));
      console.log(`  ${pair}: ${r.w}W-${r.l}L-${r.t}T of ${r.n} inside ${clock}s   win% ${((100 * r.w) / dec).toFixed(0)}  z=${z.toFixed(2)} p=${p < 0.001 ? '<0.001' : p.toFixed(3)}`);
    }
  }

  main() {
    this.coverage();
    this.pairwise();
    this.absolute();
    this.lengthBias();
    this.timing();
  }
}

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
new GauntletAnalyze({
  dir: args.dir || join(homedir(), 'tmp', 'locatesta', 'gauntlet-artifacts'),
  seats: args.seats,
}).main();
