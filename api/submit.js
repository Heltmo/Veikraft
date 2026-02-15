const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbyaYQ4My6d0W__Dz1549Ly37fInekChwrRIxYWo5EgVaDprh9ug7GYc72wySNlJugTlvQ/exec';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const NOTIFY_EMAIL_FROM = process.env.NOTIFY_EMAIL_FROM || '';
const NOTIFY_EMAIL_TO = (process.env.NOTIFY_EMAIL_TO || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set([
  'https://www.veikraft.com',
  'https://veikraft.com',
]);

const MAX_BODY_BYTES = 8000;
const MAX_REDIRECTS = 3;

function getAllowedOrigin(req) {
  const origin = (req.headers.origin || '').toLowerCase().trim();
  if (ALLOWED_ORIGINS.has(origin)) return origin;

  // Allow Vercel preview deploys
  if (/^https:\/\/veikraft[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;

  // Allow localhost in dev
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin;

  return '';
}

function setCors(req, res) {
  const allowed = getAllowedOrigin(req);
  if (allowed) res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return Boolean(allowed);
}

/**
 * POST to Apps Script, following redirects manually so the body isn't lost.
 */
async function postToAppsScript(payload) {
  let url = WEB_APP_URL;
  const body = JSON.stringify(payload);

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'manual',
    });

    // Follow redirect with the same POST body
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirect without Location header');
      url = location;
      continue;
    }

    return res;
  }

  throw new Error('Too many redirects from Apps Script');
}

function createEmailText(payload) {
  const entries = Object.entries(payload || {})
    .map(([k, v]) => `${k}: ${String(v ?? '')}`)
    .join('\n');

  return `Ny innsending fra veikraft.com\n\n${entries}`;
}

async function sendNotificationEmail(payload) {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL_FROM || NOTIFY_EMAIL_TO.length === 0) return;

  const subject = `Ny innsending (${payload.formType || 'ukjent'})`;
  const text = createEmailText(payload);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFY_EMAIL_FROM,
      to: NOTIFY_EMAIL_TO,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  const trusted = setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  if (!trusted) {
    res.status(403).json({ ok: false, error: 'Forbidden origin' });
    return;
  }

  // Parse body
  let payload;
  try {
    const raw =
      typeof req.body === 'string'
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : JSON.stringify(req.body);

    if (!raw || raw.length > MAX_BODY_BYTES) {
      res.status(400).json({ ok: false, error: 'Payload too large or empty' });
      return;
    }

    payload = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(raw);
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON' });
    return;
  }

  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ ok: false, error: 'Invalid payload' });
    return;
  }

  let sheetOk = false;
  let emailOk = false;
  let sheetData = null;
  let sheetError = '';
  let emailError = '';

  // 1) Try Google Sheets first
  try {
    const gasRes = await postToAppsScript(payload);
    const text = await gasRes.text();

    try {
      sheetData = JSON.parse(text);
    } catch {
      sheetData = { ok: gasRes.ok, raw: text };
    }

    sheetOk = gasRes.ok && sheetData.ok !== false;
    if (!sheetOk) sheetError = 'Google Sheets returned non-ok response';
  } catch (err) {
    sheetError = 'Failed to reach Apps Script';
    console.error('Apps Script proxy error:', err);
  }

  // 2) Try email as additional channel / fallback
  try {
    await sendNotificationEmail(payload);
    emailOk = Boolean(RESEND_API_KEY && NOTIFY_EMAIL_FROM && NOTIFY_EMAIL_TO.length > 0);
  } catch (err) {
    emailError = 'Email notification failed';
    console.error('Email notification error:', err);
  }

  // Success when at least one channel succeeded.
  if (sheetOk || emailOk) {
    res.status(200).json({
      ok: true,
      sheetOk,
      emailOk,
      sheetData,
      warning: !sheetOk ? 'Saved via email fallback only' : undefined,
    });
    return;
  }

  res.status(502).json({
    ok: false,
    error: sheetError || 'Submission failed',
    emailError: emailError || undefined,
  });
};
