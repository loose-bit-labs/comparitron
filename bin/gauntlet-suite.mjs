#!/usr/bin/env node
// Gauntlet suite passage: append comparitron's capability suites to the send-set as a
// second, REPEATABLE track. The transcript tasks are moments that already passed and can
// never be re-run; these 28 prompts live in git, so a brain that does not exist yet can be
// dropped into the same scoreboard next winter.
//
// Idempotent: existing kind='suite' tasks are dropped and re-appended, so it can be re-run
// after harhar.sh rebuilds the send-set. Ids continue numerically after the transcript tasks
// so nothing downstream (flip seed, qids) needs to know two passages exist.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import { GauntletRedactor } from './gauntlet-redact.mjs';

class GauntletSuite {
  constructor({ tasksFile, suiteDir, mapFile }) {
    this.tasksFile = tasksFile;
    this.suiteDir = suiteDir;
    this.mapFile = mapFile;
  }

  loadSuites() {
    const out = [];
    for (const f of readdirSync(this.suiteDir).filter((n) => n.endsWith('.json')).sort()) {
      const cap = basename(f, '.json');
      let items;
      try { items = JSON.parse(readFileSync(join(this.suiteDir, f), 'utf8')); } catch (e) { console.log(`skip ${f}: ${e.message}`); continue; }
      if (!Array.isArray(items)) { console.log(`skip ${f}: not a list`); continue; }
      for (const it of items) {
        if (!it.prompt) { console.log(`skip ${f} entry ${it.id}: no prompt`); continue; }
        out.push({
          capability: cap,
          suiteId: it.id,
          text: it.prompt,
          rubric: it.evalHint || '',
          // ground truth is a strong prior, not a verdict: the arbiter sees it and judges
          // agreement, it never over-rides the answer in front of it. A string check could
          // not be trusted here — half these answers are bare numbers inside prose.
          groundTruth: it.answer || null,
        });
      }
      console.log(`${f}: ${items.length} items`);
    }
    return out;
  }

  main() {
    if (!existsSync(this.tasksFile)) { console.error(`FATAL: no send-set at ${this.tasksFile} — run the merge first`); process.exit(2); }
    const official = JSON.parse(readFileSync(this.tasksFile, 'utf8'));
    const transcripts = (official.tasks || []).filter((t) => t.kind !== 'suite');
    const dropped = (official.tasks || []).length - transcripts.length;
    if (dropped) console.log(`replacing ${dropped} previously appended suite tasks`);

    const suites = this.loadSuites();
    // same chokepoint as everything else — idempotent, and it keeps the send-set a single
    // redaction story no matter which passage a task came from
    const redactor = new GauntletRedactor({ mapFile: this.mapFile });
    const tasks = suites.map((s, i) => {
      const t = {
        id: transcripts.length + i + 1,
        kind: 'suite',
        text: redactor.redact(s.text),
        rubric: redactor.redact(s.rubric),
        groundTruth: s.groundTruth ? redactor.redact(s.groundTruth) : null,
        capability: s.capability,
        suiteId: s.suiteId,
        context: '',
        project: `suite:${s.capability}`,
        charLen: redactor.redact(s.text).length,
        ctxLen: 0,
        answerable: true,
        origin: 'suite',
      };
      return t;
    });
    redactor.save();

    const withSuites = [...transcripts.map((t) => ({ kind: 'transcript', ...t })), ...tasks];
    writeFileSync(this.tasksFile, JSON.stringify({ ...official, suitesAt: new Date().toISOString(), suiteDir: this.suiteDir, tasks: withSuites }, null, 2));
    const nExact = tasks.filter((t) => t.groundTruth).length;
    console.log(`send-set: ${transcripts.length} transcript tasks + ${tasks.length} suite items (${nExact} with ground truth) -> ${this.tasksFile}`);
    console.log('READ IT AND EDIT BEFORE THE JUDGE RUNS — these exact strings go to the arbiter.');
  }
}

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1]; i++; }
}
const dir = join(homedir(), 'tmp', 'locatesta');
new GauntletSuite({
  tasksFile: args.tasks || join(dir, 'gauntlet-tasks.json'),
  suiteDir: args.suiteDir || join(homedir(), 'src', 'me', 'comparitron', 'capabilities'),
  mapFile: args.map || join(dir, 'gauntlet-redact.json'),
}).main();
