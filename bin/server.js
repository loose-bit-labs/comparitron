#!/usr/bin/env node
const http = require('node:http')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const { aggregate } = require('../lib/aggregate')
const { latestRunId } = require('../lib/runs')
const leaderboard = require('../lib/leaderboard')

const PUBLIC = path.join(__dirname, '../public')
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/summary') {
    const data = aggregate(config, latestRunId(config))
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify(data))
  }
  if (req.url === '/api/leaderboard') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ rows: leaderboard.read(), hardware: leaderboard.readHardware() }))
  }

  const filePath = path.join(PUBLIC, req.url === '/' ? 'index.html' : req.url)
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end() }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found') }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' })
    res.end(data)
  })
})

const port = config.serverPort
server.listen(port, () => console.log(`[comparitron] http://localhost:${port}`))
