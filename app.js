const SUPABASE_URL = 'https://jifoamltmdgpawpjgrbz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IiaTAO0BNUJTp_pzVidhhA_e1g82vpi';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);

const CONTACT_EMAIL = 'tfm.chat08@gmail.com';
const BASE_TITLE = 'TFM Chat';
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// ---------- الترجمة ----------
const T = {
  ar: {
    login: 'دخول', signup: 'حساب جديد', createAccount: 'إنشاء حساب',
    email: 'الإيميل', password: 'الباسورد', newPassword: 'الباسورد الجديد',
    pwRule: 'الباسورد 8 حروف على الأقل، فيه حرف كبير وحرف صغير ورقم ورمز (مثال: Ab12@xyz)',
    chooseAvatarSignup: 'لازم تختار صورة بروفايل عشان تعمل الحساب',
    chooseAvatar: 'لازم تختار صورة بروفايل قبل ما تدخل',
    save: 'حفظ', forgot: 'نسيت كلمة السر؟', google: 'تسجيل الدخول بجوجل', contact: 'التواصل والشكاوي',
    settings: 'الإعدادات', changeAvatar: 'تغيير صورة البروفايل', changeName: 'تغيير اسم المستخدم',
    changeBg: 'تغيير خلفية الشات', chatBg: 'خلفية الشات', uploadBg: 'رفع صورة من جهازي',
    resetBg: 'رجّع الخلفية الافتراضية', bgFail: 'فشل حفظ الخلفية: ',
    history: 'السجل', admin: 'لوحة الأدمن', search: 'بحث', logout: 'تسجيل خروج',
    searchPh: 'ابحث في الرسايل...', msgPh: 'اكتب رسالة...', send: 'إرسال',
    emailPwReq: 'اكتب الإيميل والباسورد', emailReq: 'اكتب إيميلك الأول',
    pwInvalid: 'الباسورد لازم يكون 8 حروف على الأقل، وفيه حرف كبير وصغير ورقم ورمز',
    avatarReq: 'اختار صورة بروفايل الأول',
    checkEmail: 'اتعمل الحساب. اتأكد من إيميلك أو سجّل دخول',
    loginFail: 'الإيميل أو الباسورد غلط. لو انت معندكش حساب، اعمل حساب جديد الأول', exists: 'الإيميل ده متسجل قبل كده',
    resetSent: 'بعتنالك لينك تغيير الباسورد على الإيميل', pwChanged: 'تم تغيير الباسورد',
    linkExpired: 'اللينك انتهى أو اتستخدم قبل كده. اطلب لينك جديد من "نسيت كلمة السر"',
    recTitle: 'باسورد جديد', recSave: 'حفظ الباسورد',
    nameAsk: 'اكتب الاسم الجديد:', nameFail: 'فشل التغيير: ',
    avatarFail: 'فشل رفع الصورة: ', avatarSaved: 'تم حفظ صورة البروفايل',
    deleteAsk: 'تمسح الرسالة دي؟', deleteFail: 'فشل المسح: ', sendFail: 'فشل الإرسال: ',
    uploadFail: 'فشل الرفع: ', loadFail: 'فشل تحميل الرسايل: ',
    camFail: 'ما قدرتش أفتح الكاميرا: ', micFail: 'ما قدرتش أفتح الميكروفون: ',
    copyFail: 'ما قدرتش أنسخ الرسالة', copy: 'نسخ', delete: 'مسح',
    pin: '📌 تثبيت', unpin: '📌 فك التثبيت', pinnedLabel: 'مثبتة', pinFail: 'فشل التثبيت: ',
    reply: '↩️ رد', edit: '✏️ تعديل', replyTo: 'رد على', editedLabel: '(معدّلة)',
    editAsk: 'عدّل الرسالة:', editFail: 'فشل التعديل: ', reactFail: 'فشل التفاعل: ',
    noRows: 'مفيش حاجة هنا لسه', tabLinks: 'روابط', tabDocs: 'ملفات', tabMedia: 'ميديا',
    image: 'صورة', audio: 'صوت', video: 'فيديو', file: 'ملف',
    camera: 'الكاميرا', shoot: 'تصوير وإرسال',
    contactTitle: 'التواصل والشكاوي', contactInfo: 'للتواصل أو تقديم الشكاوي:',
    emailLabel: 'الإيميل:', contactPh: 'اكتب شكواك أو رسالتك هنا...', contactBtn: 'إرسال عن طريق الإيميل',
    contactSubject: 'TFM Chat - تواصل وشكوى',
    roles: 'إدارة الأدوار', userDefault: 'مستخدم', profileFail: 'خطأ في تحميل البروفايل',
    noProfile: 'مفيش بروفايل للحساب ده',
    kick: 'طرد', unkick: 'فك الطرد',
    kickedMsg: 'تم طرد حسابك من المنصة. كلّم الأدمن',
    track: 'الشعبة', level: 'المستوى',
    trkAr: 'عربي', trkEn: 'انجليزي',
    lvl1: 'الأول', lvl2: 'الثاني', lvl3: 'الثالث', lvl4: 'الرابع',
    membersTitle: 'الأعضاء', adminsTitle: 'الأدمنز', membersSection: 'الأعضاء',
    roleAdmin: 'أدمن', roleSender: 'مرسل', roleViewer: 'مشاهد',
    notifOn: '🔔 تفعيل الإشعارات', notifOk: 'الإشعارات اتفعلت', notifDenied: 'الإشعارات متقفلة من إعدادات المتصفح',
    typingNow: 'بيكتب...', recording: 'بيسجل صوت...',
    createdBy: 'Created by', designedBy: 'Designed by',
    toggleLang: 'English', toLight: '☀️ وضع نهار', toDark: '🌙 وضع ليلي'
  },
  en: {
    login: 'Login', signup: 'Sign up', createAccount: 'Create account',
    email: 'Email', password: 'Password', newPassword: 'New password',
    pwRule: 'At least 8 characters, with uppercase, lowercase, a number and a symbol (example: Ab12@xyz)',
    chooseAvatarSignup: 'You must choose a profile picture to create your account',
    chooseAvatar: 'You must choose a profile picture before entering',
    save: 'Save', forgot: 'Forgot password?', google: 'Continue with Google', contact: 'Contact & complaints',
    settings: 'Settings', changeAvatar: 'Change profile picture', changeName: 'Change display name',
    changeBg: 'Change chat background', chatBg: 'Chat background', uploadBg: 'Upload image from my device',
    resetBg: 'Restore default background', bgFail: 'Failed to save background: ',
    history: 'History', admin: 'Admin panel', search: 'Search', logout: 'Log out',
    searchPh: 'Search messages...', msgPh: 'Write a message...', send: 'Send',
    emailPwReq: 'Enter email and password', emailReq: 'Enter your email first',
    pwInvalid: 'Password must be at least 8 characters with uppercase, lowercase, a number and a symbol',
    avatarReq: 'Choose a profile picture first',
    checkEmail: 'Account created. Check your email or log in',
    loginFail: 'Wrong email or password. If you do not have an account, please create one first', exists: 'This email is already registered',
    resetSent: 'We sent a password reset link to your email', pwChanged: 'Password changed',
    linkExpired: 'This link expired or was already used. Request a new one from "Forgot password?"',
    recTitle: 'New password', recSave: 'Save password',
    nameAsk: 'Enter the new name:', nameFail: 'Failed: ',
    avatarFail: 'Image upload failed: ', avatarSaved: 'Profile picture saved',
    deleteAsk: 'Delete this message?', deleteFail: 'Delete failed: ', sendFail: 'Send failed: ',
    uploadFail: 'Upload failed: ', loadFail: 'Failed to load messages: ',
    camFail: 'Could not open camera: ', micFail: 'Could not open microphone: ',
    copyFail: 'Could not copy the message', copy: 'Copy', delete: 'Delete',
    pin: '📌 Pin', unpin: '📌 Unpin', pinnedLabel: 'Pinned', pinFail: 'Pin failed: ',
    reply: '↩️ Reply', edit: '✏️ Edit', replyTo: 'Replying to', editedLabel: '(edited)',
    editAsk: 'Edit message:', editFail: 'Edit failed: ', reactFail: 'Reaction failed: ',
    noRows: 'Nothing here yet', tabLinks: 'Links', tabDocs: 'Documents', tabMedia: 'Media',
    image: 'Image', audio: 'Audio', video: 'Video', file: 'File',
    camera: 'Camera', shoot: 'Capture & send',
    contactTitle: 'Contact & complaints', contactInfo: 'For contact or complaints:',
    emailLabel: 'Email:', contactPh: 'Write your complaint or message here...', contactBtn: 'Send by email',
    contactSubject: 'TFM Chat - Contact & Complaint',
    roles: 'Role management', userDefault: 'User', profileFail: 'Failed to load profile',
    noProfile: 'No profile found for this account',
    kick: 'Kick', unkick: 'Unkick',
    kickedMsg: 'Your account was removed from the platform. Contact the admin',
    track: 'Track', level: 'Level',
    trkAr: 'Arabic', trkEn: 'English',
    lvl1: '1st', lvl2: '2nd', lvl3: '3rd', lvl4: '4th',
    membersTitle: 'Members', adminsTitle: 'Admins', membersSection: 'Members',
    roleAdmin: 'Admin', roleSender: 'Sender', roleViewer: 'Viewer',
    notifOn: '🔔 Enable notifications', notifOk: 'Notifications enabled', notifDenied: 'Notifications are blocked in browser settings',
    typingNow: 'is typing...', recording: 'is recording audio...',
    createdBy: 'Created by', designedBy: 'Designed by',
    toggleLang: 'عربي', toLight: '☀️ Day mode', toDark: '🌙 Night mode'
  }
};

let lang = localStorage.getItem('lang') || 'ar';
let theme = localStorage.getItem('theme') || 'dark';

function t(k) { return (T[lang] && T[lang][k]) || k; }

function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = theme;

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('.lang-toggle').forEach(b => { b.textContent = t('toggleLang'); });
  document.querySelectorAll('.theme-toggle').forEach(b => { b.textContent = theme === 'dark' ? t('toLight') : t('toDark'); });

  setAuthMode(authMode);
  if (currentProfile) refreshUserLabel();
}

function toggleLang() {
  lang = lang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('lang', lang);
  applyI18n();
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
  applyI18n();
}

document.querySelectorAll('.lang-toggle').forEach(b => { b.onclick = toggleLang; });
document.querySelectorAll('.theme-toggle').forEach(b => { b.onclick = toggleTheme; });

// ---------- الشعبة والمستوى (بيتختاروا قبل الدخول) ----------
const TRACKS = ['ar', 'en'];
const LEVELS = [1, 2, 3, 4];

function readRoom() {
  let tr = 'ar';
  let lv = 1;
  try {
    const savedTrack = localStorage.getItem('track');
    const savedLevel = Number(localStorage.getItem('level'));
    if (TRACKS.includes(savedTrack)) tr = savedTrack;
    if (LEVELS.includes(savedLevel)) lv = savedLevel;
  } catch {}
  return { track: tr, level: lv };
}

let { track, level } = readRoom();

function currentRoom() {
  return `${track}-${level}`;
}

// الشات اللي جوه الشعبة (من 1 لـ 5)
function readChatSlot() {
  try {
    const n = Number(localStorage.getItem('chatSlot'));
    return n >= 1 && n <= 5 ? n : 1;
  } catch {
    return 1;
  }
}
let currentChatSlot = readChatSlot();

function saveChatSlot() {
  try { localStorage.setItem('chatSlot', String(currentChatSlot)); } catch {}
}

function saveRoom() {
  try {
    localStorage.setItem('track', track);
    localStorage.setItem('level', String(level));
  } catch {}
}

function applyRoomUI() {
  $('track-select').value = track;
  $('level-select').value = String(level);
}

$('track-select').onchange = () => {
  track = $('track-select').value;
  saveRoom();
  onRoomChanged();
};

$('level-select').onchange = () => {
  level = Number($('level-select').value);
  saveRoom();
  onRoomChanged();
};

// لما الشعبة أو المستوى يتغيروا: نفضّي الرسايل القديمة، نفحص كود الدخول، ونحمّل رسايل الشعبة الجديدة
function onRoomChanged() {
  if (!currentProfile) return;
  $('messages').innerHTML = '';
  msgById = new Map();
  reactMap.clear();
  renderPinned();
  if (typeof checkRoomGate === 'function') checkRoomGate();
  loadMessages();
  joinTyping();
}

// ---------- متغيرات ----------
let currentProfile = null;
let subscribed = false;
let msgById = new Map();
let menuMsgId = null;
let activeTab = 'links';
let authMode = 'login';
let recovering = false;
let signingUp = false;
let camStream = null;
let recorder = null;
let chunks = [];
let kickChannel = null;
let kickUserId = null;
let unread = 0;

// مؤشر الكتابة والتسجيل
let typingChannel = null;
let typingRoom = null;
const typers = new Map();
let lastTypeSent = 0;
let recTimer = null;

// الرد والتفاعلات
let replyingTo = null;
const reactMap = new Map(); // رقم الرسالة -> Map(إيموجي -> Set(user ids))

const ROLE_KEYS = { admin: 'roleAdmin', sender: 'roleSender', viewer: 'roleViewer' };

// ---------- مساعدات ----------
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showScreen(id) {
  ['auth-screen', 'recovery-screen', 'chat-screen'].forEach(s => $(s).classList.add('hidden'));
  $(id).classList.remove('hidden');
  $('members-panel').classList.add('hidden');
}

function setMsg(id, text, isErr = true) {
  const el = $(id);
  el.textContent = text;
  el.className = 'msg-text' + (isErr ? '' : ' ok');
}

function translateError(msg) {
  if (!msg) return t('loginFail');
  if (msg.includes('Invalid login')) return t('loginFail');
  if (msg.includes('already registered')) return t('exists');
  if (msg.includes('Password should')) return t('pwInvalid');
  return msg;
}

function validPassword(p) {
  return p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);
}

function scrollBottom() {
  const el = $('messages');
  el.scrollTop = el.scrollHeight;
}

// ---------- مشغل الصوت المخصص (بدل المشغل الافتراضي للمتصفح) ----------
function voicePlayerHtml(src) {
  return `<div class="vp" dir="ltr">
    <audio src="${esc(src)}" preload="metadata"></audio>
    <button type="button" class="vp-play" aria-label="play">▶</button>
    <div class="vp-track"><div class="vp-fill"></div></div>
    <span class="vp-time">0:00</span>
  </div>`;
}

function voiceFmt(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
}

// الكليك على المشغل بيتعالج هنا بالكامل (capture) عشان ما يفتحش قايمة الرسالة
document.addEventListener('click', e => {
  const box = e.target.closest && e.target.closest('.vp');
  if (!box) return;
  e.stopPropagation();
  const audio = box.querySelector('audio');

  if (e.target.closest('.vp-play')) {
    if (audio.paused) {
      document.querySelectorAll('.vp audio').forEach(a => { if (a !== audio) a.pause(); });
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    return;
  }

  const track = e.target.closest('.vp-track');
  if (track && audio.duration) {
    const r = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    audio.currentTime = ratio * audio.duration;
  }
}, true);

// تحديث الشريط والوقت والزرار (أحداث الميديا ما بتطلعش للفوق، فبنستخدم capture)
['timeupdate', 'loadedmetadata', 'play', 'pause', 'ended'].forEach(ev => {
  document.addEventListener(ev, e => {
    const audio = e.target;
    if (!(audio instanceof HTMLAudioElement)) return;
    const box = audio.closest('.vp');
    if (!box) return;
    const d = audio.duration;
    box.querySelector('.vp-fill').style.width = (d ? (audio.currentTime / d) * 100 : 0) + '%';
    box.querySelector('.vp-time').textContent = voiceFmt(audio.currentTime) + ' / ' + voiceFmt(d);
    box.querySelector('.vp-play').textContent = audio.paused ? '▶' : '❚❚';
  }, true);
});

function isMediaType(tp) {
  return !!tp && (tp.startsWith('image/') || tp.startsWith('video/') || tp.startsWith('audio/'));
}

function extractLinks(text) {
  return (text || '').match(/https?:\/\/[^\s]+/g) || [];
}

function fileName(url) {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]); }
  catch { return 'file'; }
}

function refreshUserLabel() {
  if (!currentProfile) return;
  const name = currentProfile.display_name || t('userDefault');
  $('user-label').textContent = `${name} (${currentProfile.role})`;
}

function canSend() {
  return !!currentProfile && (currentProfile.role === 'admin' || currentProfile.role === 'sender');
}

async function uploadAvatar(file, userId) {
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^\w]/g, '');
  const path = `${userId}/avatar_${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from('uploads').getPublicUrl(path);
  const { error: e2 } = await sb.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
  if (e2) throw new Error(e2.message);
  return data.publicUrl;
}

// ---------- شاشة الدخول ----------
document.querySelectorAll('.auth-tab').forEach(tb => {
  tb.onclick = () => setAuthMode(tb.dataset.mode);
});

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach(tb => tb.classList.toggle('active', tb.dataset.mode === mode));
  $('auth-submit').textContent = mode === 'login' ? t('login') : t('createAccount');
  $('forgot-btn').classList.toggle('hidden', mode !== 'login');
  $('signup-box').classList.toggle('hidden', mode !== 'signup');
  // جملة شروط الباسورد تظهر بس في إنشاء الحساب
  $('pw-hint').classList.toggle('hidden', mode !== 'signup');
  setMsg('auth-msg', '');
}

$('signup-avatar-input').onchange = () => {
  const file = $('signup-avatar-input').files[0];
  if (!file) return;
  const pv = $('signup-preview');
  pv.src = URL.createObjectURL(file);
  pv.classList.remove('hidden');
};

$('auth-submit').onclick = async () => {
  const email = $('email').value.trim();
  const password = $('password').value;
  if (!email || !password) return setMsg('auth-msg', t('emailPwReq'));

  if (authMode === 'login') {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setMsg('auth-msg', translateError(error.message));
    return;
  }

  // إنشاء حساب
  if (!validPassword(password)) return setMsg('auth-msg', t('pwInvalid'));

  signingUp = true;
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin + window.location.pathname }
  });
  if (error) {
    signingUp = false;
    return setMsg('auth-msg', translateError(error.message));
  }
  if (!data.session) {
    signingUp = false;
    setAuthMode('login');
    return setMsg('auth-msg', t('checkEmail'), false);
  }
  signingUp = false;
  await enterChat(data.user.id);
};

$('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('auth-submit').click();
});

$('forgot-btn').onclick = async () => {
  const email = $('email').value.trim();
  if (!email) return setMsg('auth-msg', t('emailReq'));
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) setMsg('auth-msg', error.message);
  else setMsg('auth-msg', t('resetSent'), false);
};

// ---------- تسجيل الدخول بجوجل ----------
$('google-btn').onclick = async () => {
  setMsg('auth-msg', '');
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  if (error) setMsg('auth-msg', error.message);
};

// ---------- التواصل ----------
$('contact-open').onclick = () => $('contact-modal').classList.remove('hidden');
$('contact-close').onclick = () => $('contact-modal').classList.add('hidden');
$('contact-send').onclick = () => {
  const text = $('contact-msg').value.trim();
  if (!text) return alert(lang === 'en' ? 'Write your message first' : 'اكتب رسالتك الأول');

  const subject = encodeURIComponent(t('contactSubject'));
  const body = encodeURIComponent(text);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // الموبايل: بيفتح تطبيق الإيميل
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  } else {
    // الكمبيوتر: بيفتح Gmail في تاب جديد (لأن mailto مش بيشتغل من غير برنامج إيميل)
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}&su=${subject}&body=${body}`;
    const w = window.open(url, '_blank');
    if (!w) window.location.href = url;
  }
};

// ---------- تغيير الباسورد بعد اللينك ----------
$('recovery-btn').onclick = async () => {
  const pw = $('new-password').value;
  if (!validPassword(pw)) return setMsg('rec-msg', t('pwInvalid'));

  // لو مفيش جلسة فعلية، اللينك انتهى أو اتستخدم قبل كده
  const { data: cur } = await sb.auth.getSession();
  if (!cur.session) {
    recovering = false;
    $('new-password').value = '';
    showScreen('auth-screen');
    return setMsg('auth-msg', t('linkExpired'));
  }

  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return setMsg('rec-msg', error.message);
  recovering = false;
  $('new-password').value = '';
  alert(t('pwChanged'));
  const { data } = await sb.auth.getSession();
  if (data.session) await enterChat(data.session.user.id);
  else showScreen('auth-screen');
};

// ---------- حالة الجلسة ----------
// setTimeout عشان ما نعملش استدعاءات لـ Supabase جوه الـ callback مباشرة (ممكن تعمل تعليق)
sb.auth.onAuthStateChange((event, session) => {
  setTimeout(() => handleAuthChange(event, session), 0);
});

async function handleAuthChange(event, session) {
  // نمسح التوكن من اللينك عشان شاشة الباسورد الجديد ما تتفتحش تاني مع الريفريش
  if ((session || event === 'PASSWORD_RECOVERY') &&
      /access_token|type=recovery|code=/.test(location.hash + location.search)) {
    history.replaceState(null, '', location.pathname);
  }

  if (event === 'PASSWORD_RECOVERY') {
    recovering = true;
    showScreen('recovery-screen');
    return;
  }
  if (recovering || signingUp) return;
  if (session) {
    await enterChat(session.user.id);
  } else {
    currentProfile = null;
    $('avatar-gate').classList.add('hidden');
    leaveTyping();
    showScreen('auth-screen');
  }
}

// بوابة إعداد البروفايل: اسم + صورة (ارفع أو اختار من الجاهزة)
function openProfileGate() {
  const en = lang === 'en';
  $('pg-title').textContent = en ? 'Set up your profile' : 'جهّز بروفايلك';
  $('pg-hint').textContent = en
    ? 'Choose your display name and a picture (upload one or pick a ready one)'
    : 'اكتب اسمك واختار صورة (ارفع صورة أو اختار من الجاهزة)';
  $('pg-name').placeholder = en ? 'Your name' : 'اسمك';
  $('pg-name').value = currentProfile.display_name || '';
  $('gate-msg').textContent = '';
  showScreen('auth-screen');
  $('avatar-gate').classList.remove('hidden');
}

async function enterChat(userId) {
  const ok = await loadProfile(userId);
  if (!ok) return;

  watchKick(currentProfile.id);

  // أول دخول (بجوجل أو إيميل) لازم يكتب اسمه ويختار صورة الأول
  if (!currentProfile.avatar_url || !currentProfile.profile_setup) {
    openProfileGate();
    return;
  }

  $('avatar-gate').classList.add('hidden');
  showScreen('chat-screen');
  await loadMessages();
  subscribeToMessages();
  joinTyping();
}

// حفظ بوابة إعداد البروفايل (الاسم + الصورة)
$('gate-save').onclick = async () => {
  const name = $('pg-name').value.trim();
  if (name.length < 2) {
    return setMsg('gate-msg', lang === 'en' ? 'Name must be at least 2 characters' : 'الاسم لازم يكون حرفين على الأقل');
  }
  const file = $('gate-input').files[0];
  const hasAvatar = !!currentProfile.avatar_url;
  if (!file && !window.pickedAvatar && !hasAvatar) return setMsg('gate-msg', t('avatarReq'));
  try {
    // الصورة بتتحفظ بس لو المستخدم اختار واحدة جديدة
    if (file || window.pickedAvatar) await saveAvatarChoice(file, currentProfile.id);
    const { error } = await sb.from('profiles')
      .update({ display_name: name, profile_setup: true })
      .eq('id', currentProfile.id);
    if (error) throw error;
  } catch (e) {
    return setMsg('gate-msg', t('avatarFail') + e.message);
  }
  window.pickedAvatar = null;
  await enterChat(currentProfile.id);
};

// ---------- البروفايل ----------
async function loadProfile(userId) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) {
    setMsg('auth-msg', error ? t('profileFail') : t('noProfile'));
    await sb.auth.signOut();
    return false;
  }

  if (data.is_banned) {
    setMsg('auth-msg', t('kickedMsg'));
    await sb.auth.signOut();
    return false;
  }

  currentProfile = data;
  refreshUserLabel();

  const av = $('my-avatar');
  if (data.avatar_url) {
    av.src = data.avatar_url;
    av.hidden = false;
  } else {
    av.hidden = true;
  }

  const writable = canSend();
  $('msg-input').disabled = !writable;
  $('send-btn').disabled = !writable;
  $('attach-btn').disabled = !writable;
  $('cam-btn').disabled = !writable;
  $('mic-btn').disabled = !writable;
  return true;
}

// ---------- الطرد الفوري ----------
function watchKick(userId) {
  if (kickUserId === userId) return;
  kickUserId = userId;
  if (kickChannel) sb.removeChannel(kickChannel);

  kickChannel = sb.channel('kick-' + userId)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`
    }, payload => {
      if (payload.new.is_banned) {
        alert(t('kickedMsg'));
        sb.auth.signOut();
      }
    })
    .subscribe();
}

// ---------- الأعضاء (قايمة من الجنب) ----------
$('members-btn').onclick = async () => {
  $('members-panel').classList.remove('hidden');
  await loadMembers();
};
$('members-close').onclick = () => $('members-panel').classList.add('hidden');

async function loadMembers() {
  const box = $('members-list');
  if (window.loadBadges) await window.loadBadges();
  // أعضاء الشعبة دي بس (من السيرفر)
  const { data, error } = await sb.rpc('room_members', { p_room: currentRoom() });

  if (error) {
    box.innerHTML = `<p class="empty">${esc(error.message)}</p>`;
    return;
  }

  const admins = data.filter(p => p.role === 'admin');
  const others = data.filter(p => p.role !== 'admin');
  box.innerHTML = '';

  const addSection = title => {
    const h = document.createElement('div');
    h.className = 'members-section';
    h.textContent = title;
    box.appendChild(h);
  };

  const addRow = p => {
    const name = p.display_name || t('userDefault');
    const row = document.createElement('div');
    row.className = 'member-row' + (p.role === 'admin' ? ' is-admin' : '');

    const avatar = p.avatar_url
      ? `<img class="member-avatar" src="${esc(p.avatar_url)}" alt="">`
      : `<div class="member-avatar member-initial">${esc(name.charAt(0))}</div>`;
    const banned = p.is_banned && currentProfile && currentProfile.role === 'admin' ? ' 🚫' : '';

    row.innerHTML = `${avatar}<div class="member-info"><b>${esc(name)}${banned}</b><span class="role-tag">${t(ROLE_KEYS[p.role] || 'roleViewer')}</span></div>`;
    // زرار ⋮ بيفتح قايمة الإجراءات لكل عضو
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'ghost';
    more.textContent = '⋮';
    more.title = lang === 'en' ? 'Actions' : 'إجراءات';
    row.appendChild(more);

    const actions = document.createElement('div');
    actions.className = 'member-actions hidden';
    actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;width:100%;padding:8px 0 2px;';

    const addAction = (label, onclick, cls = 'ghost') => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = label;
      b.onclick = onclick;
      actions.appendChild(b);
    };

    more.onclick = () => actions.classList.toggle('hidden');

    // الكل يشوف رسايل العضو
    addAction('📜 رسايله في الشعبة', () => showUserMessages(p.id, name));

    // أدوات الأدمن بس (على الأعضاء التانيين)
    if (currentProfile && currentProfile.role === 'admin' && p.id !== currentProfile.id) {
      const who = p.display_name || p.id.slice(0, 8);

      ['admin', 'sender', 'viewer'].forEach(r => {
        const isCurrent = p.role === r;
        addAction(`${isCurrent ? '✔ ' : ''}${t(ROLE_KEYS[r])}`, async () => {
          if (isCurrent) return;
          const { error } = await sb.from('profiles').update({ role: r }).eq('id', p.id);
          if (error) alert(error.message);
          else await loadMembers();
        }, isCurrent ? 'primary' : 'ghost');
      });

      addAction(p.is_banned ? t('unkick') : t('kick'), async () => {
        const { error } = await sb.from('profiles').update({ is_banned: !p.is_banned }).eq('id', p.id);
        if (error) alert(error.message);
        else await loadMembers();
      }, p.is_banned ? 'ghost' : 'danger-btn');

      (window.ownedBadgeKeys ? window.ownedBadgeKeys(p.id) : []).forEach(key => {
        addAction(`🏷️ شيل بادج: ${window.badgeLabel(key)}`, async () => {
          if (!confirm(`تشيل بادج "${window.badgeLabel(key)}" من "${who}"؟`)) return;
          await window.revokeBadge(p.id, key);
        }, 'ghost');
      });

      addAction('🗑️ حذف الحساب', async () => {
        if (p.role === 'admin') return alert('مينفعش تحذف أدمن من هنا');
        if (!confirm(`هتحذف حساب "${who}" نهائياً ورسايله وبياناته؟ ومش هيرجع.`)) return;
        try {
          const { data, error } = await sb.functions.invoke('admin-delete-user', { body: { userId: p.id } });
          if (error || (data && data.error)) {
            alert('الحذف ما اتعملش: ' + ((data && data.error) || (error && error.message) || ''));
            return;
          }
          await loadMembers();
        } catch {
          alert('حصلت مشكلة، جرّب تاني.');
        }
      }, 'danger-btn');
    }

    const wrap = document.createElement('div');
    wrap.className = 'member-wrap';
    wrap.appendChild(row);
    wrap.appendChild(actions);
    box.appendChild(wrap);
  };

  if (admins.length) {
    addSection(t('adminsTitle'));
    admins.forEach(addRow);
  }
  addSection(t('membersSection'));
  others.forEach(addRow);
}

// ---------- الإعدادات ----------
$('settings-btn').onclick = () => {
  $('settings-modal').classList.remove('hidden');
};
$('settings-close').onclick = () => $('settings-modal').classList.add('hidden');

$('set-logout').onclick = async () => {
  $('settings-modal').classList.add('hidden');
  try {
    leaveTyping();
    if (kickChannel) {
      sb.removeChannel(kickChannel);
      kickChannel = null;
      kickUserId = null;
    }
    const { error } = await sb.auth.signOut({ scope: 'local' });
    if (error) alert('خطأ تسجيل الخروج: ' + error.message);
  } catch (e) {
    alert('خطأ تسجيل الخروج: ' + e.message);
  }
  window.location.reload();
};

$('set-avatar').onclick = () => {
  $('settings-modal').classList.add('hidden');
  $('avatar-input').click();
};

$('avatar-input').onchange = async () => {
  const file = $('avatar-input').files[0];
  if (!file || !currentProfile) return;
  try {
    await uploadAvatar(file, currentProfile.id);
    await loadProfile(currentProfile.id);
    await loadMessages();
    alert(t('avatarSaved'));
  } catch (e) {
    alert(t('avatarFail') + e.message);
  }
  $('avatar-input').value = '';
};

$('set-name').onclick = async () => {
  $('settings-modal').classList.add('hidden');
  if (!currentProfile) return;
  const name = prompt(t('nameAsk'), currentProfile.display_name || '');
  if (!name || !name.trim()) return;
  const { error } = await sb.from('profiles').update({ display_name: name.trim() }).eq('id', currentProfile.id);
  if (error) return alert(t('nameFail') + error.message);
  await loadProfile(currentProfile.id);
  await loadMessages();
};

// ---------- الملف الشخصي (زرار واحد في الإعدادات) ----------
function pfText() {
  const en = lang === 'en';
  return {
    title: en ? 'Profile' : 'الملف الشخصي',
    logout: en ? 'Log out' : 'تسجيل خروج',
    del: en ? '🗑️ Delete account' : '🗑️ حذف الحساب',
    setBtn: en ? '👤 Profile' : '👤 الملف الشخصي',
    fontT: en ? 'Font size' : 'حجم الخط',
    bgT: en ? 'Background' : 'الخلفية',
  };
}

function closeProfile() {
  $('profile-modal').classList.add('hidden');
}

async function openProfile() {
  if (!currentProfile) return;
  const x = pfText();
  $('pf-title').textContent = x.title;
  $('pf-logout').textContent = x.logout;
  $('pf-delete').textContent = x.del;
  $('pf-font-t').textContent = x.fontT;
  $('pf-bg-t').textContent = x.bgT;
  renderPfFont();
  $('pf-avatar').src = currentProfile.avatar_url || 'avatars/av1.png';
  $('pf-name').textContent = currentProfile.display_name || t('userDefault');
  $('pf-email').textContent = '';
  $('profile-modal').classList.remove('hidden');
  const { data } = await sb.auth.getUser();
  $('pf-email').textContent = data && data.user ? (data.user.email || '') : '';
}

$('profile-close').onclick = closeProfile;
// الضغط على صورة المستخدم في الهيدر بيفتح الملف الشخصي
$('user-box').onclick = () => openProfile();
// كل زرار بيستخدم نفس الوظيفة الأصلية (الإعدادات القديمة متخفية بس)
$('pf-avatar-btn').onclick = () => { closeProfile(); $('avatar-input').click(); };
$('pf-name-btn').onclick = () => { closeProfile(); $('set-name').click(); };
$('pf-logout').onclick = () => { closeProfile(); $('set-logout').click(); };
$('pf-delete').onclick = () => { closeProfile(); $('set-delete').click(); };

// حجم الخط: بيستخدم نفس زرار prefs.js (بيدوّر على الأحجام)، والكارت بيعرض الحجم الحالي
const PF_FONTS = {
  small: ['صغير', 'Small'],
  normal: ['عادي', 'Normal'],
  large: ['كبير', 'Large'],
  xlarge: ['كبير جداً', 'Extra large'],
};

function renderPfFont() {
  let k = 'normal';
  try { k = localStorage.getItem('tfm_font') || 'normal'; } catch {}
  const f = PF_FONTS[k] || PF_FONTS.normal;
  $('pf-font-val').textContent = lang === 'en' ? f[1] : f[0];
}

$('pf-font').onclick = () => {
  $('set-font').click();
  renderPfFont();
};
$('pf-bg').onclick = () => { closeProfile(); $('set-bg').click(); };

$('set-history').onclick = () => {
  $('settings-modal').classList.add('hidden');
  $('history-modal').classList.remove('hidden');
  renderHistory();
};

$('set-search').onclick = () => {
  $('settings-modal').classList.add('hidden');
  openSearch();
};

// ---------- الإشعارات ----------
$('set-notify').onclick = async () => {
  $('settings-modal').classList.add('hidden');
  if (!('Notification' in window)) return alert(t('notifDenied'));
  const perm = await Notification.requestPermission();
  alert(perm === 'granted' ? t('notifOk') : t('notifDenied'));
};

function playBeep() {
  try { if (localStorage.getItem('notifySound') === 'off') return; } catch {}
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.15);
    o.onended = () => ctx.close();
  } catch {}
}

function newMessageAlert(m) {
  playBeep();
  if (!document.hidden) return;

  unread++;
  document.title = `(${unread}) ${BASE_TITLE}`;

  if ('Notification' in window && Notification.permission === 'granted') {
    const name = m.profiles?.display_name || '?';
    const body = m.content || (m.file_url ? t('file') : '');
    try {
      new Notification(name, { body, icon: 'icon-192.png' });
    } catch {}
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    unread = 0;
    document.title = BASE_TITLE;
  }
});

// ---------- مؤشر "بيكتب" و"بيسجل صوت" ----------
// بيستخدم Broadcast في Supabase، فمش محتاج أي جدول جديد
function joinTyping() {
  // كل شات (شعبة + رقم الشات) ليه قناة كتابة لوحده
  const key = currentRoom() + '-' + currentChatSlot;
  if (typingChannel && typingRoom === key) return;
  leaveTyping();

  typingRoom = key;
  typingChannel = sb.channel('typing-' + key, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (!payload || !currentProfile || payload.id === currentProfile.id) return;
      if (payload.kind === 'stop') typers.delete(payload.id);
      else typers.set(payload.id, { name: payload.name, kind: payload.kind, at: Date.now() });
      renderTyping();
    })
    .subscribe();
}

function leaveTyping() {
  if (typingChannel) sb.removeChannel(typingChannel);
  typingChannel = null;
  typingRoom = null;
  typers.clear();
  renderTyping();
}

function sendTyping(kind) {
  if (!typingChannel || !currentProfile) return;
  typingChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      id: currentProfile.id,
      name: currentProfile.display_name || t('userDefault'),
      kind
    }
  });
}

function renderTyping() {
  const bar = $('typing-bar');
  if (!bar) return;
  const list = [...typers.values()];
  if (!list.length) {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
  bar.innerHTML = list.map(p =>
    `<span><span class="typing-name">${esc(p.name)}</span> ${p.kind === 'rec' ? t('recording') : t('typingNow')}<span class="tdots"><b></b><b></b><b></b></span></span>`
  ).join('');
  bar.classList.remove('hidden');
}

// لو ماحدش كتب من فترة، بنشيله من الشريط
setInterval(() => {
  let changed = false;
  const now = Date.now();
  for (const [id, p] of typers) {
    if (now - p.at > 3500) {
      typers.delete(id);
      changed = true;
    }
  }
  if (changed) renderTyping();
}, 1000);

$('msg-input').addEventListener('input', () => {
  const hasText = $('msg-input').value.trim().length > 0;
  if (!hasText) {
    sendTyping('stop');
    lastTypeSent = 0;
    return;
  }
  const now = Date.now();
  if (now - lastTypeSent > 2000) {
    sendTyping('text');
    lastTypeSent = now;
  }
});

function startRecTyping() {
  sendTyping('rec');
  recTimer = setInterval(() => sendTyping('rec'), 2000);
}

function stopRecTyping() {
  if (recTimer) {
    clearInterval(recTimer);
    recTimer = null;
  }
  sendTyping('stop');
}

// ---------- خلفية الشات ----------
// المفتاح اتغير عشان الخلفية القديمة المحفوظة (الزرقا) ما تتطبقش تاني
const BG_KEY = 'chatBg_v2';

const BG_PRESETS = [
  '#ffffff',
  '#000000',
  'linear-gradient(135deg, #ffd0db, #ffb3c4)',
  'linear-gradient(135deg, #3f0410, #6e0819)',
  'linear-gradient(135deg, #9b0f26, #3f0410)',
  '#2a0812'
];

function readBg() {
  try { return localStorage.getItem(BG_KEY); } catch { return null; }
}

function applyBg() {
  const el = $('messages');
  const val = readBg();
  if (val && val.startsWith('img:')) {
    el.style.background = '';
    el.style.backgroundImage = `url("${val.slice(4)}")`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  } else if (val) {
    el.style.background = val;
  } else {
    el.style.background = '';
  }
}

function saveBg(value) {
  try {
    localStorage.setItem(BG_KEY, value);
  } catch (e) {
    alert(t('bgFail') + e.message);
    return false;
  }
  applyBg();
  return true;
}

function renderBgSwatches() {
  const box = $('bg-swatches');
  if (box.childElementCount) return;
  box.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px;';
  BG_PRESETS.forEach(bg => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.cssText = `height:52px;padding:0;border:1px solid var(--border);border-radius:10px;background:${bg};`;
    b.onclick = () => {
      if (saveBg(bg)) $('bg-modal').classList.add('hidden');
    };
    box.appendChild(b);
  });
}

async function shrinkImage(file, maxW) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxW / img.width);
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

$('set-bg').onclick = () => {
  $('settings-modal').classList.add('hidden');
  renderBgSwatches();
  $('bg-modal').classList.remove('hidden');
};
$('bg-close').onclick = () => $('bg-modal').classList.add('hidden');
$('bg-upload').onclick = () => $('bg-input').click();

$('bg-reset').onclick = () => {
  try { localStorage.removeItem(BG_KEY); } catch {}
  applyBg();
  $('bg-modal').classList.add('hidden');
};

$('bg-input').onchange = async () => {
  const file = $('bg-input').files[0];
  if (!file) return;
  try {
    const dataUrl = await shrinkImage(file, 1280);
    if (saveBg('img:' + dataUrl)) $('bg-modal').classList.add('hidden');
  } catch (e) {
    alert(t('bgFail') + e.message);
  }
  $('bg-input').value = '';
};

// ---------- التفاعلات ----------
function applyReact(kind, id, emoji, userId) {
  id = Number(id);
  if (!reactMap.has(id)) reactMap.set(id, new Map());
  const byEmoji = reactMap.get(id);

  // رياكت واحد بس لكل شخص على الرسالة
  if (kind === 'add') {
    for (const [em, users] of [...byEmoji]) {
      if (em !== emoji && users.delete(userId) && !users.size) byEmoji.delete(em);
    }
  }

  if (!byEmoji.has(emoji)) byEmoji.set(emoji, new Set());
  const set = byEmoji.get(emoji);
  if (kind === 'add') set.add(userId);
  else set.delete(userId);
  if (!set.size) byEmoji.delete(emoji);
  if (!byEmoji.size) reactMap.delete(id);
  paintReacts(id);
}

function reactsHtml(id) {
  const map = reactMap.get(Number(id));
  if (!map) return '';
  let html = '';
  map.forEach((users, emoji) => {
    const on = currentProfile && users.has(currentProfile.id);
    html += `<button class="react-chip${on ? ' on' : ''}" data-rid="${id}" data-emoji="${esc(emoji)}">${esc(emoji)} ${users.size}</button>`;
  });
  return html;
}

function paintReacts(id) {
  const box = document.querySelector(`.reacts[data-rid="${id}"]`);
  if (box) box.innerHTML = reactsHtml(id);
}

async function toggleReact(id, emoji) {
  if (!currentProfile) return;
  id = Number(id);
  const me = currentProfile.id;

  // رياكتي الحالي على الرسالة دي (لو موجود)
  let current = null;
  const byEmoji = reactMap.get(id);
  if (byEmoji) byEmoji.forEach((users, em) => { if (users.has(me)) current = em; });

  // نفس الإيموجي: نشيله
  if (current === emoji) {
    const { error } = await sb.from('reactions')
      .delete()
      .match({ message_id: id, user_id: me, emoji });
    if (error) return alert(t('reactFail') + error.message);
    applyReact('del', id, emoji, me);
    return;
  }

  // إيموجي تاني: نشيل القديم الأول (رياكت واحد بس)
  if (current) {
    const { error } = await sb.from('reactions')
      .delete()
      .match({ message_id: id, user_id: me, emoji: current });
    if (error) return alert(t('reactFail') + error.message);
    applyReact('del', id, current, me);
  }

  const { error } = await sb.from('reactions')
    .insert({ message_id: id, user_id: me, emoji });
  if (error) return alert(t('reactFail') + error.message);
  applyReact('add', id, emoji, me);
}

async function loadReactions(ids) {
  if (!ids.length) return;
  const { data, error } = await sb.from('reactions').select('*').in('message_id', ids);
  if (error) return;
  (data || []).forEach(r => applyReact('add', r.message_id, r.emoji, r.user_id));
}

// ---------- الرسايل ----------
function snippetOf(m) {
  return (m.content || (m.file_url ? t('file') : '')).slice(0, 60);
}

function buildMessageEl(m) {
  const div = document.createElement('div');
  const mine = currentProfile && m.user_id === currentProfile.id;
  div.className = 'msg' + (mine ? ' mine' : '') + (m.pinned ? ' pinned' : '');
  div.dataset.id = m.id;

  const avatar = m.profiles?.avatar_url
    ? `<img class="msg-avatar" src="${esc(m.profiles.avatar_url)}" alt="">`
    : '';
  const time = new Date(m.created_at).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US');
  const pinMark = m.pinned ? '<span class="pin-mark">📌</span>' : '';

  let html = `<button class="dots" data-id="${m.id}">⋮</button>`;
  const badgeMark = window.badgeHtml ? window.badgeHtml(m.user_id) : '';
  html += `<div class="meta">${avatar}${esc(m.profiles?.display_name || '?')}${badgeMark} · ${time}${pinMark}</div>`;

  if (m.reply_to) {
    const parent = msgById.get(Number(m.reply_to));
    const pName = parent?.profiles?.display_name || '';
    const pText = parent ? snippetOf(parent) : '';
    html += `<div class="quote" data-target="${m.reply_to}"><b>${esc(pName)}</b><span>${esc(pText)}</span></div>`;
  }

  if (m.content) {
    const edited = m.edited_at ? `<span class="edited">${t('editedLabel')}</span>` : '';
    html += `<div>${esc(m.content)}${edited}</div>`;
  }

  if (m.file_url) {
    const tp = m.file_type || '';
    if (tp.startsWith('image/')) {
      html += `<img src="${esc(m.file_url)}" alt="">`;
    } else if (tp.startsWith('video/')) {
      html += `<video src="${esc(m.file_url)}" controls playsinline></video>`;
    } else if (tp.startsWith('audio/')) {
      html += voicePlayerHtml(m.file_url);
    } else {
      html += `<a href="${esc(m.file_url)}" target="_blank">📄 ${esc(fileName(m.file_url))}</a>`;
    }
  }

  html += `<div class="reacts" data-rid="${m.id}">${reactsHtml(m.id)}</div>`;

  div.innerHTML = html;
  return div;
}

function renderMessage(m) {
  msgById.set(m.id, m);
  if (document.querySelector(`.msg[data-id="${m.id}"]`)) return;
  $('messages').appendChild(buildMessageEl(m));
}

// نبدّل الرسالة في مكانها (للتعديل والتثبيت)
function replaceMsgEl(m) {
  const old = document.querySelector(`.msg[data-id="${m.id}"]`);
  const el = buildMessageEl(m);
  if (old) old.replaceWith(el);
  else $('messages').appendChild(el);
}

function removeMessageEl(id) {
  const el = document.querySelector(`.msg[data-id="${id}"]`);
  if (el) el.remove();
  msgById.delete(Number(id));
  reactMap.delete(Number(id));
  renderPinned();
}

// ---------- الرسالة المثبتة ----------
function renderPinned() {
  const bar = $('pinned-bar');
  const pinned = [...msgById.values()]
    .filter(m => m.pinned)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (!pinned.length) {
    bar.classList.add('hidden');
    bar.dataset.id = '';
    return;
  }

  const m = pinned[0];
  const text = m.content || (m.file_url ? '📎 ' + fileName(m.file_url) : '');
  $('pinned-text').textContent = `📌 ${t('pinnedLabel')}: ${text.slice(0, 80)}`;
  bar.dataset.id = m.id;
  bar.classList.remove('hidden');
}

function flashMsg(id) {
  const el = document.querySelector(`.msg[data-id="${id}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

$('pinned-bar').onclick = () => flashMsg($('pinned-bar').dataset.id);

async function loadMessages() {
  // الشاتات بترسم الأول، عشان تفضل ظاهرة حتى لو الرسايل فشلت
  if (window.renderChatTabs) window.renderChatTabs();
  if (window.loadBadges) await window.loadBadges();
  const { data, error } = await sb.from('messages')
    .select('*, profiles(display_name, avatar_url)')
    .eq('room', currentRoom())
    .eq('chat_slot', currentChatSlot)
    .order('created_at', { ascending: true })
    .limit(300);
  if (error) {
    alert(t('loadFail') + error.message);
    return;
  }
  $('messages').innerHTML = '';
  msgById = new Map();
  reactMap.clear();
  data.forEach(renderMessage);
  renderPinned();
  await loadReactions(data.map(m => m.id));
  scrollBottom();
}

// ---------- الرد ----------
function setReply(m) {
  replyingTo = m.id;
  $('reply-text').textContent = `${t('replyTo')} ${m.profiles?.display_name || '?'}: ${snippetOf(m)}`;
  $('reply-bar').classList.remove('hidden');
  $('msg-input').focus();
}

function clearReply() {
  replyingTo = null;
  $('reply-text').textContent = '';
  $('reply-bar').classList.add('hidden');
}

$('reply-cancel').onclick = clearReply;

async function sendMessage(fileUrl = null, fileType = null) {
  if (!currentProfile) return;
  const content = $('msg-input').value.trim();
  if (!content && !fileUrl) return;

  const { error } = await sb.from('messages').insert({
    user_id: currentProfile.id,
    content: content || null,
    file_url: fileUrl,
    file_type: fileType,
    room: currentRoom(),
    chat_slot: currentChatSlot,
    reply_to: replyingTo
  });
  if (error) return alert(t('sendFail') + error.message);
  $('msg-input').value = '';
  clearReply();
  sendTyping('stop');
  lastTypeSent = 0;
  // نعرض الرسالة فوراً حتى لو الوقت الفعلي (Realtime) اتأخر أو ما وصلش
  await loadMessages();
}

$('send-btn').onclick = () => sendMessage();
$('msg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

// ---------- رفع الملفات ----------
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

$('attach-btn').onclick = () => $('file-input').click();

$('file-input').onchange = async () => {
  const file = $('file-input').files[0];
  if (!file || !currentProfile) return;

  if (file.size > MAX_UPLOAD_BYTES) {
    alert(`الملف كبير. الحد الأقصى ${MAX_UPLOAD_MB} ميجا`);
    $('file-input').value = '';
    return;
  }

  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${currentProfile.id}/${Date.now()}_${safeName}`;
  const { error } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type });
  if (error) return alert(t('uploadFail') + error.message);

  const { data } = sb.storage.from('uploads').getPublicUrl(path);
  await sendMessage(data.publicUrl, file.type);
  $('file-input').value = '';
};

// ---------- الكاميرا ----------
async function openCamera() {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: true });
    $('cam-video').srcObject = camStream;
    $('cam-modal').classList.remove('hidden');
  } catch (err) {
    alert(t('camFail') + err.message);
  }
}

function closeCamera() {
  if (camStream) camStream.getTracks().forEach(tr => tr.stop());
  camStream = null;
  $('cam-video').srcObject = null;
  $('cam-modal').classList.add('hidden');
}

$('cam-btn').onclick = openCamera;
$('cam-close').onclick = closeCamera;

$('cam-snap').onclick = () => {
  const video = $('cam-video');
  const canvas = $('cam-canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  canvas.toBlob(async blob => {
    if (!blob || !currentProfile) return;
    const path = `${currentProfile.id}/${Date.now()}_photo.jpg`;
    const { error } = await sb.storage.from('uploads').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) return alert(t('uploadFail') + error.message);
    const { data } = sb.storage.from('uploads').getPublicUrl(path);
    await sendMessage(data.publicUrl, 'image/jpeg');
    closeCamera();
  }, 'image/jpeg', 0.9);
};

// ---------- الميكروفون ----------
$('mic-btn').onclick = async () => {
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
    $('mic-btn').classList.remove('recording');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      stopRecTyping();
      stream.getTracks().forEach(tr => tr.stop());
      const type = recorder.mimeType || 'audio/webm';
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type });
      if (blob.size > MAX_UPLOAD_BYTES) {
        return alert(`التسجيل كبير. الحد الأقصى ${MAX_UPLOAD_MB} ميجا، سجّل مقطع أقصر`);
      }
      const path = `${currentProfile.id}/${Date.now()}_voice.${ext}`;
      const { error } = await sb.storage.from('uploads').upload(path, blob, { contentType: type });
      if (error) return alert(t('uploadFail') + error.message);
      const { data } = sb.storage.from('uploads').getPublicUrl(path);
      await sendMessage(data.publicUrl, type);
    };
    recorder.start();
    startRecTyping();
    $('mic-btn').classList.add('recording');
  } catch (err) {
    alert(t('micFail') + err.message);
  }
};

// ---------- الثلاث نقط + الضغط على التفاعلات والرد ----------
function openMenu(btn) {
  menuMsgId = Number(btn.dataset.id);
  const m = msgById.get(menuMsgId);
  const isAdmin = currentProfile && currentProfile.role === 'admin';
  const mine = !!(m && currentProfile && m.user_id === currentProfile.id);

  $('menu-delete').classList.toggle('hidden', !(m && (mine || isAdmin)));
  $('menu-pin').classList.toggle('hidden', !isAdmin);
  $('menu-pin').textContent = m && m.pinned ? t('unpin') : t('pin');
  $('menu-edit').classList.toggle('hidden', !(mine && m && !m.file_url));
  $('menu-reply').classList.toggle('hidden', !canSend());

  const menu = $('msg-menu');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 8;

  // نظهرها مخفية الأول عشان نقيس حجمها الحقيقي
  menu.style.visibility = 'hidden';
  menu.style.maxHeight = (vh - gap * 2) + 'px';
  menu.style.overflowY = 'auto';
  menu.classList.remove('hidden');

  const r = btn.getBoundingClientRect();
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;

  let left = r.left;
  if (left + mw > vw - gap) left = vw - mw - gap;
  if (left < gap) left = gap;

  let top = r.bottom + 4;
  if (top + mh > vh - gap) top = r.top - mh - 4;       // مفيش مكان تحت: نفتحها فوق الزرار
  if (top < gap) top = Math.max(gap, vh - mh - gap);   // مفيش مكان فوق كمان: نلزقها في آخر الشاشة

  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.visibility = '';
}

$('messages').addEventListener('click', e => {
  const chip = e.target.closest('.react-chip');
  if (chip) {
    toggleReact(Number(chip.dataset.rid), chip.dataset.emoji);
    return;
  }

  const quote = e.target.closest('.quote');
  if (quote) {
    flashMsg(Number(quote.dataset.target));
    return;
  }

  const btn = e.target.closest('.dots');
  if (!btn) return;
  e.stopPropagation();
  openMenu(btn);
});

// صف الإيموجي جوه القايمة + زرار ➕ لاختيار أي إيموجي
const emoRow = $('menu-emojis');
EMOJIS.forEach(em => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = em;
  b.dataset.emoji = em;
  emoRow.appendChild(b);
});
const moreBtn = document.createElement('button');
moreBtn.type = 'button';
moreBtn.textContent = '➕';
moreBtn.dataset.more = '1';
emoRow.appendChild(moreBtn);

emoRow.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  $('msg-menu').classList.add('hidden');
  if (b.dataset.more) {
    if (menuMsgId) openEmojiPicker(menuMsgId);
    return;
  }
  if (menuMsgId) toggleReact(menuMsgId, b.dataset.emoji);
});

// ---------- لوحة اختيار أي إيموجي ----------
const EMOJI_CATS = [
  { icon: '😀', list: '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 💩 🤡 👻 👽 👾 🤖' },
  { icon: '👍', list: '👍 👎 👊 ✊ 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✌️ 🤞 🤟 🤘 👌 🤌 🤏 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤙 💪 🦾 ✍️ 💅 👀 🧠 👑 💍' },
  { icon: '❤️', list: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 😻 🥰 😍 💋 💌 🌹 🌸 🌷 🌻' },
  { icon: '🔥', list: '🔥 ✨ ⭐ 🌟 💫 ⚡ 💥 💢 💦 💨 🎉 🎊 🎈 🎁 🏆 🥇 🥈 🥉 ⚽ 🏀 🎮 🎯 🎵 🎶 📚 📖 ✏️ 📝 💡 📌 📎 💯 ✅ ❌ ❗ ❓ ⭕ 🚫 💬 🔔 🔒 🔑 📱 💻 🎓' },
  { icon: '🐶', list: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐙 🦈 🐳 🌈 ☀️ 🌙 ☁️ ❄️ 🌊 🍕 🍔 🍟 🌭 🍿 🍩 🍪 🎂 ☕ 🍵 🥤 🍉 🍓 🍎 🥑 🍫' }
].map(c => ({ icon: c.icon, items: c.list.split(' ') }));

let emojiPop = null;
let emojiTargetId = null;

function pickFirstEmoji(text) {
  const str = (text || '').trim();
  if (!str) return null;
  let first;
  if (window.Intl && Intl.Segmenter) {
    const it = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)[Symbol.iterator]().next();
    first = it.done ? null : it.value.segment;
  } else {
    first = Array.from(str)[0];
  }
  if (!first) return null;
  const isEmoji = /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3/u.test(first);
  return isEmoji ? first : null;
}

function closeEmojiPicker() {
  if (emojiPop) emojiPop.classList.add('hidden');
  emojiTargetId = null;
}

function chooseEmoji(em) {
  const id = emojiTargetId;
  closeEmojiPicker();
  if (id && em) toggleReact(id, em);
}

function buildEmojiPicker() {
  emojiPop = document.createElement('div');
  emojiPop.className = 'emoji-pop hidden';
  emojiPop.addEventListener('click', e => {
    if (e.target === emojiPop) closeEmojiPicker();
  });

  const box = document.createElement('div');
  box.className = 'emoji-box';

  const head = document.createElement('div');
  head.className = 'emoji-head';
  const title = document.createElement('b');
  title.className = 'emoji-title';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'ghost';
  close.textContent = '✕';
  close.onclick = closeEmojiPicker;
  head.appendChild(title);
  head.appendChild(close);

  const tabs = document.createElement('div');
  tabs.className = 'emoji-tabs';
  const grid = document.createElement('div');
  grid.className = 'emoji-grid';

  const showCat = idx => {
    [...tabs.children].forEach((b, i) => b.classList.toggle('on', i === idx));
    grid.innerHTML = '';
    EMOJI_CATS[idx].items.forEach(em => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = em;
      b.onclick = () => chooseEmoji(em);
      grid.appendChild(b);
    });
    grid.scrollTop = 0;
  };

  EMOJI_CATS.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = c.icon;
    b.onclick = () => showCat(i);
    tabs.appendChild(b);
  });

  const custom = document.createElement('div');
  custom.className = 'emoji-custom';
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'emoji-input';
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'primary';
  ok.textContent = '✓';
  const submitCustom = () => {
    const em = pickFirstEmoji(inp.value);
    if (!em) return alert(lang === 'en' ? 'Enter a valid emoji' : 'اكتب إيموجي صحيح');
    inp.value = '';
    chooseEmoji(em);
  };
  ok.onclick = submitCustom;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitCustom(); });
  custom.appendChild(inp);
  custom.appendChild(ok);

  box.appendChild(head);
  box.appendChild(tabs);
  box.appendChild(grid);
  box.appendChild(custom);
  emojiPop.appendChild(box);
  document.body.appendChild(emojiPop);

  emojiPop._showCat = showCat;
}

function openEmojiPicker(msgId) {
  if (!emojiPop) buildEmojiPicker();
  emojiTargetId = msgId;
  emojiPop.querySelector('.emoji-title').textContent = lang === 'en' ? 'Pick an emoji' : 'اختار إيموجي';
  emojiPop.querySelector('.emoji-input').placeholder = lang === 'en' ? 'Type or paste any emoji' : 'اكتب أو الصق أي إيموجي';
  emojiPop._showCat(0);
  emojiPop.classList.remove('hidden');
}

document.addEventListener('click', () => $('msg-menu').classList.add('hidden'));
$('msg-menu').addEventListener('click', e => e.stopPropagation());

$('menu-reply').onclick = () => {
  $('msg-menu').classList.add('hidden');
  const m = msgById.get(menuMsgId);
  if (m && canSend()) setReply(m);
};

$('menu-edit').onclick = async () => {
  $('msg-menu').classList.add('hidden');
  const m = msgById.get(menuMsgId);
  if (!m || !currentProfile || m.user_id !== currentProfile.id || m.file_url) return;
  const text = prompt(t('editAsk'), m.content || '');
  if (text === null) return;
  const clean = text.trim();
  if (!clean || clean === m.content) return;

  const edited_at = new Date().toISOString();
  const { error } = await sb.from('messages')
    .update({ content: clean, edited_at })
    .eq('id', m.id);
  if (error) return alert(t('editFail') + error.message);
  m.content = clean;
  m.edited_at = edited_at;
  replaceMsgEl(m);
};

$('menu-copy').onclick = async () => {
  const m = msgById.get(menuMsgId);
  $('msg-menu').classList.add('hidden');
  if (!m) return;
  try {
    await navigator.clipboard.writeText(m.content || m.file_url || '');
  } catch {
    alert(t('copyFail'));
  }
};

$('menu-search').onclick = () => {
  $('msg-menu').classList.add('hidden');
  openSearch();
};

$('menu-pin').onclick = async () => {
  $('msg-menu').classList.add('hidden');
  const m = msgById.get(menuMsgId);
  if (!m) return;
  const { error } = await sb.from('messages').update({ pinned: !m.pinned }).eq('id', m.id);
  if (error) return alert(t('pinFail') + error.message);
  m.pinned = !m.pinned;
  replaceMsgEl(m);
  renderPinned();
};

$('menu-delete').onclick = () => {
  $('msg-menu').classList.add('hidden');
  if (menuMsgId) deleteMessage(menuMsgId);
};

async function deleteMessage(id) {
  if (!confirm(t('deleteAsk'))) return;
  const { error } = await sb.from('messages').delete().eq('id', id);
  if (error) return alert(t('deleteFail') + error.message);
  removeMessageEl(id);
}

// ---------- البحث ----------
function openSearch() {
  $('search-bar').classList.remove('hidden');
  $('search-input').focus();
}

function closeSearch() {
  $('search-bar').classList.add('hidden');
  $('search-input').value = '';
  filterMessages('');
}

function filterMessages(q) {
  q = q.trim().toLowerCase();
  document.querySelectorAll('#messages .msg').forEach(el => {
    el.style.display = !q || el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

$('search-close').onclick = closeSearch;
$('search-input').addEventListener('input', e => filterMessages(e.target.value));

// ---------- السجل ----------
$('history-close').onclick = () => $('history-modal').classList.add('hidden');

document.querySelectorAll('.tab').forEach(tb => {
  tb.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    tb.classList.add('active');
    activeTab = tb.dataset.tab;
    renderHistory();
  };
});

function renderHistory() {
  const list = $('history-list');
  list.innerHTML = '';
  const items = [];

  for (const m of msgById.values()) {
    const who = m.profiles?.display_name || '?';
    const date = new Date(m.created_at);

    if (activeTab === 'links') {
      extractLinks(m.content).forEach(u => items.push({ title: u, url: u, who, date }));
    } else if (activeTab === 'docs') {
      if (m.file_url && !isMediaType(m.file_type))
        items.push({ title: '📄 ' + fileName(m.file_url), url: m.file_url, who, date });
    } else if (m.file_url && isMediaType(m.file_type)) {
      const tp = m.file_type;
      const title = tp.startsWith('image/') ? '🖼️ ' + t('image')
                  : tp.startsWith('audio/') ? '🎙️ ' + t('audio') : '🎬 ' + t('video');
      items.push({ title, url: m.file_url, who, date });
    }
  }

  items.sort((a, b) => b.date - a.date);

  if (!items.length) {
    list.innerHTML = `<p class="empty">${t('noRows')}</p>`;
    return;
  }

  items.forEach(it => {
    const a = document.createElement('a');
    a.href = it.url;
    a.target = '_blank';
    a.className = 'hist-item';
    a.innerHTML = `<b>${esc(it.title)}</b><span>${esc(it.who)} · ${it.date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>`;
    list.appendChild(a);
  });
}

// ---------- احتياطي: لو الاتصال الحي ما اتفتحش، بنجيب الرسايل الجديدة كل 10 ثواني ----------
let fallbackTimer = null;

async function pollNewMessages() {
  try {
    // أحدث رسالة عندنا، ونجيب بس اللي بعدها (أخف بكتير من إننا نجيب الشات كله كل مرة)
    let newest = null;
    msgById.forEach(m => { if (!newest || m.created_at > newest) newest = m.created_at; });
    let q = sb.from('messages')
      .select('*, profiles(display_name, avatar_url)')
      .eq('room', currentRoom())
      .eq('chat_slot', currentChatSlot);
    q = newest
      ? q.gt('created_at', newest).order('created_at', { ascending: true }).limit(50)
      : q.order('created_at', { ascending: false }).limit(20);
    const { data, error } = await q;
    if (error || !data) return;
    let added = false;
    (newest ? data : data.reverse()).forEach(m => {
      if (msgById.has(m.id)) return; // موجودة أصلاً، ما نكررهاش
      renderMessage(m);
      added = true;
    });
    if (added) {
      renderPinned();
      scrollBottom();
    }
  } catch {
    // لو فشل، هنحاول تاني في الدورة الجاية
  }
}

function scheduleFallback() {
  // كل دورة بوقت عشوائي بين 8 و12 ثانية، عشان الطلبات ما تتجمعش في نفس الثانية
  const wait = 8000 + Math.random() * 4000;
  fallbackTimer = setTimeout(async () => {
    // لو التاب مخفية (الموبايل مثلاً) ما نسألش السيرفر
    if (!document.hidden) await pollNewMessages();
    if (fallbackTimer) scheduleFallback();
  }, wait);
}

function startFallback() {
  if (fallbackTimer) return;
  scheduleFallback();
}

function stopFallback() {
  if (!fallbackTimer) return;
  clearTimeout(fallbackTimer);
  fallbackTimer = null;
}

// ---------- الوقت الفعلي ----------
function subscribeToMessages() {
  if (subscribed) return;
  subscribed = true;

  sb.channel('messages-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
      // نعرض بس الرسايل اللي في الشعبة والمستوى اللي اخترته
      if (payload.new.room !== currentRoom() || payload.new.chat_slot !== currentChatSlot) return;

      const { data } = await sb.from('messages')
        .select('*, profiles(display_name, avatar_url)')
        .eq('id', payload.new.id)
        .maybeSingle();
      if (data) {
        // الشخص اللي بعت الرسالة بيوقف مؤشر الكتابة عند الكل
        if (data.user_id !== currentProfile?.id) typers.delete(data.user_id);
        renderTyping();
        renderMessage(data);
        renderPinned();
        scrollBottom();
        if (currentProfile && data.user_id !== currentProfile.id) newMessageAlert(data);
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
      const m = msgById.get(payload.new.id);
      if (!m) return;
      m.pinned = payload.new.pinned;
      m.content = payload.new.content;
      m.edited_at = payload.new.edited_at;
      replaceMsgEl(m);
      renderPinned();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
      removeMessageEl(payload.old.id);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' }, payload => {
      if (!msgById.has(Number(payload.new.message_id))) return;
      applyReact('add', payload.new.message_id, payload.new.emoji, payload.new.user_id);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reactions' }, payload => {
      if (!msgById.has(Number(payload.old.message_id))) return;
      applyReact('del', payload.old.message_id, payload.old.emoji, payload.old.user_id);
    })
    .subscribe(status => {
      // لو الاتصال الحي اتفتح تمام نوقف الاحتياطي، ولو لأ نشغّله
      if (status === 'SUBSCRIBED') stopFallback();
      else startFallback();
    });
}

// ---------- لوحة الأدمن ----------
async function loadUsers() {
  const { data, error } = await sb.from('profiles').select('*').order('created_at');
  if (error) return alert(error.message);

  const box = $('users-list');
  box.innerHTML = '';

  data.forEach(p => {
    const row = document.createElement('div');
    row.className = 'user-row';
    row.innerHTML = `<span>${esc(p.display_name || p.id.slice(0, 8))}${p.is_banned ? ' 🚫' : ''}</span>`;

    const sel = document.createElement('select');
    ['admin', 'sender', 'viewer'].forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      if (r === p.role) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.onchange = async () => {
      const { error } = await sb.from('profiles').update({ role: sel.value }).eq('id', p.id);
      if (error) alert(error.message);
      else await loadUsers();
    };

    row.appendChild(sel);

    if (!currentProfile || p.id !== currentProfile.id) {
      const kb = document.createElement('button');
      kb.textContent = p.is_banned ? t('unkick') : t('kick');
      kb.className = p.is_banned ? 'ghost' : 'danger-btn';
      kb.onclick = async () => {
        const { error } = await sb.from('profiles').update({ is_banned: !p.is_banned }).eq('id', p.id);
        if (error) alert(error.message);
        else await loadUsers();
      };
      row.appendChild(kb);

      // حذف الحساب نهائياً (الأدمن بس، ومش بيتنفذ على أدمن)
      const db = document.createElement('button');
      db.textContent = 'حذف';
      db.className = 'danger-btn';
      db.onclick = async () => {
        if (p.role === 'admin') return alert('مينفعش تحذف أدمن من هنا');
        const name = p.display_name || p.id.slice(0, 8);
        if (!confirm(`هتحذف حساب "${name}" نهائياً ورسايله وبياناته؟ ومش هيرجع.`)) return;
        try {
          const { data, error } = await sb.functions.invoke('admin-delete-user', { body: { userId: p.id } });
          if (error || (data && data.error)) {
            alert('الحذف ما اتعملش: ' + ((data && data.error) || (error && error.message) || ''));
            return;
          }
          await loadUsers();
        } catch {
          alert('حصلت مشكلة، جرّب تاني.');
        }
      };
      row.appendChild(db);
    }

    box.appendChild(row);
  });
}

// أي حد يشوف رسايل عضو تاني في الشعبة والمستوى الحالي بس (الرسايل اللي هو أصلاً شايفها)
function showUserMessages(userId, name) {
  const list = $('history-list');
  list.innerHTML = '';

  const mine = [...msgById.values()]
    .filter(m => m.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const head = document.createElement('p');
  head.className = 'empty';
  head.textContent = (lang === 'en' ? 'Messages by ' : 'رسايل ') + name + ` (${mine.length}) · ${currentRoom()}`;
  list.appendChild(head);

  if (!mine.length) {
    const none = document.createElement('p');
    none.className = 'empty';
    none.textContent = t('noRows');
    list.appendChild(none);
  }

  mine.forEach(m => {
    const a = document.createElement('div');
    a.className = 'hist-item';
    const text = m.content || (m.file_url ? '📎 ' + fileName(m.file_url) : '');
    a.innerHTML = `<b>${esc(text.slice(0, 200))}</b><span>${new Date(m.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>`;
    list.appendChild(a);
  });

  $('members-panel').classList.add('hidden');
  $('history-modal').classList.remove('hidden');
}

// ---------- زرار إظهار/إخفاء الباسورد ----------
function addPwToggle(id) {
  const inp = $(id);
  if (!inp) return;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%;';
  inp.parentNode.insertBefore(wrap, inp);
  wrap.appendChild(inp);
  inp.style.width = '100%';
  inp.style.paddingRight = '48px';

  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = '👁️';
  b.style.cssText = 'position:absolute;top:0;bottom:0;right:6px;margin:auto 0;height:34px;background:transparent;padding:4px 8px;font-size:18px;line-height:1;';
  b.onclick = () => {
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    b.textContent = show ? '🙈' : '👁️';
  };
  wrap.appendChild(b);
}
addPwToggle('password');
addPwToggle('new-password');

// ---------- بدء التطبيق ----------
applyRoomUI();
applyBg();
applyI18n();
renderTyping();