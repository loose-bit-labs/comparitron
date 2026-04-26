#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const config = require('../config')

const scoresDir = path.join(config.resultsDir, 'scores')

const files = fs.readdirSync(scoresDir).filter(f => f.endsWith('.json'))
let removed = 0

for (const file of files) {
  const p = path.join(scoresDir, file)
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'))
    if (data.skipped) {
      fs.unlinkSync(p)
      console.log(`removed: ${file}`)
      removed++
    }
  } catch (e) {
    console.error(`error reading ${file}: ${e.message}`)
  }
}

console.log(`\n${removed} tombstone(s) removed`)
