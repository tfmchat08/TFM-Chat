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
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '')) ? String(u) : '');
  const MAX_FILE = 10 * 1024 * 1024; // 10MB زي باقي المنصة
  const MAX_IMAGES = 10;

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('ar-EG'); } catch (e) { return ''; }
  }

  // أسماء الشاتات بتتقرا من جدول chats كل مرة، فأي اسم يتغيّر بيظهر لوحده
  const currentSlot = () => Number(localStorage.getItem('chatSlot')) || 1;
  let chatNames = [];   // [{ slot, name }]
  async function loadChatNames() {
    const { data, error } = await sb.from('chats').select('slot, name').eq('room', currentRoom()).order('slot', { ascending: true });
    chatNames = (!error && data && data.length)
      ? data.map((r) => ({ slot: Number(r.slot), name: r.name }))
      : [1, 2, 3, 4, 5].map((n) => ({ slot: n, name: '' }));
  }
  const slotName = (n) => {
    const c = chatNames.find((x) => x.slot === n);
    return c && c.name ? c.name : `شات ${n}`;
  };

  // ===== ملفات المادة =====
  async function load() {
    list.innerHTML = '<p class="empty">...</p>';
    const pickFiles = (cols) => sb.from('room_files')
      .select(cols)
      .eq('room', currentRoom())
      .order('created_at', { ascending: false });
    // لو عمود chat_slot لسه مااتضافش في قاعدة البيانات، نقرا من غيره
    let res = await pickFiles('id, title, file_url, file_name, uploaded_by, created_at, chat_slot');
    if (res.error) res = await pickFiles('id, title, file_url, file_name, uploaded_by, created_at');
    const error = res.error;
    let data = res.data;
    // الطالب بيشوف ملفات شاته هو (والملفات القديمة للشعبة كلها)، والأدمن/المرسل بيشوف الكل
    if (data && !isStaff()) data = data.filter((f) => f.chat_slot == null || f.chat_slot === currentSlot());
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
      meta.textContent = (f.chat_slot ? `${slotName(f.chat_slot)} · ` : '') + fmtDate(f.created_at);

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

  let slotSel = null;   // قايمة اختيار الشات اللي الملف ليه

  async function upload(file) {
    const slot = slotSel ? Number(slotSel.value) : currentSlot();
    const path = `${currentProfile.id}/materials/${currentRoom()}/${Date.now()}_${safeName(file.name)}`;
    const { error: upErr } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type });
    if (upErr) return alert(t('uploadFail') + upErr.message);

    const { data } = sb.storage.from('uploads').getPublicUrl(path);
    const { error: insErr } = await sb.from('room_files').insert({
      room: currentRoom(),
      title: file.name,
      file_url: data.publicUrl,
      file_name: file.name,
      chat_slot: slot,
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

  // رابط وصور وملف الواجب نفسه (اللي حطه الأدمن/المرسل)
  function renderAttachments(a, info) {
    const link = safeUrl(a.link_url);
    const atts = Array.isArray(a.attachments) ? a.attachments : [];
    if (!link && !atts.length) return;

    const box = document.createElement('div');
    box.style.cssText = 'margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;';

    if (link) {
      const l = document.createElement('a');
      l.href = link;
      l.target = '_blank';
      l.rel = 'noopener noreferrer';
      l.textContent = '🔗 رابط الواجب';
      box.appendChild(l);
    }
    atts.forEach((f) => {
      const url = safeUrl(f && f.url);
      if (!url) return;
      const l = document.createElement('a');
      l.href = url;
      l.target = '_blank';
      l.rel = 'noopener noreferrer';
      if (f.type === 'image') {
        const img = document.createElement('img');
        img.src = url;
        img.alt = f.name || '';
        img.style.cssText = 'width:72px;height:72px;object-fit:cover;border-radius:8px;';
        l.appendChild(img);
      } else {
        l.textContent = `📎 ${f.name || 'ملف'}`;
      }
      box.appendChild(l);
    });
    info.appendChild(box);
  }

  async function loadAssign() {
    if (!asList) return;
    const room = currentRoom();
    const pickAssign = (cols) => sb.from('room_assignments')
      .select(cols)
      .eq('room', room)
      .order('due_at', { ascending: true, nullsFirst: false });
    // لو أعمدة الرابط والمرفقات لسه مااتضافتش في قاعدة البيانات، نقرا من غيرهم
    let aRes = await pickAssign('id, title, details, due_at, created_by, link_url, attachments');
    if (aRes.error) aRes = await pickAssign('id, title, details, due_at, created_by');

    const [sRes, gRes] = await Promise.all([
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
      renderAttachments(a, info);
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

  // ===== فورم الواجب: اسم + ميعاد + (رابط أو صور أو ملف) إجباري =====
  let linkIn = null;
  let imgIn = null;
  let fileIn = null;

  if (asForm) {
    const dueEl = document.getElementById('assign-due');
    if (dueEl) dueEl.required = true;

    const mkHint = (text) => {
      const s = document.createElement('small');
      s.className = 'hint';
      s.style.cssText = 'display:block;margin-top:6px;';
      s.textContent = text;
      return s;
    };
    linkIn = document.createElement('input');
    linkIn.type = 'url';
    linkIn.id = 'assign-link';
    linkIn.dir = 'ltr';
    linkIn.placeholder = '🔗 رابط الواجب';
    imgIn = document.createElement('input');
    imgIn.type = 'file';
    imgIn.id = 'assign-images';
    imgIn.accept = 'image/*';
    imgIn.multiple = true;
    fileIn = document.createElement('input');
    fileIn.type = 'file';
    fileIn.id = 'assign-file';

    const submitEl = asForm.querySelector('button[type="submit"]');
    [
      mkHint('ميعاد التسليم إجباري. ولازم تحط واحد على الأقل من التلاتة دول: رابط، أو صور، أو ملف.'),
      linkIn,
      mkHint('🖼️ صور الواجب (تقدر تختار أكتر من صورة)'),
      imgIn,
      mkHint('📎 ملف الواجب'),
      fileIn,
    ].forEach((n) => asForm.insertBefore(n, submitEl));

    asForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('assign-title').value.trim();
      const details = document.getElementById('assign-details').value.trim();
      const dueRaw = dueEl.value;
      const link = linkIn.value.trim();
      const imgs = Array.from(imgIn.files || []);
      const file = fileIn.files && fileIn.files[0];

      if (title.length < 2) return alert('اكتب اسم الواجب');
      if (!dueRaw) return alert('حدد ميعاد تسليم الواجب');
      if (!link && !imgs.length && !file) return alert('لازم تحط رابط الواجب، أو صور، أو ملف');
      if (link && !/^https?:\/\/\S+$/i.test(link)) return alert('الرابط لازم يبدأ بـ http:// أو https://');
      if (imgs.length > MAX_IMAGES) return alert(`الحد الأقصى ${MAX_IMAGES} صور`);
      if ([...imgs, file].some((f) => f && f.size > MAX_FILE)) return alert('كل ملف أو صورة لازم يكون أقل من 10 ميجا');

      const submitBtn = asForm.querySelector('button[type="submit"]');
      const oldText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ جاري الرفع...';
      try {
        const attachments = [];
        const queue = [...imgs.map((f) => ({ f, type: 'image' })), ...(file ? [{ f: file, type: 'file' }] : [])];
        for (let i = 0; i < queue.length; i++) {
          const { f, type } = queue[i];
          const path = `${currentProfile.id}/assign-files/${currentRoom()}/${Date.now()}_${i}_${safeName(f.name)}`;
          const { error: upErr } = await sb.storage.from('uploads').upload(path, f, { contentType: f.type });
          if (upErr) return alert(t('uploadFail') + upErr.message);
          const { data } = sb.storage.from('uploads').getPublicUrl(path);
          attachments.push({ url: data.publicUrl, name: f.name, type });
        }

        const { error } = await sb.from('room_assignments').insert({
          room: currentRoom(),
          title,
          details: details || null,
          due_at: new Date(dueRaw).toISOString(),
          link_url: link || null,
          attachments,
        });
        if (error) return alert(error.message);
        asForm.reset();
        await loadAssign();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = oldText;
      }
    };
  }

  function fillSlotSelect() {
    if (!slotSel) {
      const hint = document.createElement('small');
      hint.className = 'hint';
      hint.style.cssText = 'display:block;margin-bottom:4px;';
      hint.textContent = 'الملف ده لأنهي شات؟';
      slotSel = document.createElement('select');
      slotSel.id = 'materials-chat';
      slotSel.style.cssText = 'width:100%;margin-bottom:8px;';
      uploadBox.insertBefore(slotSel, uploadBox.firstChild);
      uploadBox.insertBefore(hint, slotSel);
    }
    const keep = slotSel.value;
    slotSel.innerHTML = '';
    chatNames.forEach((c) => {
      const o = document.createElement('option');
      o.value = String(c.slot);
      o.textContent = slotName(c.slot);
      slotSel.appendChild(o);
    });
    const want = chatNames.some((c) => String(c.slot) === keep) ? keep : String(currentSlot());
    slotSel.value = chatNames.some((c) => String(c.slot) === want) ? want : String(chatNames[0].slot);
  }

  btn.onclick = async () => {
    panel.classList.remove('hidden');
    uploadBox.classList.toggle('hidden', !canUpload());
    if (asForm) asForm.classList.toggle('hidden', !canUpload());
    await loadChatNames();
    if (canUpload()) fillSlotSelect();
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