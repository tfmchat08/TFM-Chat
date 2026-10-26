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
function currentPickRoom() {
  return `${$('track').value}-${$('level').value}`;
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
  $('lang-toggle').textContent = isEn ? 'عربي' : 'English';
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
  $('track').value = r.track;
  $('level').value = String(r.level);
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

// ---------- تحميل الشعبة العادية ----------
async function loadRoom() {
  room = currentPickRoom();
  saveRoom($('track').value, $('level').value);
  if (editingId) stopEdit();

  $('quiz').innerHTML = '';
  $('submit').hidden = true;
  $('reset').hidden = true;
  $('result').hidden = true;

  if (!loggedIn) {
    questions = [];
    setStatus(txt('سجّل دخول من الشات الأول عشان تشوف الاختبارات', 'Log in from the chat first to see the quizzes'));
  } else {
    setStatus(txt('بحمّل الأسئلة...', 'Loading questions...'));
    const { data, error } = await sb.rpc('get_quiz', { p_room: room });
    if (error) {
      questions = [];
      setStatus(txt('ما قدرتش أحمّل الأسئلة: ', 'Could not load questions: ') + error.message);
    } else {
      questions = data || [];
      if (!questions.length) {
        setStatus(txt('مفيش أسئلة للشعبة والمستوى ده لسه', 'No questions for this class yet'));
      } else {
        setStatus(txt(`عدد الأسئلة: ${questions.length}`, `Questions: ${questions.length}`));
        renderQuiz();
      }
    }
  }

  if (isStaff) await loadBank();
}

// ---------- بنك أسئلة الشعبة (للأستاذ) ----------
async function loadBank() {
  const box = $('bank-list');
  box.innerHTML = '';
  const { data, error } = await sb.from('quiz_questions')
    .select('id, question, options, answer')
    .eq('room', room)
    .order('id', { ascending: true });

  if (error) {
    box.textContent = error.message;
    return;
  }
  const bank = data || [];
  $('count-staff').textContent = String(bank.length);

  if (!bank.length) {
    const p = el('p', 'empty-line');
    p.textContent = txt('مفيش أسئلة للشعبة دي لسه', 'No questions in this class yet');
    box.appendChild(p);
    return;
  }

  bank.forEach((row, i) => {
    const div = el('div', 'bank-item');

    const q = el('div', 'bank-q');
    q.textContent = `${i + 1}. ${row.question}`;

    const opts = el('div', 'bank-opts');
    row.options.forEach((o, oi) => {
      const line = el('div');
      line.textContent = (oi === row.answer ? '✅ ' : '• ') + o;
      opts.appendChild(line);
    });

    const btns = el('div', 'row-btns');
    const edit = btn(txt('✏️ تعديل', '✏️ Edit'));
    edit.onclick = () => startEdit(row);
    const copy = btn(txt('📋 نسخ', '📋 Copy'));
    copy.onclick = () => duplicateQuestion(row);
    const del = btn(txt('🗑️ حذف', '🗑️ Delete'), 'danger');
    del.onclick = async () => {
      if (!confirm(txt('تمسح السؤال ده؟', 'Delete this question?'))) return;
      if (!(await deleteQuestion(row.id))) return;
      await loadRoom();
    };
    btns.appendChild(edit);
    btns.appendChild(copy);
    btns.appendChild(del);

    div.appendChild(q);
    div.appendChild(opts);
    div.appendChild(btns);
    box.appendChild(div);
  });
}

// حذف سؤال: لو السيرفر ما مسحش ولا صف (بسبب الصلاحية) بنقول للأستاذ
async function deleteQuestion(id) {
  const { data, error } = await sb.from('quiz_questions').delete().eq('id', id).select('id');
  if (error) {
    alert(error.message);
    return false;
  }
  if (!data || !data.length) {
    alert(txt('ما اتمسحش السؤال. مفيش صلاحية على الشعبة دي من حسابك.', 'Not deleted. You have no permission for this class.'));
    return false;
  }
  return true;
}

// ---------- فورم السؤال ----------
function setFormMode(mode) {
  // mode: 'new' | 'edit' | 'copy'
  const titles = {
    new: txt('➕ سؤال جديد', '➕ New question'),
    edit: txt('✏️ تعديل السؤال', '✏️ Edit question'),
    copy: txt('📋 سؤال منسوخ (جديد)', '📋 Copied question (new)'),
  };
  $('form-title').textContent = titles[mode];
  $('save-btn').textContent = mode === 'edit' ? txt('💾 حفظ التعديل', '💾 Save changes') : txt('حفظ السؤال', 'Save question');
  $('cancel-edit').hidden = mode === 'new';
}

function fillForm(row) {
  $('new-q').value = row.question;
  document.querySelectorAll('.new-opt').forEach((inp, i) => {
    inp.value = row.options[i] || '';
  });
  document.querySelectorAll('input[name="new-ans"]').forEach(r => {
    r.checked = Number(r.value) === row.answer;
  });
  $('add-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function startEdit(row) {
  editingId = row.id;
  fillForm(row);
  setFormMode('edit');
}

// نسخ سؤال: بيتملّي الفورم، وبيتحفظ كسؤال جديد
function duplicateQuestion(row) {
  editingId = null;
  fillForm(row);
  setFormMode('copy');
}

function stopEdit() {
  editingId = null;
  $('add-form').reset();
  setFormMode('new');
}

async function saveQuestion(e) {
  e.preventDefault();
  const question = $('new-q').value.trim();
  const picked = document.querySelector('input[name="new-ans"]:checked');
  const correctIdx = picked ? Number(picked.value) : -1;

  // بناخد الاختيارات الفاضية، ونظبط رقم الإجابة الصح حسب الترتيب الجديد
  const opts = [...document.querySelectorAll('.new-opt')]
    .map((inp, i) => ({ text: inp.value.trim(), i }))
    .filter(o => o.text);

  if (!question) return alert(txt('اكتب نص السؤال', 'Write the question text'));
  if (opts.length < 2) return alert(txt('لازم اختيارين على الأقل', 'At least two options are required'));
  const answerPos = opts.findIndex(o => o.i === correctIdx);
  if (answerPos < 0) return alert(txt('علّم على الإجابة الصح من الاختيارات المكتوبة', 'Mark the correct answer among the written options'));

  const payload = { room, question, options: opts.map(o => o.text), answer: answerPos };
  const res = editingId
    ? await sb.from('quiz_questions').update(payload).eq('id', editingId)
    : await sb.from('quiz_questions').insert(payload);
  if (res.error) return alert(res.error.message);

  stopEdit();
  await loadRoom();
}

// ---------- إنشاء / تعديل امتحان ----------
function updateCreateRoomLabel() {
  $('create-room').textContent = txt(
    `الشعبة: ${roomLabel(createRoom)} · النشر هيتم في الشات ${currentChatSlot()}`,
    `Class: ${roomLabel(createRoom)} · Will be posted in chat ${currentChatSlot()}`);
}

function openCreate(exam) {
  editingExamId = exam ? exam.id : null;
  editingExamStatus = exam ? exam.status : null;
  createRoom = exam ? exam.room : currentPickRoom();

  $('create-title').textContent = txt(exam ? '✏️ تعديل الامتحان' : '➕ إنشاء امتحان',
    exam ? '✏️ Edit exam' : '➕ New exam');
  $('exam-title').value = exam ? exam.title : '';
  $('exam-limit').value = '';
  // الحفظ كمسودة بيتخفي لو الامتحان منشور أصلاً (عشان ما يتحولش لمسودة ويتقفل عن الطلاب)
  $('save-draft').hidden = editingExamStatus === 'published';
  updateCreateRoomLabel();
  $('create-box').hidden = false;
  loadCreateList(exam ? exam.question_ids : []);
  $('create-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCreate() {
  editingExamId = null;
  editingExamStatus = null;
  $('create-box').hidden = true;
  $('exam-title').value = '';
  $('exam-limit').value = '';
  $('create-list').innerHTML = '';
  $('picked-list').innerHTML = '';
  $('picked-count').textContent = '0';
}

// أسئلة الشعبة اللي بتتختار منها الامتحان
async function loadCreateList(preselect = []) {
  const box = $('create-list');
  box.innerHTML = '';
  const { data, error } = await sb.from('quiz_questions')
    .select('id, question, options, answer')
    .eq('room', createRoom)
    .order('id', { ascending: true });

  if (error) {
    box.textContent = error.message;
    return;
  }
  createBank = data || [];

  if (!createBank.length) {
    const p = el('p', 'empty-line');
    p.textContent = txt('مفيش أسئلة للشعبة دي. ضيف أسئلة من "أسئلة الشعبة" الأول.',
      'No questions in this class. Add questions in "Class questions" first.');
    box.appendChild(p);
    renderPicked();
    return;
  }

  createBank.forEach((row, i) => {
    const div = el('div', 'bank-item');
    const top = el('div', 'bank-top');
    const cb = el('input', 'pick');
    cb.type = 'checkbox';
    cb.value = String(row.id);
    cb.checked = preselect.includes(row.id);
    cb.addEventListener('change', renderPicked);
    const q = el('div', 'bank-q');
    q.textContent = `${i + 1}. ${row.question}`;
    top.appendChild(cb);
    top.appendChild(q);

    const opts = el('div', 'bank-opts');
    row.options.forEach((o, oi) => {
      const line = el('div');
      line.textContent = (oi === row.answer ? '✅ ' : '• ') + o;
      opts.appendChild(line);
    });

    div.appendChild(top);
    div.appendChild(opts);
    box.appendChild(div);
  });

  renderPicked();
}

function checkedIds() {
  return [...document.querySelectorAll('#create-list input.pick:checked')].map(c => Number(c.value));
}

// قايمة الأسئلة اللي في الامتحان دلوقتي، وكل سؤال فيها زرار ✕ يشيله
function renderPicked() {
  const ids = checkedIds();
  const picked = createBank.filter(r => ids.includes(r.id));
  $('picked-count').textContent = String(picked.length);

  const box = $('picked-list');
  box.innerHTML = '';
  if (!picked.length) {
    const p = el('p', 'empty-line');
    p.textContent = txt('ما اخترتش أي سؤال لسه', 'No questions picked yet');
    box.appendChild(p);
    return;
  }

  picked.forEach((row, i) => {
    const line = el('div', 'picked-row');
    const t = el('span', 'picked-text');
    t.textContent = `${i + 1}. ${row.question}`;
    const x = btn('✕', 'ghost icon-x');
    x.title = txt('شيل السؤال من الامتحان', 'Remove from exam');
    x.onclick = () => {
      const cb = document.querySelector(`#create-list input.pick[value="${row.id}"]`);
      if (cb) cb.checked = false;
      renderPicked();
    };
    line.appendChild(t);
    line.appendChild(x);
    box.appendChild(line);
  });
}

// الحد: اكتب رقم، وأول الأسئلة لحد الرقم ده بتتختار
function applyLimit() {
  const n = Number($('exam-limit').value);
  if (!n || n < 1) return;
  document.querySelectorAll('#create-list input.pick').forEach((cb, i) => {
    cb.checked = i < n;
  });
  renderPicked();
}

function togglePickAll() {
  const boxes = [...document.querySelectorAll('#create-list input.pick')];
  if (!boxes.length) return;
  const allOn = boxes.every(b => b.checked);
  boxes.forEach(b => { b.checked = !allOn; });
  $('pick-all').textContent = allOn
    ? txt('☑️ تحديد الكل', '☑️ Select all')
    : txt('⬜ إلغاء التحديد', '⬜ Clear selection');
  renderPicked();
}

// بينزل الامتحان في الشات اللي المدرس فاتح عليه
async function postExamToChat(exam) {
  const slot = currentChatSlot();
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

// حفظ: مسودة (بتظهر في السجل بس)، أو حفظ ونشر (بتنزل في الشات اللي المدرس فيه)
async function saveExam(publish) {
  const title = $('exam-title').value.trim();
  const ids = checkedIds();

  if (!title) return alert(txt('اكتب اسم الامتحان أو اسم المادة', 'Write the exam or subject name'));
  if (!ids.length) return alert(txt('اختار سؤال واحد على الأقل', 'Pick at least one question'));

  // نحافظ على ترتيب البنك
  const ordered = createBank.filter(r => ids.includes(r.id)).map(r => r.id);
  const status = publish ? 'published' : 'draft';
  // بنزل الرسالة في الشات بس لو الامتحان كان مش منشور قبل كده (عشان ما يتكررش)
  const shouldPost = publish && editingExamStatus !== 'published';

  let exam;
  if (editingExamId) {
    const { data, error } = await sb.from('quiz_exams')
      .update({ room: createRoom, title, question_ids: ordered, status })
      .eq('id', editingExamId)
      .select('id, room, title, status');
    if (error) return alert(error.message);
    if (!data || !data.length) return alert(txt('ما اتحفظش الامتحان. مفيش صلاحية على الشعبة دي من حسابك.', 'Not saved. You have no permission for this class.'));
    exam = data[0];
  } else {
    const { data, error } = await sb.from('quiz_exams')
      .insert({ room: createRoom, title, question_ids: ordered, status })
      .select('id, room, title, status')
      .single();
    if (error) return alert(error.message);
    exam = data;
  }

  if (shouldPost) {
    const ok = await postExamToChat(exam);
    if (!ok) return;
    alert(txt(`اتحفظ ونزل في الشات ${currentChatSlot()}`, `Saved and posted in chat ${currentChatSlot()}`));
  } else {
    alert(publish
      ? txt('اتحفظ الامتحان', 'Exam saved')
      : txt('اتحفظ الامتحان في السجل كمسودة', 'Exam saved as a draft in history'));
  }

  closeCreate();
  if (isAdmin) await loadHistory();
}

// ---------- السجل: الامتحانات المحفوظة (للأدمن) ----------
function toggleHistory() {
  const box = $('history-box');
  const opening = box.hidden;
  box.hidden = !opening;
  if (opening) loadHistory();
}

async function loadHistory() {
  const list = $('history-list');
  list.innerHTML = '';
  const { data, error } = await sb.from('quiz_exams')
    .select('id, room, title, question_ids, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    list.textContent = error.message;
    return;
  }
  const rows = data || [];
  $('count-hist').textContent = String(rows.length);

  if (!rows.length) {
    const p = el('p', 'empty-line');
    p.textContent = txt('مفيش امتحانات محفوظة لسه', 'No saved exams yet');
    list.appendChild(p);
    return;
  }

  rows.forEach((ex) => {
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

    const edit = btn(txt('✏️ تعديل', '✏️ Edit'));
    edit.onclick = () => {
      $('history-box').hidden = true;
      openCreate(ex);
    };

    const preview = btn(txt('👁️ معاينة', '👁️ Preview'));
    preview.onclick = () => window.open(examUrl(ex.id), '_blank', 'noopener');

    if (!isPub) {
      const pub = btn(txt('📤 نشر', '📤 Publish'));
      pub.onclick = () => publishDraft(ex);
      btns.appendChild(pub);
    }

    const del = btn(txt('🗑️ حذف', '🗑️ Delete'), 'danger');
    del.onclick = async () => {
      if (!confirm(txt(`تمسح الامتحان "${ex.title}"؟`, `Delete exam "${ex.title}"?`))) return;
      const { data: gone, error: delErr } = await sb.from('quiz_exams').delete().eq('id', ex.id).select('id');
      if (delErr) return alert(delErr.message);
      if (!gone || !gone.length) return alert(txt('ما اتمسحش الامتحان. مفيش صلاحية على الشعبة دي من حسابك.', 'Not deleted. You have no permission for this class.'));
      await loadHistory();
    };

    btns.appendChild(edit);
    btns.appendChild(preview);
    btns.appendChild(del);

    div.appendChild(title);
    div.appendChild(meta);
    div.appendChild(btns);
    list.appendChild(div);
  });
}

// نشر مسودة من السجل: بيتغير حالتها لمنشور وبينزل في الشات
async function publishDraft(ex) {
  if (!confirm(txt(`تنشر الامتحان "${ex.title}" في الشات ${currentChatSlot()}؟`,
    `Publish exam "${ex.title}" in chat ${currentChatSlot()}?`))) return;
  const { data, error } = await sb.from('quiz_exams')
    .update({ status: 'published' })
    .eq('id', ex.id)
    .select('id, room, title, status');
  if (error) return alert(error.message);
  if (!data || !data.length) return alert(txt('ما اتنشرش الامتحان. مفيش صلاحية على الشعبة دي من حسابك.', 'Not published. You have no permission for this class.'));
  const ok = await postExamToChat(data[0]);
  if (ok) alert(txt(`اتنشر في الشات ${currentChatSlot()}`, `Published in chat ${currentChatSlot()}`));
  await loadHistory();
}

// ---------- التشغيل ----------
async function init() {
  setPickersFromRoom();
  applyStaticText();
  applyTheme();
  $('lang-toggle').addEventListener('click', toggleLang);
  $('theme-toggle').addEventListener('click', toggleTheme);

  $('track').addEventListener('change', loadRoom);
  $('level').addEventListener('change', loadRoom);
  $('submit').addEventListener('click', submitQuiz);
  $('reset').addEventListener('click', resetQuiz);
  $('print-btn').addEventListener('click', () => window.print());

  // الأسئلة
  $('add-form').addEventListener('submit', saveQuestion);
  $('cancel-edit').addEventListener('click', stopEdit);

  // الإنشاء
  $('create-open').addEventListener('click', () => openCreate(null));
  $('create-cancel').addEventListener('click', closeCreate);
  $('pick-all').addEventListener('click', togglePickAll);
  $('exam-limit').addEventListener('input', applyLimit);
  $('save-draft').addEventListener('click', () => saveExam(false));
  $('save-publish').addEventListener('click', () => saveExam(true));

  $('history-btn').addEventListener('click', toggleHistory);

  let s;
  try {
    s = await checkUser();
  } catch {
    s = { loggedIn: false, staff: false, admin: false, id: null };
  }
  loggedIn = s.loggedIn;
  isStaff = s.staff;
  isAdmin = s.admin;
  myId = s.id;

  if (examId) {
    // وضع الامتحان: مفيش شعبة ولا أدوات أستاذ
    document.querySelector('.picker').hidden = true;
    $('staff-box').hidden = true;
    $('create-box').hidden = true;
    $('create-open').hidden = true;
    $('history-btn').hidden = true;
    await loadExam();
    return;
  }

  $('create-open').hidden = !isStaff;
  $('history-btn').hidden = !isAdmin;
  $('staff-box').hidden = !isStaff;
  await loadRoom();
}

init();