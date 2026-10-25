// ---------- صفحة الاختبارات: الأسئلة من Supabase، والتصحيح على السيرفر ----------

const SUPABASE_URL = 'https://jifoamltmdgpawpjgrbz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IiaTAO0BNUJTp_pzVidhhA_e1g82vpi';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);
const TRACKS = ['ar', 'en'];
const LEVELS = [1, 2, 3, 4];

const lang = (() => { try { return localStorage.getItem('lang') || 'ar'; } catch { return 'ar'; } })();
const isEn = lang === 'en';
const txt = (ar, en) => (isEn ? en : ar);

let room = 'ar-1';
let questions = [];   // [{ id, question, options }]
let loggedIn = false;
let isStaff = false;

// الشعبة والمستوى بيتقروا من نفس الإعدادات اللي في الشات
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

function setStatus(msg) {
  $('status').textContent = msg;
}

// هل فيه جلسة؟ ولو فيه، هل هو أدمن/مرسل؟
async function checkUser() {
  const { data } = await sb.auth.getSession();
  const user = data && data.session ? data.session.user : null;
  if (!user) return { loggedIn: false, staff: false };
  const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return { loggedIn: true, staff: !!prof && (prof.role === 'admin' || prof.role === 'sender') };
}

async function loadRoom() {
  room = `${$('track').value}-${$('level').value}`;
  saveRoom($('track').value, $('level').value);

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
        render();
      }
    }
  }

  if (isStaff) await loadStaffList();
}

function render() {
  const form = $('quiz');
  form.innerHTML = '';

  questions.forEach((item, qi) => {
    const fs = document.createElement('fieldset');
    fs.className = 'q';
    fs.id = `q${qi}`;

    const legend = document.createElement('legend');
    legend.textContent = `${qi + 1}. ${item.question}`;
    fs.appendChild(legend);

    item.options.forEach((opt, oi) => {
      const label = document.createElement('label');
      label.className = 'opt';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${qi}`;
      input.value = String(oi);

      const span = document.createElement('span');
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
  const { data, error } = await sb.rpc('submit_quiz', { p_room: room, p_answers: answers });
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

    if (!picked) {
      const hint = document.createElement('div');
      hint.className = 'hint bad';
      hint.textContent = txt(`ما جاوبتش. الإجابة الصح: ${correctText}`, `Not answered. Correct answer: ${correctText}`);
      fs.appendChild(hint);
    } else if (r.correct) {
      fs.classList.add('ok');
      const hint = document.createElement('div');
      hint.className = 'hint ok';
      hint.textContent = txt('صح ✅', 'Correct ✅');
      fs.appendChild(hint);
    } else {
      fs.classList.add('bad');
      const hint = document.createElement('div');
      hint.className = 'hint bad';
      hint.textContent = txt(`غلط ❌. الإجابة الصح: ${correctText}`, `Wrong ❌. Correct answer: ${correctText}`);
      fs.appendChild(hint);
    }

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
  }

  $('submit').hidden = true;
  $('reset').hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetQuiz() {
  render();
  $('result').hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- لوحة الأستاذ ----------
async function loadStaffList() {
  const box = $('staff-list');
  box.innerHTML = '';
  const { data, error } = await sb.from('quiz_questions')
    .select('id, question, options, answer')
    .eq('room', room)
    .order('id', { ascending: true });

  if (error) {
    box.textContent = error.message;
    return;
  }
  const rows = data || [];
  $('count-staff').textContent = String(rows.length);
  if (!rows.length) {
    box.textContent = 'مفيش أسئلة للشعبة دي لسه';
    return;
  }

  rows.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'staff-item';

    const title = document.createElement('div');
    title.className = 'staff-q';
    title.textContent = `${i + 1}. ${row.question}`;

    const opts = document.createElement('div');
    opts.className = 'staff-opts';
    row.options.forEach((o, oi) => {
      const line = document.createElement('div');
      line.textContent = (oi === row.answer ? '✅ ' : '• ') + o;
      opts.appendChild(line);
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.textContent = '🗑️ حذف';
    del.onclick = async () => {
      if (!confirm('تمسح السؤال ده؟')) return;
      const { error: delErr } = await sb.from('quiz_questions').delete().eq('id', row.id);
      if (delErr) return alert(delErr.message);
      await loadRoom();
    };

    div.appendChild(title);
    div.appendChild(opts);
    div.appendChild(del);
    box.appendChild(div);
  });
}

async function addQuestion(e) {
  e.preventDefault();
  const question = $('new-q').value.trim();
  const picked = document.querySelector('input[name="new-ans"]:checked');
  const correctIdx = picked ? Number(picked.value) : -1;

  const inputs = [...document.querySelectorAll('.new-opt')];
  // بناخد الاختيارات الفاضية، ونظبط رقم الإجابة الصح حسب الترتيب الجديد
  const opts = inputs
    .map((el, i) => ({ text: el.value.trim(), i }))
    .filter(o => o.text);

  if (!question) return alert('اكتب نص السؤال');
  if (opts.length < 2) return alert('لازم اختيارين على الأقل');
  const answerPos = opts.findIndex(o => o.i === correctIdx);
  if (answerPos < 0) return alert('علّم على الإجابة الصح من الاختيارات المكتوبة');

  const { error } = await sb.from('quiz_questions').insert({
    room,
    question,
    options: opts.map(o => o.text),
    answer: answerPos,
  });
  if (error) return alert(error.message);

  $('add-form').reset();
  await loadRoom();
}

// ---------- الأحداث والتشغيل ----------
function setPickersFromRoom() {
  const r = readRoom();
  $('track').value = r.track;
  $('level').value = String(r.level);
}

async function init() {
  setPickersFromRoom();

  $('track').addEventListener('change', loadRoom);
  $('level').addEventListener('change', loadRoom);
  $('submit').addEventListener('click', submitQuiz);
  $('reset').addEventListener('click', resetQuiz);
  $('add-form').addEventListener('submit', addQuestion);

  try {
    const s = await checkUser();
    loggedIn = s.loggedIn;
    isStaff = s.staff;
  } catch {
    loggedIn = false;
    isStaff = false;
  }
  $('staff-box').hidden = !isStaff;

  await loadRoom();
}

init();