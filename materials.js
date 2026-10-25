// ملفات المادة: مكتبة ملفات لكل شعبة (محاضرات، ملخصات، أسئلة قديمة)
(function () {
  const panel = document.getElementById('materials-modal');
  const list = document.getElementById('materials-list');
  const uploadBox = document.getElementById('materials-upload');
  const fileInput = document.getElementById('materials-input');
  const btn = document.getElementById('materials-btn');
  if (!panel || !list || !btn) return;

  const canUpload = () => !!currentProfile && (currentProfile.role === 'admin' || currentProfile.role === 'sender');
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('ar-EG'); } catch (e) { return ''; }
  }

  async function load() {
    list.innerHTML = '<p class="empty">...</p>';
    const { data, error } = await sb.from('room_files')
      .select('id, title, file_url, file_name, uploaded_by, created_at')
      .eq('room', currentRoom())
      .order('created_at', { ascending: false });
    if (error) {
      list.innerHTML = `<p class="empty">${esc2(error.message)}</p>`;
      return;
    }
    if (!data || !data.length) {
      list.innerHTML = '<p class="empty">مفيش ملفات للشعبة دي لسه</p>';
      return;
    }
    list.innerHTML = '';
    data.forEach((f) => {
      const row = document.createElement('div');
      row.className = 'mat-row';

      const a = document.createElement('a');
      a.href = f.file_url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'mat-link';
      a.textContent = `📄 ${f.title}`;

      const meta = document.createElement('small');
      meta.className = 'mat-meta';
      meta.textContent = fmtDate(f.created_at);

      row.appendChild(a);
      row.appendChild(meta);

      const mine = currentProfile && f.uploaded_by === currentProfile.id;
      if (mine || (currentProfile && currentProfile.role === 'admin')) {
        const del = document.createElement('button');
        del.className = 'danger-btn mat-del';
        del.type = 'button';
        del.textContent = '🗑️';
        del.onclick = async () => {
          if (!confirm(`تمسح "${f.title}"؟`)) return;
          const { error: delErr } = await sb.from('room_files').delete().eq('id', f.id);
          if (delErr) return alert(delErr.message);
          await load();
        };
        row.appendChild(del);
      }
      list.appendChild(row);
    });
  }

  async function upload(file) {
    const safeName = file.name.replace(/[^\w.\-]/g, '_');
    const path = `${currentProfile.id}/materials/${currentRoom()}/${Date.now()}_${safeName}`;
    const { error: upErr } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type });
    if (upErr) return alert(t('uploadFail') + upErr.message);

    const { data } = sb.storage.from('uploads').getPublicUrl(path);
    const { error: insErr } = await sb.from('room_files').insert({
      room: currentRoom(),
      title: file.name,
      file_url: data.publicUrl,
      file_name: file.name,
    });
    if (insErr) return alert(insErr.message);
    await load();
  }

  // ===== الواجبات والمواعيد =====
  const asList = document.getElementById('assign-list');
  const asForm = document.getElementById('assign-form');

  function fmtDue(iso) {
    if (!iso) return 'بدون موعد';
    try { return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; }
  }

  async function loadAssign() {
    if (!asList) return;
    const { data, error } = await sb.from('room_assignments')
      .select('id, title, details, due_at, created_by')
      .eq('room', currentRoom())
      .order('due_at', { ascending: true, nullsFirst: false });
    if (error) {
      asList.innerHTML = `<p class="empty">${esc2(error.message)}</p>`;
      return;
    }
    if (!data || !data.length) {
      asList.innerHTML = '<p class="empty">مفيش واجبات للشعبة دي لسه</p>';
      return;
    }
    asList.innerHTML = '';
    const now = Date.now();
    data.forEach((a) => {
      const row = document.createElement('div');
      row.className = 'mat-row assign-row';

      const info = document.createElement('div');
      info.className = 'mat-link';
      const late = a.due_at && new Date(a.due_at).getTime() < now;
      info.innerHTML = `<b>📝 ${esc2(a.title)}</b>${late ? ' <span class="late">(انتهى)</span>' : ''}`
        + `<br><small>⏰ ${esc2(fmtDue(a.due_at))}</small>`
        + (a.details ? `<br><small>${esc2(a.details)}</small>` : '');
      row.appendChild(info);

      const mine = currentProfile && a.created_by === currentProfile.id;
      if (mine || (currentProfile && currentProfile.role === 'admin')) {
        const del = document.createElement('button');
        del.className = 'danger-btn mat-del';
        del.type = 'button';
        del.textContent = '🗑️';
        del.onclick = async () => {
          if (!confirm(`تمسح الواجب "${a.title}"؟`)) return;
          const { error: delErr } = await sb.from('room_assignments').delete().eq('id', a.id);
          if (delErr) return alert(delErr.message);
          await loadAssign();
        };
        row.appendChild(del);
      }
      asList.appendChild(row);
    });
  }

  if (asForm) {
    asForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('assign-title').value.trim();
      const details = document.getElementById('assign-details').value.trim();
      const dueRaw = document.getElementById('assign-due').value;
      if (title.length < 2) return alert('اكتب اسم الواجب');
      const { error } = await sb.from('room_assignments').insert({
        room: currentRoom(),
        title,
        details: details || null,
        due_at: dueRaw ? new Date(dueRaw).toISOString() : null,
      });
      if (error) return alert(error.message);
      asForm.reset();
      await loadAssign();
    };
  }

  btn.onclick = async () => {
    panel.classList.remove('hidden');
    uploadBox.classList.toggle('hidden', !canUpload());
    if (asForm) asForm.classList.toggle('hidden', !canUpload());
    await Promise.all([load(), loadAssign()]);
  };
  document.getElementById('materials-close').onclick = () => panel.classList.add('hidden');

  if (fileInput) {
    fileInput.onchange = async () => {
      const f = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (f) await upload(f);
    };
  }
})();