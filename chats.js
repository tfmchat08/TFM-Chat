// ---------- الشاتات الخمسة جوه كل شعبة ----------
let chatsInfo = [];

async function loadChatsInfo() {
  const { data, error } = await sb.from('chats')
    .select('slot, name, avatar_url')
    .eq('room', currentRoom())
    .order('slot', { ascending: true });
  chatsInfo = error ? [] : (data || []);
}

function chatInfo(slot) {
  return chatsInfo.find(c => c.slot === slot) || { slot, name: 'شات ' + slot, avatar_url: null };
}

function chatBar() {
  let bar = document.getElementById('chat-tabs');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'chat-tabs';
    bar.className = 'chat-tabs';
    $('search-bar').before(bar);
  }
  return bar;
}

// بيرسم الخمس شاتات فوق (من اليمين)
window.renderChatTabs = async function () {
  await loadChatsInfo();
  const bar = chatBar();
  bar.innerHTML = '';
  for (let s = 1; s <= 5; s++) {
    const c = chatInfo(s);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-tab' + (s === currentChatSlot ? ' active' : '');
    b.title = c.name;
    const pic = c.avatar_url
      ? `<img src="${esc(c.avatar_url)}" alt="">`
      : `<span class="chat-tab-init">${s}</span>`;
    b.innerHTML = `${pic}<span>${esc(c.name)}</span>`;
    b.onclick = () => switchChat(s);
    bar.appendChild(b);
  }
};

function switchChat(slot) {
  if (slot === currentChatSlot) return;
  currentChatSlot = slot;
  saveChatSlot();
  clearReply();
  loadMessages();
}

// ---------- زرار إعدادات فهيم ----------
// بنربطه هنا عشان يشتغل حتى لو ai.js على الريبو لسه قديم
$('ai-settings-btn').onclick = () => {
  const isAdmin = !!(currentProfile && currentProfile.role === 'admin');
  $('ai-books-open').classList.toggle('hidden', !isAdmin);
  $('ai-settings-modal').classList.remove('hidden');
};
$('ai-settings-close').onclick = () => $('ai-settings-modal').classList.add('hidden');
$('ai-books-open').onclick = () => {
  const box = $('ai-books-admin');
  box.classList.toggle('hidden');
  if (!box.classList.contains('hidden') && typeof loadAiBooksAdmin === 'function') loadAiBooksAdmin();
};

// ---------- إعدادات الشاتات (الأدمن بس) ----------
const chatAdminBtn = document.createElement('button');
chatAdminBtn.type = 'button';
chatAdminBtn.className = 'set-item hidden';
chatAdminBtn.textContent = '🗂️ شاتات الشعبة';
$('set-search').after(chatAdminBtn);

$('settings-btn').addEventListener('click', () => {
  chatAdminBtn.classList.toggle('hidden', !(currentProfile && currentProfile.role === 'admin'));
});

chatAdminBtn.onclick = () => {
  $('settings-modal').classList.add('hidden');
  openChatAdmin();
};

function openChatAdmin() {
  let modal = document.getElementById('chat-admin-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'chat-admin-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-head">
          <h3 id="chat-admin-title"></h3>
          <button class="ghost" id="chat-admin-close">✕</button>
        </div>
        <div id="chat-admin-rows"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#chat-admin-close').onclick = () => modal.classList.add('hidden');
  }
  modal.querySelector('#chat-admin-title').textContent = `🗂️ شاتات ${aiRoomTitle(currentRoom())}`;
  modal.classList.remove('hidden');
  renderChatAdminRows();
}

async function renderChatAdminRows() {
  await loadChatsInfo();
  const box = document.getElementById('chat-admin-rows');
  box.innerHTML = '';

  for (let s = 1; s <= 5; s++) {
    const c = chatInfo(s);
    const row = document.createElement('div');
    row.className = 'chat-admin-row';

    const num = document.createElement('b');
    num.textContent = s;

    const name = document.createElement('input');
    name.value = c.name;
    name.maxLength = 30;

    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'primary';
    save.textContent = lang === 'en' ? 'Save' : 'حفظ';
    save.onclick = () => saveChatRow(s, name, file, save);

    row.appendChild(num);
    row.appendChild(name);
    row.appendChild(file);
    row.appendChild(save);
    box.appendChild(row);
  }
}

async function saveChatRow(slot, nameInput, fileInput, btn) {
  const patch = { name: nameInput.value.trim() || ('شات ' + slot) };
  const f = fileInput.files[0];

  if (f) {
    if (f.size > 2 * 1024 * 1024) return alert('الصورة كبيرة. الحد الأقصى 2 ميجا');
    btn.disabled = true;
    const path = `${currentProfile.id}/chat_${currentRoom()}_${slot}_${Date.now()}`;
    const { error: upErr } = await sb.storage.from('uploads').upload(path, f, { contentType: f.type });
    btn.disabled = false;
    if (upErr) return alert(upErr.message);
    patch.avatar_url = sb.storage.from('uploads').getPublicUrl(path).data.publicUrl;
  }

  const { error } = await sb.from('chats')
    .update(patch)
    .eq('room', currentRoom())
    .eq('slot', slot);
  if (error) return alert(error.message);

  fileInput.value = '';
  await window.renderChatTabs();
  await renderChatAdminRows();
}