import { admin, purgeUser } from '../_shared/purge.ts';
import nodemailer from 'npm:nodemailer@6.9.14';

const DAY = 24 * 60 * 60 * 1000;
const WARN_AFTER_DAYS = 7;          // بعد 7 أيام من آخر دخول: نبعت تحذير بإيميل
const DELETE_AFTER_DAYS = 10;       // بعد 10 أيام من آخر دخول: نمسح الحساب
const GRACE_AFTER_WARNING_DAYS = 3; // لازم يعدي 3 أيام على التحذير قبل الحذف
const SITE_URL = 'https://tfmchat08.github.io/TFM-Chat/';

const SMTP_USER = Deno.env.get('SMTP_USER') ?? '';
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: Deno.env.get('SMTP_PASS') ?? '' },
});

function warningHtml(): string {
  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
      <h2>TFM Chat</h2>
      <p>أهلاً،</p>
      <p>لاحظنا إنك ما دخلتش على المنصة من أكتر من ${WARN_AFTER_DAYS} أيام.</p>
      <p><b>لو ما دخلتش خلال ${GRACE_AFTER_WARNING_DAYS} أيام، حسابك وكل رسايلك هيتمسحوا نهائياً.</b></p>
      <p>عشان تفضل حسابك، ادخل على الموقع من الرابط ده:<br>
        <a href="${SITE_URL}">${SITE_URL}</a></p>
      <p>ولو الحساب اتمسح، تقدر تسجل من أول وجديد بنفس الإيميل.</p>
    </div>`;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('forbidden', { status: 403 });
  }

  const now = Date.now();

  // 1) نجمع كل الحسابات
  const users: { id: string; email?: string; last: number }[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    for (const u of data.users) {
      users.push({
        id: u.id,
        email: u.email ?? undefined,
        last: new Date(u.last_sign_in_at || u.created_at).getTime(),
      });
    }
    if (data.users.length < 200) break;
    page++;
  }

  // 2) التحذيرات اللي اتبعتت قبل كده
  const { data: warnRows } = await admin.from('inactivity_warnings').select('user_id, warned_at');
  const warned = new Map<string, number>(
    (warnRows ?? []).map((r) => [r.user_id as string, new Date(r.warned_at).getTime()]),
  );

  let warnedNow = 0;
  let deleted = 0;
  let skippedAdmin = 0;
  let failed = 0;

  for (const u of users) {
    const idle = (now - u.last) / DAY;

    // الطالب رجع ودخل: نشيل التحذير عشان العداد يبدأ من جديد
    if (idle < WARN_AFTER_DAYS) {
      if (warned.has(u.id)) {
        await admin.from('inactivity_warnings').delete().eq('user_id', u.id);
        warned.delete(u.id);
      }
      continue;
    }

    // الأدمن ما يتمسحش ولا يتبعتله تحذير
    const { data: profile } = await admin.from('profiles').select('role').eq('id', u.id).maybeSingle();
    if (profile?.role === 'admin') {
      skippedAdmin++;
      continue;
    }

    const warnedAt = warned.get(u.id);

    // 3) الحذف: بس لو اتبعتله تحذير من 3 أيام على الأقل
    if (idle >= DELETE_AFTER_DAYS && warnedAt && (now - warnedAt) / DAY >= GRACE_AFTER_WARNING_DAYS) {
      try {
        await purgeUser(u.id);
        deleted++;
      } catch (e) {
        console.error('purge failed', u.id, e);
        failed++;
      }
      continue;
    }

    // 4) التحذير: مرة واحدة بس، ولو فيه إيميل
    if (!warnedAt && u.email) {
      try {
        await transporter.sendMail({
          from: `TFM Chat <${SMTP_USER}>`,
          to: u.email,
          subject: `حسابك في TFM Chat هيتمسح بعد ${GRACE_AFTER_WARNING_DAYS} أيام`,
          html: warningHtml(),
        });
        await admin.from('inactivity_warnings').upsert({
          user_id: u.id,
          warned_at: new Date(now).toISOString(),
        });
        warned.set(u.id, now);
        warnedNow++;
      } catch (e) {
        console.error('warning mail failed', u.id, e);
        failed++;
      }
    }
  }

  return new Response(
    JSON.stringify({ checked: users.length, warnedNow, deleted, skippedAdmin, failed }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});