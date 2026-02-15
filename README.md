# Veikraft website

Static site deployed on Vercel with modal forms in `index.html`.
Frontend submits to `POST /api/submit`, and that endpoint forwards payload to a Google Apps Script Web App that writes to Google Sheets.

## Required: Google Sheets via Apps Script

1. Create a Google Sheet with these tabs:
- `Staffingrequests`
- `TransportCompanies`
- `Drivers`

2. Deploy your Google Apps Script as Web App:
- Execute as: `Me`
- Who has access: `Anyone` (or `Anyone with link`)

3. Copy the Apps Script `/exec` URL and set it in:
- `api/submit.js` -> `WEB_APP_URL`

4. Confirm form tab names in `index.html`:
- `bedriftForm` -> `Staffingrequests`
- `courierForm` -> `TransportCompanies`
- `driverForm` -> `Drivers`

## Optional: email notifications via Resend

If configured, every successful submission also sends email notification.

Set these Vercel environment variables:
- `RESEND_API_KEY`
- `NOTIFY_EMAIL_FROM` (example: `Veikraft <onboarding@resend.dev>`)
- `NOTIFY_EMAIL_TO` (comma-separated recipients)

If these vars are missing, submissions still go to Google Sheets only.

## CORS / allowed origins

Allowed origins are configured in `api/submit.js` (`ALLOWED_ORIGINS`), plus:
- Vercel preview URLs matching `https://veikraft*.vercel.app`
- localhost for local development
