const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbyaYQ4My6d0W__Dz1549Ly37fInekChwrRIxYWo5EgVaDprh9ug7GYc72wySNlJugTlvQ/exec';

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

  // Forward to Apps Script
  try {
    const gasRes = await postToAppsScript(payload);
    const text = await gasRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: gasRes.ok, raw: text };
    }

    res.status(gasRes.ok ? 200 : 502).json(data);
  } catch (err) {
    console.error('Apps Script proxy error:', err);
    res.status(502).json({ ok: false, error: 'Failed to reach Apps Script' });
  }
};
