// تنبيهات الذكر والرد: لما حد يذكر اسمك (@اسمك) أو يرد على رسالتك، يظهرلك تنبيه حتى لو الشات مفتوح
// بيعتمد على newMessageAlert الموجودة في app.js ومش بيغيّر فيها
(function () {
  const origAlert = window.newMessageAlert;
  if (typeof origAlert !== 'function') return;

  function isForMe(m) {
    if (!currentProfile || !m || m.user_id === currentProfile.id) return false;

    const name = (currentProfile.display_name || '').trim();
    if (name && (m.content || '').includes('@' + name)) return true;

    if (m.reply_to) {
      const parent = msgById.get(Number(m.reply_to));
      if (parent && parent.user_id === currentProfile.id) return true;
    }
    return false;
  }

  function toast(text) {
    const d = document.createElement('div');
    d.className = 'badge-toast';
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4500);
  }

  window.newMessageAlert = function (m) {
    origAlert(m); // الصوت والإشعار العادي زي ما هما

    if (!isForMe(m)) return;

    const who = (m.profiles && m.profiles.display_name) || '?';
    toast(`💬 ${who} ذكرك أو رد عليك`);

    // لو الصفحة مفتوحة، الإشعار الأصلي مش بيظهر، فنظهره هنا
    if (!document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`${who} ذكرك`, { body: m.content || '', icon: 'icon-192.png' });
      } catch (e) { /* مش مهم */ }
    }
  };
})();