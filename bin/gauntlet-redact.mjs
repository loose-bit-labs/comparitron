// Shared redaction module for the gauntlet: the ONE chokepoint between raw transcripts
// and anything that leaves the box (classifier, arbiter). One persistent map file means
// box-1 is always the same box, proj-1 the same project, across every message ever sent.
// Map file lives next to the corpora: gauntlet-redact.json. She edits it freely —
// entries are hers; auto-detection only ever ADDS, never removes.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { userInfo } from 'node:os';

export class GauntletRedactor {
  constructor({ mapFile }) {
    this.mapFile = mapFile;
    this.map = existsSync(mapFile)
      ? JSON.parse(readFileSync(mapFile, 'utf8'))
      : { hosts: {}, projects: {}, ips: {}, users: [] };
    for (const k of ['hosts', 'projects', 'ips']) this.map[k] ||= {};
    // "np" = not-a-problem: names the Grafin has explicitly waved through. Never mapped,
    // never reported. Values are ignored — only the keys matter. She owns this section.
    this.np = new Set(Object.keys(this.map.np || {}));
    if (Array.isArray(this.map.np)) for (const n of this.map.np) this.np.add(n);
    // manual entries: she adds "blip": null to the map; the null gets a real assignment
    for (const k of ['hosts', 'projects', 'ips']) {
      const pending = Object.keys(this.map[k]).filter((t) => this.map[k][t] === null);
      if (pending.length) this.assign(k, pending);
    }
    // usernames always map to "dev"; home dirs follow the username
    this.users = new Set([userInfo().username, ...this.map.users].filter(Boolean));
    this.dirty = false;
    this.build();
  }

  assign(kind, tokens) {
    const dict = this.map[kind];
    tokens = (tokens || []).filter((t) => t && !this.np.has(t) && !this.np.has(t.toLowerCase()));
    const prefix = { hosts: 'box-', projects: 'proj-', ips: 'ip-' }[kind];
    for (const token of tokens) {
      if (dict[token]) continue;
      let n = Object.keys(dict).length + 1; // next free suffix, never reuse
      const used = new Set(Object.values(dict));
      while (used.has(prefix + n)) n++;
      dict[token] = prefix + n;
      this.dirty = true;
    }
  }

  // auto-detection entry points (corpus passes what it finds; merge passes origins)
  addHosts(list) {
    const uniq = (list || []).filter((h) => h && /^[a-z][a-z0-9-]{1,30}$/.test(h));
    this.assign('hosts', uniq);
    this.build();
  }

  addProjects(list) {
    const uniq = (list || [])
      .filter((p) => p && p.length >= 3 && !/^[0-9a-f-]{30,}$/.test(p) && !/^\.jsonl?/.test(p));
    this.assign('projects', uniq);
    this.build();
  }

  build() {
    // longest tokens first so 'wan-t5-api' wins over 'wan-t5'
    const mk = (dict) => Object.entries(dict)
      .sort((a, b) => b[0].length - a[0].length)
      .map(([token, sub]) => {
        const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pats = [new RegExp(`\\b${esc}\\b`, 'gi')]; // dash/underscore siblings (wan-t5 <-> wan_t5)
        if (token.includes('-')) pats.push(new RegExp(`\\b${esc.replace(/-/g, '_')}\\b`, 'gi'));
        return { pats, sub };
      });
    this.hostPats = mk(this.map.hosts);
    this.projPats = mk(this.map.projects);
    this.userPats = [...this.users]
      .sort((a, b) => b.length - a.length)
      .map((u) => ({ re: new RegExp(u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), sub: 'dev' }));
  }

  // Usernames hide in paths: /home/<user>/, /Users/<user>/, /userspace/<user>/.
  // Any such segment is a username candidate — mapped to "dev" like every other user.
  userCandidates(text) {
    const out = [];
    for (const m of (text || '').matchAll(/\/(?:home|Users|userspace)\/([a-z0-9._-]{2,})\//gi))
      if (m[1] !== 'dev') out.push(m[1]);
    return out;
  }

  addUsers(list) {
    let changed = false;
    for (const u of list || []) if (u && !this.np.has(u) && !this.users.has(u)) { this.users.add(u); changed = true; }
    if (changed) this.build();
  }

  // Token harvest: find mentions of KNOWN hosts/projects in arbitrary text (including
  // as URL hosts: superack:18081, //blip/). Callers feed this over all candidate text so
  // cross-box mentions get mapped even when the box ran no sessions in that project.
  harvest(text) {
    if (typeof text !== 'string') return [];
    const found = [];
    const pats = [...this.hostPats, ...this.projPats].flatMap(({ pats }) => pats);
    for (const re of pats) for (const m of text.matchAll(new RegExp(re.source, 'gi'))) found.push(m[0]);
    return found;
  }

  redact(text) {
    if (typeof text !== 'string') return text;
    let s = text;
    for (const { re, sub } of this.userPats) s = s.replace(re, sub);
    for (const { pats, sub } of this.hostPats) for (const p of pats) s = s.replace(p, sub);
    for (const { pats, sub } of this.projPats) for (const p of pats) s = s.replace(p, sub);
    s = s.replace(/\b((?:\d{1,3}\.){3}\d{1,3})\b/g, (m) => {
      if (m.startsWith('127.')) return m;
      if (!this.map.ips[m]) { this.map.ips[m] = `ip-${Object.keys(this.map.ips).length + 1}`; this.dirty = true; }
      return this.map.ips[m];
    });
    return s;
  }

  save() {
    const cur = JSON.stringify([...this.users]);
    if (!this.dirty && existsSync(this.mapFile) && JSON.parse(readFileSync(this.mapFile, 'utf8')).users && JSON.stringify(JSON.parse(readFileSync(this.mapFile, 'utf8')).users) === cur) return;
    this.map.users = [...this.users];
    writeFileSync(this.mapFile, JSON.stringify(this.map, null, 2) + '\n');
    this.dirty = false;
  }

  stats() {
    return `hosts=${Object.keys(this.map.hosts).length} projects=${Object.keys(this.map.projects).length} ips=${Object.keys(this.map.ips).length} users=${this.users.size} np=${this.np.size}`;
  }
}
