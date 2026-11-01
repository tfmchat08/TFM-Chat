/* ===== ux-fx.js (نسخة آمنة): تأثير الضغط بدون ما الزراير تكبر أو تملا الشاشة =====
   - كل ريبل بيتشال بعد ما يخلص، ومفيش أكتر من 2 على نفس العنصر
   - العنصر بياخد position:relative و overflow:hidden عشان الريبل يفضل جواه
   - الحجم محدود، فمفيش تضخيم
   - بيحترم تقليل الحركة في الجهاز */
(function () {
  'use strict';
  if (window.__uxFxLoaded) return;
  window.__uxFxLoaded = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var style = document.createElement('style');
  style.id = 'ux-fx-style';
  style.textContent =
    '.ux-ripple{position:absolute;border-radius:50%;pointer-events:none;z-index:0;' +
    'background:rgba(255,255,255,.28);transform:scale(0);opacity:.55;' +
    'animation:uxFxRipple .55s ease-out forwards;will-change:transform,opacity}' +
    '@keyframes uxFxRipple{to{transform:scale(1);opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){.ux-ripple{display:none}}';
  document.head.appendChild(style);

  var SEL = 'button, .set-item, .chat-tab, .auth-tab, .ai-chip, [data-level], [data-track], a.back';
  var MAX_PER_TARGET = 2;

  document.addEventListener('pointerdown', function (e) {
    if (reduce || e.button > 0) return;
    var t = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!t || t.disabled) return;

    // لو فيه ريبلات كتير على نفس العنصر، نشيل القديم
    var existing = t.querySelectorAll(':scope > .ux-ripple');
    while (existing.length >= MAX_PER_TARGET) {
      existing[0].remove();
      existing = t.querySelectorAll(':scope > .ux-ripple');
    }

    var cs = window.getComputedStyle(t);
    if (cs.position === 'static') t.style.position = 'relative';
    if (cs.overflow === 'visible') t.style.overflow = 'hidden';

    var r = t.getBoundingClientRect();
    var size = Math.min(Math.max(r.width, r.height) * 1.4, 240);
    var s = document.createElement('span');
    s.className = 'ux-ripple';
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    t.appendChild(s);

    var removed = false;
    var remove = function () {
      if (removed) return;
      removed = true;
      s.remove();
    };
    s.addEventListener('animationend', remove);
    // أمان: لو الـ animationend ما اتطلقش لأي سبب، نشيله بعد وقته
    setTimeout(remove, 800);
  }, { passive: true });

  // أزرار الإرسال بتهتز خفيف على الموبايل
  document.addEventListener('click', function (e) {
    if (!navigator.vibrate || !e.target || !e.target.closest) return;
    if (e.target.closest('#send-btn, #ai-send, #auth-submit')) navigator.vibrate(10);
  });
})();
