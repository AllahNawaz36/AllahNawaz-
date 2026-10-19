# Card-free Cloudflare Workers deployment

This adds an optional API for the existing GitHub Pages dashboard. You must authorize Cloudflare in your own account. Do not choose a paid plan.

## What this provides
- Cloudflare Worker API for health checks, protected lead CRUD, and Workers AI chat.
- D1 SQL storage for leads once the real database binding is configured.
- CORS restricted to the project's GitHub Pages origin by default.
- Private `ADMIN_TOKEN` secret; no token is placed in browser source.
- The current GitHub Pages dashboard stays live if backend setup is incomplete.

## Deploy from the Cloudflare dashboard (Android-friendly)
1. Sign in at https://dash.cloudflare.com/.
2. Open Workers & Pages and create/connect a Worker using this repository.
3. The Worker name in Cloudflare must match `naz-business-assistant-api` in `wrangler.toml`. If the build reports a name mismatch, rename the Worker to that exact name or update the config name to match the Worker.
4. Deploy the Worker. The D1 block is intentionally commented out in `wrangler.toml` so a fake database ID cannot break the first deployment.
5. Confirm the `CHAT_LIMITER` rate-limit binding from `wrangler.toml` is present. It limits chat to 10 requests per client IP per 60 seconds as a basic abuse guard; shared mobile/carrier IPs can affect multiple visitors. The Worker deliberately returns 503 for chat if this binding is missing. Configure Workers AI binding named `AI` if the dashboard does not pick it up from `wrangler.toml`. The chat endpoint uses `@cf/zai-org/glm-4.7-flash`, which Cloudflare listed as available on the Workers Free plan in its July 28, 2026 model-access update. Workers AI free usage is limited to 10,000 Neurons/day; when the daily allowance is exhausted, requests may fail until the daily reset. Do not upgrade or add billing to keep this project free. Check the current model and usage shown in your own Cloudflare dashboard before enabling public chat. (Official references: https://developers.cloudflare.com/changelog/post/2026-07-28-models-require-workers-paid/ and https://developers.cloudflare.com/workers-ai/platform/pricing/.)
6. In Worker Settings → Variables and Secrets, add secret `ADMIN_TOKEN` using a unique random value of at least 32 characters. Keep it private. The `ALLOWED_ORIGIN` variable is already defined in `wrangler.toml`.
7. To enable Lead CRM storage, create a D1 database named `naz-business-assistant`, copy its real database ID, uncomment the D1 block in `wrangler.toml`, replace the placeholder with the actual ID, and commit the change. Never deploy with a fake ID. Then run the SQL in `schema.sql` in the D1 Console and deploy again.
8. Copy the deployed Worker HTTPS URL, for example `https://naz-business-assistant-api.<your-subdomain>.workers.dev`.
9. Open the GitHub Pages dashboard → Connections & Settings. Save the Worker URL in API endpoint (without a trailing slash) and press Check backend.
10. Confirm `<worker-url>/api/health` returns `ok: true`. Its `ai` field should say `configured` when Workers AI is bound. The `storage` field will say `not-configured` until D1 is configured.
11. For Lead CRM, use Admin login and enter the same `ADMIN_TOKEN` secret. Test with a sample lead only after the database and schema are configured.

## Security / troubleshooting
- Never commit `ADMIN_TOKEN` or paste it into public files/screenshots.
- A Cloudflare Workers Builds failure can also occur if the Worker name in the dashboard does not match the `name` in `wrangler.toml`; check View Build History for the exact error.
- If browser requests fail, verify `ALLOWED_ORIGIN` equals `https://allahnawaz36.github.io` and redeploy.
- A 401 means the admin token is missing/incorrect. A 503 on lead endpoints means D1 or its schema is missing.
- Workers AI chat works only after both `AI` and `CHAT_LIMITER` bindings are configured and the Worker URL is saved in dashboard settings. The API returns a generic error if upstream inference fails and does not expose provider error details. Without these, the API intentionally returns an unavailable error rather than pretending the chat is protected or live. The portfolio may use clearly labelled demo replies.
- This chat can prepare plans and drafts; it does not itself send email, publish/schedule LinkedIn or Facebook posts, change ads, or edit Canva/Figma files. Those actions require separate integrations and permissions.
- Do not store sensitive customer data until you have a privacy notice, retention/deletion process, and backup plan.
