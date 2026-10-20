# Card-free Cloudflare Workers deployment

This adds an optional API for the existing GitHub Pages dashboard. You must authorize Cloudflare in your own account. Do not choose a paid plan.

## What this provides
- Cloudflare Worker API for health checks, protected lead CRUD, and Workers AI chat.
- D1 SQL storage for leads once the real database binding is configured.
- CORS restricted to the project's GitHub Pages origin by default.
- Private `ADMIN_TOKEN` secret; no token is placed in browser source.
- The current GitHub Pages dashboard stays live if backend setup is incomplete.



## Recovery when `naz-business-assistant-api` is missing (Android)

Do not create a duplicate Worker just because this exact name is absent. Repository configuration names the Worker `naz-business-assistant-api`, while an older deployment note referenced `allahnawaz`; neither name proves which service currently exists in the owner's Cloudflare account.

1. Open the Cloudflare dashboard home first: https://dash.cloudflare.com/
2. Sign in and select the account you used when creating the Worker. Do not use a hard-coded account-specific deep link; it can return **Not Found** when the account or service does not match.
3. Open **Workers & Pages** from the dashboard navigation. If the navigation item itself returns Not Found, reload the dashboard, verify the selected account, and try the dashboard home in a fresh browser tab. Cloudflare's official guide starts from Workers & Pages and then the application list: https://developers.cloudflare.com/workers/get-started/dashboard/
4. Search the list for both `naz-business-assistant-api` and `allahnawaz`. If one exists, open it and inspect **Deployments / Build History** and the newest build logs. If neither exists, stop here rather than creating a duplicate until the correct account is confirmed.
5. The dashboard Worker name must match the `name` in `wrangler.toml` (`naz-business-assistant-api`) for Git-connected deployments. If the existing Worker is actually named differently, review the account and deployment history before changing either name. Official troubleshooting: https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/
6. After a successful deployment, copy the actual assigned `workers.dev` URL and open `<that-url>/api/health`. Continue only if it returns JSON with `ok: true`. Then save the exact base URL (without a trailing slash) in the dashboard's **Connections & Settings** and press **Check backend**.

**What has been verified from repository access:** the Worker source and Wrangler config exist in GitHub. **What has not been verified:** which Worker currently exists in your Cloudflare account, the assigned URL, live health, secret values, or binding state. A Worker marked Enabled is not enough to prove AI chat or database operations are ready. Do not add real customer records until health, AI chat, and protected test lead operations pass.

## Deploy from the Cloudflare dashboard (Android-friendly)
1. Sign in at https://dash.cloudflare.com/.
2. Open Workers & Pages and create/connect a Worker using this repository.
3. The Worker name in Cloudflare must match `naz-business-assistant-api` in `wrangler.toml`. If the build reports a name mismatch, rename the Worker to that exact name or update the config name to match the Worker.
4. Deploy the Worker. The D1 block is intentionally commented out in `wrangler.toml` so a fake database ID cannot break the first deployment.
5. Confirm the `CHAT_LIMITER` rate-limit binding from `wrangler.toml` is present. It limits chat to 10 requests per client IP per 60 seconds as a basic abuse guard; shared mobile/carrier IPs can affect multiple visitors. The Worker deliberately returns 503 for chat if this binding is missing. Configure Workers AI binding named `AI` if the dashboard does not pick it up from `wrangler.toml`. The chat endpoint uses `@cf/meta/llama-3.1-8b-instruct`; verify current model availability and account limits in Cloudflare's dashboard.
6. In Worker Settings → Variables and Secrets, add secret `ADMIN_TOKEN` using a unique random value of at least 32 characters. Keep it private. The `ALLOWED_ORIGIN` variable is already defined in `wrangler.toml`.
7. To enable Lead CRM storage, create a D1 database named `naz-business-assistant`, copy its real database ID, uncomment the D1 block in `wrangler.toml`, replace the placeholder with the actual ID, and commit the change. Never deploy with a fake ID. Then run the SQL in `schema.sql` in the D1 Console and deploy again.
8. Copy the deployed Worker HTTPS URL, for example `https://naz-business-assistant-api.<your-subdomain>.workers.dev`.
9. Open the GitHub Pages dashboard → Connections & Settings. Save the Worker URL in API endpoint (without a trailing slash) and press Check backend.
10. Confirm `<worker-url>/api/health` returns `ok: true`. Check `chatReady: true`, `ai: "configured"`, and `chatProtection: "configured"` before treating AI chat as ready. `status: "degraded"` means the API responds but chat setup is incomplete. The `storage` field will say `not-configured` until D1 is configured; `admin` should say `configured` after adding `ADMIN_TOKEN`.
11. For Lead CRM, use Admin login and enter the same `ADMIN_TOKEN` secret. Test with a sample lead only after the database and schema are configured.

## Security / troubleshooting
- Never commit `ADMIN_TOKEN` or paste it into public files/screenshots.
- A Cloudflare Workers Builds failure can also occur if the Worker name in the dashboard does not match the `name` in `wrangler.toml`; check View Build History for the exact error.
- If browser requests fail, verify `ALLOWED_ORIGIN` equals `https://allahnawaz36.github.io` and redeploy.
- A 401 means the admin token is missing/incorrect. A 503 on lead endpoints means D1 or its schema is missing.
- Workers AI chat works only after both `AI` and `CHAT_LIMITER` bindings are configured and the Worker URL is saved in dashboard settings. Without these, the API intentionally returns an unavailable error rather than pretending the chat is protected or live. The portfolio may use clearly labelled demo replies.
- This chat can prepare plans and drafts; it does not itself send email, publish/schedule LinkedIn or Facebook posts, change ads, or edit Canva/Figma files. Those actions require separate integrations and permissions.
- Do not store sensitive customer data until you have a privacy notice, retention/deletion process, and backup plan.


## Optional Google Gemini free-tier provider

Gemini can be used instead of Workers AI for dashboard chat. Google offers a free tier for selected Gemini API models, but quotas and model access vary by account and can change. Check [official Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) and [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) before relying on it. Requests made on the free tier may be used to improve Google's products; do not send confidential client data unless you have reviewed the applicable terms.

1. Open [Google AI Studio](https://aistudio.google.com/) and create an API key for a project that has Gemini API access.
2. In Cloudflare, open **Workers & Pages → naz-business-assistant-api → Settings → Variables and Secrets**.
3. Add a secret named `GEMINI_API_KEY` and paste the key there. Never put this key in `index.html`, GitHub, a screenshot, or the browser.
4. Optionally add a plain-text variable `GEMINI_MODEL` set to a model available to your account. Default is `gemini-2.5-flash`; if that model is unavailable, choose one listed in your AI Studio/API access.
5. Save and redeploy the Worker. Keep `CHAT_LIMITER` configured; the public chat fails closed without rate limiting.
6. Open the dashboard, save the deployed Worker URL in **Connections & Settings**, and press **Check backend**. Health should show `chatReady: true` and `aiProvider: "gemini"`.
7. Send a harmless test message. If you receive a quota/429 message, wait for the quota reset or review current limits in AI Studio. This dashboard does not automatically switch to paid billing.

If `GEMINI_API_KEY` is absent, the Worker falls back to its existing Workers AI binding. The app does not include a key, and Gemini will not work until you add the secret yourself.
