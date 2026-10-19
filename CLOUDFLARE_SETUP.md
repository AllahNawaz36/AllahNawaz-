# Card-free Cloudflare Workers deployment

This adds an optional API for the existing GitHub Pages dashboard. It does not silently deploy itself: you must authorize Cloudflare and create the free D1 database in your own account.

## What this provides
- Cloudflare Worker API for health checks and protected lead CRUD.
- D1 SQL storage instead of ephemeral server filesystem storage.
- CORS restricted to the project's GitHub Pages origin by default.
- Private `ADMIN_TOKEN` secret; no token is placed in browser source.
- The current GitHub Pages dashboard stays live if backend setup is incomplete.

## Free-plan note
Cloudflare documents a Workers Free plan with 100,000 requests/day and D1 allowances. Limits can change; check the current official pricing page before deployment: https://developers.cloudflare.com/workers/platform/pricing/

## Deploy from the Cloudflare dashboard (Android-friendly)
1. Sign up / sign in: https://dash.cloudflare.com/
2. Open **Workers & Pages** and create a D1 database named `naz-business-assistant`.
3. Open that D1 database and run the SQL in `schema.sql` in its Console.
4. Create a Worker named `naz-business-assistant-api`. Use **Connect to Git** if available and select this repository, or paste the contents of `worker.mjs` into the editor.
5. Configure the D1 binding named **DB** to the database you created.
6. In Worker Settings → Variables and Secrets, add:
   - Secret `ADMIN_TOKEN`: use a unique random value of at least 32 characters. Keep it private.
   - Variable `ALLOWED_ORIGIN`: `https://allahnawaz36.github.io`
7. Deploy the Worker and copy its HTTPS URL, for example `https://naz-business-assistant-api.<your-subdomain>.workers.dev`.
8. Open the dashboard → Connections & Settings → API endpoint. Paste the Worker URL (without a trailing slash), save, and run **Check backend**.
9. In Lead CRM, use **Admin login** and enter the same secret token. Create a test lead, refresh, edit its stage, then delete the test record.
10. Confirm `<worker-url>/api/health` returns `ok: true`.

## Security / troubleshooting
- Never commit `ADMIN_TOKEN` or paste it into public files/screenshots.
- If browser requests fail, verify the exact GitHub Pages origin in `ALLOWED_ORIGIN` and check that the Worker was redeployed.
- A 401 means the token is missing/incorrect. A 503 means the D1 binding or schema is missing.
- This API stores leads only. AI provider calls, email sending, LinkedIn/Facebook publishing, scheduling, and Canva/Figma export are separate integrations and are not activated by this API.
- Do not store sensitive customer data until you have a privacy notice, retention/deletion process, and backup plan.
