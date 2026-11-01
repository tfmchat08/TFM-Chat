/* ===== ux-core.js: تحسينات واجهة وثبات (مستقل، ما بيعدّلش app.js ولا chats.js) =====
   - إشعارات Toast بدل alert (بدون ما توقف الصفحة)
   - alert() القديم بيتحوّل لـ Toast تلقائياً
   - أي خطأ مش متلقط بيظهر برسالة واضحة بدل ما يقف بصمت
   - Esc بيقفل آخر نافذة مفتوحة
   - صور الشات والقوايم بتتحمّل lazy
   - تنبيه لما النت يقطع أو يرجع
   - حد أقصى لطول الرسالة في خانة الكتابة
*/
(function () {
  'use strict';

  if (window.__uxCoreLoaded) return;
  window.__uxCoreLoaded = true;

  /* ---------- ستايل الإشعارات (بيتحقن بالـ JS) ---------- */
  var CSS =
    '#ux-toasts{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10000;' +
    'display:flex;flex-direction:column;align-items:center;gap:8px;width:min(92vw,420px);pointer-events:none}' +
    '.ux-toast{pointer-events:auto;width:100%;display:flex;align-items:center;gap:10px;' +
    'padding:12px 16px;border-radius:16px;cursor:pointer;' +
    'background:var(--card-a,#111);color:var(--text,#fff);' +
    'border:1px solid var(--ux-glass-border,rgba(255,255,255,.1));' +
    'box-shadow:0 14px 40px rgba(0,0,0,.4);font:600 14px/1.5 Cairo,Tahoma,sans-serif;' +
    'animation:uxToastIn .35s cubic-bezier(.2,.8,.2,1) both}' +
    '.ux-toast.ux-out{animation:uxToastOut .25s ease both}' +
    '.ux-toast .ux-dot{width:10px;height:10px;border-radius:50%;flex:0 0 auto;background:#22c55e}' +
    '.ux-toast.error .ux-dot{background:#e11d48}' +
    '.ux-toast.warn .ux-dot{background:#f59e0b}' +
    '.ux-toast.info .ux-dot{background:#38bdf8}' +
    '@keyframes uxToastIn{from{opacity:0;transform:translateY(-12px) scale(.96)}to{opacity:1;transform:none}}' +
    '@keyframes uxToastOut{to{opacity:0;transform:translateY(-8px)}}' +
    '@media (prefers-reduced-motion:reduce){.ux-toast,.ux-toast.ux-out{animation:none}}';

  function ensureBox() {
    var box = document.getElementById('ux-toasts');
    if (box) return box;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    box = document.createElement('div');
    box.id = 'ux-toasts';
    box.setAttribute('role', 'status');
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
    return box;
  }

  /* ---------- Toast ---------- */
  var lastMsg = { text: '', at: 0 };

  function toast(message, type, duration) {
    var text = String(message == null ? '' : message).trim();
    if (!text) return;

    // نفس الرسالة متتكررش بسرعة
    var now = Date.now();
    if (text === lastMsg.text && now - lastMsg.at < 2500) return;
    lastMsg = { text: text, at: now };

    var box = ensureBox();
    var el = document.createElement('div');
    el.className = 'ux-toast ' + (type || 'info');

    var dot = document.createElement('span');
    dot.className = 'ux-dot';
    var label = document.createElement('span');
    label.textContent = text; // textContent عشان ما يتنفذش أي HTML

    el.appendChild(dot);
    el.appendChild(label);
    box.appendChild(el);

    var remove = function () {
      if (!el.parentNode) return;
      el.classList.add('ux-out');
      setTimeout(function () { el.remove(); }, 260);
    };
    setTimeout(remove, duration || 3800);
    el.addEventListener('click', remove);
  }

  function guessType(message) {
    var s = String(message || '');
    if (/خطأ|فشل|مش قادر|ما اتمسحش|ما اتعملش|error|failed|denied/i.test(s)) return 'error';
    if (/تنبيه|انتبه|warning/i.test(s)) return 'warn';
    return 'info';
  }

  window.uxToast = toast;

  // alert() القديم يظهر كـ Toast بدل ما يوقف الصفحة
  window.alert = function (message) {
    toast(message, guessType(message), 4800);
  };

  /* ---------- أي خطأ مش متلقط ---------- */
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    if (reason && reason.name === 'AbortError') return;
    var msg = (reason && (reason.message || reason.error_description)) ||
      'حصل خطأ غير متوقع، جرّب تاني';
    toast(msg, 'error', 4800);
  });

  /* ---------- النت ---------- */
  window.addEventListener('offline', function () {
    toast('النت قطع. الرسايل هتتبعت أول ما يرجع', 'warn', 5000);
  });
  window.addEventListener('online', function () {
    toast('رجع النت ✓', 'info', 2500);
  });

  /* ---------- Esc بيقفل آخر نافذة مفتوحة ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelectorAll('.modal:not(.hidden)');
    if (!open.length) return;
    var top = open[open.length - 1];
    var closeBtn = top.querySelector('.modal-head button');
    if (closeBtn) closeBtn.click();
  });

  /* ---------- Lazy loading للصور ---------- */
  var LAZY_AREAS = '#messages, #members-list, #history-list, #materials-list, #subs-list, #ai-messages, #assign-list';

  function lazify(root) {
    if (!root || root.nodeType !== 1) return;
    var imgs = root.tagName === 'IMG' ? [root] : root.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (!img.hasAttribute('loading') && img.closest(LAZY_AREAS)) {
        img.setAttribute('loading', 'lazy');
      }
    }
  }

  function startLazy() {
    lazify(document.body);
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) lazify(added[j]);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- حد أقصى لطول الرسالة ---------- */
  function limitInputs() {
    var ids = ['msg-input', 'ai-input', 'search-input'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && el.maxLength < 0) {
        el.maxLength = ids[i] === 'search-input' ? 100 : 4000;
      }
    }
  }

  function init() {
    startLazy();
    limitInputs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();