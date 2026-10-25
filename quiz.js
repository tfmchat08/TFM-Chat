// ---------- صفحة الاختبارات: بنك الأسئلة + الاختبارات الكاملة + التصحيح على السيرفر ----------

const SUPABASE_URL = 'https://jifoamltmdgpawpjgrbz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IiaTAO0BNUJTp_pzVidhhA_e1g82vpi';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const TRACKS = ['ar', 'en'];
const LEVELS = [1, 2, 3, 4];

const lang = (() => { try { return localStorage.getItem('lang') || 'ar'; } catch { return 'ar'; } })();
const isEn = lang === 'en';
const txt = (ar, en) => (isEn ? en : ar);

// لو الرابط فيه ?exam=ID يبقى ده اختبار كامل بيتحل
const params = new URLSearchParams(location.search);
const examId = params.get('exam') ? Number(params.get('exam')) : null;

let room = 'ar-1';
let questions = [];   // اللي الطالب بيحله: [{ id, question, options }]
let bank = [];        // بنك الأستاذ: [{ id, question, options, answer }]
let loggedIn = false;
let isStaff = false;
let myId = null;
let editingId = null;

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

// ---------- التبويبات (الأسئلة / الاختبارات) ----------
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('[data-pane]').forEach(p => {
    p.hidden = p.dataset.pane !== name;
  });
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

// ---------- تحميل اختبار كامل (رابط ?exam=ID) ----------
async function loadExam() {
  if (!loggedIn) {
    setStatus(txt('سجّل دخول من الشات الأول عشان تفتح الاختبار', 'Log in from the chat first to open the exam'));
    return;
  }
  setStatus(txt('بحمّل الاختبار...', 'Loading exam...'));
  const { data, error } = await sb.rpc('get_exam', { p_id: examId });
  if (error) {
    setStatus(txt('ما قدرتش أحمّل الاختبار: ', 'Could not load exam: ') + error.message);
    return;
  }
  if (!data) {
    setStatus(txt('الاختبار ده مش موجود، أو مش متاح ليك', 'This exam does not exist or is not available to you'));
    return;
  }

  room = data.room;
  const head = $('exam-head');
  head.textContent = '📝 ' + data.title;
  head.hidden = false;

  questions = data.questions || [];
  if (!questions.length) {
    setStatus(txt('الاختبار ده فاضي', 'This exam is empty'));
    return;
  }
  setStatus(txt(`عدد الأسئلة: ${questions.length}`, `Questions: ${questions.length}`));
  renderQuiz();
  $('print-btn').hidden = false;
}

// ---------- تحميل الشعبة العادية ----------
async function loadRoom() {
  room = `${$('track').value}-${$('level').value}`;
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

  if (isStaff) {
    await loadBank();
    await loadExams();
  }
}

// ---------- بنك الأستاذ ----------
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

    const top = el('div', 'bank-top');
    const cb = el('input', 'pick');
    cb.type = 'checkbox';
    cb.value = String(row.id);
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

    const btns = el('div', 'row-btns');
    const edit = btn('✏️ تعديل');
    edit.onclick = () => startEdit(row);
    const copy = btn('📋 نسخ');
    copy.title = 'نسخ السؤال لسؤال جديد';
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

    div.appendChild(top);
    div.appendChild(opts);
    div.appendChild(btns);
    box.appendChild(div);
  });
}

// حذف سؤال: لو السيرفر ما مسحش ولا صف (بسبب الصلاحية) بنقول للأستاذ بدل ما نعرض إنه اتمسح
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

// تحديد الكل / إلغاء التحديد
function togglePickAll() {
  const boxes = [...document.querySelectorAll('#bank-list input.pick')];
  if (!boxes.length) return;
  const allOn = boxes.every(b => b.checked);
  boxes.forEach(b => { b.checked = !allOn; });
  $('pick-all').textContent = allOn ? '☑️ تحديد الكل' : '⬜ إلغاء التحديد';
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

// تعديل سؤال موجود
function startEdit(row) {
  showTab('bank');
  editingId = row.id;
  fillForm(row);
  $('form-title').textContent = '✏️ تعديل السؤال';
  $('save-btn').textContent = '💾 حفظ التعديل';
  $('cancel-edit').hidden = false;
}

// نسخ سؤال: بيتملّي الفورم، وبيتحفظ كسؤال جديد
function duplicateQuestion(row) {
  showTab('bank');
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

// ---------- الاختبارات الكاملة ----------
async function makeExam() {
  const title = $('exam-title').value.trim();
  const picked = [...document.querySelectorAll('#bank-list input.pick:checked')].map(c => Number(c.value));

  if (!title) return alert('اكتب اسم الاختبار');
  if (!picked.length) return alert('علّم على سؤال واحد على الأقل من أسئلة الشعبة');

  // نحافظ على ترتيب البنك
  const ordered = bank.filter(r => picked.includes(r.id)).map(r => r.id);
  const { error } = await sb.from('quiz_exams').insert({ room, title, question_ids: ordered });
  if (error) return alert(error.message);

  $('exam-title').value = '';
  document.querySelectorAll('#bank-list input.pick').forEach(c => { c.checked = false; });
  $('pick-all').textContent = '☑️ تحديد الكل';
  await loadExams();
  showTab('exams');
}

async function loadExams() {
  const box = $('exam-list');
  box.innerHTML = '';
  const { data, error } = await sb.from('quiz_exams')
    .select('id, title, question_ids, created_at')
    .eq('room', room)
    .order('created_at', { ascending: false });

  if (error) {
    box.textContent = error.message;
    return;
  }
  if (!data || !data.length) {
    const p = el('p', 'empty-line');
    p.textContent = 'مفيش اختبارات للشعبة دي لسه. اعملها من لسان الأسئلة.';
    box.appendChild(p);
    return;
  }

  data.forEach(ex => {
    const div = el('div', 'exam-item');
    const link = examUrl(ex.id);

    const title = el('div', 'bank-q');
    title.textContent = '📝 ' + ex.title;
    const meta = el('div', 'exam-meta');
    meta.textContent = `عدد الأسئلة: ${ex.question_ids.length}`;

    const row = el('div', 'row-btns');

    const preview = btn('👁️ معاينة');
    preview.title = 'شوف الاختبار زي ما الطالب هيشوفه';
    preview.onclick = () => window.open(link, '_blank', 'noopener');

    const share = btn('📤 مشاركة');
    share.onclick = async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: ex.title, text: `📝 امتحان: ${ex.title}`, url: link });
          return;
        } catch { /* المستخدم لغى المشاركة */ return; }
      }
      copyLink(link);
    };

    const copy = btn('🔗 نسخ الرابط');
    copy.onclick = () => copyLink(link);

    const slot = el('select');
    for (let n = 1; n <= 5; n++) {
      const o = el('option');
      o.value = String(n);
      o.textContent = `شات ${n}`;
      slot.appendChild(o);
    }

    const send = btn('📨 ابعته في الشات', 'primary');
    send.onclick = async () => {
      send.disabled = true;
      const { error: sendErr } = await sb.from('messages').insert({
        user_id: myId,
        content: `📝 امتحان: ${ex.title}\n${link}`,
        room,
        chat_slot: Number(slot.value),
        reply_to: null,
        file_url: null,
        file_type: null,
      });
      send.disabled = false;
      if (sendErr) return alert(sendErr.message);
      alert('اتبعت الامتحان في الشات');
    };

    const del = btn('🗑️ حذف', 'danger');
    del.onclick = async () => {
      if (!confirm(`تمسح الاختبار "${ex.title}"؟`)) return;
      const { data: gone, error: delErr } = await sb.from('quiz_exams').delete().eq('id', ex.id).select('id');
      if (delErr) return alert(delErr.message);
      if (!gone || !gone.length) return alert('ما اتمسحش الاختبار. مفيش صلاحية على الشعبة دي من حسابك.');
      await loadExams();
    };

    row.appendChild(preview);
    row.appendChild(share);
    row.appendChild(copy);
    row.appendChild(slot);
    row.appendChild(send);
    row.appendChild(del);

    div.appendChild(title);
    div.appendChild(meta);
    div.appendChild(row);
    box.appendChild(div);
  });
}

async function copyLink(link) {
  try {
    await navigator.clipboard.writeText(link);
    alert('اتنسخ الرابط');
  } catch {
    prompt('انسخ الرابط ده:', link);
  }
}

// ---------- السجل: كل الأسئلة المضافة للشعبة بالتاريخ (للأدمن) ----------
function toggleHistory() {
  const box = $('history-box');
  const opening = box.hidden;
  box.hidden = !opening;
  if (opening) loadHistory();
}

async function loadHistory() {
  const list = $('history-list');
  list.innerHTML = '';
  const { data, error } = await sb.from('quiz_questions')
    .select('id, question, options, answer, created_at')
    .eq('room', room)
    .order('created_at', { ascending: false });

  if (error) {
    list.textContent = error.message;
    return;
  }
  const rows = data || [];
  $('count-hist').textContent = String(rows.length);

  if (!rows.length) {
    const p = el('p', 'empty-line');
    p.textContent = 'مفيش أسئلة مضافة للشعبة دي لسه';
    list.appendChild(p);
    return;
  }

  rows.forEach((row) => {
    const div = el('div', 'bank-item');

    const q = el('div', 'bank-q');
    q.textContent = row.question;

    const meta = el('div', 'exam-meta');
    meta.textContent = `أُضيف: ${new Date(row.created_at).toLocaleString('ar-EG')}`;

    const btns = el('div', 'row-btns');
    const edit = btn('✏️ تعديل');
    edit.onclick = () => {
      $('history-box').hidden = true;
      startEdit(row);
    };
    const del = btn('🗑️ حذف', 'danger');
    del.onclick = async () => {
      if (!confirm('تمسح السؤال ده؟')) return;
      if (!(await deleteQuestion(row.id))) return;
      await loadHistory();
      await loadRoom();
    };
    btns.appendChild(edit);
    btns.appendChild(del);

    div.appendChild(q);
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
  $('add-form').addEventListener('submit', saveQuestion);
  $('cancel-edit').addEventListener('click', stopEdit);
  $('pick-all').addEventListener('click', togglePickAll);
  $('exam-make').addEventListener('click', makeExam);
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

  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => showTab(t.dataset.tab));
  });

  let s;
  try {
    s = await checkUser();
  } catch {
    s = { loggedIn: false, staff: false, admin: false, id: null };
  }
  loggedIn = s.loggedIn;
  isStaff = s.staff;
  myId = s.id;
  // السجل للأدمن بس
  $('history-btn').hidden = !s.admin || !!examId;

  if (examId) {
    // وضع الاختبار: مفيش شعبة ولا لوحة أستاذ
    document.querySelector('.picker').hidden = true;
    $('staff-box').hidden = true;
    await loadExam();
    return;
  }

  $('staff-box').hidden = !isStaff;
  showTab('bank');
  await loadRoom();
}

init();