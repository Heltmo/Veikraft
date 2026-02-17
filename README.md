# Veikraft website

Static site deployed on Vercel with modal forms in `index.html`.
All modal forms are submitted from `script.js` to FormSubmit (email delivery).

## Form email setup (active)

Configured in:
- `script.js` -> `FORM_EMAIL`

Current flow:
- Frontend sends AJAX POST to `https://formsubmit.co/ajax/<FORM_EMAIL>` for:
  - `bedriftForm`
  - `courierForm`
  - `driverForm`
- `api/submit.js` exists as an optional/legacy endpoint, but is not called by the current frontend.

Notes:
- FormSubmit must be activated for the recipient email first
- Content Security Policy allows `https://formsubmit.co` for both `connect-src` and `form-action` in `vercel.json`
