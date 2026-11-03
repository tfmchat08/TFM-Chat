// ---------- زرار حذف الحساب من الإعدادات ----------
// بيستخدم sb , lang , openDialog , notify من app.js (لازم account.js يتحمّل بعد app.js)
(() => {
  const btn = document.getElementById('set-delete');
  if (!btn) return;

  const isEn = typeof lang !== 'undefined' && lang === 'en';
  const txt = (ar, en) => (isEn ? en : ar);
  const WORD = txt('حذف', 'DELETE');

  btn.textContent = txt('🗑️ حذف الحساب', '🗑️ Delete account');

  btn.onclick = async () => {
    document.getElementById('settings-modal').classList.add('hidden');

    // نافذة داخل المنصة بدل prompt الأصلي
    const typed = await openDialog({
      title: txt('حذف الحساب', 'Delete account'),
      message: txt(
        `ده هيمسح حسابك ورسايلك وبياناتك نهائياً ومش هيرجعوا.\nعشان تأكد، اكتب كلمة "${WORD}":`,
        `This permanently deletes your account, messages and data.\nTo confirm, type "${WORD}":`
      ),
      input: { value: '', placeholder: WORD, max: 10 },
      okText: txt('احذف حسابي', 'Delete my account'),
      danger: true
    });
    if (typed === null) return;
    if (typed !== WORD) {
      notify(txt('الكلمة مش مطابقة، حسابك لسه موجود.', 'Word does not match, your account is still there.'), 'error');
      return;
    }

    const failMsg = txt('حصلت مشكلة وحسابك ما اتحذفش، جرّب تاني.', 'Something went wrong, your account was not deleted. Try again.');
    try {
      const { data, error } = await sb.functions.invoke('delete-account', { body: {} });

      // لو الدالة رجّعت خطأ (403 مثلاً)، سبب الرفض بيكون جوه رد السيرفر مش في data
      let reason = data && data.error;
      if (!reason && error && error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          reason = body && (body.error || body.message);
        } catch (e) { /* الرد مش JSON */ }
      }
      if (reason) console.error('delete-account:', reason);

      if (error || (data && data.error)) {
        if (reason === 'last_admin') {
          notify(txt('إنت آخر أدمن في المنصة، مينفعش تحذف حسابك. اختار أدمن تاني الأول.', 'You are the last admin, so you cannot delete your account. Make someone else an admin first.'), 'error');
        } else {
          notify(failMsg + (reason ? ` (${reason})` : ''), 'error');
        }
        return;
      }

      try { await sb.auth.signOut(); } catch (e) {}
      notify(txt('حسابك اتحذف. تقدر تسجل حساب جديد في أي وقت.', 'Your account was deleted. You can sign up again any time.'), 'success');
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      notify(failMsg, 'error');
    }
  };
})();