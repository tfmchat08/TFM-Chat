// ملفات المادة + الواجبات (تسليم الحل، الدرجات، تصدير للتقويم)
(function () {
  const panel = document.getElementById('materials-modal');
  const list = document.getElementById('materials-list');
  const uploadBox = document.getElementById('materials-upload');
  const fileInput = document.getElementById('materials-input');
  const btn = document.getElementById('materials-btn');
  if (!panel || !list || !btn) return;

  const isStaff = () => !!currentProfile && (currentProfile.role === 'admin' || currentProfile.role === 'sender');
  const canUpload = isStaff;
  const esc2 = (s) => (typeof esc === 'function' ? esc(s) : String(s));
  const safeName = (n) => n.replace(/[^\w.\-]/g, '_');

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('ar-EG'); } catch (e) { return ''; }
  }

  // ===== ملفات المادة =====
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
    const path = `${currentProfile.id}/materials/${currentRoom()}/${Date.now()}_${safeName(file.name)}`;
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

  // ===== الواجبات =====
  const asList = document.getElementById('assign-list');
  const asForm = document.getElementById('assign-form');
  const icsBtn = document.getElementById('assign-ics');
  const subsModal = document.getElementById('subs-modal');
  const subsList = document.getElementById('subs-list');
  const subsTitle = document.getElementById('subs-title');
  const subsClose = document.getElementById('subs-close');

  function fmtDue(iso) {
    if (!iso) return 'بدون موعد';
    try { return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; }
  }

  function pickFile(cb) {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (f) cb(f);
    };
    input.click();
  }

  // تسليم الطالب لحله (بيغيّر الملف لو سلّم قبل كده)
  async function submitFile(a, file) {
    const path = `${currentProfile.id}/assign/${currentRoom()}/${a.id}/${Date.now()}_${safeName(file.name)}`;
    const { error: upErr } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type });
    if (upErr) return alert(t('uploadFail') + upErr.message);

    const { data } = sb.storage.from('uploads').getPublicUrl(path);
    const { error } = await sb.from('assignment_submissions').upsert({
      assignment_id: a.id,
      room: currentRoom(),
      user_id: currentProfile.id,
      file_url: data.publicUrl,
      file_name: file.name,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,user_id' });
    if (error) return alert(error.message);
    await loadAssign();
  }

  async function loadAssign() {
    if (!asList) return;
    const room = currentRoom();
    const [aRes, sRes, gRes] = await Promise.all([
      sb.from('room_assignments')
        .select('id, title, details, due_at, created_by')
        .eq('room', room)
        .order('due_at', { ascending: true, nullsFirst: false }),
      sb.from('assignment_submissions')
        .select('id, assignment_id, user_id, file_url, file_name, submitted_at')
        .eq('room', room),
      sb.from('assignment_grades')
        .select('assignment_id, user_id, grade, note')
        .eq('room', room),
    ]);
    if (aRes.error) {
      asList.innerHTML = `<p class="empty">${esc2(aRes.error.message)}</p>`;
      return;
    }
    const assignments = aRes.data || [];
    if (!assignments.length) {
      asList.innerHTML = '<p class="empty">مفيش واجبات للشعبة دي لسه</p>';
      return;
    }
    const subs = sRes.data || [];
    const grades = gRes.data || [];
    const me = currentProfile && currentProfile.id;
    const staff = isStaff();
    const now = Date.now();

    asList.innerHTML = '';
    assignments.forEach((a) => {
      const row = document.createElement('div');
      row.className = 'mat-row assign-row';

      const info = document.createElement('div');
      info.className = 'mat-link';
      const late = a.due_at && new Date(a.due_at).getTime() < now;
      info.innerHTML = `<b>📝 ${esc2(a.title)}</b>${late ? ' <span class="late">(انتهى)</span>' : ''}`
        + `<br><small>⏰ ${esc2(fmtDue(a.due_at))}</small>`
        + (a.details ? `<br><small>${esc2(a.details)}</small>` : '');
      row.appendChild(info);

      const mySub = subs.find((s) => s.assignment_id === a.id && s.user_id === me);
      const myGrade = grades.find((g) => g.assignment_id === a.id && g.user_id === me);
      const allSubs = subs.filter((s) => s.assignment_id === a.id);

      if (!staff) {
        const st = document.createElement('small');
        st.className = 'sub-status';
        st.innerHTML = mySub
          ? `✅ سلّمت: <a href="${esc2(mySub.file_url)}" target="_blank" rel="noopener">${esc2(mySub.file_name)}</a>`
          : 'لسه ماسلّمتش';
        info.appendChild(st);

        if (myGrade && (myGrade.grade || myGrade.note)) {
          const gd = document.createElement('small');
          gd.className = 'sub-status';
          gd.textContent = `🏅 الدرجة: ${myGrade.grade || '-'}${myGrade.note ? ' · ' + myGrade.note : ''}`;
          info.appendChild(gd);
        }

        const sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.className = 'ghost mat-del';
        sendBtn.textContent = mySub ? '🔁 غيّر الحل' : '📤 سلّم الحل';
        sendBtn.onclick = () => pickFile((f) => submitFile(a, f));
        row.appendChild(sendBtn);
      } else {
        const subsBtn = document.createElement('button');
        subsBtn.type = 'button';
        subsBtn.className = 'ghost mat-del';
        subsBtn.textContent = `👥 ${allSubs.length}`;
        subsBtn.title = 'التسليمات والدرجات';
        subsBtn.onclick = () => openSubs(a);
        row.appendChild(subsBtn);
      }

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

  // الأدمن والمرسل: قايمة التسليمات والدرجات لواجب معين
  async function openSubs(a) {
    subsTitle.textContent = `📝 تسليمات: ${a.title}`;
    subsModal.classList.remove('hidden');
    subsList.innerHTML = '<p class="empty">...</p>';

    const { data: rows, error } = await sb.from('assignment_submissions')
      .select('id, user_id, file_url, file_name, submitted_at, profiles(display_name)')
      .eq('assignment_id', a.id)
      .order('submitted_at', { ascending: true });
    if (error) {
      subsList.innerHTML = `<p class="empty">${esc2(error.message)}</p>`;
      return;
    }
    if (!rows || !rows.length) {
      subsList.innerHTML = '<p class="empty">ماحدش سلّم لسه</p>';
      return;
    }

    const { data: gr } = await sb.from('assignment_grades')
      .select('user_id, grade, note')
      .eq('assignment_id', a.id);
    const gMap = new Map((gr || []).map((g) => [g.user_id, g]));

    subsList.innerHTML = '';
    rows.forEach((s) => {
      const g = gMap.get(s.user_id) || {};
      const box = document.createElement('div');
      box.className = 'mat-row sub-row';

      const info = document.createElement('div');
      info.className = 'mat-link';
      info.innerHTML = `<b>${esc2((s.profiles && s.profiles.display_name) || '?')}</b>`
        + `<br><a href="${esc2(s.file_url)}" target="_blank" rel="noopener">📄 ${esc2(s.file_name)}</a>`
        + `<br><small>${esc2(fmtDue(s.submitted_at))}</small>`;
      box.appendChild(info);

      const inputs = document.createElement('div');
      inputs.className = 'sub-inputs';
      const grade = document.createElement('input');
      grade.placeholder = 'الدرجة';
      grade.maxLength = 10;
      grade.value = g.grade || '';
      const note = document.createElement('input');
      note.placeholder = 'ملاحظة (اختياري)';
      note.maxLength = 120;
      note.value = g.note || '';
      const save = document.createElement('button');
      save.type = 'button';
      save.className = 'primary mat-del';
      save.textContent = '💾';
      save.onclick = async () => {
        const { error: gErr } = await sb.from('assignment_grades').upsert({
          assignment_id: a.id,
          room: currentRoom(),
          user_id: s.user_id,
          grade: grade.value.trim() || null,
          note: note.value.trim() || null,
          graded_by: currentProfile.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'assignment_id,user_id' });
        if (gErr) return alert(gErr.message);
        save.textContent = '✅';
      };
      inputs.appendChild(grade);
      inputs.appendChild(note);
      inputs.appendChild(save);
      box.appendChild(inputs);

      subsList.appendChild(box);
    });
  }

  if (subsClose) subsClose.onclick = () => subsModal.classList.add('hidden');

  // تصدير المواعيد لتطبيق التقويم (ملف ICS)
  function icsEscape(s) {
    return String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }
  function icsDate(d) {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  async function exportIcs() {
    const { data, error } = await sb.from('room_assignments')
      .select('id, title, details, due_at')
      .eq('room', currentRoom())
      .not('due_at', 'is', null);
    if (error) return alert(error.message);
    if (!data || !data.length) return alert('مفيش واجبات ليها موعد');

    const stamp = icsDate(new Date());
    const events = data.map((a) => {
      const start = new Date(a.due_at);
      const finish = new Date(start.getTime() + 60 * 60 * 1000);
      return [
        'BEGIN:VEVENT',
        `UID:assign-${a.id}-${currentRoom()}@tfmchat`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsDate(start)}`,
        `DTEND:${icsDate(finish)}`,
        `SUMMARY:${icsEscape('📝 ' + a.title)}`,
        `DESCRIPTION:${icsEscape(a.details || '')}`,
        'END:VEVENT',
      ].join('\r\n');
    });
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TFM Chat//AR', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n');

    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `tfm-${currentRoom()}-assignments.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  if (icsBtn) icsBtn.onclick = exportIcs;

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