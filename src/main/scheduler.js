const schedule = require('node-schedule')
const { Notification } = require('electron')
const path = require('path')
const fs = require('fs')

let quranPool = []
let hadithPool = []
let mainWindow = null
let db = null
let jobs = []

function loadPools() {
  const assetsPath = path.join(__dirname, '../../assets')
  try {
    quranPool = JSON.parse(fs.readFileSync(path.join(assetsPath, 'quran_pool.json'), 'utf8'))
    hadithPool = JSON.parse(fs.readFileSync(path.join(assetsPath, 'hadith_pool.json'), 'utf8'))
  } catch (e) {
    console.error('Failed to load quote pools:', e.message)
  }
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h, minute: m }
}

function cancelJobs() {
  jobs.forEach(j => j && j.cancel())
  jobs = []
}

function scheduleAll(settings) {
  cancelJobs()
  const { notifTimes, fajrTime } = settings

  const t = notifTimes || {}
  const morning  = parseTime(t.morning  || '06:00')
  const midday   = parseTime(t.midday   || '12:00')
  const evening  = parseTime(t.evening  || '18:00')
  const night    = parseTime(t.night    || '00:00')
  const fajr     = parseTime(fajrTime   || '04:30')

  // 6 AM — Quran (morning)
  jobs.push(schedule.scheduleJob(
    { hour: morning.hour, minute: morning.minute },
    () => sendQuranNotif('morning')
  ))

  // 12 PM — Hadith
  jobs.push(schedule.scheduleJob(
    { hour: midday.hour, minute: midday.minute },
    () => sendHadithNotif()
  ))

  // 6 PM — Quran (evening)
  jobs.push(schedule.scheduleJob(
    { hour: evening.hour, minute: evening.minute },
    () => sendQuranNotif('evening')
  ))

  // 12 AM — Hadith
  jobs.push(schedule.scheduleJob(
    { hour: night.hour, minute: night.minute },
    () => sendHadithNotif()
  ))

  // Fajr reset (default 4:30 AM BD)
  jobs.push(schedule.scheduleJob(
    { hour: fajr.hour, minute: fajr.minute },
    () => resetDhikr()
  ))
}

function init(window, dbInstance) {
  mainWindow = window
  db = dbInstance
  loadPools()
  const settings = db.getSettings()
  scheduleAll(settings)
}

function reschedule(settings) {
  scheduleAll(settings)
}

function getRandomQuote(pool, category) {
  let source = category
    ? pool.filter(q => (q.category === category || q.time === category))
    : pool

  if (!source.length) source = pool

  // Avoid recent repeats
  const recentIds = db ? db.getNotifHistory().map(h => h.id) : []
  const fresh = source.filter(q => !recentIds.includes(q.id))
  const finalPool = fresh.length > 0 ? fresh : source

  return finalPool[Math.floor(Math.random() * finalPool.length)]
}

function sendQuranNotif(timeOfDay) {
  const verse = getRandomQuote(quranPool, timeOfDay)
  if (!verse) return

  const emojis = { morning: '🌅', evening: '🌙' }
  const titles = { morning: 'Morning Reminder', evening: 'Evening Reminder' }

  const body = verse.english_translation.length > 100
    ? verse.english_translation.substring(0, 97) + '...'
    : verse.english_translation

  const notif = new Notification({
    title: `${titles[timeOfDay]} ${emojis[timeOfDay]}`,
    body,
    silent: false
  })

  notif.on('click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('show-quote', { type: 'quran', data: verse })
    }
  })

  notif.show()
  if (db) db.addToNotifHistory(verse.id)
}

function sendHadithNotif() {
  const hadith = getRandomQuote(hadithPool, null)
  if (!hadith) return

  const body = hadith.english.length > 100
    ? hadith.english.substring(0, 97) + '...'
    : hadith.english

  const notif = new Notification({
    title: 'Hadith Reminder 📖',
    body,
    silent: false
  })

  notif.on('click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('show-quote', { type: 'hadith', data: hadith })
    }
  })

  notif.show()
  if (db) db.addToNotifHistory(hadith.id)
}

function resetDhikr() {
  if (db) {
    const fresh = db.resetDhikrState()
    if (mainWindow) {
      mainWindow.webContents.send('dhikr-reset', fresh)
    }
  }
}

module.exports = {
  init,
  reschedule,
  getRandomQuote: (type) => {
    if (type === 'quran') return getRandomQuote(quranPool, null)
    return getRandomQuote(hadithPool, null)
  }
}
