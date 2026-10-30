// ---------- صفحة الاختبارات: الأسئلة + إنشاء الامتحانات + السجل + التصحيح على السيرفر ----------

const SUPABASE_URL = 'https://jifoamltmdgpawpjgrbz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IiaTAO0BNUJTp_pzVidhhA_e1g82vpi';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const TRACKS = ['ar', 'en'];
const LEVELS = [1, 2, 3, 4];

let isEn = false;
try { isEn = localStorage.getItem('lang') === 'en'; } catch {}
const txt = (ar, en) => (isEn ? en : ar);

// لو الرابط فيه ?exam=ID يبقى ده امتحان بيتحل
const params = new URLSearchParams(location.search);
const examId = params.get('exam') ? Number(params.get('exam')) : null;

let room = 'ar-1';
let questions = [];        // اللي الطالب بيحله: [{ id, question, options }]
let createBank = [];       // أسئلة الشعبة اللي في شاشة إنشاء الامتحان
let createRoom = 'ar-1';   // الشعبة اللي الامتحان بيتعمل فيها
let loggedIn = false;
let isStaff = false;
let isAdmin = false;
let myId = null;
let editingId = null;        // سؤال بيتعدّل
let editingExamId = null;    // امتحان بيتعدّل
let editingExamStatus = null;

// ---------- أدوات صغيرة ----------
function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function btn(text, cls) {
  const b = el('button', cls);
  b.type = 'button';
  b.textContent = text;
  return b;
}
function setStatus(msg) {
  $('status').hidden = false;
  $('status').textContent = msg;
}
function examUrl(id) {
  const u = new URL('quiz.html', location.href);
  u.search = `?exam=${id}`;
  return u.href;
}
function roomLabel(r) {
  const [t, l] = r.split('-');
  const names = isEn ? { ar: 'Arabic', en: 'English' } : { ar: 'عربي', en: 'انجليزي' };
  return `${names[t] || t} · ${txt('الصف', 'Level')} ${l}`;
}
// رقم الشات اللي المدرس فاتح عليه دلوقتي (نفس الشات اللي في الصفحة الرئيسية)
function currentChatSlot() {
  let n = 1;
  try { n = Number(localStorage.getItem('chatSlot')); } catch {}
  return n >= 1 && n <= 5 ? n : 1;
}

// ---------- اللغة والوضع (لون الخلفية) ----------
function applyStaticText() {
  document.documentElement.lang = isEn ? 'en' : 'ar';
  document.documentElement.dir = isEn ? 'ltr' : 'rtl';
  document.querySelectorAll('[data-ar]').forEach(n => {
    n.textContent = isEn ? n.dataset.en : n.dataset.ar;
  });
  document.querySelectorAll('[data-ph-ar]').forEach(n => {
    n.placeholder = isEn ? n.dataset.phEn : n.dataset.phAr;
  });
  $('lang-toggle').textContent = isEn ? 'ع' : 'EN';
}

function toggleLang() {
  try { localStorage.setItem('lang', isEn ? 'ar' : 'en'); } catch {}
  location.reload();
}

function isDark() {
  try { return localStorage.getItem('quizTheme') === 'dark'; } catch { return false; }
}

function applyTheme() {
  const dark = isDark();
  document.documentElement.classList.toggle('dark', dark);
  const b = $('theme-toggle');
  b.textContent = dark ? '☀️' : '🌙';
  b.title = dark ? txt('الوضع الفاتح', 'Light mode') : txt('الوضع الداكن', 'Dark mode');
}

function toggleTheme() {
  try { localStorage.setItem('quizTheme', isDark() ? 'light' : 'dark'); } catch {}
  applyTheme();
}

// ---------- الشعبة والمستوى ----------
function readRoom() {
  let track = 'ar';
  let level = 1;
  try {
    const t = localStorage.getItem('track');
    const l = Number(localStorage.getItem('level'));
    if (TRACKS.includes(t)) track = t;
    if (LEVELS.includes(l)) level = l;
  } catch {}
  return { track, level };
}

function saveRoom(track, level) {
  try {
    localStorage.setItem('track', track);
    localStorage.setItem('level', String(level));
  } catch {}
}

function setPickersFromRoom() {
  const r = readRoom();
  $('c-track').value = r.track;
  $('c-level').value = String(r.level);
}

// ---------- المستخدم ----------
async function checkUser() {
  const { data } = await sb.auth.getSession();
  const user = data && data.session ? data.session.user : null;
  if (!user) return { loggedIn: false, staff: false, admin: false, id: null };
  const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return {
    loggedIn: true,
    staff: !!prof && (prof.role === 'admin' || prof.role === 'sender'),
    admin: !!prof && prof.role === 'admin',
    id: user.id,
  };
}

// ---------- عرض الأسئلة للطالب ----------
function renderQuiz() {
  const form = $('quiz');
  form.innerHTML = '';

  questions.forEach((item, qi) => {
    const fs = el('fieldset', 'q');
    fs.id = `q${qi}`;

    const legend = el('legend');
    legend.textContent = `${qi + 1}. ${item.question}`;
    fs.appendChild(legend);

    item.options.forEach((opt, oi) => {
      const label = el('label', 'opt');
      const input = el('input');
      input.type = 'radio';
      input.name = `q${qi}`;
      input.value = String(oi);
      const span = el('span');
      span.textContent = String(opt);
      label.appendChild(input);
      label.appendChild(span);
      fs.appendChild(label);
    });

    form.appendChild(fs);
  });

  $('submit').hidden = false;
  $('reset').hidden = true;
}

// بنبعت الإجابات للسيرفر، والسيرفر بيصحح ويرجع النتيجة
async function submitQuiz() {
  const answers = [];
  questions.forEach((item, qi) => {
    const picked = document.querySelector(`input[name="q${qi}"]:checked`);
    if (picked) answers.push({ id: item.id, choice: Number(picked.value) });
  });

  $('submit').disabled = true;
  const { data, error } = await sb.rpc('submit_quiz', {
    p_room: room,
    p_answers: answers,
    p_ids: examId ? questions.map(q => q.id) : null,
  });
  $('submit').disabled = false;
  if (error) {
    setStatus(txt('ما قدرتش أصحح: ', 'Could not grade: ') + error.message);
    return;
  }

  const byId = new Map((data.results || []).map(r => [r.id, r]));

  questions.forEach((item, qi) => {
    const fs = $(`q${qi}`);
    const picked = document.querySelector(`input[name="q${qi}"]:checked`);
    const r = byId.get(item.id) || {};
    const correctText = item.options[r.answer];

    fs.classList.remove('ok', 'bad');
    fs.querySelectorAll('.hint').forEach(h => h.remove());

    const hint = el('div');
    if (!picked) {
      hint.className = 'hint bad';
      hint.textContent = txt(`ما جاوبتش. الإجابة الصح: ${correctText}`, `Not answered. Correct answer: ${correctText}`);
    } else if (r.correct) {
      fs.classList.add('ok');
      hint.className = 'hint ok';
      hint.textContent = txt('صح ✅', 'Correct ✅');
    } else {
      fs.classList.add('bad');
      hint.className = 'hint bad';
      hint.textContent = txt(`غلط ❌. الإجابة الصح: ${correctText}`, `Wrong ❌. Correct answer: ${correctText}`);
    }
    fs.appendChild(hint);

    fs.querySelectorAll('input').forEach(i => { i.disabled = true; });
  });

  const total = data.total || questions.length;
  const correct = data.score || 0;
  const unanswered = data.unanswered || 0;
  const pct = total ? Math.round((correct / total) * 100) : 0;

  const result = $('result');
  result.textContent = txt(
    `نتيجتك: ${correct} من ${total} (${pct}%)` + (unanswered ? ` · لم تجب على ${unanswered}` : ''),
    `Your score: ${correct} of ${total} (${pct}%)` + (unanswered ? ` · ${unanswered} unanswered` : ''));
  result.hidden = false;

  // علامة كاملة = بادج "العبقري" (بيتفتح لما يرجع للشات)
  if (total > 0 && correct === total && unanswered === 0) {
    try { localStorage.setItem('quizPerfect', '1'); } catch (e) { /* مش مهم */ }
    if (window.fxConfetti) window.fxConfetti(150);
  }

  $('submit').hidden = true;
  $('reset').hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetQuiz() {
  renderQuiz();
  $('result').hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- تحميل امتحان (رابط ?exam=ID) ----------
async function loadExam() {
  if (!loggedIn) {
    setStatus(txt('سجّل دخول من الشات الأول عشان تفتح الامتحان', 'Log in from the chat first to open the exam'));
    return;
  }
  setStatus(txt('بحمّل الامتحان...', 'Loading exam...'));
  const { data, error } = await sb.rpc('get_exam', { p_id: examId });
  if (error) {
    setStatus(txt('ما قدرتش أحمّل الامتحان: ', 'Could not load exam: ') + error.message);
    return;
  }
  if (!data) {
    setStatus(txt('الامتحان ده مش موجود، أو لسه مش منشور، أو مش متاح ليك', 'This exam does not exist, is not published yet, or is not available to you'));
    return;
  }

  room = data.room;
  const head = $('exam-head');
  head.textContent = '📝 ' + data.title;
  head.hidden = false;

  questions = data.questions || [];
  if (!questions.length) {
    setStatus(txt('الامتحان ده فاضي', 'This exam is empty'));
    return;
  }
  setStatus(txt(`عدد الأسئلة: ${questions.length}`, `Questions: ${questions.length}`));
  renderQuiz();
  $('print-btn').hidden = false;
}

// ---------- إضافة اختبار (قايمة من تحت) ----------
let selSlot = 1;
let qCount = 0;

function updatePublishLabel() {
  $('publish').textContent = txt(`📤 نشر في الشات ${selSlot}`, `📤 Publish to chat ${selSlot}`);
}

function selectSlot(n) {
  selSlot = n;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.toggle('sel', Number(b.dataset.slot) === n));
  updatePublishLabel();
}

function renumberBlocks() {
  document.querySelectorAll('.qb').forEach((b, i) => {
    b.querySelector('.qb-num').textContent = txt(`سؤال ${i + 1}`, `Question ${i + 1}`);
    b.querySelector('.qb-del').hidden = document.querySelectorAll('.qb').length < 2;
  });
}

function addQBlock() {
  const id = ++qCount;
  const box = el('div', 'qb');
  const head = el('div', 'qb-head');
  const num = el('span', 'qb-num');
  const del = btn('✕', 'ghost icon-x qb-del');
  del.onclick = () => { box.remove(); renumberBlocks(); };
  head.appendChild(num); head.appendChild(del);

  const ta = el('textarea', 'qb-q');
  ta.rows = 2; ta.maxLength = 500;
  ta.placeholder = txt('نص السؤال', 'Question text');
  box.appendChild(head); box.appendChild(ta);

  for (let i = 0; i < 4; i++) {
    const row = el('div', 'ans-row');
    const r = el('input');
    r.type = 'radio'; r.name = `ans${id}`; r.value = String(i);
    if (i === 0) r.checked = true;
    const t = el('input', 'qb-opt');
    t.type = 'text'; t.maxLength = 200;
    t.placeholder = txt(`الاختيار ${i + 1}` + (i > 1 ? ' (اختياري)' : ''), `Option ${i + 1}` + (i > 1 ? ' (optional)' : ''));
    row.appendChild(r); row.appendChild(t);
    box.appendChild(row);
  }
  $('q-blocks').appendChild(box);
  renumberBlocks();
  return box;
}

// بنجمع الأسئلة المكتوبة ونتأكد منها. null = فيه خطأ (اتعرض تنبيه)
function readQuestions() {
  const out = [];
  let n = 0;
  for (const b of document.querySelectorAll('.qb')) {
    n++;
    const question = b.querySelector('.qb-q').value.trim();
    const inputs = [...b.querySelectorAll('.qb-opt')];
    if (!question && !inputs.some(i => i.value.trim())) continue; // سؤال فاضي خالص: نتجاهله
    const picked = b.querySelector('input[type="radio"]:checked');
    const correct = picked ? Number(picked.value) : -1;
    const opts = inputs.map((inp, i) => ({ text: inp.value.trim(), i })).filter(o => o.text);
    if (!question) { alert(txt(`اكتب نص السؤال ${n}`, `Write the text of question ${n}`)); return null; }
    if (opts.length < 2) { alert(txt(`السؤال ${n}: لازم اختيارين على الأقل`, `Question ${n}: at least two options`)); return null; }
    const pos = opts.findIndex(o => o.i === correct);
    if (pos < 0) { alert(txt(`السؤال ${n}: علّم على الإجابة الصح من الاختيارات المكتوبة`, `Question ${n}: mark the correct answer among written options`)); return null; }
    out.push({ question, options: opts.map(o => o.text), answer: pos });
  }
  if (!out.length) { alert(txt('اكتب سؤال واحد على الأقل', 'Write at least one question')); return null; }
  return out;
}

function openSheet() {
  setPickersFromRoom();
  $('exam-title').value = '';
  $('q-blocks').innerHTML = '';
  addQBlock();
  selectSlot(currentChatSlot());
  $('sheet').hidden = false;
}
function closeSheet() { $('sheet').hidden = true; }

// بينزل الامتحان في الشات اللي الأستاذ اختاره
async function postExamToChat(exam, slot) {
  const { error } = await sb.from('messages').insert({
    user_id: myId,
    content: `📝 امتحان: ${exam.title}\n${examUrl(exam.id)}`,
    room: exam.room,
    chat_slot: slot,
    reply_to: null,
    file_url: null,
    file_type: null,
  });
  if (error) {
    alert(txt('الامتحان اتحفظ، بس ما اتنزلش في الشات: ', 'Saved, but not posted to chat: ') + error.message);
    return false;
  }
  return true;
}

// نشر: بنحفظ الأسئلة في بنك الشعبة، وبنعمل الامتحان بيها، وبننزله في الشات
async function publishExam() {
  const title = $('exam-title').value.trim();
  if (!title) return alert(txt('اكتب اسم الاختبار', 'Write the quiz name'));
  const qs = readQuestions();
  if (!qs) return;

  const track = $('c-track').value;
  const level = $('c-level').value;
  saveRoom(track, level);
  const roomId = `${track}-${level}`;
  const slot = selSlot;

  $('publish').disabled = true;
  try {
    const { data: ins, error: qErr } = await sb.from('quiz_questions')
      .insert(qs.map(q => ({ room: roomId, question: q.question, options: q.options, answer: q.answer })))
      .select('id');
    if (qErr) return alert(qErr.message);
    const ids = (ins || []).map(r => r.id).sort((a, b) => a - b);
    if (ids.length !== qs.length) return alert(txt('ما اتحفظتش الأسئلة. مفيش صلاحية على الشعبة دي من حسابك.', 'Questions not saved. You have no permission for this class.'));

    const { data: exam, error: eErr } = await sb.from('quiz_exams')
      .insert({ room: roomId, title, question_ids: ids, status: 'published' })
      .select('id, room, title, status')
      .single();
    if (eErr) {
      await sb.from('quiz_questions').delete().in('id', ids); // نشيل الأسئلة اللي اتضافت عشان ما تفضلش يتيمة
      return alert(eErr.message);
    }

    if (!(await postExamToChat(exam, slot))) return;
    alert(txt(`اتنشر في الشات ${slot}`, `Published to chat ${slot}`));
    closeSheet();
    if (isAdmin && !$('history-box').hidden) await loadHistory();
  } finally {
    $('publish').disabled = false;
  }
}

// ---------- السجل: الامتحانات المنشورة (للأدمن) ----------
function toggleHistory() {
  closeSheet();
  const box = $('history-box');
  box.hidden = !box.hidden;
  if (!box.hidden) { loadHistory(); box.scrollIntoView({ behavior: 'smooth' }); }
}

async function loadHistory() {
  const list = $('history-list');
  list.innerHTML = '';
  const { data, error } = await sb.from('quiz_exams')
    .select('id, room, title, question_ids, status, created_at')
    .order('created_at', { ascending: false });
  if (error) { list.textContent = error.message; return; }
  const rows = data || [];
  $('count-hist').textContent = String(rows.length);
  if (!rows.length) {
    const p = el('p', 'empty-line');
    p.textContent = txt('مفيش امتحانات لسه', 'No exams yet');
    list.appendChild(p);
    return;
  }
  rows.forEach(ex => {
    const div = el('div', 'bank-item');
    const title = el('div', 'bank-q');
    title.textContent = '📝 ' + ex.title;
    const isPub = ex.status === 'published';
    const pill = el('span', 'pill ' + (isPub ? 'pub' : 'draft'));
    pill.textContent = isPub ? txt('منشور', 'Published') : txt('مسودة', 'Draft');
    title.appendChild(pill);

    const meta = el('div', 'exam-meta');
    meta.textContent = `${roomLabel(ex.room)} · ${ex.question_ids.length} ${txt('سؤال', 'questions')} · ${new Date(ex.created_at).toLocaleString(isEn ? 'en-GB' : 'ar-EG')}`;

    const btns = el('div', 'row-btns');
    const preview = btn(txt('👁️ معاينة', '👁️ Preview'));
    preview.onclick = () => window.open(examUrl(ex.id), '_blank', 'noopener');
    const del = btn(txt('🗑️ حذف', '🗑️ Delete'), 'danger');
    del.onclick = async () => {
      if (!confirm(txt(`تمسح الامتحان "${ex.title}"؟`, `Delete exam "${ex.title}"?`))) return;
      const { data: gone, error: delErr } = await sb.from('quiz_exams').delete().eq('id', ex.id).select('id');
      if (delErr) return alert(delErr.message);
      if (!gone || !gone.length) return alert(txt('ما اتمسحش الامتحان. مفيش صلاحية على الشعبة دي من حسابك.', 'Not deleted. You have no permission for this class.'));
      await loadHistory();
    };
    btns.appendChild(preview); btns.appendChild(del);
    div.appendChild(title); div.appendChild(meta); div.appendChild(btns);
    list.appendChild(div);
  });
}

// ---------- التشغيل ----------
async function init() {
  setPickersFromRoom();
  applyStaticText();
  applyTheme();
  $('lang-toggle').addEventListener('click', toggleLang);
  $('theme-toggle').addEventListener('click', toggleTheme);
  $('submit').addEventListener('click', submitQuiz);
  $('reset').addEventListener('click', resetQuiz);
  $('print-btn').addEventListener('click', () => window.print());

  $('create-open').addEventListener('click', openSheet);
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) closeSheet(); });
  $('c-track').addEventListener('change', () => saveRoom($('c-track').value, $('c-level').value));
  $('c-level').addEventListener('change', () => saveRoom($('c-track').value, $('c-level').value));
  document.querySelectorAll('.slot-btn').forEach(b => b.addEventListener('click', () => selectSlot(Number(b.dataset.slot))));
  $('add-q').addEventListener('click', () => addQBlock().querySelector('.qb-q').focus());
  $('publish').addEventListener('click', publishExam);
  $('history-btn').addEventListener('click', toggleHistory);

  let u;
  try { u = await checkUser(); } catch { u = { loggedIn: false, staff: false, admin: false, id: null }; }
  loggedIn = u.loggedIn; isStaff = u.staff; isAdmin = u.admin; myId = u.id;

  if (examId) { await loadExam(); return; }   // الصفحة مش فاضية إلا من رابط امتحان

  // الصفحة فاضية. الأستاذ بس بيشوف ＋
  $('create-open').hidden = !isStaff;
  $('history-btn').hidden = !isAdmin;
}

init();