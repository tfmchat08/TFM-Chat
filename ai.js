// ---------- فاهم: مساعد الذكاء الاصطناعي (ومساعد الدكتور للأدمن) ----------

// اسم وظيفة الذكاء الاصطناعي في Supabase: الموقع الأساسي ai-chat، والتجريبي ai-chat-test
const AI_FUNCTION = 'ai-chat';
const AI_ICON = '<img src="ai-icon.png" alt="">';
const AI_MAX_FILE = 5 * 1024 * 1024;
const AI_BOOK_MAX = 50 * 1024 * 1024;
const AI_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const ROOMS = ['ar-1', 'ar-2', 'ar-3', 'ar-4', 'en-1', 'en-2', 'en-3', 'en-4'];
const CHUNK_MAX = 1200;

let aiRoom = null;
let aiBusy = false;
let aiPending = null;
let aiLangMode = lang; // يتبع لغة الصفحة، والزرار جوه الشات بيغيّرها للجلسة دي بس

$('ai-open').innerHTML = AI_ICON;
document.querySelectorAll('.ai-avatar').forEach(el => { el.innerHTML = AI_ICON; });

// الدكتور = الأدمن
function aiIsDoctor() {
  return !!currentProfile && currentProfile.role === 'admin';
}

// وضع الامتحان: بيتفعل بالعبارة دي (للأدمن بس) وبيتقفل بعبارة الإيقاف
const EXAM_ON = 'تفعيل تسجيل الامتحان';
const EXAM_OFF = 'إيقاف وضع الامتحان';
let aiExamMode = false;

// ---------- الصوت (بيشتغل في المتصفح، من غير مفاتيح ومن غير تكلفة) ----------
const AI_VOICE_KEY = 'ai_voice_reply';
const AI_SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let aiRec = null;
let aiListening = false;
let aiRecBase = '';
let aiRecText = '';
let aiRecErr = null;

const AI_TXT = {
  listening: { ar: 'بسمعك... اضغط ⏹️ لما تخلص', en: 'Listening... tap ⏹️ when you finish' },
  think: { ar: 'بفكر...', en: 'Thinking...' },
  speak: { ar: '🔊 بتكلم... اضغط هنا للإيقاف', en: '🔊 Speaking... tap here to stop' },
  noMic: { ar: 'المتصفح ده مش بيدعم الرسايل الصوتية. جرّب Chrome.', en: 'This browser does not support voice input. Try Chrome.' },
  micFail: { ar: 'ما قدرتش أشغّل الميكروفون، جرّب تاني.', en: "Couldn't start the microphone, try again." },
  noSpeech: { ar: 'ما سمعتش كلام، جرّب تاني.', en: "I didn't hear anything, try again." },
  denied: { ar: 'الميكروفون مقفول. اسمح للمتصفح يستخدمه من 🔒 جنب العنوان.', en: 'Microphone is blocked. Allow it from the 🔒 icon next to the address.' },
  noDevice: { ar: 'مفيش ميكروفون متوصل بالجهاز.', en: 'No microphone found on this device.' },
  netErr: { ar: 'تحويل الكلام لنص محتاج إنترنت، والاتصال مش مستقر دلوقتي.', en: 'Speech recognition needs internet, and the connection is unstable.' },
};

function tr(k) {
  const x = AI_TXT[k];
  return aiLangMode === 'en' ? x.en : x.ar;
}

function aiSetStatus(text, kind = '') {
  const el = $('ai-status');
  if (!el) return;
  el.textContent = text || '';
  el.className = 'ai-status' + (kind ? ' ' + kind : '') + (text ? '' : ' hidden');
  el.onclick = kind === 'speak' ? aiStopSpeaking : null;
}

function aiVoiceOn() {
  try { return localStorage.getItem(AI_VOICE_KEY) !== 'off'; } catch { return true; }
}

function aiSetVoiceOn(on) {
  try { localStorage.setItem(AI_VOICE_KEY, on ? 'on' : 'off'); } catch {}
}

function applySpeakBtn() {
  const b = $('ai-speak');
  if (!b) return;
  const on = aiVoiceOn();
  b.textContent = (on ? '🔊 ' : '🔇 ') + (aiLangMode === 'en' ? 'Voice replies' : 'الرد الصوتي');
  b.title = aiLangMode === 'en'
    ? (on ? 'Voice replies: on' : 'Voice replies: off')
    : (on ? 'الرد الصوتي: شغال' : 'الرد الصوتي: مقفول');
}

function setMicUI() {
  const b = $('ai-mic');
  if (!b) return;
  // الأيقونة بتفضل زي ما هي، والحالة بتتغير بالكلاس بس (زي زرار الريكورد في الشات)
  b.classList.toggle('mic-on', aiListening);
  b.title = aiListening
    ? (aiLangMode === 'en' ? 'Stop' : 'إيقاف')
    : (aiLangMode === 'en' ? 'Voice message' : 'رسالة صوتية');
}

// يشيل الماركداون والإيموجي والروابط علشان الصوت يبقى نظيف
function cleanForSpeech(s) {
  return String(s || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_#`~>|]/g, ' ')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

// يقسم الرد لجمل قصيرة، عشان المتصفح ما يقطعش الكلام الطويل
function splitForSpeech(s) {
  const sentences = s.match(/[^.!?؟]+[.!?؟]?/g) || [s];
  const out = [];
  let cur = '';
  for (const x of sentences) {
    const t = x.trim();
    if (!t) continue;
    if (cur && (cur + ' ' + t).length > 200) {
      out.push(cur);
      cur = t;
    } else {
      cur = cur ? cur + ' ' + t : t;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function aiStopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if ($('ai-status') && $('ai-status').classList.contains('speak')) aiSetStatus('');
}

// يختار أحسن صوت ذكر موجود في الجهاز، وإلا أي صوت متاح بنفس اللغة
function pickVoice() {
  const wantEn = aiLangMode === 'en';
  const pool = window.speechSynthesis.getVoices()
    .filter(v => v.lang && v.lang.toLowerCase().startsWith(wantEn ? 'en' : 'ar'));
  if (!pool.length) return null;
  if (wantEn) return pool.find(v => /david|mark|male|guy|daniel/i.test(v.name)) || pool[0];
  const male = /hamed|majed|maged|naayf|male|حامد|ماجد/i;
  const female = /salma|zariyah|female|سلمى/i;
  return pool.find(v => male.test(v.name))
    || pool.find(v => !female.test(v.name))
    || pool[0];
}

function aiSpeak(text) {
  if (!('speechSynthesis' in window)) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const voice = pickVoice();
  const parts = splitForSpeech(clean);

  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = aiLangMode === 'en' ? 'en-US' : 'ar-EG';
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 0.8; // صوت أعمق شوية
    u.onstart = () => { if (i === 0) aiSetStatus(tr('speak'), 'speak'); };
    u.onend = () => { if (i === parts.length - 1) aiSetStatus(''); };
    u.onerror = () => { aiSetStatus(''); };
    synth.speak(u);
  });
}

function aiStartMic() {
  if (!aiRoom || aiBusy || aiListening) return;
  if (!AI_SR) return aiSetStatus(tr('noMic'), 'error');

  aiStopSpeaking();
  const rec = new AI_SR();
  rec.lang = aiLangMode === 'en' ? 'en-US' : 'ar-EG';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  aiRecBase = $('ai-input').value.trim();
  aiRecText = '';
  aiRecErr = null;

  rec.onstart = () => {
    aiListening = true;
    setMicUI();
    aiSetStatus(tr('listening'), 'listen');
  };

  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) aiRecText += r[0].transcript;
      else interim += r[0].transcript;
    }
    $('ai-input').value = (aiRecBase + ' ' + aiRecText + interim).trim();
  };

  rec.onerror = e => {
    aiRecErr = e.error || 'unknown';
  };

  rec.onend = () => {
    aiListening = false;
    aiRec = null;
    setMicUI();

    // اتلغى (مثلاً قفلنا الشات): ما نبعتش حاجة
    if (aiRecErr === 'aborted') { aiSetStatus(''); return; }

    if (aiRecErr) {
      const map = {
        'not-allowed': 'denied',
        'service-not-allowed': 'denied',
        'audio-capture': 'noDevice',
        'network': 'netErr',
        'no-speech': 'noSpeech',
      };
      aiSetStatus(tr(map[aiRecErr] || 'micFail'), 'error');
      return;
    }

    const text = ($('ai-input').value || '').trim();
    if (!text) { aiSetStatus(tr('noSpeech'), 'error'); return; }

    aiSetStatus('');
    aiSend(true); // الكلام اتحول لنص وبيتبعت للشات لوحده
  };

  aiRec = rec;
  try {
    rec.start();
  } catch (e) {
    aiRec = null;
    aiListening = false;
    setMicUI();
    aiSetStatus(tr('micFail'), 'error');
  }
}

function aiStopMic() {
  if (aiRec) { try { aiRec.stop(); } catch {} }
}

function aiCancelMic() {
  if (aiRec) {
    aiRecErr = 'aborted';
    try { aiRec.abort(); } catch {}
  }
}

function aiScanExam(texts, start = false) {
  if (!aiIsDoctor()) return false;
  let on = start;
  const onN = aiNorm(EXAM_ON);
  const offN = aiNorm(EXAM_OFF);
  for (const x of texts) {
    const n = aiNorm(x);
    if (n.includes(offN)) on = false;
    else if (n.includes(onN)) on = true;
  }
  return on;
}

function aiNorm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ');
}

// الاسم بالعربي والإنجليزي: فاهم، ولما وضع الامتحان يتفعل يبقى مساعد الدكتور
function aiNames() {
  return aiExamMode
    ? { ar: 'مساعد الدكتور', en: 'Doctor Assistant' }
    : { ar: 'فهيم', en: 'Faheem' };
}

function aiName() {
  const n = aiNames();
  return aiLangMode === 'en' ? n.en : n.ar;
}

function aiRoomTitle(room) {
  const parts = room.split('-');
  const trk = parts[0] === 'ar' ? t('trkAr') : t('trkEn');
  const lvl = t('lvl' + parts[1]);
  return `${trk} · ${lvl}`;
}

// الترحيب: "أهلا وسهلا يا دكتور" بتظهر بس بعد تفعيل وضع الامتحان، والملحوظة بتتقال مرة واحدة في أول رسالة (من السيرفر)
function greetingText() {
  if (aiLangMode === 'en') {
    return "Welcome, I'm Faheem, your AI assistant 🤖\nWrite to me in English, Arabic or any language. I can explain, solve problems, search the web, and review images you send me. I also answer from the course books when they are available.";
  }
  return 'أهلا وسهلا معاك فهيم 🤖\nكلمني بالمصري أو بالإنجليزي أو أي لغة. أقدر أشرح وأحل وأبحث على النت، وأرد عليك من كتب المادة، ولو بعتلي صورة أقدر أحللها أو أعدّلها لك.';
}

// اقتراحات أسئلة جاهزة تظهر في الشات الفاضي (3 عشوائيين)
const AI_SUGGESTIONS = {
  ar: [
    'اشرح لي مفهوم العرض والطلب بمثال بسيط',
    'ازاي أحسب نسبة الربح من التكلفة؟',
    'لخصلي أهم نقط في محاسبة التكاليف',
    'اديني 5 أسئلة مراجعة على أي مادة',
    'اشرح الفرق بين الأصول والخصوم',
    'ازاي أكتب سيرة ذاتية قوية؟',
    'اعملي جدول مذاكرة لأسبوع امتحانات',
    'اشرح لي الميزانية العمومية ببساطة',
  ],
  en: [
    'Explain supply and demand with a simple example',
    'How do I calculate profit margin from cost?',
    'Summarize the key points of cost accounting',
    'Give me 5 review questions on any subject',
    'Explain the difference between assets and liabilities',
    'Help me write a strong CV',
    'Make a one-week study plan for exams',
    'Explain the balance sheet simply',
  ],
};

function aiRandomSuggestions(n = 3) {
  const pool = [...(aiLangMode === 'en' ? AI_SUGGESTIONS.en : AI_SUGGESTIONS.ar)];
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function appendAiSuggestions() {
  const box = $('ai-messages');
  const wrap = document.createElement('div');
  wrap.className = 'ai-suggest';
  aiRandomSuggestions(3).forEach(q => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ai-chip';
    b.textContent = q;
    // بيحط السؤال في خانة الكتابة، والطالب يبعته بنفسه
    b.onclick = () => { $('ai-input').value = q; $('ai-input').focus(); };
    wrap.appendChild(b);
  });
  box.appendChild(wrap);
}

function appendAiBubble(role, text, extra = '') {
  const box = $('ai-messages');
  const div = document.createElement('div');
  div.className = 'ai-msg ' + (role === 'user' ? 'mine' : 'bot') + (extra ? ' ' + extra : '');
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

// أزرار تحت آخر رد بس: احفظ كارت، لخّص، اختبرني
const CARD_PROMPT = 'من الرد اللي فوق اعمل كارت مذاكرة. رجّع JSON بس من غير أي كلام قبله أو بعده، بالشكل ده بالظبط: {"q":"السؤال","a":"الجواب"}';
const CARDS_KEY = 'fahem_cards';

function appendAiReply(text) {
  document.querySelectorAll('.ai-actions').forEach(x => x.remove());
  appendAiBubble('model', text);
  const en = aiLangMode === 'en';
  const bar = document.createElement('div');
  bar.className = 'ai-actions';
  const actions = [
    [en ? '🧠 Save card' : '🧠 احفظ كارت', () => aiSend(false, {
      display: en ? 'Save a card from the reply above' : 'احفظ كارت من الرد اللي فوق',
      text: CARD_PROMPT,
      card: true,
    })],
    [en ? '📝 Summarize' : '📝 لخّص', () => aiSend(false, {
      display: en ? 'Summarize the reply above' : 'لخّص الرد اللي فوق',
      text: en ? 'Summarize the reply above in 3 short points.' : 'لخّص الرد اللي فوق في 3 نقط قصيرة.',
    })],
    [en ? '❓ Quiz me' : '❓ اختبرني', () => aiSend(false, {
      display: en ? 'Quiz me on the reply above' : 'اختبرني على الرد اللي فوق',
      text: en
        ? 'Make 3 multiple-choice questions based on the reply above, with 4 options each. Do not reveal the correct answers until I reply.'
        : 'اعملي 3 أسئلة اختيار من متعدد على الرد اللي فوق، كل سؤال فيه 4 اختيارات. ماتقولش الإجابات الصح غير لما أجاوب.',
    })],
  ];
  actions.forEach(([label, fn]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.onclick = fn;
    bar.appendChild(b);
  });
  $('ai-messages').appendChild(bar);
}

function loadCards() {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || '[]'); } catch { return []; }
}

function saveCards(list) {
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(list)); } catch {}
}

function saveCard(reply) {
  const m = String(reply || '').match(/\{[\s\S]*\}/);
  let card = null;
  try { card = m ? JSON.parse(m[0]) : null; } catch {}
  if (!card || !card.q || !card.a) {
    return appendAiBubble('model', aiLangMode === 'en' ? "Couldn't make a card, try again." : 'ما قدرتش أعمل الكارت، جرّب تاني.');
  }
  const list = loadCards();
  list.push({ q: String(card.q), a: String(card.a), room: aiRoom, at: Date.now() });
  saveCards(list);
  appendAiBubble('model', (aiLangMode === 'en' ? '🧠 Card saved: ' : '🧠 اتحفظ الكارت: ') + card.q);
}

function showCards() {
  const mine = loadCards().filter(c => c.room === aiRoom);
  if (!mine.length) {
    return appendAiBubble('model', aiLangMode === 'en' ? 'No cards in this room yet.' : 'مفيش كروت في الشعبة دي لسه.');
  }
  mine.forEach((c, i) => appendAiBubble('model', `${i + 1}. ❓ ${c.q}\n✅ ${c.a}`));
}

function applyAiLabels() {
  const n = aiNames();
  $('ai-name-ar').textContent = n.ar;
  $('ai-name-en').textContent = n.en;
  $('ai-open').title = aiLangMode === 'en' ? n.en : n.ar;
  $('ai-room-label').textContent = aiRoom ? aiRoomTitle(aiRoom) : '';
  $('ai-back-text').textContent = aiLangMode === 'en' ? 'Back' : 'رجوع';
  $('ai-lang').textContent = aiLangMode === 'en' ? 'عربي' : 'EN';
  $('ai-input').placeholder = aiLangMode === 'en' ? `Write to ${n.en}...` : `اكتب لـ${n.ar}...`;
  $('ai-attach').title = aiLangMode === 'en' ? 'Attach an image' : 'ارفع صورة';
  applySpeakBtn();
  setMicUI();
}

async function renderAiHistory() {
  const box = $('ai-messages');
  box.innerHTML = '';

  const { data, error } = await sb.from('ai_messages')
    .select('role, content')
    .eq('room', aiRoom)
    .order('id', { ascending: true })
    .limit(200);

  if (error) {
    appendAiBubble('model', '⚠️ ' + error.message);
    return;
  }

  aiExamMode = aiScanExam((data || []).slice(-30).filter(m => m.role === 'user').map(m => m.content));
  applyAiLabels();

  if (!data || !data.length) {
    appendAiBubble('model', greetingText());
    appendAiSuggestions();
    return;
  }

  data.forEach(m => (m.role === 'user' ? appendAiBubble('user', m.content) : appendAiReply(m.content)));
  box.scrollTop = box.scrollHeight;
}

async function openAiChat(room) {
  aiRoom = room;
  aiLangMode = lang; // كل ما تفتح الشات، المساعد يتبع لغة الصفحة
  $('ai-chat-screen').classList.remove('hidden');
  applyAiLabels();
  await renderAiHistory();
}

function closeAiScreen() {
  aiCancelMic();
  aiStopSpeaking();
  aiSetStatus('');
  $('ai-chat-screen').classList.add('hidden');
}

function readFileB64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

function clearAiFile() {
  aiPending = null;
  $('ai-file-name').textContent = '';
  $('ai-file-name').classList.add('hidden');
}

// fromVoice = true لما الرسالة جاية من الميكروفون، وقتها الرد بيتقري بصوت
// opts: text = نص مختلف عن اللي المستخدم كتبه، display = اللي يظهر في الشات، card = احفظ الرد ككارت
async function aiSend(fromVoice = false, opts = {}) {
  if (aiBusy || !aiRoom) return;
  const text = opts.text !== undefined ? opts.text : $('ai-input').value.trim();
  if (!text && !aiPending) return;

  const shown = ((opts.display ?? text) + (aiPending ? `\n📎 ${aiPending.name}` : '')).trim();
  appendAiBubble('user', shown);

  const payload = { room: aiRoom, message: text, lang: aiLangMode };
  if (aiPending) {
    payload.file = { name: aiPending.name, mime: aiPending.mime, data: aiPending.data };
  }

  if (opts.text === undefined) $('ai-input').value = '';
  clearAiFile();

  aiBusy = true;
  $('ai-send').disabled = true;
  $('ai-mic').disabled = true;
  const thinking = appendAiBubble('model', aiLangMode === 'en' ? `${aiName()} is thinking...` : `${aiName()} بيفكر...`, 'thinking');
  aiSetStatus(tr('think'), 'think');

  try {
    const { data: sess } = await sb.auth.getSession();
    const token = sess.session ? sess.session.access_token : null;
    if (!token) throw new Error(aiLangMode === 'en' ? 'Please log in again' : 'سجّل دخول تاني');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/${AI_FUNCTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify(payload)
    });

    const j = await res.json().catch(() => ({}));
    thinking.remove();
    if (!res.ok) throw new Error(j.error || ('Error ' + res.status));
    if (opts.card) saveCard(j.reply);
    else appendAiReply(j.reply);
    const wasExam = aiExamMode;
    aiExamMode = aiScanExam([text], aiExamMode);
    applyAiLabels();
    if (!wasExam && aiExamMode) {
      appendAiBubble('model', aiLangMode === 'en'
        ? 'Welcome, Doctor. Exam mode is on ✅'
        : 'أهلا وسهلا يا دكتور، وضع الامتحان اتفعّل ✅');
    }
    aiSetStatus('');
    if (fromVoice && aiVoiceOn()) aiSpeak(j.reply);
  } catch (e) {
    thinking.remove();
    aiSetStatus('');
    appendAiBubble('model', '⚠️ ' + e.message);
  } finally {
    aiBusy = false;
    $('ai-send').disabled = false;
    $('ai-mic').disabled = false;
  }
}

// ---------- قراية الكتب في المتصفح (pdf.js) ----------
let pdfJsReady = null;

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve();
  if (pdfJsReady) return pdfJsReady;
  pdfJsReady = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    s.onerror = () => reject(new Error('pdf.js load failed'));
    document.head.appendChild(s);
  });
  return pdfJsReady;
}

async function extractBookPages(file) {
  await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
    if (text) pages.push({ page: i, text });
  }
  return pages;
}

function makeChunks(pages) {
  const out = [];
  for (const p of pages) {
    let cur = '';
    for (const w of p.text.split(' ')) {
      if (cur && (cur + ' ' + w).length > CHUNK_MAX) {
        out.push({ page: p.page, text: cur.trim() });
        cur = w;
      } else {
        cur = cur ? cur + ' ' + w : w;
      }
    }
    if (cur.trim()) out.push({ page: p.page, text: cur.trim() });
  }
  return out;
}

// ---------- كتب المساعد (الأدمن) ----------
async function loadAiBooksAdmin() {
  const box = $('ai-books-admin');
  box.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = lang === 'en' ? '📚 Assistant books' : '📚 كتب المساعد';
  box.appendChild(title);

  const form = document.createElement('div');
  form.className = 'ai-book-form';

  const sel = document.createElement('select');
  ROOMS.forEach(r => {
    const o = document.createElement('option');
    o.value = r;
    o.textContent = aiRoomTitle(r);
    sel.appendChild(o);
  });

  const file = document.createElement('input');
  file.type = 'file';
  file.accept = 'application/pdf';

  const up = document.createElement('button');
  up.type = 'button';
  up.className = 'primary';
  up.textContent = lang === 'en' ? 'Upload book' : 'ارفع الكتاب';
  up.onclick = () => uploadBook(sel.value, file, up);

  form.appendChild(sel);
  form.appendChild(file);
  form.appendChild(up);
  box.appendChild(form);

  const list = document.createElement('div');
  list.className = 'ai-book-list';
  box.appendChild(list);

  const { data, error } = await sb.from('ai_books').select('id, room, title, path').order('id', { ascending: true });
  if (error) {
    list.textContent = error.message;
    return;
  }
  if (!data || !data.length) {
    list.textContent = lang === 'en' ? 'No books yet' : 'مفيش كتب لسه';
    return;
  }

  data.forEach(b => {
    const row = document.createElement('div');
    row.className = 'ai-book-row';
    const info = document.createElement('span');
    info.textContent = `${aiRoomTitle(b.room)} · ${b.title}`;
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger-btn';
    del.textContent = '🗑️';
    del.onclick = () => deleteBook(b);
    row.appendChild(info);
    row.appendChild(del);
    list.appendChild(row);
  });
}

async function uploadBook(room, fileInput, btn) {
  const f = fileInput.files[0];
  if (!f) return alert(lang === 'en' ? 'Choose a PDF first' : 'اختار ملف PDF الأول');
  if (f.type !== 'application/pdf') return alert(lang === 'en' ? 'PDF files only' : 'PDF بس');
  if (f.size > AI_BOOK_MAX) return alert(lang === 'en' ? 'Max 50 MB' : 'أقصى حجم 50 ميجا');

  const oldText = btn.textContent;
  btn.disabled = true;
  try {
    btn.textContent = lang === 'en' ? 'Reading the book...' : 'بقرا الكتاب...';
    const pages = await extractBookPages(f);
    const chunks = makeChunks(pages);
    if (!chunks.length) {
      alert(lang === 'en'
        ? 'No readable text in this PDF (scanned images are not supported)'
        : 'الملف ده مفيهوش نص مقروء (الصور الممسوحة مش بتتقري)');
      return;
    }

    btn.textContent = lang === 'en' ? 'Uploading...' : 'برفع الملف...';
    const safeName = f.name.replace(/[^\w.\-]/g, '_');
    const path = `${room}/${Date.now()}_${safeName}`;
    const { error: upErr } = await sb.storage.from('books').upload(path, f, { contentType: 'application/pdf' });
    if (upErr) return alert(upErr.message);

    const { data: book, error } = await sb.from('ai_books')
      .insert({ room, title: f.name, path, size_bytes: f.size })
      .select('id')
      .single();
    if (error) return alert(error.message);

    const rows = chunks.map(c => ({ book_id: book.id, room, page: c.page, content: c.text }));
    for (let i = 0; i < rows.length; i += 100) {
      btn.textContent = `${lang === 'en' ? 'Indexing' : 'بفهرس'} ${Math.min(i + 100, rows.length)}/${rows.length}`;
      const { error: chErr } = await sb.from('ai_book_chunks').insert(rows.slice(i, i + 100));
      if (chErr) return alert(chErr.message);
    }

    fileInput.value = '';
    alert(lang === 'en'
      ? `Book uploaded and indexed (${rows.length} parts).`
      : `الكتاب اترفع واتفهرس (${rows.length} جزء).`);
  } catch (e) {
    alert((lang === 'en' ? 'Upload failed: ' : 'فشل الرفع: ') + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
    await loadAiBooksAdmin();
  }
}

async function deleteBook(b) {
  if (!confirm(lang === 'en' ? 'Delete this book?' : 'تمسح الكتاب ده؟')) return;
  const { error: stErr } = await sb.storage.from('books').remove([b.path]);
  if (stErr) return alert(stErr.message);
  const { error } = await sb.from('ai_books').delete().eq('id', b.id);
  if (error) return alert(error.message);
  await loadAiBooksAdmin();
}

// ---------- الأحداث ----------
$('ai-open').onclick = () => openAiChat(currentRoom());

$('ai-chat-back').onclick = closeAiScreen;

$('ai-lang').onclick = async () => {
  toggleLang(); // بيقلب الصفحة كلها عربي/إنجليزي
  aiLangMode = lang;
  applyAiLabels();
  if (typeof renderPinned === 'function') renderPinned();
  if (currentProfile) loadMessages(); // عشان الوقت والنصوص تتحدث
  await renderAiHistory();
};

// الكروت: عرض كروت الشعبة الحالية
$('ai-cards').onclick = () => showCards();

// أعد الرد: بيمسح آخر رد ويبعت آخر سؤال تاني
$('ai-regen').onclick = async () => {
  if (aiBusy || !aiRoom) return;
  const { data, error } = await sb.from('ai_messages')
    .select('id, role, content')
    .eq('room', aiRoom)
    .order('id', { ascending: false })
    .limit(2);
  if (error) return alert(error.message);
  const [last, prev] = data || [];
  if (!last || last.role !== 'model' || !prev || prev.role !== 'user') {
    return alert(aiLangMode === 'en' ? 'Nothing to regenerate yet' : 'مفيش رد أقدر أعيده دلوقتي');
  }
  const { error: delErr } = await sb.from('ai_messages').delete().in('id', [last.id, prev.id]);
  if (delErr) return alert(delErr.message);
  const question = prev.content.replace(/ \[ملف: .*\]$/, '').trim();
  await renderAiHistory();
  $('ai-input').value = question;
  aiSend(false);
};

$('ai-clear').onclick = async () => {
  if (!aiRoom) return;
  if (!confirm(aiLangMode === 'en' ? 'Clear this chat?' : 'تمسح المحادثة دي؟')) return;
  const { error } = await sb.from('ai_messages').delete().eq('room', aiRoom);
  if (error) return alert(error.message);
  await renderAiHistory();
};

$('ai-attach').onclick = () => $('ai-file').click();

$('ai-file').onchange = async () => {
  const f = $('ai-file').files[0];
  $('ai-file').value = '';
  if (!f) return;

  if (!AI_MIME.includes(f.type)) {
    return alert(aiLangMode === 'en' ? 'Only image files are supported' : 'حالياً بنقبل صور بس (PNG أو JPG أو WEBP)');
  }
  if (f.size > AI_MAX_FILE) {
    return alert(aiLangMode === 'en' ? 'Max file size is 5 MB' : 'أقصى حجم للملف 5 ميجا');
  }

  try {
    const data = await readFileB64(f);
    aiPending = { name: f.name, mime: f.type, data };
    $('ai-file-name').textContent = '📎 ' + f.name + (aiLangMode === 'en' ? '  (tap to remove)' : '  (اضغط للإلغاء)');
    $('ai-file-name').classList.remove('hidden');
  } catch {
    alert(aiLangMode === 'en' ? 'Could not read the file' : 'ما قدرتش أقرأ الملف');
  }
};

$('ai-file-name').onclick = clearAiFile;

// الميكروفون: بيبدأ بضغطة من المستخدم بس، ولما يخلص بيبعت الكلام للشات لوحده
$('ai-mic').onclick = () => {
  if (aiListening) aiStopMic();
  else aiStartMic();
};

// زرار الرد الصوتي: يشغّل أو يقفل قراية الردود
$('ai-speak').onclick = () => {
  const on = !aiVoiceOn();
  aiSetVoiceOn(on);
  if (!on) aiStopSpeaking();
  applySpeakBtn();
};

$('ai-send').onclick = () => aiSend(false);
$('ai-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') aiSend(false);
});

// ---------- إعدادات فهيم ----------
function closeAiSettings() {
  $('ai-settings-modal').classList.add('hidden');
}

$('ai-settings-btn').onclick = () => {
  const isAdmin = !!(currentProfile && currentProfile.role === 'admin');
  $('ai-books-open').classList.toggle('hidden', !isAdmin);
  $('ai-settings-modal').classList.remove('hidden');
};
$('ai-settings-close').onclick = closeAiSettings;

// زرار إضافة الكتب (الأدمن بس): يفتح/يقفل قسم رفع الكتب
$('ai-books-open').onclick = () => {
  const box = $('ai-books-admin');
  box.classList.toggle('hidden');
  if (!box.classList.contains('hidden')) loadAiBooksAdmin();
};

// الزراير اللي جوه الإعدادات بتقفل النافذة بعد ما تتضغط
['ai-speak', 'ai-lang', 'ai-cards', 'ai-regen', 'ai-clear'].forEach(id => {
  $(id).addEventListener('click', closeAiSettings);
});
applySpeakBtn();

sb.auth.onAuthStateChange((event, session) => {
  if (!session) closeAiScreen();
});

// ستايل بسيط للحالة والميكروفون (من غير ما نلمس ai.css)
(function injectVoiceStyle() {
  const st = document.createElement('style');
  st.textContent = `
    .ai-actions { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 10px; }
    .ai-actions button { border: 1px solid #6e0819; background: transparent; color: #6e0819; border-radius: 12px; padding: 4px 10px; font-size: 13px; cursor: pointer; }
    .ai-actions button:active { background: #6e0819; color: #fff; }
    .ai-suggest { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 12px; }
    .ai-chip { border: 1px solid #6e0819; background: transparent; color: #6e0819; border-radius: 16px; padding: 7px 12px; font-size: 14px; cursor: pointer; text-align: start; }
    .ai-chip:active { background: #6e0819; color: #fff; }
    .ai-status { font-size: 13px; padding: 6px 14px; text-align: center; }
    .ai-status.listen { color: #6e0819; font-weight: bold; }
    .ai-status.think { opacity: .75; }
    .ai-status.speak { cursor: pointer; text-decoration: underline; }
    .ai-status.error { color: #c0392b; }
    #ai-mic.mic-on { color: #c0392b; animation: aiPulse 1.2s infinite; }
    @keyframes aiPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
  `;
  document.head.appendChild(st);
})();

applySpeakBtn();
setMicUI();