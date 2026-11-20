const http = require('http')
const fs = require('fs')
const path = require('path')
const db = require('./src/main/db')
const gemini = require('./src/main/gemini')

db.init()

const PORT = 3000
const RENDERER_DIR = path.join(__dirname, 'src/renderer')

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
}

function parseJSONBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        resolve({})
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = url.pathname

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json')

    if (pathname === '/api/settings' && req.method === 'GET') {
      return res.end(JSON.stringify(db.getSettings()))
    }
    if (pathname === '/api/settings' && req.method === 'POST') {
      const body = await parseJSONBody(req)
      db.saveSettings(body)
      return res.end(JSON.stringify({ success: true }))
    }
    if (pathname === '/api/mood-history' && req.method === 'GET') {
      return res.end(JSON.stringify(db.getMoodHistory()))
    }
    if (pathname === '/api/mood-history' && req.method === 'POST') {
      const body = await parseJSONBody(req)
      const saved = db.saveMoodEntry(body)
      return res.end(JSON.stringify(saved))
    }
    if (pathname === '/api/dhikr-state' && req.method === 'GET') {
      return res.end(JSON.stringify(db.getDhikrState()))
    }
    if (pathname === '/api/dhikr-state' && req.method === 'POST') {
      const body = await parseJSONBody(req)
      const saved = db.saveDhikrState(body)
      return res.end(JSON.stringify(saved))
    }
    if (pathname === '/api/dhikr-state/reset' && req.method === 'POST') {
      return res.end(JSON.stringify(db.resetDhikrState()))
    }
    if (pathname === '/api/analyze-mood' && req.method === 'POST') {
      const body = await parseJSONBody(req)
      const settings = db.getSettings()
      if (!settings.geminiApiKey) {
        return res.end(JSON.stringify({ error: 'GEMINI_KEY_MISSING' }))
      }
      try {
        const result = await gemini.analyzeMood(body, settings.geminiApiKey)
        return res.end(JSON.stringify({ data: result }))
      } catch (err) {
        return res.end(JSON.stringify({ error: err.message }))
      }
    }

    res.writeHead(404)
    return res.end(JSON.stringify({ error: 'Not Found' }))
  }

  // Static Files
  let filePath = path.join(RENDERER_DIR, pathname === '/' ? 'index.html' : pathname)
  const ext = path.extname(filePath).toLowerCase()

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('File Not Found')
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
      res.end(content)
    }
  })
})

server.listen(PORT, () => {
  console.log(`[Shukarr App] Server running at http://localhost:${PORT}`)
})
