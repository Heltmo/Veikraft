# ROD Logistics — Static Landing (starter)

Minimal static landing page for capturing leads for courier capacity. Replace placeholders before public launch.

Files added:
- index.html — main landing page
- styles.css — layout and responsive styles
- script.js — form validation and POST to webhook
- privacy.html, terms.html, couriers.html — simple pages

Key placeholders to replace in `script.js` and `index.html`:
- `WEBHOOK_URL` in `script.js` — set to your n8n / Zapier / webhook.site URL
- `[BrandName]`, `[City]`, `[SLA_Minutes]`, `[Phone]`, `[Email]`, `[CalendlyLink]` in `index.html`

How to test locally:

1. Open `index.html` in a browser (double-click or serve with a static server).
2. Replace `WEBHOOK_URL` with a test webhook (e.g. https://webhook.site) to inspect incoming POSTs.
3. Submit the form and verify JSON payload includes `timestamp` and `page`.

Example: use `npx http-server` or Python simple server:

```bash
# Python 3
python -m http.server 8000

# then open http://localhost:8000/index.html
```

Next recommended steps:
- Configure real webhook (n8n / Zapier) to create leads and send notifications.
- Add server-side rate-limiting and webhook secret verification if needed.
- Integrate Calendly or booking link for the Book 10 min CTA.
