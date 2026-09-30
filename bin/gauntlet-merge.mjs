#!/usr/bin/env node
// Gauntlet merge: combine per-box corpora (gauntlet-tasks-<box>.json + local) into one
// send-set. Fuzzy-dedupe across boxes, round-robin across origins so no single box's era
// monopolizes, answerable-first within each origin. House class style.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { homedir } from 'node:os';
import { GauntletRedactor } from './gauntlet-redact.mjs';

class GauntletMerge {
  constructor({ dir, out, max = 60 }) {
    this.dir = dir; // locatesta dir holding gauntlet-tasks*.json files
    this.out = out;
    this.max = max;
    this.mapFile = join(dir, 'gauntlet-redact.json');
  }

  fuzzyKey(t) {
    return t.toLowerCase().replace(/\W+/g, ' ').trim().slice(0, 72);
  }

  load() {
    const pool = []; // {text, project, charLen, answerable, origin}
    const seen = new Map(); // fuzzyKey -> origin (first wins, later dupes noted)
    // NEVER read our own output back in: with the official file in the input glob, the
    // previous send-set became a phantom origin ("local"), won dedupe by sort order, and
    // polluted every subsequent pool (observed 2026-09-24).
    const outAbs = resolve(this.out);
    const names = readdirSync(this.dir)
      .filter((f) => /^gauntlet-tasks.*\.json$/.test(f) && resolve(this.dir, f) !== outAbs)
      .sort();
    const origins = [];
    for (const f of names) {
      let meta;
      try { meta = JSON.parse(readFileSync(join(this.dir, f), 'utf8')); } catch { console.log(`skip unreadable ${f}`); continue; }
      const origin = meta.host || basename(f, '.json').replace(/^gauntlet-tasks-?/, '') || 'local';
      let kept = 0, dupes = 0;
      origins.push(origin);
      for (const t of meta.tasks || []) {
        const k = this.fuzzyKey(t.text);
        if (seen.has(k)) { dupes++; continue; }
        seen.set(k, origin);
        pool.push({ text: t.text, context: t.context || '', project: t.project, charLen: t.charLen, ctxLen: (t.context || '').length, answerable: !!t.answerable, origin });
        kept++;
      }
      console.log(`${f}: origin=${origin} kept=${kept} dupes-dropped=${dupes}`);
    }
    // belt and braces: a corpus built by older code may hold raw text — the shared
    // redactor is idempotent, so re-running it on already-redacted text is a no-op.
    // Registered automatically: box names, session-project slugs, usernames found in
    // paths, IP literals. Everything else (repo dirs, service names, pet projects) is
    // HERS to decide — the report below lists name-like tokens she can add to the map.
    const redactor = new GauntletRedactor({ mapFile: this.mapFile });
    const addP = (str) => {
      const m = String(str).match(/-me-([a-z0-9][a-z0-9-]*)$/i);
      if (m) return m[1];
      const s = String(str);
      // path-slugs (Users-x-..., home-x-..., leading dash) are not project names
      if (/^(Users?|home|mnt|userspace)-|^[-]/i.test(s) || /[-_](vgvm|catlifuo|dev)[-.]/i.test(s)) return null;
      return s;
    };
    const slugNames = [...origins];
    for (const f of names) {
      try { for (const t of (JSON.parse(readFileSync(join(this.dir, f), 'utf8')).tasks || [])) slugNames.push(t.project); } catch { /* */ }
    }
    redactor.addHosts(origins);
    redactor.addProjects(slugNames.map(addP).filter((p) => p && p !== '.' && p !== '..'));
    for (const t of pool) redactor.addUsers(redactor.userCandidates(t.text));
    for (const t of pool) { t.text = redactor.redact(t.text); t.context = redactor.redact(t.context || ''); t.charLen = t.text.length; }
    redactor.save();
    this.reportCandidates(pool, redactor);

    console.log(`redactor (${this.mapFile}): ${redactor.stats()}`);
    return pool;
  }

  // Advisory only — never registers, never alters text. She reads this, decides which
  // names are actually internal, and adds them to gauntlet-redact.json as "name": null.
  reportCandidates(pool, redactor) {
    const known = new Set([
      ...Object.keys(redactor.map.hosts), ...Object.keys(redactor.map.projects),
      ...redactor.users, ...Object.keys(redactor.map.ips), ...redactor.np,
    ].map((x) => (x || '').toLowerCase()));
    const STOP = new Set(['home', 'users', 'src', 'me', 'tmp', 'data', 'dev', 'mnt', 'var', 'usr',
      'etc', 'lib', 'bin', 'srv', 'opt', 'docs', 'doc', 'api', 'json', 'md', 'txt', 'log', 'logs',
      'cache', 'config', 'models', 'downloads', 'scripts', 'audio', 'video', 'apps', 'index',
      'static', 'assets', 'public', 'private', 'node_modules', 'plugin', 'skills', 'llama-server',
      'api-keys', 'chat-completions', 'system-reminder', 'hf-cache', 'localhost', 'https', 'http',
      'systemd', 'service', 'services', 'journalctl', 'system-ctl', 'python', 'javascript',
      'github', 'http-only', 'markdown', 'rw-rw-r', 'rwxrwxrwx', 'unix-permissions', 'dashboard', 'workflow', 'workflows', 'research',
      'project', 'projects', 'session', 'sessions', 'assistant', 'background', 'download',
      'downloads', 'training', 'finetune', 'fine-tuning', 'serverless', 'server', 'servers',
      'pipeline', 'pipelines', 'endpoint', 'endpoints', 'timestamp', 'typescript', 'interfaces']);
    const tally = new Map();
    const bump = (tok, kind) => {
      const lc = tok.toLowerCase();
      if (known.has(lc) || STOP.has(lc) || lc === 'dev') return;
      if (/^(box|proj|ip)-\d+$/.test(lc)) return; // our own mapped aliases, not raw names
      const cur = tally.get(lc) || { n: 0, kind };
      cur.n++; tally.set(lc, cur);
    };
    for (const t of pool) {
      for (const m of t.text.matchAll(/\b([a-z][a-z0-9]*(?:[-_][a-z0-9]+)+)\b/gi)) bump(m[1], 'compound');
      for (const m of t.text.matchAll(/(?:^|[\s`'"=(])\/([a-z][a-z0-9_-]{3,40})\//gm)) bump(m[1], 'path');
    }
    const rows = [...tally.entries()].filter(([, v]) => v.n >= 2).sort((a, b) => b[1].n - a[1].n).slice(0, 25);
    if (!rows.length) return;
    console.log('\n== name-like tokens seen in your texts (NOT mapped — add to gauntlet-redact.json as "name": null if internal) ==');
    for (const [tok, v] of rows) console.log(`  ${String(v.n).padStart(3)}x  ${v.kind.padEnd(9)} ${tok}`);
  }

  stratify(pool) {
    // Two passes: answerable tasks fill the send-set via round-robin across origins;
    // strays only top up whatever is left, same fairness. A shallow box's strays must
    // never displace a deep box's answerable tasks.
    const picked = [];
    // STRAYS NEVER FILL. Observed 2026-09-24: with the strict jev bar the answerable
    // pool shrank below the send-set size, and strays — regex-rejected junk — quietly
    // padded the official file. An honest set of 38 beats a padded set of 60, always.
    // Strays are only ever allowed back with the explicit flag ALLOW_STRAYS=1.
    const tiers = process.env.ALLOW_STRAYS === '1' ? [true, false] : [true];
    for (const tier of tiers) {
      const byOrigin = {};
      for (const t of pool) {
        if (!!t.answerable !== tier) continue;
        if (picked.length >= this.max) break;
        (byOrigin[t.origin] ||= []).push(t);
      }
      for (const arr of Object.values(byOrigin)) arr.sort((x, y) => y.charLen - x.charLen); // substance first
      const names = Object.keys(byOrigin).sort();
      let round = 0;
      while (picked.length < this.max) {
        let any = false;
        for (const n of names) {
          if (byOrigin[n][round]) { picked.push(byOrigin[n][round]); any = true; }
        }
        if (!any) break;
        round++;
      }
    }
    return picked.slice(0, this.max).map((t, i) => ({ id: i + 1, ...t }));
  }

  main() {
    const pool = this.load();
    console.log(`pool: ${pool.length} unique tasks across origins`);
    const tasks = this.stratify(pool);
    const answerable = tasks.filter((t) => t.answerable).length;
    console.log(`picked ${tasks.length} (${answerable} answerable) -> ${this.out}`);
    writeFileSync(this.out, JSON.stringify({ builtAt: new Date().toISOString(), max: this.max, tasks }, null, 2));
    console.log('READ IT AND EDIT BEFORE THE JUDGE RUNS — these exact strings go to the arbiter.');
  }
}

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1]; i++; }
}
const dir = join(homedir(), 'tmp', 'locatesta');
new GauntletMerge({
  dir,
  out: args.out || join(dir, 'gauntlet-tasks.json'),
  max: Number(args.max || process.env.MAXN || 60),
}).main();
