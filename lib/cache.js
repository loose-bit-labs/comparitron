const fs = require('fs')
const path = require('path')

const slug = (s) => s.replace(/[:/]/g, '_')

const responsePath = (dir, scenario, promptId, model) =>
  path.join(dir, 'responses', `${scenario}_${promptId}_${slug(model)}.json`)

const scorePath = (dir, scenario, promptId, candidate, juror) =>
  path.join(dir, 'scores', `${scenario}_${promptId}_${slug(candidate)}_by_${slug(juror)}.json`)

function read(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) } catch { return null }
}

function write(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

module.exports = { responsePath, scorePath, slug, read, write }
