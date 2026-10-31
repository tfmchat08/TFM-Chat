// ---------- الاختبارات: زرار في الهيدر جنب 📚 (الواجبات)، وبنود الإعدادات ----------
(() => {
  const isEn = typeof lang !== 'undefined' && lang === 'en';
  const modal = document.getElementById('settings-modal');
  const goQuiz = () => {
    if (modal) modal.classList.add('hidden');
    window.location.href = 'quiz.html';
  };

  // زرار 📝 في الهيدر جنب زرار 📚 (ملفات المادة والواجبات)
  const mat = document.getElementById('materials-btn');
  if (mat && !document.getElementById('quiz-btn')) {
    const q = document.createElement('button');
    q.id = 'quiz-btn';
    q.type = 'button';
    q.className = mat.className;
    q.title = isEn ? 'Quizzes' : 'الاختبارات';
    q.textContent = '📝';
    q.onclick = goQuiz;
    mat.insertAdjacentElement('afterend', q);
  }

  const btn = document.getElementById('set-quiz');
  if (!btn) return;

  // درجات امتحاناتي: للأدمن والمدرسين بس
  const g = btn.cloneNode(false);
  g.id = 'set-grades';
  g.textContent = isEn ? '📊 My exam grades' : '📊 درجات امتحاناتي';
  g.onclick = () => {
    if (modal) modal.classList.add('hidden');
    window.location.href = 'quiz.html?grades=1';
  };
  btn.insertAdjacentElement('afterend', g);
  btn.remove();   // زرار الاختبارات اتشال من الإعدادات، وفضل برا في الهيدر

  const isStaff = () => typeof currentProfile !== 'undefined' && !!currentProfile
    && (currentProfile.role === 'admin' || currentProfile.role === 'sender');
  const sync = () => g.classList.toggle('hidden', !isStaff());
  sync();
  if (modal) new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['class'] });
})();