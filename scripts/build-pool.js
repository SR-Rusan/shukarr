/**
 * build-pool.js
 * Fetches Quran verses from alquran.cloud and compiles hadith collection.
 * Run: node scripts/build-pool.js
 */

const fs   = require('fs')
const path = require('path')
const https = require('https')

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch(e) { reject(e) }
      })
    }).on('error', reject)
  })
}

// ── All verse references to include ───────────────────────────────
// Format: [surah, ayah] or [surah, startAyah, endAyah]
const VERSE_REFS = [
  // Al-Fatiha
  [1,1],[1,2],[1,5],[1,6],[1,7],
  // Al-Baqarah
  [2,2],[2,45],[2,62],[2,107],[2,112],[2,143],[2,152],[2,153],[2,155],
  [2,156],[2,157],[2,177],[2,183],[2,185],[2,186],[2,195],[2,216],
  [2,255],[2,256],[2,261],[2,268],[2,269],[2,277],[2,285],[2,286],
  // Al-Imran
  [3,17],[3,26],[3,27],[3,31],[3,92],[3,102],[3,103],[3,133],[3,134],
  [3,139],[3,160],[3,173],[3,185],[3,190],[3,191],[3,200],
  // An-Nisa
  [4,36],[4,48],[4,103],[4,110],[4,116],[4,124],[4,147],
  // Al-Maidah
  [5,2],[5,3],[5,8],[5,35],[5,54],[5,105],
  // Al-An'am
  [6,54],[6,82],[6,103],[6,116],[6,162],[6,163],
  // Al-A'raf
  [7,23],[7,42],[7,56],[7,126],[7,156],[7,180],[7,204],
  // Al-Anfal
  [8,2],[8,46],
  // At-Tawbah
  [9,18],[9,40],[9,51],[9,71],[9,72],[9,111],[9,128],[9,129],
  // Yunus
  [10,9],[10,26],[10,57],[10,62],[10,63],[10,64],[10,107],
  // Hud
  [11,3],[11,6],[11,11],[11,56],[11,88],[11,114],[11,115],
  // Yusuf
  [12,18],[12,64],[12,87],[12,101],
  // Ar-Ra'd
  [13,11],[13,14],[13,20],[13,21],[13,22],[13,23],[13,28],[13,29],
  // Ibrahim
  [14,7],[14,11],[14,27],[14,31],[14,39],[14,40],[14,41],
  // Al-Hijr
  [15,46],[15,56],
  // An-Nahl
  [16,18],[16,19],[16,90],[16,96],[16,97],[16,98],[16,106],[16,119],[16,128],
  // Al-Isra
  [17,7],[17,25],[17,28],[17,44],[17,78],[17,79],[17,80],[17,82],
  // Al-Kahf
  [18,10],[18,28],[18,45],[18,46],[18,107],[18,109],[18,110],
  // Maryam
  [19,4],[19,47],[19,48],[19,65],[19,96],
  // Ta-Ha
  [20,8],[20,14],[20,25],[20,26],[20,27],[20,114],[20,124],[20,130],[20,132],
  // Al-Anbiya
  [21,83],[21,87],[21,88],[21,92],[21,94],
  // Al-Hajj
  [22,37],[22,40],[22,54],[22,73],[22,77],[22,78],
  // Al-Mu'minun
  [23,1],[23,2],[23,3],[23,4],[23,5],[23,57],[23,58],[23,59],[23,60],[23,118],
  // An-Nur
  [24,22],[24,31],[24,35],[24,55],[24,56],
  // Al-Furqan
  [25,58],[25,63],[25,68],[25,70],[25,71],[25,72],[25,73],[25,74],[25,75],[25,76],
  // Ash-Shu'ara
  [26,78],[26,79],[26,80],[26,81],[26,82],[26,83],[26,87],[26,88],[26,89],
  // An-Naml
  [27,19],[27,40],[27,62],
  // Al-Qasas
  [28,24],[28,54],[28,56],[28,77],
  // Al-Ankabut
  [29,2],[29,3],[29,45],[29,69],
  // Ar-Rum
  [30,21],[30,30],[30,41],[30,47],
  // Luqman
  [31,12],[31,13],[31,14],[31,17],[31,18],[31,19],[31,22],
  // As-Sajdah
  [32,15],[32,16],[32,17],
  // Al-Ahzab
  [33,21],[33,35],[33,41],[33,42],[33,43],[33,56],[33,70],[33,71],
  // Saba
  [34,13],[34,39],
  // Fatir
  [35,5],[35,15],[35,18],[35,28],[35,29],[35,30],
  // Ya-Sin
  [36,12],[36,47],[36,58],[36,82],[36,83],
  // As-Saffat
  [37,40],[37,41],[37,100],[37,101],[37,102],[37,103],[37,104],[37,105],[37,180],[37,181],[37,182],
  // Az-Zumar
  [39,9],[39,10],[39,17],[39,18],[39,22],[39,53],[39,54],[39,55],
  // Ghafir
  [40,3],[40,44],[40,60],
  // Fussilat
  [41,30],[41,31],[41,32],[41,34],
  // Ash-Shura
  [42,5],[42,25],[42,26],[42,27],[42,28],[42,36],[42,40],[42,43],
  // Az-Zukhruf
  [43,13],[43,14],[43,32],
  // Ad-Dukhan
  [44,51],[44,52],
  // Al-Jathiyah
  [45,15],
  // Al-Ahqaf
  [46,13],[46,15],[46,31],[46,32],
  // Muhammad
  [47,7],[47,12],[47,19],[47,31],[47,36],[47,38],
  // Al-Fath
  [48,1],[48,2],[48,4],[48,10],[48,29],
  // Al-Hujurat
  [49,10],[49,11],[49,12],[49,13],
  // Qaf
  [50,16],[50,29],[50,32],
  // Adh-Dhariyat
  [51,50],[51,56],
  // At-Tur
  [52,21],
  // An-Najm
  [53,32],[53,39],[53,40],[53,41],
  // Al-Qamar
  [54,17],
  // Ar-Rahman
  [55,1],[55,2],[55,3],[55,4],[55,13],[55,26],[55,27],[55,78],
  // Al-Waqia
  [56,10],[56,11],[56,12],[56,88],[56,89],[56,90],[56,91],
  // Al-Hadid
  [57,3],[57,4],[57,21],[57,22],[57,23],[57,28],
  // Al-Hashr
  [59,18],[59,19],[59,22],[59,23],[59,24],
  // As-Saff
  [61,4],[61,13],
  // Al-Jumu'ah
  [62,9],[62,10],
  // At-Taghabun
  [64,11],[64,13],[64,15],[64,16],
  // At-Talaq
  [65,2],[65,3],[65,7],
  // At-Tahrim
  [66,8],
  // Al-Mulk
  [67,2],[67,13],[67,14],[67,15],[67,29],
  // Al-Qalam
  [68,4],
  // Al-Haqqah
  [69,33],[69,34],
  // Al-Ma'arij
  [70,19],[70,20],[70,21],[70,22],[70,23],[70,24],[70,25],[70,26],[70,27],[70,28],[70,29],[70,30],
  // Nuh
  [71,10],[71,11],[71,12],
  // Al-Jinn
  [72,13],
  // Al-Muzammil
  [73,8],[73,20],
  // Al-Muddaththir
  [74,38],
  // Al-Qiyamah
  [75,31],[75,32],[75,33],[75,34],[75,35],
  // Al-Insan
  [76,8],[76,9],[76,10],
  // Al-Mursalat
  [77,50],
  // An-Naba
  [78,31],[78,32],[78,33],[78,34],[78,35],[78,36],
  // An-Nazi'at
  [79,40],[79,41],
  // Abasa
  [80,24],[80,25],[80,26],[80,27],[80,28],[80,29],[80,30],[80,31],[80,32],
  // At-Takwir
  [81,19],[81,28],[81,29],
  // Al-Infitar
  [82,6],[82,7],[82,8],
  // Al-Mutaffifin
  [83,14],[83,15],
  // Al-Inshiqaq
  [84,6],
  // Al-Buruj
  [85,14],[85,15],[85,16],
  // At-Tariq
  [86,4],
  // Al-A'la
  [87,1],[87,2],[87,3],[87,14],[87,15],[87,16],[87,17],
  // Al-Ghashiyah
  [88,2],[88,3],[88,4],[88,5],[88,6],[88,7],[88,8],[88,9],[88,10],
  // Al-Fajr
  [89,27],[89,28],[89,29],[89,30],
  // Al-Balad
  [90,11],[90,12],[90,13],[90,14],[90,15],[90,16],[90,17],[90,18],
  // Ash-Shams
  [91,9],[91,10],
  // Al-Layl
  [92,5],[92,6],[92,7],[92,17],[92,18],[92,19],[92,20],[92,21],
  // Ad-Duha
  [93,1],[93,2],[93,3],[93,4],[93,5],[93,6],[93,7],[93,8],[93,9],[93,10],[93,11],
  // Ash-Sharh (Al-Inshirah)
  [94,1],[94,2],[94,3],[94,4],[94,5],[94,6],[94,7],[94,8],
  // At-Tin
  [95,4],[95,5],[95,6],
  // Al-Alaq
  [96,1],[96,2],[96,3],[96,4],[96,5],
  // Al-Qadr
  [97,1],[97,2],[97,3],[97,4],[97,5],
  // Al-Bayyinah
  [98,5],
  // Az-Zalzalah
  [99,7],[99,8],
  // Al-Adiyat
  [100,6],[100,7],[100,8],
  // Al-Qari'ah
  [101,6],[101,7],[101,8],[101,9],[101,10],[101,11],
  // At-Takathur
  [102,1],[102,2],[102,3],[102,4],[102,5],[102,6],[102,7],[102,8],
  // Al-Asr
  [103,1],[103,2],[103,3],
  // Al-Fil
  [105,1],[105,2],[105,3],[105,4],[105,5],
  // Al-Kawthar
  [108,1],[108,2],[108,3],
  // Al-Kafiroon
  [109,1],[109,2],[109,3],[109,4],[109,5],[109,6],
  // An-Nasr
  [110,1],[110,2],[110,3],
  // Al-Masad
  [111,1],[111,2],[111,3],[111,4],[111,5],
  // Al-Ikhlas
  [112,1],[112,2],[112,3],[112,4],
  // Al-Falaq
  [113,1],[113,2],[113,3],[113,4],[113,5],
  // An-Nas
  [114,1],[114,2],[114,3],[114,4],[114,5],[114,6],
]

// ── Hadith collection ──────────────────────────────────────────────
const HADITHS = [
  { id: 'h1', source: 'Bukhari & Muslim', narrator: 'Abu Hurairah', arabic: 'إِنَّ اللَّهَ قَالَ: أَنَا عِنْدَ ظَنِّ عَبْدِي بِي', transliteration: "Innallāha qāla: Ana 'inda ẓanni 'abdī bī", english: 'Allah says: I am as My servant thinks of Me.', theme: 'hope' },
  { id: 'h2', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ', transliteration: "Mā naqaṣat ṣadaqatun min māl", english: 'Charity never diminishes wealth.', theme: 'generosity' },
  { id: 'h3', source: 'Bukhari', narrator: 'Abdullah ibn Masud', arabic: 'عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ', transliteration: "Alaykum biṣ-ṣidqi fa-innaṣ-ṣidqa yahdī ilal-birr", english: 'Hold fast to truthfulness, for it leads to righteousness.', theme: 'character' },
  { id: 'h4', source: 'Bukhari & Muslim', narrator: 'Abu Hurairah', arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', transliteration: "Man kāna yu'minu billāhi wal-yawmil-ākhiri falyaqul khayran aw liyaṣmut", english: 'Whoever believes in Allah and the Last Day should speak good or remain silent.', theme: 'speech' },
  { id: 'h5', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ', transliteration: "Al-mu'minul-qawiyyu khayrun wa-aḥabbu ilallāhi minal-mu'minil-ḍa'īf", english: 'The strong believer is better and more beloved to Allah than the weak believer.', theme: 'strength' },
  { id: 'h6', source: 'Tirmidhi', narrator: 'Anas ibn Malik', arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', transliteration: "Lā yu'minu aḥadukum ḥattā yuḥibba li-akhīhi mā yuḥibbu li-nafsih", english: 'None of you truly believes until he loves for his brother what he loves for himself.', theme: 'brotherhood' },
  { id: 'h7', source: 'Bukhari', narrator: 'Aisha', arabic: 'إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ', transliteration: "Innallāha rafīqun yuḥibbur-rifq", english: 'Allah is gentle and loves gentleness in all things.', theme: 'gentleness' },
  { id: 'h8', source: 'Muslim', narrator: 'Suhaib', arabic: 'عَجَبًا لِأَمْرِ الْمُؤْمِنِ إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ', transliteration: "Ajaban li-amril-mu'min, inna amrahu kullahu khayar", english: 'Wondrous is the affair of the believer — all of his affairs are good.', theme: 'gratitude' },
  { id: 'h9', source: 'Bukhari', narrator: 'Ibn Umar', arabic: 'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ', transliteration: "Kun fid-dunyā ka-annaka gharīb aw 'ābiru sabīl", english: 'Be in this world as if you were a stranger or a traveller passing through.', theme: 'dunya' },
  { id: 'h10', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ', transliteration: "Idhā mātal-insānu inqaṭa'a 'anhu 'amaluhu illā min thalāthah", english: 'When a person dies, all deeds end except three: ongoing charity, beneficial knowledge, or a righteous child who prays for them.', theme: 'legacy' },
  { id: 'h11', source: 'Tirmidhi', narrator: 'Abdullah ibn Abbas', arabic: 'احْفَظِ اللَّهَ يَحْفَظْكَ', transliteration: "Iḥfaẓillāha yaḥfaẓka", english: 'Be mindful of Allah and He will protect you.', theme: 'taqwa' },
  { id: 'h12', source: 'Tirmidhi', narrator: 'Abdullah ibn Abbas', arabic: 'وَاعْلَمْ أَنَّ مَا أَصَابَكَ لَمْ يَكُنْ لِيُخْطِئَكَ', transliteration: "Wa'lam anna mā aṣābaka lam yakun liyukhṭi'ak", english: 'Know that whatever has befallen you was never meant to miss you.', theme: 'qadr' },
  { id: 'h13', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', transliteration: "Khayrukum man ta'allamal-Qur'āna wa 'allamah", english: 'The best of you are those who learn the Quran and teach it.', theme: 'quran' },
  { id: 'h14', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ', transliteration: "Man salaka ṭarīqan yaltamisu fīhi 'ilman sahhallāhu lahu bihi ṭarīqan ilal-jannah", english: 'Whoever travels a path seeking knowledge, Allah makes easy for him a path to Paradise.', theme: 'knowledge' },
  { id: 'h15', source: 'Bukhari', narrator: 'Aisha', arabic: 'إِنَّ أَحَبَّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', transliteration: "Inna aḥabbal-a'māli ilallāhi adwamuhā wa-in qall", english: 'The most beloved deeds to Allah are the most consistent, even if they are small.', theme: 'consistency' },
  { id: 'h16', source: 'Muslim', narrator: 'Abu Dharr', arabic: 'اتَّقِ اللَّهِ حَيْثُمَا كُنْتَ وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا', transliteration: "Ittaqillāha ḥaythumā kunta wa-atbi'is-sayyi'atal-ḥasanata tamḥuhā", english: 'Fear Allah wherever you are, and follow an evil deed with a good one to erase it.', theme: 'repentance' },
  { id: 'h17', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ', transliteration: "Ad-dunyā sijnal-mu'min wa-jannatul-kāfir", english: 'This world is a prison for the believer and a paradise for the disbeliever.', theme: 'dunya' },
  { id: 'h18', source: 'Ibn Majah', narrator: 'Abu Hurairah', arabic: 'اللَّهُمَّ أَصْلِحْ لِي دِينِيَ الَّذِي هُوَ عِصْمَةُ أَمْرِي', transliteration: "Allāhumma aṣliḥ lī dīniyal-ladhī huwa 'iṣmatu amrī", english: 'O Allah, rectify for me my religion which is the safeguard of my affairs.', theme: 'dua' },
  { id: 'h19', source: 'Bukhari & Muslim', narrator: 'Anas ibn Malik', arabic: 'يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا', transliteration: "Yassirū wa-lā tu'assirū wa-bashshirū wa-lā tunaffirū", english: 'Make things easy and do not make them difficult; give glad tidings and do not repel.', theme: 'ease' },
  { id: 'h20', source: 'Muslim', narrator: 'Jabir ibn Abdullah', arabic: 'كُلُّ مَعْرُوفٍ صَدَقَةٌ', transliteration: "Kullu ma'rūfin ṣadaqah", english: 'Every act of kindness is charity.', theme: 'kindness' },
  { id: 'h21', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ', transliteration: "Laysal-shadīdu biṣ-ṣur'ah, innamaş-shadīdul-ladhī yamliku nafsahu 'indal-ghaḍab", english: 'The strong person is not the one who can wrestle others; the strong person is the one who controls himself in anger.', theme: 'anger' },
  { id: 'h22', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'مَنْ لَا يَشْكُرُ النَّاسَ لَا يَشْكُرُ اللَّهَ', transliteration: "Man lā yashkurun-nāsa lā yashkurullāh", english: 'Whoever does not thank people does not thank Allah.', theme: 'gratitude' },
  { id: 'h23', source: 'Bukhari', narrator: 'Ibn Umar', arabic: 'وَالْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ', transliteration: "Wal-kalimatut-ṭayyibatu ṣadaqah", english: 'A kind word is charity.', theme: 'kindness' },
  { id: 'h24', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ', transliteration: "Innallāha lā yanẓuru ilā ṣuwarikum wa-amwālikum wa-lākin yanẓuru ilā qulūbikum wa-a'mālikum", english: 'Allah does not look at your appearance or wealth, but at your hearts and deeds.', theme: 'sincerity' },
  { id: 'h25', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ', transliteration: "Man ṣāma Ramaḍāna īmānan waḥtisāban ghufira lahu mā taqaddama min dhanbih", english: 'Whoever fasts Ramadan out of faith and seeking reward, his past sins will be forgiven.', theme: 'forgiveness' },
  { id: 'h26', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'الصَّبْرُ ضِيَاءٌ', transliteration: "Aṣ-ṣabru ḍiyā'", english: 'Patience is illumination.', theme: 'patience' },
  { id: 'h27', source: 'Ahmad', narrator: 'Anas ibn Malik', arabic: 'لَوْ أَنَّ ابْنَ آدَمَ هَرَبَ مِنْ رِزْقِهِ كَمَا يَهْرُبُ مِنَ الْمَوْتِ لَأَدْرَكَهُ رِزْقُهُ كَمَا يُدْرِكُهُ الْمَوْتُ', transliteration: "Law anna ibna Ādama haraba min rizqihi kamā yahrubu minal-mawti la-adrakahu rizquhu kamā yudrikuhu mawt", english: 'If the son of Adam were to flee from his provision as he flees from death, his provision would still catch him just as death will catch him.', theme: 'rizq' },
  { id: 'h28', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'أَقْرَبُ مَا يَكُونُ الْعَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ', transliteration: "Aqrabu mā yakūnal-'abdu min rabbihi wa-huwa sājid", english: 'The servant is closest to his Lord when he is in prostration.', theme: 'prayer' },
  { id: 'h29', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَا أَصَابَ الْمُسْلِمَ مِنْ نَصَبٍ وَلَا وَصَبٍ وَلَا هَمٍّ وَلَا حَزَنٍ وَلَا أَذًى وَلَا غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا إِلَّا كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ', transliteration: "Mā aṣābal-muslima min naṣabin wa-lā waṣabin wa-lā hammin wa-lā ḥazanin wa-lā adhan wa-lā ghamin ḥattāsh-shawkati yushākuhā illā kaffara llāhu bihā min khaṭāyāh", english: 'No fatigue, disease, sorrow, grief, hurt, or distress — even a thorn that pricks him — befalls a Muslim, but Allah expiates some of his sins because of it.', theme: 'hardship' },
  { id: 'h30', source: 'Tirmidhi', narrator: 'Muadh ibn Jabal', arabic: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ', transliteration: "Ittaqillāha ḥaythumā kunta wa-khāliqi n-nāsa bi-khuluqin ḥasan", english: 'Fear Allah wherever you are, and treat people with good character.', theme: 'character' },
  { id: 'h31', source: 'Bukhari', narrator: 'Abdullah ibn Amr', arabic: 'الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ ارْحَمُوا مَنْ فِي الْأَرْضِ يَرْحَمْكُمْ مَنْ فِي السَّمَاءِ', transliteration: "Ar-rāḥimūna yarḥamuhum ar-Raḥmān, irḥamū man fil-arḍi yarḥamkum man fis-samā'", english: 'The merciful are shown mercy by the Most Merciful. Be merciful to those on earth and the One above the heavens will be merciful to you.', theme: 'mercy' },
  { id: 'h32', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'إِنَّ اللَّهَ يَقْبَلُ التَّوْبَةَ مَا لَمْ يُغَرْغِرْ', transliteration: "Innallāha yaqbalut-tawbata mā lam yugharghar", english: 'Allah accepts repentance as long as the soul has not reached the throat.', theme: 'repentance' },
  { id: 'h33', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللَّهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ', transliteration: "Man naffasa 'an mu'minin kurbatan min kurabidunyā, naffasallāhu 'anhu kurbatan min kurabi yawmil-qiyāmah", english: 'Whoever relieves a believer of a distress in this world, Allah will relieve him of a distress on the Day of Judgement.', theme: 'helping' },
  { id: 'h34', source: 'Bukhari', narrator: 'Anas ibn Malik', arabic: 'لَا تَحَاسَدُوا وَلَا تَنَاجَشُوا وَلَا تَبَاغَضُوا وَكُونُوا عِبَادَ اللَّهِ إِخْوَانًا', transliteration: "Lā taḥāsadū wa-lā tanājashū wa-lā tabāghaḍū wa-kūnū 'ibādallāhi ikhwānā", english: 'Do not envy one another, do not deceive one another, do not hate one another — be brothers in the worship of Allah.', theme: 'brotherhood' },
  { id: 'h35', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ', transliteration: "Ṭalabul-'ilmi farīḍatun 'alā kulli muslim", english: 'Seeking knowledge is an obligation upon every Muslim.', theme: 'knowledge' },
  { id: 'h36', source: 'Bukhari', narrator: 'Ibn Abbas', arabic: 'نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ الصِّحَّةُ وَالْفَرَاغُ', transliteration: "Ni'matāni maghbūnun fīhimā kathīrun minan-nās: aṣ-ṣiḥḥatu wal-farāgh", english: 'Two blessings that many people are cheated of: good health and free time.', theme: 'gratitude' },
  { id: 'h37', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'انْظُرُوا إِلَى مَنْ هُوَ أَسْفَلَ مِنْكُمْ وَلَا تَنْظُرُوا إِلَى مَنْ هُوَ فَوْقَكُمْ', transliteration: "Unẓurū ilā man huwa asfala minkum wa-lā tanẓurū ilā man huwa fawqakum", english: 'Look at those below you (in worldly terms) and do not look at those above you — it is more likely to keep you from despising Allah\'s favour.', theme: 'contentment' },
  { id: 'h38', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ', transliteration: "Ad-du'ā'u huwal-'ibādah", english: 'Dua (supplication) is worship.', theme: 'dua' },
  { id: 'h39', source: 'Ahmad', narrator: 'Shaddad ibn Aws', arabic: 'الْكَيِّسُ مَنْ دَانَ نَفْسَهُ وَعَمِلَ لِمَا بَعْدَ الْمَوْتِ', transliteration: "Al-kayyisu man dāna nafsahu wa-'amila limā ba'dal-mawt", english: 'The intelligent person is one who holds himself accountable and works for what comes after death.', theme: 'accountability' },
  { id: 'h40', source: 'Bukhari', narrator: 'Aisha', arabic: 'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', transliteration: "Innallāha jamīlun yuḥibbul-jamāl", english: 'Allah is beautiful and loves beauty.', theme: 'beauty' },
  { id: 'h41', source: 'Tirmidhi', narrator: 'Anas ibn Malik', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ ثَبَاتَ الْأَمْرِ وَالْعَزِيمَةَ عَلَى الرُّشْدِ', transliteration: "Allāhumma innī as'aluka thabātal-amri wal-'azīmata 'alar-rushd", english: 'O Allah, I ask You for steadfastness in my affairs and determination to be rightly guided.', theme: 'steadfastness' },
  { id: 'h42', source: 'Muslim', narrator: 'Jabir', arabic: 'لَا تَدَعُوا الدُّعَاءَ فَإِنَّهُ لَنْ يَهْلِكَ مَعَ الدُّعَاءِ أَحَدٌ', transliteration: "Lā tada'ud-du'ā'a fa-innahu lan yahlika ma'ad-du'ā'i aḥad", english: 'Do not abandon dua, for no one who makes dua will be destroyed.', theme: 'dua' },
  { id: 'h43', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'مَنْ تَوَاضَعَ لِلَّهِ رَفَعَهُ اللَّهُ', transliteration: "Man tawāḍa'a lillāhi rafa'ahullāh", english: 'Whoever humbles himself for Allah, Allah will raise him.', theme: 'humility' },
  { id: 'h44', source: 'Muslim', narrator: 'Abu Musa al-Ashari', arabic: 'مَثَلُ الْجَلِيسِ الصَّالِحِ وَالْجَلِيسِ السَّوْءِ كَمَثَلِ صَاحِبِ الْمِسْكِ وَكِيرِ الْحَدَّادِ', transliteration: "Mathalul-jalīṣiṣ-ṣāliḥi wal-jalīsiś-saw'i ka-mathali ṣāḥibil-miski wa-kīril-ḥaddād", english: 'The example of a good companion and a bad companion is like a musk seller and a blacksmith — one brings fragrance, the other smoke.', theme: 'companions' },
  { id: 'h45', source: 'Bukhari', narrator: 'Abdullah ibn Masud', arabic: 'هَلَكَ الْمُتَنَطِّعُونَ', transliteration: "Halakul-mutanaṭṭi'ūn", english: 'Destroyed are those who go to extremes (in religion).', theme: 'moderation' },
  { id: 'h46', source: 'Tirmidhi', narrator: 'Muadh ibn Jabal', arabic: 'رَأْسُ الْأَمْرِ الْإِسْلَامُ وَعَمُودُهُ الصَّلَاةُ وَذِرْوَةُ سَنَامِهِ الْجِهَادُ', transliteration: "Ra'sul-amril-islāmu wa-'amūduhus-ṣalātu wa-dhirwatu sanāmihil-jihād", english: 'The foundation of the matter is Islam, its pillar is prayer, and its peak is striving in Allah\'s cause.', theme: 'prayer' },
  { id: 'h47', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'حَقُّ الْمُسْلِمِ عَلَى الْمُسْلِمِ سِتٌّ', transliteration: "Ḥaqqul-muslimi 'alal-muslimi sittun", english: 'The Muslim has six rights over another Muslim: greeting, visiting the sick, following funerals, accepting invitations, returning sneezes, and well-wishing.', theme: 'community' },
  { id: 'h48', source: 'Bukhari', narrator: 'Anas ibn Malik', arabic: 'لَا يُؤْمِنُ عَبْدٌ حَتَّى يُحِبَّ لِجَارِهِ أَوْ قَالَ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', transliteration: "Lā yu'minu 'abdun ḥattā yuḥibba li-jārih aw qāla li-akhīhi mā yuḥibbu li-nafsih", english: 'A person does not truly believe until he loves for his neighbour what he loves for himself.', theme: 'brotherhood' },
  { id: 'h49', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'إِنَّ اللَّهَ يَبْسُطُ يَدَهُ بِاللَّيْلِ لِيَتُوبَ مُسِيءُ النَّهَارِ وَيَبْسُطُ يَدَهُ بِالنَّهَارِ لِيَتُوبَ مُسِيءُ اللَّيْلِ', transliteration: "Innallāha yabsuṭu yadahu bil-layli li-yatūba musī'un-nahāri wa-yabsuṭu yadahu bin-nahāri li-yatūba musī'ul-layl", english: 'Allah extends His hand at night to accept the repentance of those who sinned in the day, and extends His hand by day for those who sinned at night.', theme: 'repentance' },
  { id: 'h50', source: 'Bukhari', narrator: 'Aisha', arabic: 'خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ وَأَنَا خَيْرُكُمْ لِأَهْلِي', transliteration: "Khayrukum khayrukum li-ahlihi wa-ana khayrukum li-ahlī", english: 'The best of you are those who are best to their families, and I am the best of you to my family.', theme: 'family' },
  { id: 'h51', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'إِنَّ الرَّجُلَ لَيَبْلُغُ بِحُسْنِ خُلُقِهِ دَرَجَةَ الصَّائِمِ الْقَائِمِ', transliteration: "Innar-rajula la-yablughu biḥusni khuluqihi darajataṣ-ṣā'imil-qā'im", english: 'A person can reach the level of one who fasts and prays all night through their good character alone.', theme: 'character' },
  { id: 'h52', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ أَحَبُّ إِلَيَّ مِمَّا طَلَعَتْ عَلَيْهِ الشَّمْسُ', transliteration: "SubḥānAllāhi wa-biḥamdihi aḥabbu ilayya mimmā ṭala'at 'alayhish-shams", english: "Saying 'SubhanAllahi wa bihamdihi' is more beloved to me than all the sun shines upon.", theme: 'dhikr' },
  { id: 'h53', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ ثَقِيلَتَانِ فِي الْمِيزَانِ حَبِيبَتَانِ إِلَى الرَّحْمَنِ سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ', transliteration: "Kalimatāni khafīfatāni 'alal-lisāni thaqīlatāni fil-mīzāni ḥabībatāni ilar-Raḥmān: SubḥānAllāhi wa-biḥamdihi, SubḥānAllāhil-'Aẓīm", english: "Two words light on the tongue, heavy on the scale, beloved to the Most Merciful: 'SubhanAllahi wa bihamdihi, SubhanAllahil Adheem'.", theme: 'dhikr' },
  { id: 'h54', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'مَنْ قَالَ سُبْحَانَ اللَّهِ وَبِحَمْدِهِ فِي يَوْمٍ مِائَةَ مَرَّةٍ حُطَّتْ خَطَايَاهُ', transliteration: "Man qāla SubḥānAllāhi wa-biḥamdihi fī yawmin mi'ata marratin ḥuṭṭat khaṭāyāh", english: 'Whoever says SubhanAllahi wa bihamdihi 100 times in a day will have his sins wiped away.', theme: 'dhikr' },
  { id: 'h55', source: 'Muslim', narrator: 'Saad ibn Abi Waqqas', arabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ أَلِظُّوا', transliteration: "Yā dhal-jalāli wal-ikrāmi, aliẓẓū", english: 'Hold fast to saying: O Lord of Majesty and Honour.', theme: 'dhikr' },
  { id: 'h56', source: 'Ibn Majah', narrator: 'Abu Hurairah', arabic: 'مَنْ كَانَتْ لَهُ مَظْلَمَةٌ لِأَخِيهِ مِنْ عِرْضِهِ أَوْ شَيْءٍ فَلْيَتَحَلَّلْهُ مِنْهُ الْيَوْمَ', transliteration: "Man kānat lahu maẓlamatun li-akhīhi min 'irḍihi aw shay'in falyataḥallal minhu al-yawm", english: 'Whoever has wronged his brother in honour or anything else, let him seek his pardon today before the Day of Judgement.', theme: 'forgiveness' },
  { id: 'h57', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'يَقُولُ اللَّهُ تَعَالَى أَنَا عِنْدَ ظَنِّ عَبْدِي بِي وَأَنَا مَعَهُ إِذَا ذَكَرَنِي', transliteration: "Yaqūlullāhu ta'ālā: Anā 'inda ẓanni 'abdī bī, wa-anā ma'ahu idhā dhakaranī", english: 'Allah says: I am as My servant thinks of Me, and I am with him when he remembers Me.', theme: 'hope' },
  { id: 'h58', source: 'Tirmidhi', narrator: 'Abdullah ibn Abbas', arabic: 'إِذَا سَأَلْتَ فَاسْأَلِ اللَّهَ وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللَّهِ', transliteration: "Idhā sa'alta fas'alillāha wa-idhas-ta'anta fasta'in billāh", english: 'When you ask, ask Allah. When you seek help, seek it from Allah.', theme: 'tawakkul' },
  { id: 'h59', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'أَفْضَلُ الصِّيَامِ بَعْدَ رَمَضَانَ شَهْرُ اللَّهِ الْمُحَرَّمُ', transliteration: "Afḍaluṣ-ṣiyāmi ba'da Ramaḍāna shahru llāhil-Muḥarram", english: 'The best fasting after Ramadan is in the month of Allah, Al-Muharram.', theme: 'worship' },
  { id: 'h60', source: 'Bukhari', narrator: 'Umar ibn al-Khattab', arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', transliteration: "Innamal-a'mālu bin-niyyāt", english: 'Actions are only by intentions — every person receives what they intended.', theme: 'sincerity' },
  { id: 'h61', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَنْ أَحَبَّ لِقَاءَ اللَّهِ أَحَبَّ اللَّهُ لِقَاءَهُ', transliteration: "Man aḥabba liqā'allāhi aḥabbAllāhu liqā'ah", english: 'Whoever loves to meet Allah, Allah loves to meet them.', theme: 'afterlife' },
  { id: 'h62', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'كُلُّ ابْنِ آدَمَ خَطَّاءٌ وَخَيْرُ الْخَطَّائِينَ التَّوَّابُونَ', transliteration: "Kullu ibni Ādama khaṭṭā'un wa-khayrul-khaṭṭā'īnat-tawwābūn", english: 'Every son of Adam makes mistakes, and the best of those who make mistakes are those who repent.', theme: 'repentance' },
  { id: 'h63', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', transliteration: "Al-muslimu man salimail-muslimūna min lisānihi wa-yadih", english: 'The Muslim is the one from whose tongue and hand other Muslims are safe.', theme: 'character' },
  { id: 'h64', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ', transliteration: "Man ra'ā minkum munkaran falyughayyirhu bi-yadih", english: 'Whoever sees something wrong, let him change it with his hand; if not, then with his tongue; if not, then in his heart — and that is the weakest of faith.', theme: 'action' },
  { id: 'h65', source: 'Bukhari', narrator: 'Abdullah ibn Amr', arabic: 'مَنْ أَرَادَ أَنْ يُزَحْزَحَ عَنِ النَّارِ وَيُدْخَلَ الْجَنَّةَ فَلْتُدْرِكْهُ مَنِيَّتُهُ وَهُوَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ', transliteration: "Man arāda an yuzaḥzaḥa 'anin-nāri wa-yudkhalal-jannata faltudrik-hu maniyyatuhu wa-huwa yu'minu billāhi wal-yawmil-ākhir", english: 'Whoever wants to be removed from Hellfire and enter Paradise — let death come to him while he believes in Allah and the Last Day.', theme: 'faith' },
  { id: 'h66', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَا مِنْ أَيَّامٍ الْعَمَلُ الصَّالِحُ فِيهَا أَحَبُّ إِلَى اللَّهِ مِنْ هَذِهِ الْأَيَّامِ', transliteration: "Mā min ayyāmil-'amaluṣ-ṣāliḥu fīhā aḥabbu ilallāhi min hādhihil-ayyām", english: 'There are no days in which righteous deeds are more beloved to Allah than these (first ten days of Dhul-Hijjah).', theme: 'worship' },
  { id: 'h67', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'إِيَّاكُمْ وَالظَّنَّ فَإِنَّ الظَّنَّ أَكْذَبُ الْحَدِيثِ', transliteration: "Iyyākum waẓ-ẓanna fa-innaẓ-ẓanna akdhabul-ḥadīth", english: 'Beware of suspicion, for suspicion is the most false of speech.', theme: 'character' },
  { id: 'h68', source: 'Ahmad', narrator: 'Muadh ibn Jabal', arabic: 'أَلَا أُخْبِرُكَ بِرَأْسِ الْأَمْرِ وَعَمُودِهِ وَذِرْوَةِ سَنَامِهِ', transliteration: "Alā ukhbiruka bira'sil-amri wa-'amūdihi wa-dhirwati sanāmih", english: 'Hold fast to your tongue, remain in your house, and weep over your sins.', theme: 'piety' },
  { id: 'h69', source: 'Bukhari', narrator: 'Anas ibn Malik', arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا', transliteration: "Allāhumma lā sahla illā mā ja'altahu sahlan wa-anta taj'alul-ḥazna idhā shi'ta sahlan", english: 'O Allah, there is no ease except what You make easy, and You can make the difficult easy if You will.', theme: 'dua' },
  { id: 'h70', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'وَمَنْ يَتَصَبَّرْ يُصَبِّرْهُ اللَّهُ', transliteration: "Wa-man yataṣabbar yuṣabbir-hullāh", english: 'Whoever tries to be patient, Allah will grant him patience.', theme: 'patience' },
  { id: 'h71', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'أَعُوذُ بِاللَّهِ مِنَ الْهَمِّ وَالْحَزَنِ', transliteration: "A'ūdhu billāhi minal-hammi wal-ḥazan", english: 'I seek refuge in Allah from anxiety and grief.', theme: 'anxiety' },
  { id: 'h72', source: 'Tirmidhi', narrator: 'Abu Hurairah', arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْجُبْنِ وَالْبُخْلِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ', transliteration: "Allāhumma innī a'ūdhu bika minal-hammi wal-ḥazani wal-'ajzi wal-kasali wal-jubni wal-bukhli wa-ḍala'id-dayni wa-ghalabatir-rijāl", english: 'O Allah, I seek refuge in You from worry, grief, incapacity, laziness, cowardice, miserliness, overwhelming debt, and being overpowered by people.', theme: 'anxiety' },
  { id: 'h73', source: 'Tirmidhi', narrator: 'Asma bint Umays', arabic: 'حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ', transliteration: "Ḥasbiyallāhu wa-ni'mal-wakīl", english: 'Allah is sufficient for me, and what an excellent Trustee He is.', theme: 'tawakkul' },
  { id: 'h74', source: 'Ahmad', narrator: 'Anas ibn Malik', arabic: 'لَا تَعْجِزْ وَإِنْ أَصَابَكَ شَيْءٌ فَلَا تَقُلْ لَوْ أَنِّي فَعَلْتُ كَانَ كَذَا وَكَذَا', transliteration: "Lā ta'jiz wa-in aṣābaka shay'un fa-lā taqul: law annī fa'altu kāna kadhā wa-kadhā", english: 'Do not give up, and if something afflicts you do not say "if only I had done this" — for "if only" opens the door to Satan.', theme: 'resilience' },
  { id: 'h75', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'الْمُؤْمِنُ لَا يُلْدَغُ مِنْ جُحْرٍ وَاحِدٍ مَرَّتَيْنِ', transliteration: "Al-mu'minu lā yuldag min juḥrin wāḥidin marratayni", english: 'A believer is not bitten from the same hole twice.', theme: 'wisdom' },
  { id: 'h76', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'إِذَا دَخَلَ شَهْرُ رَمَضَانَ فُتِّحَتْ أَبْوَابُ الْجَنَّةِ', transliteration: "Idhā dakhala shahru Ramaḍāna futtiḥat abwābul-jannah", english: 'When Ramadan enters, the gates of Paradise are opened, the gates of Hell are closed, and the devils are chained.', theme: 'worship' },
  { id: 'h77', source: 'Bukhari', narrator: 'Abu Hurairah', arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ ضَيْفَهُ', transliteration: "Man kāna yu'minu billāhi wal-yawmil-ākhiri falyukrim ḍayfah", english: 'Whoever believes in Allah and the Last Day should honour his guest.', theme: 'hospitality' },
  { id: 'h78', source: 'Bukhari', narrator: 'Abdullah ibn Amr', arabic: 'أَرْبَعٌ مَنْ كُنَّ فِيهِ كَانَ مُنَافِقًا خَالِصًا', transliteration: "Arba'un man kunna fīhi kāna munāfiqan khāliṣan", english: 'Four traits mark a true hypocrite: lying when speaking, betrayal of trust, breaking promises, and shameless hostility.', theme: 'character' },
  { id: 'h79', source: 'Muslim', narrator: 'Abu Hurairah', arabic: 'مَنْ صَلَّى عَلَيَّ وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا', transliteration: "Man ṣallā 'alayya wāḥidatan ṣallallāhu 'alayhi 'ashrā", english: 'Whoever sends one blessing upon me, Allah sends ten blessings upon him.', theme: 'dhikr' },
  { id: 'h80', source: 'Tirmidhi', narrator: 'Abdullah ibn Masud', arabic: 'مَا أَصَابَ أَحَدٌ قَطُّ هَمٌّ وَلَا حَزَنٌ فَقَالَ اللَّهُمَّ إِنِّي عَبْدُكَ وَابْنُ عَبْدِكَ إِلَّا فَرَّجَ اللَّهُ عَنْهُ', transliteration: "Mā aṣāba aḥadun qaṭṭu hammun wa-lā ḥazanun fa-qāla: Allāhumma innī 'abduka wabnu 'abdika ... illā farraja llāhu 'anh", english: 'No person was ever struck with worry or grief and said the dua of distress (Dua of Prophet Yunus) except that Allah relieved them.', theme: 'anxiety' }
]

async function main() {
  console.log('Fetching Quran verses from alquran.cloud...')

  const pool = []
  let fetched = 0
  let failed = 0

  for (const ref of VERSE_REFS) {
    const [s, a] = ref
    try {
      const [arRes, enRes, trRes] = await Promise.all([
        get(`https://api.alquran.cloud/v1/ayah/${s}:${a}/ar.alafasy`),
        get(`https://api.alquran.cloud/v1/ayah/${s}:${a}/en.sahih`),
        get(`https://api.alquran.cloud/v1/surah/${s}`)
      ])

      if (arRes.code !== 200 || enRes.code !== 200) {
        failed++
        continue
      }

      const arabic = arRes.data
      const english = enRes.data
      const surahMeta = trRes.data

      pool.push({
        id: `${s}:${a}`,
        type: 'quran',
        surah_number: s,
        ayah_number: a,
        surah_name_english: surahMeta.englishName || arabic.surah.englishName,
        surah_name_arabic:  arabic.surah.name,
        arabic_text:        arabic.text,
        transliteration:    '',   // alquran.cloud doesn't have transliteration free; kept blank, filled later
        english_translation: english.text
      })

      fetched++
      if (fetched % 20 === 0) console.log(`  ${fetched} verses fetched...`)

      await new Promise(r => setTimeout(r, 80)) // rate limit
    } catch (e) {
      failed++
      console.warn(`  Failed ${s}:${a}:`, e.message)
    }
  }

  console.log(`\nQuran: ${fetched} fetched, ${failed} failed`)

  // Add hadiths
  const hadithPool = HADITHS.map(h => ({ ...h, type: 'hadith' }))
  console.log(`Hadiths: ${hadithPool.length} compiled`)

  // Write both files
  const outDir = path.join(__dirname, '../assets')
  fs.writeFileSync(path.join(outDir, 'quran_pool.json'), JSON.stringify(pool, null, 2))
  fs.writeFileSync(path.join(outDir, 'hadith_pool.json'), JSON.stringify(hadithPool, null, 2))

  console.log(`\n✓ quran_pool.json  — ${pool.length} verses`)
  console.log(`✓ hadith_pool.json — ${hadithPool.length} hadiths`)
  console.log('\nDone.')
}

main().catch(console.error)
