// ---------- صفحة الاختبارات: الأسئلة + إنشاء الامتحانات + السجل + التصحيح على السيرفر ----------

const SUPABASE_URL = 'https://jifoamltmdgpawpjgrbz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IiaTAO0BNUJTp_pzVidhhA_e1g82vpi';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const TRACKS = ['ar', 'en'];
const LEVELS = [1, 2, 3, 4];
const TRACK_NAME = { ar: 'عربي', en: 'انجليزي' };

const lang = (() => { try { return localStorage.getItem('lang') || 'ar'; } catch { return 'ar'; } })();
const isEn = lang === 'en';
const txt = (ar, en) => (isEn ? en : ar);

// لو الرابط فيه ?exam=ID يبقى ده امتحان بيتحل
const params = new URLSearchParams(location.search);
const examId = params.get('exam') ? Number(params.get('exam')) : null;

let room = 'ar-1';
let questions = [];      // اللي الطالب بيحله: [{ id, question, options }]
let bank = [];           // أسئلة الشعبة للأستاذ: [{ id, question, options, answer }]
let createBank = [];     // أسئلة الشعبة اللي في شاشة إنشاء الامتحان
let loggedIn = false;
let isStaff = false;
let isAdmin = false;
let myId = null;
let editingId = null;        // سؤال بيتعدّل
let editingExamId = null;    // امتحان بيتعدّل

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
  return `${TRACK_NAME[t] || t} · الصف ${l}`;
}
function currentPickRoom() {
  return `${$('track').value}-${$('level').value}`;
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
        setStatus(txt('مفيش أسئلة للشعبة والمستوى ده لسه', 'No questions for this room yet'));
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
  bank = data || [];
  $('count-staff').textContent = String(bank.length);

  if (!bank.length) {
    const p = el('p', 'empty-line');
    p.textContent = 'مفيش أسئلة للشعبة دي لسه';
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
    const edit = btn('✏️ تعديل');
    edit.onclick = () => startEdit(row);
    const copy = btn('📋 نسخ');
    copy.onclick = () => duplicateQuestion(row);
    const del = btn('🗑️ حذف', 'danger');
    del.onclick = async () => {
      if (!confirm('تمسح السؤال ده؟')) return;
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
    alert('ما اتمسحش السؤال. مفيش صلاحية على الشعبة دي من حسابك.');
    return false;
  }
  return true;
}

// ---------- فورم السؤال ----------
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
  $('form-title').textContent = '✏️ تعديل السؤال';
  $('save-btn').textContent = '💾 حفظ التعديل';
  $('cancel-edit').hidden = false;
}

// نسخ سؤال: بيتملّي الفورم، وبيتحفظ كسؤال جديد
function duplicateQuestion(row) {
  editingId = null;
  fillForm(row);
  $('form-title').textContent = '📋 سؤال منسوخ (جديد)';
  $('save-btn').textContent = 'حفظ السؤال';
  $('cancel-edit').hidden = false;
}

function stopEdit() {
  editingId = null;
  $('add-form').reset();
  $('form-title').textContent = '➕ سؤال جديد';
  $('save-btn').textContent = 'حفظ السؤال';
  $('cancel-edit').hidden = true;
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

  if (!question) return alert('اكتب نص السؤال');
  if (opts.length < 2) return alert('لازم اختيارين على الأقل');
  const answerPos = opts.findIndex(o => o.i === correctIdx);
  if (answerPos < 0) return alert('علّم على الإجابة الصح من الاختيارات المكتوبة');

  const payload = { room, question, options: opts.map(o => o.text), answer: answerPos };
  const res = editingId
    ? await sb.from('quiz_questions').update(payload).eq('id', editingId)
    : await sb.from('quiz_questions').insert(payload);
  if (res.error) return alert(res.error.message);

  stopEdit();
  await loadRoom();
}

// ---------- إنشاء / تعديل امتحان ----------
function openCreate(exam) {
  editingExamId = exam ? exam.id : null;
  const r = exam ? exam.room : currentPickRoom();
  const [t, l] = r.split('-');
  $('c-track').value = t;
  $('c-level').value = l;
  $('exam-title').value = exam ? exam.title : '';
  $('create-title').textContent = exam ? '✏️ تعديل الامتحان' : '➕ إنشاء امتحان';
  $('save-draft').textContent = '💾 حفظ';
  $('pick-all').textContent = '☑️ تحديد الكل';
  $('create-box').hidden = false;
  loadCreateList(exam ? exam.question_ids : []);
  $('create-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCreate() {
  editingExamId = null;
  $('create-box').hidden = true;
  $('exam-title').value = '';
}

// أسئلة الشعبة اللي بتتختار منها الامتحان
async function loadCreateList(preselect = []) {
  const box = $('create-list');
  box.innerHTML = '';
  const croom = `${$('c-track').value}-${$('c-level').value}`;
  const { data, error } = await sb.from('quiz_questions')
    .select('id, question, options, answer')
    .eq('room', croom)
    .order('id', { ascending: true });

  if (error) {
    box.textContent = error.message;
    return;
  }
  createBank = data || [];

  if (!createBank.length) {
    const p = el('p', 'empty-line');
    p.textContent = 'مفيش أسئلة للشعبة دي. ضيف أسئلة من "أسئلة الشعبة" الأول.';
    box.appendChild(p);
    return;
  }

  createBank.forEach((row, i) => {
    const div = el('div', 'bank-item');
    const top = el('div', 'bank-top');
    const cb = el('input', 'pick');
    cb.type = 'checkbox';
    cb.value = String(row.id);
    cb.checked = preselect.includes(row.id);
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
}

function togglePickAll() {
  const boxes = [...document.querySelectorAll('#create-list input.pick')];
  if (!boxes.length) return;
  const allOn = boxes.every(b => b.checked);
  boxes.forEach(b => { b.checked = !allOn; });
  $('pick-all').textContent = allOn ? '☑️ تحديد الكل' : '⬜ إلغاء التحديد';
}

// حفظ: مسودة (بتظهر في السجل بس)، أو حفظ ونشر (بتنزل في الشات اللي اختاره)
async function saveExam(publish) {
  const title = $('exam-title').value.trim();
  const ids = [...document.querySelectorAll('#create-list input.pick:checked')].map(c => Number(c.value));
  const croom = `${$('c-track').value}-${$('c-level').value}`;

  if (!title) return alert('اكتب اسم الامتحان أو اسم الماده');
  if (!ids.length) return alert('اختار سؤال واحد على الأقل');

  // نحافظ على ترتيب البنك
  const ordered = createBank.filter(r => ids.includes(r.id)).map(r => r.id);
  const status = publish ? 'published' : 'draft';

  let exam;
  if (editingExamId) {
    const { data, error } = await sb.from('quiz_exams')
      .update({ room: croom, title, question_ids: ordered, status })
      .eq('id', editingExamId)
      .select('id, room, title');
    if (error) return alert(error.message);
    if (!data || !data.length) return alert('ما اتحفظش الامتحان. مفيش صلاحية على الشعبة دي من حسابك.');
    exam = data[0];
  } else {
    const { data, error } = await sb.from('quiz_exams')
      .insert({ room: croom, title, question_ids: ordered, status })
      .select('id, room, title')
      .single();
    if (error) return alert(error.message);
    exam = data;
  }

  if (publish) {
    const slot = Number($('publish-slot').value);
    const { error: msgErr } = await sb.from('messages').insert({
      user_id: myId,
      content: `📝 امتحان: ${exam.title}\n${examUrl(exam.id)}`,
      room: croom,
      chat_slot: slot,
      reply_to: null,
      file_url: null,
      file_type: null,
    });
    if (msgErr) return alert('الامتحان اتحفظ، بس ما اتنزلش في الشات: ' + msgErr.message);
    alert(`اتحفظ ونزل في الشات ${slot}`);
  } else {
    alert('اتحفظ الامتحان في السجل');
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
    p.textContent = 'مفيش امتحانات محفوظة لسه';
    list.appendChild(p);
    return;
  }

  rows.forEach((ex) => {
    const div = el('div', 'bank-item');

    const title = el('div', 'bank-q');
    title.textContent = '📝 ' + ex.title;
    const pill = el('span', 'pill ' + (ex.status === 'published' ? 'pub' : 'draft'));
    pill.textContent = ex.status === 'published' ? 'منشور' : 'مسودة';
    title.appendChild(pill);

    const meta = el('div', 'exam-meta');
    meta.textContent = `${roomLabel(ex.room)} · ${ex.question_ids.length} سؤال · ${new Date(ex.created_at).toLocaleString('ar-EG')}`;

    const btns = el('div', 'row-btns');
    const edit = btn('✏️ تعديل');
    edit.onclick = () => {
      $('history-box').hidden = true;
      openCreate(ex);
    };
    const preview = btn('👁️ معاينة');
    preview.onclick = () => window.open(examUrl(ex.id), '_blank', 'noopener');
    const del = btn('🗑️ حذف', 'danger');
    del.onclick = async () => {
      if (!confirm(`تمسح الامتحان "${ex.title}"؟`)) return;
      const { data: gone, error: delErr } = await sb.from('quiz_exams').delete().eq('id', ex.id).select('id');
      if (delErr) return alert(delErr.message);
      if (!gone || !gone.length) return alert('ما اتمسحش الامتحان. مفيش صلاحية على الشعبة دي من حسابك.');
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

// ---------- التشغيل ----------
async function init() {
  setPickersFromRoom();

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
  $('save-draft').addEventListener('click', () => saveExam(false));
  $('save-publish').addEventListener('click', () => saveExam(true));
  $('c-track').addEventListener('change', () => loadCreateList([]));
  $('c-level').addEventListener('change', () => loadCreateList([]));

  $('history-btn').addEventListener('click', toggleHistory);

  // خلفية: متحركة (الافتراضي) أو هادية، والاختيار بيتحفظ
  const applyBg = () => {
    let calm = false;
    try { calm = localStorage.getItem('quizBgCalm') === '1'; } catch {}
    document.body.classList.toggle('calm', calm);
  };
  $('bg-toggle').addEventListener('click', () => {
    const nowCalm = !document.body.classList.contains('calm');
    try { localStorage.setItem('quizBgCalm', nowCalm ? '1' : '0'); } catch {}
    applyBg();
  });
  applyBg();

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