// ---------- تأثيرات الحركة: كونفيتي، هيدر بيتصغر، رياكشن بينبض، إيقاف الحركة، وقفل الإعدادات بالضغط برا ----------
(function () {
  const OFF_KEY = 'fxOff';

  function isOff() {
    try { return localStorage.getItem(OFF_KEY) === '1'; } catch { return false; }
  }
  function reducedByOs() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function motionOff() {
    return isOff() || reducedByOs();
  }

  // ----- زرار إيقاف/تشغيل الحركة -----
  function updateFxButton() {
    const b = document.getElementById('set-fx');
    if (b) b.textContent = isOff() ? '🎬 تشغيل الحركة' : '🎬 إيقاف الحركة';
  }
  function applyFxFlag() {
    document.documentElement.classList.toggle('fx-off', isOff());
    updateFxButton();
  }
  function setFxOff(v) {
    try { localStorage.setItem(OFF_KEY, v ? '1' : '0'); } catch {}
    applyFxFlag();
  }

  // ----- كونفيتي -----
  let canvas = null;
  function fxConfetti(count) {
    if (motionOff()) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'fx-canvas';
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6e0819', '#e0a526', '#1e7b43', '#2d6cdf', '#d9534f', '#8e44ad'];
    const n = count || 120;
    const parts = Array.from({ length: n }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: window.innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 12,
      vy: -(Math.random() * 10 + 6),
      g: 0.3 + Math.random() * 0.1,
      s: 4 + Math.random() * 5,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
      life: 1,
    }));

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(2, (now - last) / 16.7);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of parts) {
        p.vy += p.g * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        p.life -= 0.006 * dt;
        if (p.life <= 0 || p.y > canvas.height + 20) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      if (alive) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(frame);
  }
  window.fxConfetti = fxConfetti;

  // ----- الهيدر بيتصغر لما تنزل في الرسايل -----
  document.addEventListener('scroll', (e) => {
    const t = e.target;
    if (t && t.id === 'messages') {
      document.body.classList.toggle('hdr-shrink', t.scrollTop > 40);
    }
  }, true);

  // ----- الرياكشن بينبض لما تدوس عليه -----
  document.addEventListener('click', (e) => {
    const chip = e.target.closest && e.target.closest('.react-chip');
    if (!chip || motionOff()) return;
    chip.classList.remove('fx-pop');
    void chip.offsetWidth;
    chip.classList.add('fx-pop');
  });

  // ----- الإعدادات بتتقفل لما تدوس برا المربع -----
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target !== settingsModal) return;

      // لو الضغطة على زرار اللغة أو الوضع اللي في الهيدر (مغطّي بالخلفية): نشغّله ونسيب الإعدادات مفتوحة
      const x = e.clientX;
      const y = e.clientY;
      const under = (sel) => [...document.querySelectorAll(sel)].find((b) => {
        const r = b.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
      const toggle = under('.lang-toggle') || under('.theme-toggle');
      if (toggle) {
        toggle.click();
        return;
      }

      settingsModal.classList.add('hidden');
    });
  }

  // ----- زرار الحركة في الإعدادات -----
  const fxBtn = document.getElementById('set-fx');
  if (fxBtn) fxBtn.addEventListener('click', () => setFxOff(!isOff()));

  applyFxFlag();
})();