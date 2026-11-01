/* ===== ux-fx.js: تأثير الضغط (Ripple) + اهتزاز خفيف عند الإرسال ===== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var RIPPLE_TARGETS = 'button, .set-item, .chat-tab, .auth-tab, .ai-chip, [data-level], [data-track], a.back';

  document.addEventListener('pointerdown', function (e) {
    if (reduceMotion) return;
    var el = e.target && e.target.closest ? e.target.closest(RIPPLE_TARGETS) : null;
    if (!el || el.disabled) return;

    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var span = document.createElement('span');
    span.className = 'ux-ripple';
    span.style.width = size + 'px';
    span.style.height = size + 'px';
    span.style.left = (e.clientX - rect.left - size / 2) + 'px';
    span.style.top = (e.clientY - rect.top - size / 2) + 'px';

    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    el.appendChild(span);
    span.addEventListener('animationend', function () {
      span.remove();
    });
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('#send-btn, #ai-send, #auth-submit') : null;
    if (btn && navigator.vibrate) {
      try { navigator.vibrate(10); } catch (_) { /* الجهاز مش داعم */ }
    }
  }, true);
})();