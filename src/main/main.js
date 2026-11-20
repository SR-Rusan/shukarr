const { app, BrowserWindow, ipcMain, Notification, nativeTheme, shell } = require('electron')
const path = require('path')

let mainWindow
let db, scheduler, geminiService

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 620,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#1C1A17',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  })

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  db = require('./db')
  db.init()

  createWindow()

  // Delay scheduler init so mainWindow is ready
  setTimeout(() => {
    scheduler = require('./scheduler')
    geminiService = require('./gemini')
    scheduler.init(mainWindow, db)
  }, 1000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC Handlers ──────────────────────────────────────────────────

ipcMain.handle('get-settings', () => db.getSettings())

ipcMain.handle('save-settings', (_, settings) => {
  db.saveSettings(settings)
  // Reschedule notifications if times changed
  if (scheduler) scheduler.reschedule(settings)
  return true
})

ipcMain.handle('get-mood-history', () => db.getMoodHistory())

ipcMain.handle('save-mood-entry', (_, entry) => db.saveMoodEntry(entry))

ipcMain.handle('get-dhikr-state', () => db.getDhikrState())

ipcMain.handle('save-dhikr-state', (_, state) => db.saveDhikrState(state))

ipcMain.handle('reset-dhikr-state', () => db.resetDhikrState())

ipcMain.handle('analyze-mood', async (_, answers) => {
  const settings = db.getSettings()
  if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
    return { error: 'GEMINI_KEY_MISSING' }
  }
  try {
    const result = await geminiService.analyzeMood(answers, settings.geminiApiKey.trim())
    return { data: result }
  } catch (err) {
    console.error('[Shukarr] Gemini error:', err.message)
    return { error: err.message }
  }
})

ipcMain.handle('get-random-quote', (_, type) => {
  if (scheduler) return scheduler.getRandomQuote(type)
  return null
})

ipcMain.handle('get-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})
