// ---------- صفحة الاختبارات: بتقرا questions/<الغرفة>.json وتعرض الأسئلة وتصحح ----------

const $ = id => document.getElementById(id);
const TRACKS = ['ar', 'en'];
const LEVELS = [1, 2, 3, 4];

const lang = (() => { try { return localStorage.getItem('lang') || 'ar'; } catch { return 'ar'; } })();
const isEn = lang === 'en';
const txt = (ar, en) => (isEn ? en : ar);

let questions = [];
let room = 'ar-1';

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

function isValidQuestion(q) {
  return q && typeof q.q === 'string'
    && Array.isArray(q.options) && q.options.length >= 2
    && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length;
}

async function loadRoom() {
  $('status').textContent = txt('بحمّل الأسئلة...', 'Loading questions...');
  $('quiz').innerHTML = '';
  $('submit').hidden = true;
  $('reset').hidden = true;
  $('result').hidden = true;

  try {
    const res = await fetch(`questions/${room}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    questions = (Array.isArray(data.questions) ? data.questions : []).filter(isValidQuestion);
  } catch {
    questions = [];
    $('status').textContent = txt('ما قدرتش أحمّل الأسئلة دي', 'Could not load these questions');
    return;
  }

  if (!questions.length) {
    $('status').textContent = txt('مفيش أسئلة للشعبة والمستوى ده لسه', 'No questions for this room yet');
    return;
  }

  $('status').textContent = txt(`عدد الأسئلة: ${questions.length}`, `Questions: ${questions.length}`);
  render();
}

function render() {
  const form = $('quiz');
  form.innerHTML = '';

  questions.forEach((item, qi) => {
    const fs = document.createElement('fieldset');
    fs.className = 'q';
    fs.id = `q${qi}`;

    const legend = document.createElement('legend');
    legend.textContent = `${qi + 1}. ${item.q}`;
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

function submitQuiz() {
  let correct = 0;
  let unanswered = 0;

  questions.forEach((item, qi) => {
    const fs = $(`q${qi}`);
    const picked = document.querySelector(`input[name="q${qi}"]:checked`);
    fs.classList.remove('ok', 'bad');
    fs.querySelectorAll('.hint').forEach(h => h.remove());

    if (!picked) {
      unanswered++;
    } else if (Number(picked.value) === item.answer) {
      correct++;
      fs.classList.add('ok');
    } else {
      fs.classList.add('bad');
    }

    // بعد التصحيح: نوضح الإجابة الصح
    const hint = document.createElement('div');
    hint.className = 'hint ' + (picked && Number(picked.value) === item.answer ? 'ok' : 'bad');
    hint.textContent = !picked
      ? txt(`ما جاوبتش. الإجابة الصح: ${item.options[item.answer]}`, `Not answered. Correct answer: ${item.options[item.answer]}`)
      : (Number(picked.value) === item.answer
        ? txt('صح ✅', 'Correct ✅')
        : txt(`غلط ❌. الإجابة الصح: ${item.options[item.answer]}`, `Wrong ❌. Correct answer: ${item.options[item.answer]}`));
    fs.appendChild(hint);

    // شرح اختياري للسؤال لو موجود في الملف
    if (item.explain) {
      const ex = document.createElement('div');
      ex.className = 'hint';
      ex.textContent = txt('الشرح: ', 'Explanation: ') + String(item.explain);
      fs.appendChild(ex);
    }

    fs.querySelectorAll('input').forEach(i => { i.disabled = true; });
  });

  const total = questions.length;
  const pct = Math.round((correct / total) * 100);
  const result = $('result');
  result.textContent = txt(
    `نتيجتك: ${correct} من ${total} (${pct}%)` + (unanswered ? ` · لم تجب على ${unanswered}` : ''),
    `Your score: ${correct} of ${total} (${pct}%)` + (unanswered ? ` · ${unanswered} unanswered` : ''));
  result.hidden = false;

  // علامة كاملة = بادج "العبقري" (الصفحة دي مش مسجلة دخول، فبنسيب علامة وتتفتح لما يرجع للشات)
  if (correct === total && unanswered === 0) {
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

// ---------- الأحداث ----------
function setPickersFromRoom() {
  const r = readRoom();
  $('track').value = r.track;
  $('level').value = String(r.level);
  room = `${r.track}-${r.level}`;
}

$('track').addEventListener('change', () => {
  room = `${$('track').value}-${$('level').value}`;
  loadRoom();
});

$('level').addEventListener('change', () => {
  room = `${$('track').value}-${$('level').value}`;
  loadRoom();
});

$('submit').addEventListener('click', submitQuiz);
$('reset').addEventListener('click', resetQuiz);

setPickersFromRoom();
loadRoom();