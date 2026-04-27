const fs = require('fs')
const path = require('path')
const config = require('../config')
const { aggregate } = require('./aggregate')
const { readMeta, latestRunId } = require('./runs')

function run(runId) {
  const resolvedRunId = runId || latestRunId(config)
  const data = aggregate(config, resolvedRunId)
  if (!data.scoreCount) { console.log('[report-html] no scores yet'); return }

  const meta = resolvedRunId ? readMeta(config, resolvedRunId) : null
  const title = `Comparitron — ${resolvedRunId || 'latest'}`
  const hardware = meta ? `${meta.hardware.host} — ${meta.hardware.gpu}` : config.hardware?.tag || ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { --bg: #0f1117; --surface: #1a1d27; --border: #2a2d3a; --text: #e2e4ed; --dim: #6b7280; --green: #4ade80; --yellow: #facc15; --red: #f87171; --blue: #60a5fa; --accent: #818cf8; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; padding: 24px; }
  h1 { font-size: 20px; color: var(--accent); margin-bottom: 4px; }
  .meta { color: var(--dim); font-size: 12px; margin-bottom: 24px; }
  .controls { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; gap: 32px; flex-wrap: wrap; }
  .control-group { display: flex; flex-direction: column; gap: 8px; }
  .control-group h3 { font-size: 11px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.08em; }
  .slider-row { display: flex; align-items: center; gap: 8px; }
  .slider-row label { width: 130px; font-size: 12px; color: var(--text); }
  .slider-row input[type=range] { width: 120px; accent-color: var(--accent); }
  .slider-row .val { width: 28px; text-align: right; color: var(--accent); font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: var(--surface); color: var(--dim); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 10px; text-align: right; white-space: nowrap; cursor: pointer; user-select: none; border-bottom: 1px solid var(--border); }
  th:first-child { text-align: left; }
  th.sorted-asc::after { content: ' ↑'; color: var(--accent); }
  th.sorted-desc::after { content: ' ↓'; color: var(--accent); }
  td { padding: 7px 10px; text-align: right; border-bottom: 1px solid var(--border); white-space: nowrap; }
  td:first-child { text-align: left; color: var(--text); }
  tr:hover td { background: var(--surface); }
  .green { color: var(--green); }
  .yellow { color: var(--yellow); }
  .red { color: var(--red); }
  .dim { color: var(--dim); }
  .rank { color: var(--dim); font-size: 11px; width: 24px; display: inline-block; }
  .bias-warn { color: var(--yellow); }
  .incomplete { color: var(--dim); font-size: 11px; }
  .maxscore { color: var(--dim); font-size: 11px; margin-bottom: 8px; }
</style>
</head>
<body>
<h1>COMPARITRON</h1>
<div class="meta">${hardware}${meta ? ` &nbsp;·&nbsp; ${new Date(meta.date).toLocaleDateString()} &nbsp;·&nbsp; ${data.responseCount} responses &nbsp;·&nbsp; ${data.scoreCount} scores` : ''}</div>

<div class="controls">
  <div class="control-group">
    <h3>Scenario Weights</h3>
    ${data.scenarios.map(sc => `
    <div class="slider-row">
      <label>${sc}</label>
      <input type="range" min="0" max="5" step="0.5" value="${data.scenarioWeights[sc] ?? 1}" data-scenario="${sc}" class="scenario-weight">
      <span class="val" id="sw-${sc}">${data.scenarioWeights[sc] ?? 1}</span>
    </div>`).join('')}
  </div>
  <div class="control-group">
    <h3>Dimension Weights</h3>
    ${Object.entries(data.weights).map(([dim, w]) => `
    <div class="slider-row">
      <label>${dim.replace(/_/g, ' ')}</label>
      <input type="range" min="0" max="16" step="1" value="${w}" data-dim="${dim}" class="dim-weight">
      <span class="val" id="dw-${dim}">${w}</span>
    </div>`).join('')}
  </div>
</div>

<div class="maxscore" id="maxscore-label">Max score: ${data.maxScore}</div>
<table id="leaderboard">
  <thead>
    <tr>
      <th data-col="model">Model</th>
      <th data-col="score">Score</th>
      <th data-col="speed">t/s</th>
      ${data.scenarios.map(sc => `<th data-col="sc_${sc}">${sc.slice(0,9)}</th>`).join('')}
      <th data-col="votes">Votes</th>
      <th data-col="delta">Self Δ</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>

<script>
const RAW = ${JSON.stringify({ rows: data.rows, scenarios: data.scenarios, maxVotesPerScene: data.maxVotesPerScene }, null, 0)};

let weights = ${JSON.stringify(data.weights)};
let scenarioWeights = ${JSON.stringify(data.scenarioWeights)};
let sortCol = 'score';
let sortDir = -1;

function computeScore(row) {
  const maxScore = Object.values(weights).reduce((a,b) => a+b, 0) * 5;
  const sceneCols = RAW.scenarios.map((sc, si) => {
    const sd = row.sceneDims[si];
    if (!sd) return null;
    const ws = Object.entries(weights).reduce((t, [d, w]) => t + (sd[d] ?? 0) * w, 0);
    return ws;
  });
  const items = sceneCols.map((s, i) => s != null ? { score: s, weight: scenarioWeights[RAW.scenarios[i]] ?? 1 } : null).filter(Boolean);
  if (!items.length) return { score: null, sceneCols, maxScore };
  const totalW = items.reduce((s,i) => s + i.weight, 0);
  const score = totalW ? items.reduce((s,i) => s + i.score * i.weight, 0) / totalW : null;
  return { score, sceneCols, maxScore };
}

function scoreColor(v, max) {
  if (v == null) return 'dim';
  const r = v / max;
  if (r >= 0.9) return 'green';
  if (r >= 0.7) return 'yellow';
  return 'red';
}

function fmt(v) { return v != null ? v.toFixed(1) : '—'; }

function render() {
  const maxScore = Object.values(weights).reduce((a,b) => a+b, 0) * 5;
  document.getElementById('maxscore-label').textContent = 'Max score: ' + maxScore;

  const rows = RAW.rows.map(r => {
    const { score, sceneCols } = computeScore(r);
    return { ...r, score, sceneCols };
  });

  rows.sort((a, b) => {
    let av, bv;
    if (sortCol === 'model') { av = a.model; bv = b.model; return sortDir * (av < bv ? -1 : av > bv ? 1 : 0); }
    if (sortCol === 'score') { av = a.score; bv = b.score; }
    else if (sortCol === 'speed') { av = a.avgSpeed; bv = b.avgSpeed; }
    else if (sortCol === 'votes') { av = a.votes; bv = b.votes; }
    else if (sortCol === 'delta') { av = a.delta; bv = b.delta; }
    else if (sortCol.startsWith('sc_')) {
      const si = RAW.scenarios.indexOf(sortCol.slice(3));
      av = a.sceneCols[si]; bv = b.sceneCols[si];
    }
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return sortDir * (bv - av);
  });

  const tbody = document.getElementById('tbody');
  tbody.innerHTML = rows.map((r, i) => {
    const sc = scoreColor(r.score, maxScore);
    const delta = r.delta != null ? (r.delta >= 0 ? '+' : '') + r.delta.toFixed(1) : '—';
    const deltaCls = r.delta != null && Math.abs(r.delta) > 0.5 ? 'bias-warn' : 'dim';
    const sceneTds = RAW.scenarios.map((scenario, si) => {
      const v = r.sceneCols[si];
      const cls = scoreColor(v, maxScore);
      const flag = (r.sceneVotes?.[si] ?? 0) < RAW.maxVotesPerScene ? '<span class="incomplete">*</span>' : '';
      return \`<td class="\${cls}">\${fmt(v)}\${flag}</td>\`;
    });
    return \`<tr>
      <td><span class="rank">\${i+1}.</span> \${r.model}</td>
      <td class="\${sc}">\${fmt(r.score)}</td>
      <td class="dim">\${r.avgSpeed ?? '—'}</td>
      \${sceneTds.join('')}
      <td class="dim">\${r.votes}</td>
      <td class="\${deltaCls}">\${delta}</td>
    </tr>\`;
  }).join('');

  document.querySelectorAll('th').forEach(th => {
    th.classList.remove('sorted-asc','sorted-desc');
    if (th.dataset.col === sortCol) th.classList.add(sortDir === -1 ? 'sorted-desc' : 'sorted-asc');
  });
}

document.getElementById('leaderboard').querySelector('thead').addEventListener('click', e => {
  const th = e.target.closest('th');
  if (!th) return;
  const col = th.dataset.col;
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = col === 'model' ? 1 : -1; }
  render();
});

document.querySelectorAll('.scenario-weight').forEach(el => {
  el.addEventListener('input', () => {
    scenarioWeights[el.dataset.scenario] = parseFloat(el.value);
    document.getElementById('sw-' + el.dataset.scenario).textContent = el.value;
    render();
  });
});

document.querySelectorAll('.dim-weight').forEach(el => {
  el.addEventListener('input', () => {
    weights[el.dataset.dim] = parseInt(el.value);
    document.getElementById('dw-' + el.dataset.dim).textContent = el.value;
    render();
  });
});

render();
</script>
</body>
</html>`;

  const outDir = path.join('docs', 'reports')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `${resolvedRunId || 'report'}.html`)
  fs.writeFileSync(outPath, html)
  console.log(`[report-html] saved → ${outPath}`)
}

module.exports = { run }
