// ---------- تفضيلات: الوضع الداكن، حجم الخط، الصوت، تصدير المحادثة، تثبيت التطبيق ----------
// ملاحظة: الوضع الداكن/الفاتح بيتحكم فيه app.js (متغير theme ودالة toggleTheme)، فهنا بس بنربط الزرار بيه
(function () {
  const KEY_FONT = 'tfm_font';        // small | normal | large | xlarge
  const KEY_SOUND = 'notifySound';    // on | off (app.js بيقرأه في playBeep)

  const FONTS = [
    { key: 'small', zoom: '0.92', ar: 'صغير', en: 'Small' },
    { key: 'normal', zoom: '1', ar: 'عادي', en: 'Normal' },
    { key: 'large', zoom: '1.12', ar: 'كبير', en: 'Large' },
    { key: 'xlarge', zoom: '1.25', ar: 'كبير جداً', en: 'Extra large' },
  ];

  const isEn = () => typeof lang !== 'undefined' && lang === 'en';
  const txt = (ar, en) => (isEn() ? en : ar);
  const el = id => document.getElementById(id);

  function getPref(k, def) {
    try { return localStorage.getItem(k) || def; } catch { return def; }
  }
  function setPref(k, v) {
    try { localStorage.setItem(k, v); } catch {}
  }
  function nextOf(list, cur) {
    const i = list.indexOf(cur);
    return list[(i + 1) % list.length];
  }

  // ---------- حجم الخط ----------
  function currentFont() {
    return FONTS.find(x => x.key === getPref(KEY_FONT, 'normal')) || FONTS[1];
  }

  function applyFont() {
    // zoom بيكبّر كل النصوص حتى اللي مكتوبة بـ px
    document.body.style.zoom = currentFont().zoom;
  }

  // ---------- العناوين ----------
  function refreshLabels() {
    const th = el('set-theme');
    if (th) th.textContent = txt(
      'الوضع: ' + (theme === 'dark' ? 'داكن' : 'فاتح'),
      'Theme: ' + (theme === 'dark' ? 'dark' : 'light'));

    const fb = el('set-font');
    if (fb) fb.textContent = txt('حجم الخط: ' + currentFont().ar, 'Font size: ' + currentFont().en);

    const sb = el('set-sound');
    if (sb) sb.textContent = txt(
      'صوت الإشعارات: ' + (getPref(KEY_SOUND, 'on') === 'off' ? 'مقفول' : 'شغال'),
      'Notification sound: ' + (getPref(KEY_SOUND, 'on') === 'off' ? 'off' : 'on'));

    const ex = el('set-export');
    if (ex) ex.textContent = txt('📥 تصدير المحادثة', '📥 Export chat');

    const ins = el('set-install');
    if (ins) ins.hidden = isStandalone();
  }

  // ---------- تثبيت التطبيق ----------
  let deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    refreshLabels();
  });

  async function installApp() {
    if (isStandalone()) {
      return alert(txt('التطبيق متثبت بالفعل', 'The app is already installed'));
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch {}
      deferredPrompt = null;
      return refreshLabels();
    }
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    alert(isIOS
      ? txt(
        'على آيفون: اضغط زرار المشاركة (Share) تحت، وبعدين اختار "Add to Home Screen".',
        'On iPhone: tap the Share button, then "Add to Home Screen".')
      : txt(
        'على أندرويد (Chrome): اضغط ⋮ فوق على اليمين، وبعدين "Install app" أو "Add to Home screen".',
        'On Android (Chrome): tap ⋮ at the top right, then "Install app" or "Add to Home screen".'));
  }

  // ---------- تصدير المحادثة (الرسايل المحمّلة في الشاشة) ----------
  function exportChat() {
    if (typeof msgById === 'undefined' || !msgById.size) {
      return alert(txt('مفيش رسايل تتصدّر', 'No messages to export'));
    }
    const rows = [...msgById.values()]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(m => {
        const who = m.profiles?.display_name || '?';
        const when = new Date(m.created_at).toLocaleString(isEn() ? 'en-US' : 'ar-EG');
        const body = m.content || (m.file_url ? `[${m.file_url}]` : '');
        return `[${when}] ${who}: ${body}`;
      });

    const blob = new Blob([`TFM Chat - ${currentRoom()}\n\n` + rows.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tfm-chat-${currentRoom()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- الأحداث ----------
  el('set-theme')?.addEventListener('click', () => {
    toggleTheme(); // دالة app.js: بتبدّل الوضع وبتحفظه
    refreshLabels();
  });

  el('set-font')?.addEventListener('click', () => {
    const keys = FONTS.map(f => f.key);
    setPref(KEY_FONT, nextOf(keys, getPref(KEY_FONT, 'normal')));
    applyFont();
    refreshLabels();
  });

  el('set-sound')?.addEventListener('click', () => {
    setPref(KEY_SOUND, getPref(KEY_SOUND, 'on') === 'off' ? 'on' : 'off');
    refreshLabels();
  });

  el('set-export')?.addEventListener('click', () => {
    el('settings-modal')?.classList.add('hidden');
    exportChat();
  });

  el('set-install')?.addEventListener('click', installApp);

  // بعد أي تغيير لغة أو وضع، نحدّث العناوين
  document.addEventListener('click', () => setTimeout(refreshLabels, 0));

  applyFont();
  refreshLabels();
})();