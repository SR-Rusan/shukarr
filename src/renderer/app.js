/* ─────────────────────────────────────────────────
   SHUKARR  –  Renderer / App Logic
   ───────────────────────────────────────────────── */

'use strict'

const api = window.shukarr || {
  getSettings: () => fetch('/api/settings').then(res => res.json()),
  saveSettings: (s) => fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }).then(res => res.json()),
  getMoodHistory: () => fetch('/api/mood-history').then(res => res.json()),
  saveMoodEntry: (e) => fetch('/api/mood-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) }).then(res => res.json()),
  analyzeMood: (a) => fetch('/api/analyze-mood', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(a) }).then(res => res.json()),
  getDhikrState: () => fetch('/api/dhikr-state').then(res => res.json()),
  saveDhikrState: (s) => fetch('/api/dhikr-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }).then(res => res.json()),
  resetDhikrState: () => fetch('/api/dhikr-state/reset', { method: 'POST' }).then(res => res.json()),
  getRandomQuote: (t) => fetch('/api/quote?type=' + t).then(res => res.json()),
  getTheme: () => Promise.resolve('dark'),
  onShowQuote: () => {},
  onDhikrReset: () => {}
}

// ── State ──────────────────────────────────────────
let currentView = 'home'
let settings    = {}
let dhikrState  = {}
let moodAnswers = { q1: '', q2: '', q3: '', note: '' }
let currentStep = 1
let activeCounter = null   // which dhikr is being counted
let activeCounterKey = null

// ── Dhikr Data ─────────────────────────────────────
const DHIKR_ITEMS = [
  {
    key: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    latin: 'SubhanAllah',
    meaning: 'Glory be to Allah'
  },
  {
    key: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    latin: 'Alhamdulillah',
    meaning: 'Praise be to Allah'
  },
  {
    key: 'allahuAkbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    latin: 'Allahu Akbar',
    meaning: 'Allah is the Greatest'
  },
  {
    key: 'laIlahaIllallah',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    latin: 'Lā ilāha illallāh',
    meaning: 'There is no god but Allah'
  },
  {
    key: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    latin: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah'
  }
]

// ── Mood Questions ─────────────────────────────────
const MOOD_QUESTIONS = [
  {
    step: 1,
    question: 'How would you describe your overall mood right now?',
    options: [
      { emoji: '😌', label: 'Calm & Content' },
      { emoji: '😔', label: 'Sad or Low' },
      { emoji: '😰', label: 'Anxious or Worried' },
      { emoji: '😤', label: 'Frustrated or Angry' },
      { emoji: '😶', label: 'Empty or Lost' },
      { emoji: '🙏', label: 'Grateful & at peace' }
    ]
  },
  {
    step: 2,
    question: 'What\'s weighing on your heart the most?',
    options: [
      { emoji: '📚', label: 'Work or Study pressure' },
      { emoji: '👨‍👩‍👧', label: 'Family or relationships' },
      { emoji: '💔', label: 'Health concerns' },
      { emoji: '🌙', label: 'Feeling distant from Allah' },
      { emoji: '🕊️', label: 'Grief or loss' },
      { emoji: '🌀', label: 'Uncertainty about the future' }
    ]
  },
  {
    step: 3,
    question: 'What do you need most right now?',
    options: [
      { emoji: '🤗', label: 'Comfort and reassurance' },
      { emoji: '💪', label: 'Motivation to keep going' },
      { emoji: '🌿', label: 'Reminder of gratitude' },
      { emoji: '⚡', label: 'Strength and patience' },
      { emoji: '🌟', label: 'A sign I\'m on the right path' },
      { emoji: '🤲', label: 'Something to make dua for' }
    ]
  }
]

// ── Init ───────────────────────────────────────────
async function init() {
  settings = await api.getSettings()
  dhikrState = await api.getDhikrState()

  applyTheme(settings.theme || 'dark')
  updateGreeting()
  renderDhikrMini()
  renderDhikrFull()
  setupNavigation()
  setupDhikrCounter()
  setupSettings()
  setupNotificationListener()

  // Time-based greeting refresh
  setInterval(updateGreeting, 60000)
}

// ── Theme ──────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const toggle = document.getElementById('settings-theme-toggle')
  if (toggle) {
    toggle.classList.toggle('on', theme === 'dark')
  }
}

// ── Greeting ───────────────────────────────────────
function updateGreeting() {
  const h = new Date().getHours()
  let msg = 'Assalamu Alaikum'
  if (h >= 4  && h < 12) msg = 'Assalamu Alaikum — Good Morning 🌅'
  if (h >= 12 && h < 17) msg = 'Assalamu Alaikum — Good Afternoon ☀️'
  if (h >= 17 && h < 21) msg = 'Assalamu Alaikum — Good Evening 🌙'
  if (h >= 21 || h < 4)  msg = 'Assalamu Alaikum — Good Night ⭐'
  const el = document.getElementById('home-greeting')
  if (el) el.textContent = msg
}

// ── Navigation ─────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view
      if (target === 'mood') {
        startMoodCheckin()
      } else {
        switchView(target)
      }
    })
  })

  document.getElementById('btn-mood-checkin').addEventListener('click', startMoodCheckin)
  document.getElementById('btn-view-dhikr').addEventListener('click', () => switchView('dhikr'))
  document.getElementById('btn-back-from-quote').addEventListener('click', () => switchView('home'))
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))

  const view = document.getElementById(`view-${viewId}`)
  if (view) view.classList.add('active')

  const btn = document.querySelector(`.nav-btn[data-view="${viewId}"]`)
  if (btn) btn.classList.add('active')

  currentView = viewId

  // Lazy-load views
  if (viewId === 'history') renderHistory()
  if (viewId === 'dhikr') renderDhikrFull()
  if (viewId === 'settings') populateSettings()
}

// ── Mood Flow ──────────────────────────────────────
function startMoodCheckin() {
  moodAnswers = { q1: '', q2: '', q3: '', note: '' }
  currentStep = 1
  renderMoodStep(1)
  switchView('mood')
}

function renderMoodStep(step) {
  const q = MOOD_QUESTIONS[step - 1]
  const container = document.getElementById('mood-step-container')

  const dotsHTML = [1,2,3].map(i => {
    let cls = 'mood-dot'
    if (i < step)  cls += ' done'
    if (i === step) cls += ' active'
    return `<div class="${cls}"></div>`
  }).join('')

  const optionsHTML = q.options.map((opt, i) => `
    <button class="mood-option" data-idx="${i}" data-label="${opt.label}">
      <span class="mood-option-emoji">${opt.emoji}</span>
      ${opt.label}
    </button>
  `).join('')

  container.innerHTML = `
    <div class="mood-progress">${dotsHTML}</div>
    <p class="mood-step-num">Question ${step} of 3</p>
    <h2 class="mood-question">${q.question}</h2>
    <div class="mood-options">${optionsHTML}</div>
    <div class="mood-note-wrap">
      <div class="mood-note-label">Or describe in your own words...</div>
      <textarea class="mood-textarea" id="mood-note-input"
                placeholder="Type how you're feeling..." rows="3"></textarea>
    </div>
    <div class="mood-nav">
      ${step > 1 ? '<button class="btn-ghost" id="mood-back">← Back</button>' : '<span></span>'}
      <button class="btn-primary" id="mood-next">${step < 3 ? 'Next →' : 'Find my verse'}</button>
    </div>
  `

  // Option select
  container.querySelectorAll('.mood-option').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.mood-option').forEach(b => b.classList.remove('selected'))
      btn.classList.add('selected')
    })
  })

  // Back
  if (step > 1) {
    document.getElementById('mood-back').addEventListener('click', () => {
      currentStep--
      renderMoodStep(currentStep)
    })
  }

  // Next
  document.getElementById('mood-next').addEventListener('click', () => {
    const selected = container.querySelector('.mood-option.selected')
    const note = document.getElementById('mood-note-input').value.trim()

    if (!selected && !note) {
      showToast('Please select an option or write something 🙏')
      return
    }

    const answerVal = selected ? selected.dataset.label : note
    moodAnswers[`q${step}`] = answerVal
    if (note) moodAnswers.note = note

    if (step < 3) {
      currentStep++
      renderMoodStep(currentStep)
    } else {
      submitMoodAnswers()
    }
  })
}

async function submitMoodAnswers() {
  switchView('loading')

  try {
    const result = await api.analyzeMood(moodAnswers)

    // Handle error object returned from main process
    if (result && result.error) {
      if (result.error === 'GEMINI_KEY_MISSING') {
        showToast('⚠️ Please add your Gemini API key in Settings')
        switchView('settings')
        populateSettings()
        document.getElementById('settings-api-key').focus()
      } else {
        showToast(`AI Error: ${result.error}`)
        switchView('mood')
        renderMoodStep(3)
      }
      return
    }

    const item = result.data
    renderVerseResult(item)
    // Save to history
    const isHadith = item.type === 'hadith'
    await api.saveMoodEntry({
      q1: moodAnswers.q1,
      q2: moodAnswers.q2,
      q3: moodAnswers.q3,
      note: moodAnswers.note,
      type: isHadith ? 'hadith' : 'quran',
      verseRef: isHadith ? item.source : `${item.surah_number}:${item.ayah_number}`,
      verseSurah: isHadith ? `${item.source} · ${item.narrator}` : item.surah_name_english,
      verseArabic: item.arabic_text,
      verseTranslation: item.english_translation,
      moodLabel: moodAnswers.q1
    })
    switchView('verse')
  } catch (err) {
    console.error(err)
    showToast(`Error: ${err.message || 'Unknown error'}`)
    switchView('mood')
    renderMoodStep(3)
  }
}

function renderVerseResult(item) {
  const isHadith = item.type === 'hadith'

  if (isHadith) {
    document.getElementById('verse-surah-ref').innerHTML =
      `<span>📖 Hadith — ${item.source || ''}</span>${item.narrator ? ` · Narrated by ${item.narrator}` : ''}`
  } else {
    document.getElementById('verse-surah-ref').innerHTML =
      `<span>${item.surah_name_arabic || ''} — ${item.surah_name_english || ''}</span> · ${item.surah_number || ''}:${item.ayah_number || ''}`
  }

  document.getElementById('verse-arabic').textContent = item.arabic_text || ''
  document.getElementById('verse-transliteration').textContent = item.transliteration || ''
  document.getElementById('verse-english').textContent = `"${item.english_translation || ''}"` 
  document.getElementById('verse-reflection').textContent = item.brief_reflection || ''

  document.getElementById('btn-save-verse').onclick = () => showToast('✓ Saved to history')
  document.getElementById('btn-new-checkin').onclick = () => startMoodCheckin()
}

// ── Dhikr Mini (Home) ──────────────────────────────
function renderDhikrMini() {
  const list = document.getElementById('dhikr-mini-list')
  const progress = document.getElementById('dhikr-mini-progress')

  const done = DHIKR_ITEMS.filter(d => dhikrState[d.key]).length
  progress.textContent = `${done}/5`

  list.innerHTML = DHIKR_ITEMS.map(d => `
    <div class="dhikr-mini-item ${dhikrState[d.key] ? 'done' : ''}">
      <div class="dhikr-checkbox">
        ${dhikrState[d.key] ? '<span class="dhikr-check-icon">✓</span>' : ''}
      </div>
      <span class="dhikr-arabic-mini">${d.arabic}</span>
      <span class="dhikr-latin-mini">${d.latin}</span>
    </div>
  `).join('')
}

// ── Dhikr Full View ────────────────────────────────
function renderDhikrFull() {
  const list = document.getElementById('dhikr-full-list')
  const info = document.getElementById('dhikr-reset-info')
  if (info && settings.fajrTime) {
    info.textContent = `Resets at Fajr (${settings.fajrTime}) · Tap to count`
  }

  list.innerHTML = DHIKR_ITEMS.map(d => {
    const count = (dhikrState.counts && dhikrState.counts[d.key]) || 0
    const done = dhikrState[d.key] || false
    return `
    <div class="dhikr-item ${done ? 'completed' : ''}" data-key="${d.key}">
      <div class="dhikr-check">${done ? '✓' : ''}</div>
      <div class="dhikr-item-body">
        <div class="dhikr-arabic">${d.arabic}</div>
        <div class="dhikr-latin">${d.latin}</div>
        <div class="dhikr-meaning">${d.meaning}</div>
      </div>
      <div class="dhikr-count-badge">${count}/100</div>
    </div>
  `}).join('')

  list.querySelectorAll('.dhikr-item').forEach(item => {
    item.addEventListener('click', () => openCounter(item.dataset.key))
  })
}

// ── Dhikr Counter ──────────────────────────────────
function setupDhikrCounter() {
  const tapBtn   = document.getElementById('counter-tap-btn')
  const closeBtn = document.getElementById('counter-close-btn')
  const overlay  = document.getElementById('counter-overlay')

  tapBtn.addEventListener('click', () => {
    if (!activeCounterKey) return
    const counts = dhikrState.counts || {}
    const current = counts[activeCounterKey] || 0
    if (current >= 100) return

    const next = current + 1
    counts[activeCounterKey] = next
    dhikrState.counts = counts

    if (next >= 100) {
      dhikrState[activeCounterKey] = true
    }

    updateCounterUI(next)
    saveAndRefreshDhikr()

    // Pulse animation
    tapBtn.classList.remove('pulse')
    void tapBtn.offsetWidth
    tapBtn.classList.add('pulse')
  })

  closeBtn.addEventListener('click', closeCounter)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCounter()
  })
}

function openCounter(key) {
  const item = DHIKR_ITEMS.find(d => d.key === key)
  if (!item) return

  activeCounterKey = key
  const count = (dhikrState.counts && dhikrState.counts[key]) || 0

  document.getElementById('counter-arabic').textContent = item.arabic
  document.getElementById('counter-latin').textContent = item.latin
  updateCounterUI(count)

  document.getElementById('counter-overlay').classList.add('open')
}

function updateCounterUI(count) {
  document.getElementById('counter-num').textContent = count

  // Ring: circumference of r=54 circle ≈ 339.3
  const circumference = 2 * Math.PI * 54
  const filled = (count / 100) * circumference
  const ring = document.getElementById('counter-ring-fill')
  ring.style.strokeDasharray = `${filled} ${circumference}`

  const completeMsg = document.getElementById('counter-complete-msg')
  const tapBtn = document.getElementById('counter-tap-btn')

  if (count >= 100) {
    completeMsg.style.display = 'block'
    tapBtn.disabled = true
    tapBtn.style.opacity = '0.4'
  } else {
    completeMsg.style.display = 'none'
    tapBtn.disabled = false
    tapBtn.style.opacity = '1'
  }
}

function closeCounter() {
  document.getElementById('counter-overlay').classList.remove('open')
  activeCounterKey = null
}

async function saveAndRefreshDhikr() {
  await api.saveDhikrState(dhikrState)
  renderDhikrFull()
  renderDhikrMini()
}

// ── History ────────────────────────────────────────
async function renderHistory() {
  const list = document.getElementById('history-list')
  const history = await api.getMoodHistory()

  if (!history.length) {
    list.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">📜</div>
        <p>No check-ins yet.</p>
        <p style="margin-top:4px; font-size:12px">Start your first mood check-in to see your journey.</p>
      </div>`
    return
  }

  list.innerHTML = history.map(entry => {
    const date = new Date(entry.date)
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    return `
    <div class="history-item">
      <div class="history-item-header">
        <span class="history-date">${dateStr}</span>
        <span class="history-mood-pill">${entry.moodLabel || entry.q1}</span>
      </div>
      <div class="history-verse-arabic">${entry.verseArabic || ''}</div>
      <div class="history-verse-ref">${entry.verseSurah || ''} · ${entry.verseRef || ''}</div>
    </div>`
  }).join('')
}

// ── Settings ───────────────────────────────────────
function populateSettings() {
  document.getElementById('settings-api-key').value     = settings.geminiApiKey || ''
  document.getElementById('settings-notif-morning').value = settings.notifTimes?.morning || '06:00'
  document.getElementById('settings-notif-midday').value  = settings.notifTimes?.midday  || '12:00'
  document.getElementById('settings-notif-evening').value = settings.notifTimes?.evening || '18:00'
  document.getElementById('settings-notif-night').value   = settings.notifTimes?.night   || '00:00'
  document.getElementById('settings-fajr').value          = settings.fajrTime || '04:30'

  const toggle = document.getElementById('settings-theme-toggle')
  toggle.classList.toggle('on', settings.theme !== 'light')
}

function setupSettings() {
  const toggle = document.getElementById('settings-theme-toggle')
  toggle.addEventListener('click', () => {
    const willBeDark = !toggle.classList.contains('on')
    toggle.classList.toggle('on')
    // Apply theme immediately for live preview
    applyTheme(willBeDark ? 'dark' : 'light')
  })

  document.getElementById('settings-save').addEventListener('click', saveSettings)
}

async function saveSettings() {
  try {
    const isDark = document.getElementById('settings-theme-toggle').classList.contains('on')

    settings = {
      geminiApiKey:  document.getElementById('settings-api-key').value.trim(),
      theme:         isDark ? 'dark' : 'light',
      fajrTime:      document.getElementById('settings-fajr').value,
      notifTimes: {
        morning: document.getElementById('settings-notif-morning').value,
        midday:  document.getElementById('settings-notif-midday').value,
        evening: document.getElementById('settings-notif-evening').value,
        night:   document.getElementById('settings-notif-night').value
      }
    }

    await api.saveSettings(settings)
    applyTheme(settings.theme)
    showToast('✓ Settings saved')
  } catch (err) {
    console.error('[Shukarr] saveSettings error:', err)
    showToast(`⚠️ Save failed: ${err.message || 'unknown error'}`, 4000)
  }
}

// ── Notification Listener ──────────────────────────
function setupNotificationListener() {
  api.onShowQuote(({ type, data }) => {
    if (type === 'quran') {
      document.getElementById('quote-ornament').textContent = '﷽'
      document.getElementById('quote-ref').innerHTML =
        `<span>${data.surah_name_arabic || ''} — ${data.surah_name_english || ''}</span> · ${data.surah_number || ''}:${data.ayah_number || ''}`
      document.getElementById('quote-arabic').textContent = data.arabic_text || data.arabic || ''
      document.getElementById('quote-transliteration').textContent = data.transliteration || ''
      document.getElementById('quote-english').textContent = `"${data.english_translation || data.english || ''}"`
    } else {
      document.getElementById('quote-ornament').textContent = '📖'
      document.getElementById('quote-ref').innerHTML =
        `<span>${data.source || 'Hadith'}</span> · ${data.book || ''} #${data.number || ''}`
      document.getElementById('quote-arabic').textContent = data.arabic || ''
      document.getElementById('quote-transliteration').textContent = ''
      document.getElementById('quote-english').textContent = `"${data.english || ''}"`
    }
    switchView('quote')
  })

  api.onDhikrReset(async (freshState) => {
    dhikrState = freshState || await api.getDhikrState()
    renderDhikrFull()
    renderDhikrMini()
    showToast('🌅 Fajr — Dhikr tracker has been reset')
  })
}

// ── Toast ──────────────────────────────────────────
let toastTimer = null
function showToast(msg, duration = 2800) {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), duration)
}

// ── Boot ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init)
