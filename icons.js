// ---------- أيقونات خطوط حديثة بدل الإيموجي في أزرار المنصة ----------
// الإيموجي اللي جوه الرسايل والتفاعلات مش بتتغير هنا.
(function () {
  // رسومات بسيطة بخطوط (stroke) 24×24
  const PATHS = {
    'book-open': '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
    'book': '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h12"/>',
    'history': '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 3"/>',
    'settings': '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    'palette': '<circle cx="12" cy="12" r="10"/><circle cx="7.5" cy="10" r="1.2"/><circle cx="12" cy="7" r="1.2"/><circle cx="16.5" cy="10" r="1.2"/><path d="M12 22a2 2 0 0 1 0-4 2 2 0 0 0 0-4"/>',
    'file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    'edit-doc': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="13" y2="18"/>',
    'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'pencil': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    'trash': '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>',
    'clipboard': '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    'send': '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
    'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    'check-square': '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    'square': '<rect x="3" y="3" width="18" height="18" rx="2"/>',
    'repeat': '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'camera': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    'mic': '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
    'volume': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
    'paperclip': '<path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    'bot': '<rect x="4" y="8" width="16" height="12" rx="2"/><line x1="12" y1="4" x2="12" y2="8"/><circle cx="9" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'bell': '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
    'film': '<rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>',
    'moon': '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    'sun': '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/>',
    'phone': '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
    'award': '<circle cx="12" cy="8" r="7"/><polyline points="8.2 14.8 7 22 12 19 17 22 15.8 14.8"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    'image': '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    'pin': '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.8a2 2 0 0 0-1.1-1.8L15 11V5a1 1 0 0 0 1-1 1 1 0 0 0-1-1H10a1 1 0 0 0-1 1 1 1 0 0 0 1 1v6l-2.9 2.4A2 2 0 0 0 5 15.2z"/>',
    'reply': '<polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
    'help': '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'stop': '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    'alert': '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'ban': '<circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'tag': '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
    'message': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'sparkles': '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>',
    'languages': '<path d="M5 8h8M9 5v3M7 14c2 0 4-3 5-6M5 18l4-7 4 7"/><path d="M14 19l3-8 3 8M15 16h4"/>',
    'brain': '<path d="M9.5 2a3.5 3.5 0 0 0-3.5 3.5v.5A3 3 0 0 0 4 9a3 3 0 0 0 1 2.2A3.5 3.5 0 0 0 9.5 22"/><path d="M14.5 2A3.5 3.5 0 0 1 18 5.5v.5A3 3 0 0 1 20 9a3 3 0 0 1-1 2.2A3.5 3.5 0 0 1 14.5 22"/>',
  };

  // الإيموجي اللي في الزراير ← اسم الأيقونة
  const MAP = {
    '📚': 'book-open', '📖': 'book', '🕘': 'history', '⚙️': 'settings', '⚙': 'settings',
    '🎨': 'palette', '📝': 'edit-doc', '📄': 'file', '➕': 'plus', '✏️': 'pencil', '✏': 'pencil',
    '🗑️': 'trash', '🗑': 'trash', '📋': 'clipboard', '🔗': 'link', '📨': 'send', '📤': 'share',
    '👁️': 'eye', '👁': 'eye', '🖨️': 'printer', '🖨': 'printer', '☑️': 'check-square', '☑': 'check-square',
    '⬜': 'square', '🔁': 'repeat', '👥': 'users', '⏰': 'clock', '📅': 'calendar', '📷': 'camera',
    '🎙️': 'mic', '🎙': 'mic', '🔇': 'volume-x', '🔊': 'volume', '📎': 'paperclip', '🤖': 'bot',
    '🔒': 'lock', '🔔': 'bell', '📥': 'download', '🗂️': 'folder', '🗂': 'folder', '🌐': 'globe',
    '🎬': 'film', '🌙': 'moon', '☀️': 'sun', '☀': 'sun', '📞': 'phone', '✉️': 'mail', '✉': 'mail',
    '🏅': 'award', '🏆': 'award', '🧠': 'brain', '✅': 'check-circle', '❌': 'x-circle', '✕': 'x', '✖': 'x',
    '💾': 'save', '🖼️': 'image', '🖼': 'image', '📌': 'pin', '↩️': 'reply', '↩': 'reply', '❓': 'help',
    '⏹️': 'stop', '⏹': 'stop', '⚠️': 'alert', '⚠': 'alert', '🚫': 'ban', '👤': 'user', '🏷️': 'tag',
    '🏷': 'tag', '📜': 'file', '💬': 'message', '✨': 'sparkles', '✓': 'check', '✔️': 'check', '✔': 'check',
    '🔤': 'languages', '🔍': 'search', '🔈': 'volume',
  };

  function svgFor(name) {
    return `<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;
  }

  // أماكن الزراير والعناوين بس (مش الرسايل ولا التفاعلات)
  const TARGETS = 'button, .tab, .set-item, h1, h2, h3, h4, label, a, .bank-q, .exam-meta, .sub-status, .mat-link b, .staff-q';
  const SKIP = '.msg, .msg-text, .react-chip, .reacts, #messages';

  // المفاتيح مرتبة من الأطول للأقصر عشان "⚙️" تتلقط قبل "⚙"
  const KEYS = Object.keys(MAP).sort((a, b) => b.length - a.length);

  function decorateTextNode(node) {
    const text = node.nodeValue;
    const trimmed = text.replace(/^\s+/, '');
    const key = KEYS.find(k => trimmed.startsWith(k));
    if (!key) return;
    const lead = text.length - trimmed.length;
    const rest = trimmed.slice(key.length).replace(/^\s+/, '');
    const wrap = document.createElement('span');
    wrap.innerHTML = svgFor(MAP[key]);
    const icon = wrap.firstElementChild;
    const before = document.createTextNode(text.slice(0, lead));
    const after = document.createTextNode(rest);
    const parent = node.parentNode;
    parent.insertBefore(before, node);
    parent.insertBefore(icon, node);
    parent.insertBefore(document.createTextNode(' '), node);
    parent.insertBefore(after, node);
    parent.removeChild(node);
  }

  function decorate(root) {
    if (!root || !root.querySelectorAll) return;
    const targets = root.matches && root.matches(TARGETS) ? [root] : [];
    root.querySelectorAll(TARGETS).forEach(e => targets.push(e));
    targets.forEach(elm => {
      if (elm.closest(SKIP)) return;
      // نشتغل على أول text node مباشر في العنصر بس
      for (const n of elm.childNodes) {
        if (n.nodeType === 3 && n.nodeValue.trim()) {
          decorateTextNode(n);
          break;
        }
      }
    });
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate(document.body);
    });
  }

  function start() {
    decorate(document.body);
    new MutationObserver(schedule).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.uiIcons = { decorate, svgFor };
})();