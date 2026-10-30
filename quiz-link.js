// ---------- أزرار "الاختبارات" و"درجات امتحاناتي" في الإعدادات ----------
(() => {
  const btn = document.getElementById('set-quiz');
  if (!btn) return;
  const modal = document.getElementById('settings-modal');

  const isEn = typeof lang !== 'undefined' && lang === 'en';
  btn.textContent = isEn ? '📝 Quizzes' : '📝 الاختبارات';
  btn.onclick = () => {
    modal.classList.add('hidden');
    window.location.href = 'quiz.html';
  };

  // درجات امتحاناتي: للأدمن والمدرسين بس
  const g = btn.cloneNode(false);
  g.id = 'set-grades';
  g.textContent = isEn ? '📊 My exam grades' : '📊 درجات امتحاناتي';
  g.onclick = () => {
    modal.classList.add('hidden');
    window.location.href = 'quiz.html?grades=1';
  };
  btn.insertAdjacentElement('afterend', g);

  const isStaff = () => typeof currentProfile !== 'undefined' && !!currentProfile
    && (currentProfile.role === 'admin' || currentProfile.role === 'sender');
  const sync = () => g.classList.toggle('hidden', !isStaff());
  sync();
  if (modal) new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['class'] });
})();