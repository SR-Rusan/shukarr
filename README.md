# Shukarr – شكر

> *Gratitude through remembrance*

A beautiful, minimalist macOS app for Islamic mindfulness with three core features.

---

## Features

### 💭 Mood Check-In
Answer 3 quick questions about how you're feeling. Gemini AI selects the most appropriate Quranic verse for your emotional state — with Arabic, transliteration, English translation, and a personal reflection.

### 🌙 Daily Reminders
4 native macOS notifications per day (configurable):
- **6:00 AM** – Quranic verse (morning)
- **12:00 PM** – Hadith (Sahih Bukhari/Muslim only)
- **6:00 PM** – Quranic verse (evening)
- **12:00 AM** – Hadith (night)

Click any notification to open the full quote in the app.

### 📿 Dhikr Tracker
5 essential dhikr, 100× each — tracked daily, resets at Fajr (4:30 AM Bangladesh default).

---

## Setup

### 1. Install dependencies
```bash
cd /Users/hello/Documents/Shukarr
npm install
```

### 2. Run
```bash
npm start
```

### 3. Add your Gemini API Key
- Go to **Settings** (⚙️ icon in sidebar)
- Paste your Gemini API key
- Get a free key at: https://aistudio.google.com/app/apikey
- Click **Save Settings**

---

## Customisation

All settings are in the **Settings** view inside the app:

| Setting | Default |
|---|---|
| Gemini API Key | *(required for mood feature)* |
| Morning reminder | 6:00 AM |
| Midday reminder | 12:00 PM |
| Evening reminder | 6:00 PM |
| Night reminder | 12:00 AM |
| Fajr reset time | 4:30 AM |
| Theme | Dark |

---

## Data Storage

All data is stored **100% locally** on your Mac at:
```
~/Library/Application Support/Shukarr/
```

No cloud, no tracking, no accounts needed.

---

## Project Structure

```
Shukarr/
├── src/
│   ├── main/
│   │   ├── main.js       # Electron main process
│   │   ├── db.js         # Local JSON persistence
│   │   ├── scheduler.js  # Notification jobs
│   │   └── gemini.js     # AI mood analysis
│   ├── preload/
│   │   └── preload.js    # Secure IPC bridge
│   └── renderer/
│       ├── index.html    # App shell
│       ├── styles.css    # Design system
│       └── app.js        # UI logic
└── assets/
    ├── quran_pool.json   # 35 curated verses
    └── hadith_pool.json  # 31 authenticated hadiths
```
