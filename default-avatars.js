// ---------- صور بروفايل جاهزة (لو المستخدم مش عايز يرفع صورة) ----------
// بيستخدم sb و uploadAvatar من app.js (لازم يتحمّل بعد app.js)
(() => {
  const COUNT = 8;
  const lang_ = typeof lang !== 'undefined' ? lang : 'ar';
  window.pickedAvatar = null;

  // الصورة المختارة من الجاهزة، ولا الصورة اللي اترفعت
  window.saveAvatarChoice = async (file, userId) => {
    if (file) return uploadAvatar(file, userId);
    if (!window.pickedAvatar) throw new Error('no avatar');
    const url = new URL(window.pickedAvatar, location.href).href;
    const { error } = await sb.from('profiles').update({ avatar_url: url }).eq('id', userId);
    if (error) throw error;
  };

  // أول ما تختار صورة من الجاهزة، الرفع يتشال، والعكس
  function clearSelection() {
    window.pickedAvatar = null;
    document.querySelectorAll('.av-pick.sel').forEach(b => b.classList.remove('sel'));
  }

  function buildPicker(parent, beforeEl, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'av-picks';

    const label = document.createElement('p');
    label.className = 'hint';
    label.textContent = lang_ === 'en' ? 'Or pick a ready picture:' : 'أو اختار صورة جاهزة:';
    wrap.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'av-grid';
    for (let i = 1; i <= COUNT; i++) {
      const path = `avatars/av${i}.png`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'av-pick';
      b.title = lang_ === 'en' ? `Picture ${i}` : `صورة ${i}`;
      const img = document.createElement('img');
      img.src = path;
      img.alt = '';
      b.appendChild(img);
      b.onclick = () => {
        clearSelection();
        window.pickedAvatar = path;
        b.classList.add('sel');
        onPick();
      };
      grid.appendChild(b);
    }
    wrap.appendChild(grid);
    parent.insertBefore(wrap, beforeEl);
  }

  // ستايل الشبكة (بيتحقن من JS عشان ما نعدّلش style.css)
  const style = document.createElement('style');
  style.textContent = `
    .av-picks { margin-top: 8px; }
    .av-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 6px; }
    .av-pick { padding: 0; background: transparent; border: 2px solid transparent; border-radius: 50%; aspect-ratio: 1; overflow: hidden; cursor: pointer; }
    .av-pick img { width: 100%; height: 100%; display: block; border-radius: 50%; }
    .av-pick.sel { border-color: var(--accent2); box-shadow: 0 0 0 3px rgba(224, 52, 79, 0.35); }
  `;
  document.head.appendChild(style);

  // إنشاء الحساب مفيهوش اختيار صورة دلوقتي: الصورة والاسم بيتطلبوا بعد الدخول (بوابة البروفايل)
  document.getElementById('signup-avatar-input').addEventListener('change', () => {
    if (document.getElementById('signup-avatar-input').files[0]) clearSelection();
  });

  // في بوابة الصورة للحسابات اللي مفيهاش صورة
  const gateBox = document.querySelector('#avatar-gate .modal-box');
  const gateSave = document.getElementById('gate-save');
  if (gateBox && gateSave) {
    buildPicker(gateBox, gateSave, () => {
      document.getElementById('gate-input').value = '';
    });
  }
  document.getElementById('gate-input').addEventListener('change', () => {
    if (document.getElementById('gate-input').files[0]) clearSelection();
  });
})();