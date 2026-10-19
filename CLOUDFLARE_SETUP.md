# Card-free Cloudflare Workers deployment

This adds an optional API for the existing GitHub Pages dashboard. It does not silently deploy itself: you must authorize Cloudflare and create the free D1 database in your own account.

## What this provides
- Cloudflare Worker API for health checks, protected lead CRUD, and Workers AI chat with topic-aware answers for UI/UX, websites, SaaS, e-commerce, branding, SEO, automation, Figma/Canva, LinkedIn/Facebook, and hiring enquiries.
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
6. In Worker Settings → Bindings, add a Workers AI binding named `AI` if your account offers Workers AI. The chat endpoint uses `@cf/meta/llama-3.1-8b-instruct`; verify current model availability and account limits in Cloudflare's dashboard.
7. In Worker Settings → Variables and Secrets, add:
   - Secret `ADMIN_TOKEN`: use a unique random value of at least 32 characters. Keep it private.
   - Variable `ALLOWED_ORIGIN`: `https://allahnawaz36.github.io`
8. Deploy the Worker and copy its HTTPS URL, for example `https://naz-business-assistant-api.<your-subdomain>.workers.dev`.
9. For live portfolio chat, set `window.NAZ_CHAT_API_URL` before the chat script runs to your Worker URL plus `/api/chat` (for example `https://your-worker.workers.dev/api/chat`), or replace the `CHAT_API_URL` fallback in `portfolio.html` with that URL. Then commit and wait for GitHub Pages deployment. This endpoint is public, rate-limited only by your provider/account limits, and must never contain an admin token. The visitor’s selected topic is sent as `platform` so the AI can tailor the answer.
10. Open the dashboard → Connections & Settings → API endpoint. Paste the Worker URL (without a trailing slash), save, and run **Check backend**.
11. In Lead CRM, use **Admin login** and enter the same secret token. Create a test lead, refresh, edit its stage, then delete the test record.
12. Confirm `<worker-url>/api/health` returns `ok: true` and reports AI as configured. Send a test request to `/api/chat` from the portfolio after deployment.

## Security / troubleshooting
- Never commit `ADMIN_TOKEN` or paste it into public files/screenshots.
- If browser requests fail, verify the exact GitHub Pages origin in `ALLOWED_ORIGIN` and check that the Worker was redeployed.
- A 401 means the token is missing/incorrect. A 503 means the D1 binding or schema is missing.
- Workers AI chat is optional and works only after the `AI` binding is configured and `CHAT_API_URL` is set in `portfolio.html`. Without this, the portfolio uses clearly labelled demo replies.
- Topic-aware AI chat answers client questions and can prepare plans/drafts; it does not itself send email, publish/schedule LinkedIn or Facebook posts, change ads, or edit Canva/Figma files. Those actions require separate integrations and permissions. The UI shows demo guidance until the Worker URL is configured and the AI binding is verified.
- Do not store sensitive customer data until you have a privacy notice, retention/deletion process, and backup plan.
