// إيستر إيج: لما الشخص يضغط على أيقونة فهيم 10 مرات (والضغطات قريبة من بعض) يتاخد بادج "المستفز"
// الأدمن يقدر يشيله من قايمة الأعضاء
(function () {
  const BADGE_TEXT = 'المستفز';
  const TAPS_NEEDED = 10;
  const TAP_GAP_MS = 4000;

  let badges = new Map(); // user_id -> نص البادج (المشالين مش بيدخلوا)
  let taps = 0;
  let lastTap = 0;

  window.badgeFor = (uid) => badges.get(uid) || null;

  window.badgeHtml = (uid) => {
    const b = badges.get(uid);
    return b ? ` <span class="user-badge" title="${esc(b)}">😏 ${esc(b)}</span>` : '';
  };

  window.loadBadges = async function () {
    try {
      const { data, error } = await sb
        .from('user_badges')
        .select('user_id, badge, revoked')
        .eq('revoked', false);
      if (error || !data) return;
      badges = new Map(data.map((r) => [r.user_id, r.badge]));
    } catch (e) { /* البادج مش ضروري، الشات يفضل شغال */ }
  };

  // الأدمن بيشيل البادج: الصف بيفضل بس بيتعلم revoked = true
  window.revokeBadge = async function (uid) {
    const { error } = await sb.from('user_badges').update({ revoked: true }).eq('user_id', uid);
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

  async function claim() {
    const me = currentProfile && currentProfile.id;
    if (!me) return;
    await window.loadBadges();
    if (badges.has(me)) return; // عنده البادج أصلاً
    const { error } = await sb.rpc('claim_faheem_badge');
    if (error) return;
    await window.loadBadges();
    if (badges.has(me)) {
      toast(`🎉 فتحت بادج "${BADGE_TEXT}"! اتكتب جنب اسمك`);
      if (window.loadMessages) await window.loadMessages();
    }
  }

  const openBtn = document.getElementById('ai-open');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap > TAP_GAP_MS) taps = 0;
      lastTap = now;
      taps++;
      if (taps >= TAPS_NEEDED) {
        taps = 0;
        claim();
      }
    });
  }
})();