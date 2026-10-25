// ---------- بوابة كلمة السر لكل شعبة ومستوى ----------

const gateEl = document.createElement('div');
gateEl.id = 'room-gate';
gateEl.className = 'modal hidden';
gateEl.innerHTML = `
  <div class="modal-box">
    <h3 id="gate-title"></h3>
    <p class="hint" id="gate-hint"></p>
    <input id="gate-code" type="password" dir="ltr" autocomplete="off">
    <button id="gate-join" class="primary"></button>
    <button id="gate-logout" class="ghost"></button>
    <p id="gate-err" class="msg-text"></p>
  </div>`;
document.body.appendChild(gateEl);

function gateLabels() {
  const room = currentRoom();
  const parts = room.split('-');
  const trk = parts[0] === 'ar' ? t('trkAr') : t('trkEn');
  const lvl = t('lvl' + parts[1]);
  $('gate-title').textContent = `${trk} · ${lvl}`;
  $('gate-hint').textContent = lang === 'en'
    ? 'Enter the access code for this room'
    : 'اكتب كلمة السر للشعبة والمستوى ده';
  $('gate-join').textContent = lang === 'en' ? 'Enter' : 'دخول';
  $('gate-logout').textContent = lang === 'en' ? 'Log out' : 'تسجيل خروج';
  $('gate-code').placeholder = lang === 'en' ? 'Access code' : 'كلمة السر';
}

function showGate() {
  gateLabels();
  $('gate-err').textContent = '';
  $('gate-code').value = '';
  gateEl.classList.remove('hidden');
}

function hideGate() {
  gateEl.classList.add('hidden');
}

// لو الفحص فشل، البوابة بتفضل مقفولة وتوضح سبب الفشل (مش بتتخفي بصمت)
async function checkRoomGate() {
  const { data: sess } = await sb.auth.getSession();
  if (!sess.session) return;
  const { data, error } = await sb.rpc('has_room_access', { p_room: currentRoom() });
  if (error) {
    showGate();
    $('gate-err').textContent = error.message;
    return;
  }
  if (data === true) hideGate();
  else showGate();
}

$('gate-join').onclick = async () => {
  const code = $('gate-code').value.trim();
  if (!code) return;
  const { data, error } = await sb.rpc('join_room', { p_room: currentRoom(), p_code: code });
  if (error) {
    $('gate-err').textContent = error.message;
    return;
  }
  if (data === true) {
    location.reload();
  } else {
    $('gate-err').textContent = lang === 'en' ? 'Wrong code' : 'الكود غلط';
  }
};

$('gate-code').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('gate-join').click();
});

$('gate-logout').onclick = async () => {
  await sb.auth.signOut({ scope: 'local' });
  location.reload();
};

// ---------- الأدمن: تحديد كلمات سر الشعب ----------
const codesAdmin = document.createElement('div');
codesAdmin.className = 'ai-books-admin';
// داخل قايمة الأعضاء، فوق القايمة نفسها (عشان متتمسحش لما القايمة تتحدّث)
$('members-list').before(codesAdmin);
codesAdmin.classList.add('hidden');

function renderCodesAdmin() {
  codesAdmin.innerHTML = '';

  // الشعبة الحالية بس (الأدمن مش بيغيّر كلمة سر شعبة تانية)
  const room = currentRoom();

  const title = document.createElement('h3');
  title.textContent = lang === 'en'
    ? `🔑 Room code: ${aiRoomTitle(room)}`
    : `🔑 كلمة سر الشعبة: ${aiRoomTitle(room)}`;
  codesAdmin.appendChild(title);

  const form = document.createElement('div');
  form.className = 'ai-book-form';

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.dir = 'ltr';
  inp.placeholder = lang === 'en' ? 'New code (min 4 chars)' : 'كلمة السر الجديدة (4 حروف على الأقل)';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'primary';
  btn.textContent = lang === 'en' ? 'Save code' : 'حفظ الكود';
  btn.onclick = async () => {
    const code = inp.value.trim();
    if (code.length < 4) return alert(lang === 'en' ? 'Min 4 characters' : 'لازم 4 حروف على الأقل');
    const { error } = await sb.rpc('set_room_code', { p_room: room, p_code: code });
    if (error) return alert(error.message);
    inp.value = '';
    alert(lang === 'en' ? 'Saved. Users must re-enter the new code.' : 'اتحفظ. الطلاب لازم يدخلوا الكود الجديد.');
  };

  form.appendChild(inp);
  form.appendChild(btn);
  codesAdmin.appendChild(form);
}

// لما يفتح الأعضاء: الأدمن بس يشوف لوحة كلمات السر
$('members-btn').addEventListener('click', () => {
  const isAdmin = !!(currentProfile && currentProfile.role === 'admin');
  codesAdmin.classList.toggle('hidden', !isAdmin);
  if (isAdmin) renderCodesAdmin();
});

sb.auth.onAuthStateChange((event, session) => {
  if (session) setTimeout(checkRoomGate, 300);
  else hideGate();
});