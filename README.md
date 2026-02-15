# Veikraft website

Static site deployed on Vercel with modal forms in `index.html`.
Forms are submitted directly to FormSubmit (email delivery).

## Form email setup (active)

Configured in:
- `script.js` -> `FORM_EMAIL`

Current flow:
- Frontend sends AJAX POST to `https://formsubmit.co/ajax/<FORM_EMAIL>`
- No backend/API is required for form delivery

Notes:
- FormSubmit must be activated for the recipient email first
- Content Security Policy allows `https://formsubmit.co` in `vercel.json`
