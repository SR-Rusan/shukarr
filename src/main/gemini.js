const path = require('path')
const fs   = require('fs')

// ── Load pools once ───────────────────────────────────────────────
let _quranPool = null
let _hadithPool = null

function getQuranPool() {
  if (!_quranPool) {
    const p = path.join(__dirname, '../../assets/quran_pool.json')
    _quranPool = JSON.parse(fs.readFileSync(p, 'utf8'))
  }
  return _quranPool
}

function getHadithPool() {
  if (!_hadithPool) {
    const p = path.join(__dirname, '../../assets/hadith_pool.json')
    if (fs.existsSync(p)) {
      _hadithPool = JSON.parse(fs.readFileSync(p, 'utf8'))
    } else {
      _hadithPool = []
    }
  }
  return _hadithPool
}

// Combined pool helper
function getPool() {
  return getQuranPool()
}

function getAllItems() {
  return [...getQuranPool(), ...getHadithPool()]
}

// ── Mood → verse affinity map ──────────────────────────────────────
// Each entry: verse id → score boost for matching keywords
const MOOD_TAGS = {
  '2:286':    ['burden','overwhelmed','too much','heavy','capacity','can\'t cope','exhausted','tired'],
  '94:5-6':   ['hardship','difficulty','hard time','struggling','stuck','ease','hope','tunnel'],
  '2:152':    ['remember','dhikr','gratitude','grateful','thankful','close to Allah','connected'],
  '39:53':    ['sin','guilt','regret','despair','hopeless','transgressed','mistake','bad deeds'],
  '14:7':     ['gratitude','grateful','blessing','thankful','appreciate','increase','shukr'],
  '13:28':    ['anxious','anxiety','restless','peace','calm','heart','worried','tranquil','rest'],
  '65:3':     ['trust','tawakkul','rely','uncertainty','unknown','future','risk','afraid'],
  '2:216':    ['confused','why','don\'t understand','bad thing','unfair','test','wisdom'],
  '89:27-28': ['peace','contentment','satisfied','returning','serene','at rest','soul'],
  '3:139':    ['weak','grief','grieve','sad','believer','superior','strong again','losing'],
  '3:173':    ['afraid','scared','fear','enough','Allah is enough','protection','sufficient'],
  '93:3-5':   ['abandoned','alone','forgotten','forsaken','Allah left me','lost','better coming'],
  '2:153':    ['patience','patience','difficult','sabr','prayer','salah','help','believer'],
  '16:96':    ['temporary','worldly','dunya','lasting','eternal','this world','end','material'],
  '3:160':    ['victory','help','overcome','support','no one against','Allah with me','strength'],
  '7:156':    ['mercy','rahmah','compassion','forgiven','merciful','kind','love'],
  '55:13':    ['deny','blessings','counting blessings','favor','gifts','nature','beauty'],
  '41:30':    ['steadfast','consistent','istiqamah','angels','glad tidings','firm','courage'],
  '21:83':    ['pain','suffering','illness','hardship','dua','prayer','merciful'],
  '9:51':     ['destiny','qadr','destined','predestined','control','decree','acceptance'],
  '39:10':    ['patient','reward','patience rewarded','endure','bear','without account'],
  '25:70':    ['repentance','tawbah','changed','new start','sins replaced','good deeds'],
  '67:29':    ['belief','reliance','trust Allah','iman','faith','depends on Allah'],
  '3:200':    ['persevere','endure','station','taqwa','piety','keep going','persist'],
  '27:40':    ['test','favor','grateful or not','trial','gift','test from Allah'],
  '18:10':    ['mercy','right guidance','refuge','youth','cave','protection','seeking'],
  '93:11':    ['proclaim','blessings','share','favors','gratitude','speak of Allah'],
  '66:8':     ['repent','sincere','tawbah','return to Allah','forgiveness','new leaf'],
  '16:128':   ['taqwa','righteous','good deeds','Allah with you','doers of good','piety'],
  '20:130':   ['patience','say','exalt','praise','Lord','times','steadfast','calm'],
  '27:62':    ['desperate','call','respond','desperate call','removes harm','answered'],
  '2:112':    ['submit','submission','good deeds','reward','Lord','whoever submits'],
  '2:286b':   ['error','forget','mistake','blame','burden','pardon','forgive','overloaded']
}

// Reflections per verse tailored for emotional support
const REFLECTIONS = {
  '2:286':    "Allah knows your capacity better than you do — this is a promise that what you face right now is within what He has given you. You are stronger than you feel.",
  '94:5-6':   "This verse was repeated twice — a deliberate reassurance. Your hardship is real, but ease is already woven into it. The relief is coming closer, not further.",
  '2:152':    "Every moment of remembrance is a conversation with Allah. He promised to remember you when you remember Him — you are never truly alone.",
  '39:53':    "No matter how far you feel, the door of return is wide open. Allah says 'My servants' even while describing those who have sinned — you are still His.",
  '14:7':     "Gratitude is not just a feeling — it is a key. The more you acknowledge what you have, the more Allah expands your blessings. Begin even with small thanks.",
  '13:28':    "The restlessness you feel has a cure, and it is specifically the remembrance of Allah. Your heart was created to find rest in Him, and in Him alone.",
  '65:3':     "When you hand your affairs to Allah, you are not losing control — you are placing them with the One who controls all things. That is not weakness; it is wisdom.",
  '2:216':    "Sometimes the things that hurt us are refining us. Allah sees the full picture of your story; what feels wrong today may be the foundation of something beautiful.",
  '89:27-28': "This is the invitation you are moving toward — to return to your Lord in peace. The tranquil soul is one that has trusted, surrendered, and found contentment.",
  '3:139':    "Grief is real, but it does not define your end. If you hold onto your faith, you are on the higher ground — even when it does not feel that way.",
  '3:173':    "When everything feels like too much, this is enough: Allah is sufficient. Recite this and mean it. It was the declaration of those facing the greatest odds.",
  '93:3-5':   "Allah has not abandoned you. This surah was revealed when the Prophet felt forgotten — and the answer was this: the best is still ahead of you.",
  '2:153':    "Patience and prayer are not passive — they are the two most powerful tools a believer has. In your difficulty, these are your anchor and your fuel.",
  '16:96':    "Whatever is worrying you in the dunya will end. Only what is with Allah is permanent. This reframe changes everything about how we carry our burdens.",
  '3:160':    "If Allah is with you, it does not matter who is against you. Your strength is not in what you have — it is in Whose side you are on.",
  '7:156':    "You are already inside Allah's mercy. It is not something you have to earn or reach — it encompasses all things, and that includes you, right now.",
  '55:13':    "Sometimes we need to stop and count. The breath in your lungs, the sight in your eyes, the people you love — which of His favors will you deny?",
  '41:30':    "Steadfastness is the mark of the believer. When you stay firm, the angels descend with reassurance. You are not alone in holding on.",
  '21:83':    "This was Prophet Ayyub's prayer in his deepest suffering. You are allowed to express your pain to Allah — He is the Most Merciful of all who show mercy.",
  '9:51':     "Peace comes from releasing what is not in your hands. Nothing befalls you except by Allah's decree, and His decree always carries wisdom and care.",
  '39:10':    "Your patience is being recorded, and its reward is beyond calculation. What you are enduring right now is building something eternal.",
  '25:70':    "It is never too late. Allah transforms sins into good deeds for those who repent sincerely. Your past does not have to define your future.",
  '67:29':    "Place your reliance on Him who is the Most Merciful. Faith and trust together are a shield — let them carry what you cannot.",
  '3:200':    "Perseverance is an act of worship. Every day you keep going in faith, you are fulfilling a command and drawing closer to Allah.",
  '27:40':    "Everything you have is a test of gratitude. Recognizing that it is from Allah — and saying so — is the act of a grateful heart.",
  '18:10':    "When you turn to Allah seeking mercy and guidance, He responds. The cave was a place of refuge — your dua is your refuge.",
  '93:11':    "Speak of what Allah has given you. Sharing gratitude spreads light — and it deepens your own awareness of His blessings.",
  '66:8':     "Sincere repentance wipes the slate. Allah loves those who return to Him — your return is itself a sign of His mercy calling you back.",
  '16:128':   "Allah is with the righteous and the good-doers. You do not have to be perfect — just sincere, and striving toward good.",
  '20:130':   "Patience in the face of what is said about you, combined with praise of Allah — this is the prophetic response to hardship. It dignifies your struggle.",
  '27:62':    "The desperate call is always heard. When you have nothing left, that raw honest dua is exactly what reaches Allah. He responds to the desperate.",
  '2:112':    "Submission to Allah with sincerity is the whole religion in one verse. Your reward is with your Lord — nothing you do in His name is wasted.",
  '2:286b':   "Allah does not hold you to account for honest mistakes or forgetfulness. You are not required to be perfect — only sincere and striving."
}

// ── Local mood matching (no API needed) ───────────────────────────
function matchVerseLocally(answers) {
  const text = [answers.q1, answers.q2, answers.q3, answers.note || '']
    .join(' ').toLowerCase()

  const pool = getPool()
  const scores = {}

  for (const verse of pool) {
    const id = verse.id
    const tags = MOOD_TAGS[id] || []
    let score = 0
    for (const tag of tags) {
      if (text.includes(tag)) score += 3
    }
    // Also score against the verse translation itself
    const words = text.split(/\W+/).filter(w => w.length > 3)
    for (const w of words) {
      if (verse.english_translation.toLowerCase().includes(w)) score += 1
    }
    scores[id] = score
  }

  // Pick highest scoring verse; if tie or zero, pick based on q3 (need)
  let best = pool[0]
  let bestScore = -1
  for (const verse of pool) {
    const s = scores[verse.id] || 0
    if (s > bestScore) { bestScore = s; best = verse }
  }

  // If nothing matched, fall back to q3-based defaults
  if (bestScore === 0) {
    const q3 = (answers.q3 || '').toLowerCase()
    if (q3.includes('comfort') || q3.includes('reassurance')) best = pool.find(v => v.id === '93:3-5') || best
    else if (q3.includes('motivation') || q3.includes('keep going')) best = pool.find(v => v.id === '3:139') || best
    else if (q3.includes('gratitude')) best = pool.find(v => v.id === '14:7') || best
    else if (q3.includes('strength') || q3.includes('patience')) best = pool.find(v => v.id === '2:153') || best
    else if (q3.includes('right path') || q3.includes('guidance')) best = pool.find(v => v.id === '65:3') || best
    else if (q3.includes('dua') || q3.includes('make dua')) best = pool.find(v => v.id === '27:62') || best
    else best = pool[Math.floor(Math.random() * pool.length)]
  }

  return {
    surah_name_english: best.surah_name_english,
    surah_name_arabic:  best.surah_name_arabic,
    surah_number:       best.surah_number,
    ayah_number:        best.ayah_number,
    arabic_text:        best.arabic_text,
    transliteration:    best.transliteration,
    english_translation: best.english_translation,
    brief_reflection:   REFLECTIONS[best.id] || 'May this verse bring light to your heart. Allah knows your situation and is closer to you than you realise.'
  }
}

// ── AI via Pollinations (free, no key needed) ─────────────────────
async function analyzeWithPollinations(answers) {
  const items = getAllItems()

  // Build compact list: id | type | text (first 90 chars)
  const itemList = items.map(item => {
    const text = item.type === 'hadith'
      ? item.english
      : item.english_translation
    return `${item.id} [${item.type === 'hadith' ? 'hadith' : 'quran'}]: "${text.slice(0, 90)}"`
  }).join('\n')

  const userContext = [
    answers.q1 && `Overall mood: ${answers.q1}`,
    answers.q2 && `What is weighing on their heart: ${answers.q2}`,
    answers.q3 && `What they need most right now: ${answers.q3}`,
    answers.note && `In their own words: ${answers.note}`
  ].filter(Boolean).join('\n')

  const systemPrompt = `You are an Islamic spiritual guide. A Muslim has shared their emotional state. From the list below, choose the single most healing and relevant Quranic verse OR hadith for their situation. Then write a brief, warm 2-sentence reflection explaining why it speaks to their heart right now.

Available items (id [type]: text):
${itemList}

Return ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "item_id": "the exact id from the list e.g. 2:286 or h12",
  "brief_reflection": "Two warm, personal sentences about why this verse or hadith fits their specific state."
}`

  const body = JSON.stringify({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContext }
    ],
    model: 'openai',
    seed: 42,
    private: true
  })

  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(25000)
  })

  if (!response.ok) throw new Error(`Pollinations ${response.status}`)
  const text = await response.text()
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  const parsed = JSON.parse(cleaned)

  const item = items.find(i => i.id === parsed.item_id)
  if (!item) throw new Error(`Unknown id: ${parsed.item_id}`)

  if (item.type === 'hadith') {
    return {
      type: 'hadith',
      source: item.source,
      narrator: item.narrator,
      arabic_text: item.arabic,
      transliteration: item.transliteration,
      english_translation: item.english,
      brief_reflection: parsed.brief_reflection
    }
  }

  return {
    type: 'quran',
    surah_name_english:  item.surah_name_english,
    surah_name_arabic:   item.surah_name_arabic,
    surah_number:        item.surah_number,
    ayah_number:         item.ayah_number,
    arabic_text:         item.arabic_text,
    transliteration:     item.transliteration,
    english_translation: item.english_translation,
    brief_reflection:    parsed.brief_reflection
  }
}


// ── Main entry ─────────────────────────────────────────────────────
async function analyzeMood(answers, apiKey) {
  // Try Gemini only if a plausibly valid key is provided
  if (apiKey && apiKey.startsWith('AIza')) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
      })
      const prompt = `You are an Islamic spiritual guide. A Muslim has shared their emotional state. Select the single most healing Quranic verse for their situation.

Mood check-in:
- Overall mood: ${answers.q1}
- What is weighing on their heart: ${answers.q2}
- What they need most: ${answers.q3}${answers.note ? `\n- Personal note: ${answers.note}` : ''}

Return ONLY this JSON (no markdown, no code block):
{
  "surah_name_english": "Al-Baqarah",
  "surah_name_arabic": "البقرة",
  "surah_number": 2,
  "ayah_number": 286,
  "arabic_text": "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
  "transliteration": "Lā yukallifullāhu nafsan illā wus'ahā",
  "english_translation": "Allah does not burden a soul beyond that it can bear.",
  "brief_reflection": "2 warm sentences about why this verse fits their state."
}`
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch (e) {
      console.log('[Shukarr] Gemini failed, trying Pollinations:', e.message.slice(0, 60))
    }
  }

  // 2. Pollinations AI — free, no key, understands any free text
  try {
    console.log('[Shukarr] Using Pollinations AI')
    return await analyzeWithPollinations(answers)
  } catch (e) {
    console.log('[Shukarr] Pollinations failed, using local matching:', e.message.slice(0, 60))
  }

  // 3. Local matching — offline fallback
  console.log('[Shukarr] Using local verse matching')
  return matchVerseLocally(answers)
}

module.exports = { analyzeMood }
