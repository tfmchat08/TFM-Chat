// نظام البادجات والإيستر إيجز
// كل بادج ليه طريقة فتحه. الشخص يختار البادج اللي يظهر جنب اسمه، بس مايقدرش يمسحه.
// الأدمن يقدر يشيل بادج من عضو من قايمة الأعضاء.
(function () {
  const CATALOG = {
    faheem:     { ar: 'المستفز',       icon: '😏' }, // 10 ضغطات على أيقونة فهيم
    chameleon:  { ar: 'الحرباية',      icon: '🦎' }, // 15 ضغطة سريعة على زرار الوضع
    translator: { ar: 'المترجم',       icon: '🌐' }, // 5 ضغطات على زرار اللغة
    follower:   { ar: 'المتابع',       icon: '👀' }, // 20 ضغطة على الأعضاء في يوم واحد
    fan:        { ar: 'المعجب',        icon: '💖' }, // 3 ضغطات على اسم المطور
    silent:     { ar: 'الساكت',        icon: '🤐' }, // 5 تسجيلات صوتية فاضية
    lover:      { ar: 'المعجب المتيم', icon: '😍' }, // 10 تفاعلات على نفس الرسالة بنفس الإيموجي
    artist:     { ar: 'الفنان',        icon: '🎨' }, // 3 مرات تغيير صورة البروفايل
    genius:     { ar: 'العبقري',       icon: '🧠' }, // علامة كاملة في الكويز
    rag:        { ar: 'الرغاي',        icon: '🗣️' }, // 15 ضغطة على المايك حتى من غير تسجيل
  };

  const EMPTY_LINES = [
    'الشات ده فاضي زي جيبي بعد الامتحان 😅',
    'مفيش ولا رسالة؟ يلا ابدأ الكلام يا بطل',
    'أنا فهيم وبستنى أول رسالة 👀',
  ];

  let rows = []; // { user_id, badge_key, is_active, revoked }

  const meId = () => (currentProfile ? currentProfile.id : null);
  const today = () => new Date().toISOString().slice(0, 10);
  const ownedOf = (uid) => rows.filter((r) => r.user_id === uid && !r.revoked && CATALOG[r.badge_key]).map((r) => r.badge_key);
  const activeOf = (uid) => {
    const r = rows.find((x) => x.user_id === uid && x.is_active && !x.revoked);
    return r && CATALOG[r.badge_key] ? r.badge_key : null;
  };
  const hasRow = (uid, key) => rows.some((r) => r.user_id === uid && r.badge_key === key);

  // ===== تحميل وعرض =====
  window.loadBadges = async function () {
    try {
      const { data, error } = await sb.from('badges_owned').select('user_id, badge_key, is_active, revoked');
      if (!error && data) rows = data;
    } catch (e) { /* البادجات مش ضرورية، الشات يفضل شغال */ }
  };

  window.badgeHtml = (uid) => {
    const key = activeOf(uid);
    if (!key) return '';
    const c = CATALOG[key];
    return ` <span class="user-badge" title="${esc(c.ar)}">${c.icon} ${esc(c.ar)}</span>`;
  };

  window.ownedBadgeKeys = (uid) => ownedOf(uid);
  window.badgeLabel = (key) => (CATALOG[key] ? CATALOG[key].ar : key);

  // الأدمن بيشيل بادج معين من عضو (الصف بيفضل بعلامة revoked، فمحدش يرجعه بالضغط)
  window.revokeBadge = async function (uid, key) {
    const { error } = await sb.from('badges_owned')
      .update({ revoked: true, is_active: false })
      .eq('user_id', uid)
      .eq('badge_key', key);
    if (error) return alert(error.message);
    await window.loadBadges();
    if (window.loadMembers) await window.loadMembers();
    if (window.loadMessages) await window.loadMessages();
  };

  function toast(text) {
    const d = document.createElement('div');
    d.className = 'badge-toast';
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4500);
  }

  async function refreshAll() {
    if (window.loadMessages) await window.loadMessages();
    renderProfileBadges();
  }

  async function award(key) {
    const me = meId();
    if (!me || !CATALOG[key]) return;
    await window.loadBadges();
    if (hasRow(me, key)) return; // عنده البادج أو اتشال منه قبل كده
    const { error } = await sb.rpc('award_badge', { p_key: key });
    if (error) return;
    await window.loadBadges();
    if (!hasRow(me, key)) return;
    toast(`🎉 فتحت بادج "${CATALOG[key].ar}" ${CATALOG[key].icon}`);
    if (window.fxConfetti) window.fxConfetti(150);
    await refreshAll();
  }

  async function setActive(key) {
    const { error } = await sb.rpc('set_active_badge', { p_key: key });
    if (error) return alert(error.message);
    await window.loadBadges();
    await refreshAll();
  }

  function renderProfileBadges() {
    const box = document.getElementById('pf-badges');
    if (!box) return;
    const me = meId();
    if (!me) { box.innerHTML = ''; return; }
    const keys = ownedOf(me);
    const current = activeOf(me);
    box.innerHTML = '';
    if (!keys.length) {
      box.innerHTML = '<p class="pf-badges-hint">لسه معندكش بادجات، جرب تكتشف الإيستر إيجز 😉</p>';
      return;
    }
    const title = document.createElement('p');
    title.className = 'pf-badges-title';
    title.textContent = '🏅 اختار البادج اللي يظهر جنب اسمك';
    box.appendChild(title);
    keys.forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pf-badge-chip' + (k === current ? ' on' : '');
      b.textContent = `${CATALOG[k].icon} ${CATALOG[k].ar}${k === current ? ' ✔' : ''}`;
      b.onclick = () => { if (k !== current) setActive(k); };
      box.appendChild(b);
    });
    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'pf-badge-chip';
    none.textContent = 'بدون بادج';
    none.onclick = () => setActive(null);
    box.appendChild(none);
  }

  // نعرض البادجات جوه البروفايل
  const origOpenProfile = window.openProfile;
  if (typeof origOpenProfile === 'function') {
    window.openProfile = async function () {
      const r = await origOpenProfile.apply(this, arguments);
      await window.loadBadges();
      renderProfileBadges();
      return r;
    };
  }

  // ===== عدادات =====
  // ضغطات متتالية: n ضغطة والفاصل بين كل ضغطة والتانية أقل من gapMs
  function burst(n, gapMs, cb) {
    let count = 0;
    let last = 0;
    return () => {
      const now = Date.now();
      if (now - last > gapMs) count = 0;
      last = now;
      count++;
      if (count >= n) { count = 0; cb(); }
    };
  }

  // عداد محفوظ في المتصفح
  function bump(key) {
    try {
      const n = Number(localStorage.getItem('bc_' + key) || 0) + 1;
      localStorage.setItem('bc_' + key, String(n));
      return n;
    } catch (e) { return 0; }
  }
  function resetCount(key) {
    try { localStorage.removeItem('bc_' + key); } catch (e) { /* مش مهم */ }
  }

  const faheemBurst = burst(10, 4000, () => award('faheem'));
  const themeBurst = burst(15, 2000, () => award('chameleon'));
  const langBurst = burst(5, 3000, () => award('translator'));
  const footerBurst = burst(3, 4000, () => {
    award('fan');
    toast('👏 شكراً إنك بتدور على المطور!');
  });

  document.addEventListener('click', (e) => {
    const el = e.target;
    if (!(el instanceof Element)) return;
    if (el.closest('#ai-open')) faheemBurst();
    if (el.closest('.theme-toggle')) themeBurst();
    if (el.closest('.lang-toggle')) langBurst();
    if (el.closest('#members-btn') && bump('members_' + today()) >= 20) {
      award('follower');
    }
    if (el.tagName === 'B' && el.closest('.credits, .auth-credits')) footerBurst();
  }, true);

  // الميكروفون: تسجيل أقل من ثانية 5 مرات
  const mic = document.getElementById('mic-btn');
  if (mic) {
    let micStart = 0;
    let shortRecs = 0;
    new MutationObserver(() => {
      const recording = mic.classList.contains('recording');
      if (recording && !micStart) {
        micStart = Date.now();
      } else if (!recording && micStart) {
        const dur = Date.now() - micStart;
        micStart = 0;
        if (dur < 1000) {
          shortRecs++;
          if (shortRecs >= 5) { shortRecs = 0; award('silent'); }
        }
      }
    }).observe(mic, { attributes: true, attributeFilter: ['class'] });
  }

  // بادج "الرغاي": 15 ضغطة على المايك حتى لو الزرار مقفول (المشاهد)
  // الزرار المقفول ممكن ما يبعتش click، فبنسمع pointerdown على الحاوية بتاعته
  // المتصفح ممكن يبلع click على زرار مقفول، فبنحسب الضغطة من مكان اللمس نفسه
  // وبنسمع pointerdown و touchstart على الصفحة كلها (capture)، ونتجاهل التكرار اللي في نفس اللحظة
  if (mic) {
    const ragBurst = burst(15, 4000, () => award('rag'));
    let lastPress = 0;
    const onPress = (e) => {
      const pt = (e.touches && e.touches[0]) || e;
      if (typeof pt.clientX !== 'number') return;
      const r = mic.getBoundingClientRect();
      const inside = pt.clientX >= r.left && pt.clientX <= r.right && pt.clientY >= r.top && pt.clientY <= r.bottom;
      if (!inside) return;
      const now = Date.now();
      if (now - lastPress < 300) return; // pointerdown و touchstart لنفس الضغطة
      lastPress = now;
      ragBurst();
    };
    document.addEventListener('pointerdown', onPress, true);
    document.addEventListener('touchstart', onPress, { capture: true, passive: true });
  }

  // تسجيل دخول غلط 5 مرات: رسالة من فهيم
  const authMsg = document.getElementById('auth-msg');
  if (authMsg) {
    new MutationObserver(() => {
      const txt = authMsg.textContent || '';
      if (txt.includes('الإيميل أو الباسورد غلط') || txt.includes('Wrong email or password')) {
        if (bump('loginfail') >= 5) {
          resetCount('loginfail');
          toast('😅 انت معندكش حساب؟ اعمل حساب جديد بدل ما تجرب الباسورد 5 مرات');
        }
      }
    }).observe(authMsg, { childList: true, characterData: true, subtree: true });
  }

  // تفاعل بنفس الإيموجي على نفس الرسالة 10 مرات
  const reactCount = new Map();
  const origToggleReact = window.toggleReact;
  if (typeof origToggleReact === 'function') {
    window.toggleReact = async function (id, emoji) {
      const k = id + '|' + emoji;
      const n = (reactCount.get(k) || 0) + 1;
      reactCount.set(k, n);
      const r = await origToggleReact.apply(this, arguments);
      if (n >= 10) {
        reactCount.set(k, 0);
        await award('lover');
      }
      return r;
    };
  }

  // تغيير صورة البروفايل 3 مرات
  ['uploadAvatar', 'saveAvatarChoice'].forEach((name) => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = async function () {
      const r = await orig.apply(this, arguments);
      if (bump('avatar') >= 3) {
        resetCount('avatar');
        await award('artist');
      }
      return r;
    };
  });

  // كتابة "فهيم بيحبك" في الشات
  const origSendMessage = window.sendMessage;
  if (typeof origSendMessage === 'function') {
    window.sendMessage = async function () {
      const v = ($('msg-input') && $('msg-input').value) || '';
      if (v.includes('فهيم بيحبك')) toast('💚 وانا كمان بحبك يا صاحبي');
      return origSendMessage.apply(this, arguments);
    };
  }

  // تحميل الشات: رسالة لو الشات فاضي + بادج العبقري لو خلّص الكويز بعلامة كاملة
  const origLoadMessages = window.loadMessages;
  window.loadMessages = async function () {
    const r = origLoadMessages ? await origLoadMessages.apply(this, arguments) : undefined;
    try {
      const box = document.getElementById('messages');
      if (box && box.children.length === 0 && !sessionStorage.getItem('emptyToast')) {
        sessionStorage.setItem('emptyToast', '1');
        toast(EMPTY_LINES[Math.floor(Math.random() * EMPTY_LINES.length)]);
      }
    } catch (e) { /* مش مهم */ }
    if (meId() && localStorage.getItem('quizPerfect')) {
      localStorage.removeItem('quizPerfect');
      await award('genius');
    }
    return r;
  };

})();