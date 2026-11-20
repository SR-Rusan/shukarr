const { app } = require('electron')
const fs = require('fs')
const path = require('path')

let dataDir

function getDataDir() {
  if (!dataDir) {
    try {
      dataDir = app.getPath('userData')
    } catch {
      dataDir = path.join(__dirname, '../../data')
    }
  }
  return dataDir
}

function readJSON(filename, defaultVal) {
  const filePath = path.join(getDataDir(), filename)
  try {
    if (!fs.existsSync(filePath)) return defaultVal
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return defaultVal
  }
}

function writeJSON(filename, data) {
  const filePath = path.join(getDataDir(), filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

function init() {
  // Ensure userData directory exists
  const dir = getDataDir()
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ── Settings ──────────────────────────────────────────────────────

function getSettings() {
  return readJSON('settings.json', {
    geminiApiKey: '',
    theme: 'dark',
    fajrTime: '04:30',
    notifTimes: {
      morning: '06:00',
      midday: '12:00',
      evening: '18:00',
      night: '00:00'
    },
    notifSound: true
  })
}

function saveSettings(settings) {
  writeJSON('settings.json', settings)
}

// ── Mood History ──────────────────────────────────────────────────

function getMoodHistory() {
  return readJSON('mood_history.json', [])
}

function saveMoodEntry(entry) {
  const history = getMoodHistory()
  const newEntry = {
    ...entry,
    id: Date.now(),
    date: new Date().toISOString()
  }
  history.unshift(newEntry)
  writeJSON('mood_history.json', history)
  return newEntry
}

// ── Dhikr State ───────────────────────────────────────────────────

function getDhikrState() {
  const today = new Date().toDateString()
  const state = readJSON('dhikr_state.json', null)
  if (!state || state.date !== today) {
    return getDefaultDhikrState(today)
  }
  return state
}

function getDefaultDhikrState(dateStr) {
  return {
    date: dateStr || new Date().toDateString(),
    subhanallah: false,
    alhamdulillah: false,
    allahuAkbar: false,
    laIlahaIllallah: false,
    astaghfirullah: false,
    counts: {
      subhanallah: 0,
      alhamdulillah: 0,
      allahuAkbar: 0,
      laIlahaIllallah: 0,
      astaghfirullah: 0
    }
  }
}

function saveDhikrState(state) {
  writeJSON('dhikr_state.json', { ...state, date: new Date().toDateString() })
  return state
}

function resetDhikrState() {
  const fresh = getDefaultDhikrState()
  writeJSON('dhikr_state.json', fresh)
  return fresh
}

// ── Notification History (avoid repeats) ─────────────────────────

function getNotifHistory() {
  return readJSON('notif_history.json', [])
}

function addToNotifHistory(contentId) {
  const history = getNotifHistory()
  history.push({ id: contentId, shownAt: new Date().toISOString() })
  // Keep last 7 days worth (max 200)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const filtered = history.filter(h => new Date(h.shownAt).getTime() > cutoff)
  writeJSON('notif_history.json', filtered.slice(-200))
}

function wasRecentlyShown(contentId) {
  return getNotifHistory().some(h => h.id === contentId)
}

module.exports = {
  init,
  getSettings,
  saveSettings,
  getMoodHistory,
  saveMoodEntry,
  getDhikrState,
  saveDhikrState,
  resetDhikrState,
  getNotifHistory,
  addToNotifHistory,
  wasRecentlyShown
}
