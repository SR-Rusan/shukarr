const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('shukarr', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Mood
  getMoodHistory: () => ipcRenderer.invoke('get-mood-history'),
  saveMoodEntry: (entry) => ipcRenderer.invoke('save-mood-entry', entry),
  analyzeMood: (answers) => ipcRenderer.invoke('analyze-mood', answers),

  // Dhikr
  getDhikrState: () => ipcRenderer.invoke('get-dhikr-state'),
  saveDhikrState: (state) => ipcRenderer.invoke('save-dhikr-state', state),
  resetDhikrState: () => ipcRenderer.invoke('reset-dhikr-state'),

  // Quotes
  getRandomQuote: (type) => ipcRenderer.invoke('get-random-quote', type),

  // Theme
  getTheme: () => ipcRenderer.invoke('get-theme'),

  // Listen for main-process events
  onShowQuote: (callback) => ipcRenderer.on('show-quote', (_, data) => callback(data)),
  onDhikrReset: (callback) => ipcRenderer.on('dhikr-reset', (_, data) => callback(data))
})
