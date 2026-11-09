# Wyson & Brendah: wedding invitation

Repo layout: `public/` (the website), `functions/api/messages.js` (message API), `schema.sql`, `wrangler.toml`.

## One-time setup (all in the Cloudflare dashboard)
1. **Storage & Databases → D1 → Create database** named `wedding-messages`. Copy its **Database ID**.
2. Open the database → **Console**, paste the contents of `schema.sql`, and run it.
3. Paste the Database ID into `wrangler.toml` (replace `PASTE-YOUR-D1-DATABASE-ID-HERE`), commit and push to GitHub.
4. **Workers & Pages → Create → Pages → Connect to Git**, pick this repo. Framework preset: *None*. Build command: *(leave empty)*. Build output directory: `public`. Deploy.
5. Optional moderation key: Pages project → **Settings → Variables and Secrets → Add** `ADMIN_KEY` (type: Secret), then redeploy.

## After you know the live address
In `public/index.html` replace `https://YOUR-DOMAIN/img/og.jpg` with your real address (e.g. `https://wysonandbrendah.pages.dev/img/og.jpg`) so WhatsApp and Facebook show the photo preview.

## Handy
- Chichewa link to share: `https://YOUR-SITE/?lang=ny`
- Delete a message: `curl -X DELETE "https://YOUR-SITE/api/messages?id=12" -H "x-admin-key: YOUR_KEY"`
- Local test: `npx wrangler d1 execute wedding-messages --local --file=schema.sql && npx wrangler pages dev`
