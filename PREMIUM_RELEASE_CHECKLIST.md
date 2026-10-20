# Premium release checklist

Last repository verification: 2026-10-20  
Latest CI: [Project checks — PASS](https://github.com/AllahNawaz36/AllahNawaz-/actions/runs/39411437219)  
Latest verified commit: `62feecdec12ac1d098b8c9d49b2c28f862490b8b`

## Repository checks — passed

- [x] GitHub repository accessible; default branch `main`.
- [x] GitHub Actions checks pass for Node syntax, JS tests, inline JavaScript/duplicate HTML IDs, Python compilation/tests, and CLI dry-run smoke test.
- [x] Worker health/readiness states have automated tests.
- [x] Structured AI output has validation tests for exact keys, summary size, list counts and item sizes.
- [x] Existing GitHub Pages dashboard and local-browser fallback retained.
- [x] Research Studio supports manual source capture, filtering, comparisons and local Markdown/JSON export.
- [x] Dashboard can request and safely render validated structured AI output when the backend is configured.

## Live Cloudflare release gate — blocked until verified in the owner's account

- [ ] Locate the correct existing Worker in Cloudflare; confirm name and latest deployment/build.
- [ ] Copy the actual `workers.dev` HTTPS URL and set it in **Connections & Settings → API endpoint**.
- [ ] `GET <worker-url>/api/health` returns `ok: true`, `status: "ready"`, `chatReady: true`, `ai: "configured"`, and `chatProtection: "configured"`.
- [ ] Set a unique `ADMIN_TOKEN` secret (32+ characters); never commit or share it.
- [ ] If persistent CRM is required: create a real D1 database, bind it as `DB`, apply `schema.sql`, redeploy, and verify `storage: "d1"`.
- [ ] From an Android browser, test a harmless real AI chat request.
- [ ] With synthetic data only, test authenticated lead create/list/update/delete; confirm missing/wrong token is rejected; delete the test lead.
- [ ] Inspect recent Worker logs for runtime errors and ensure no credentials appear in logs/source.
- [ ] Verify backup/restore and customer-data retention/deletion process before real customer data.

## Social and third-party integrations — not claimed as complete

- [ ] Verify the correct Metricool brand/account. The previously returned brand `ANJAN MALIK JAN` was confirmed not to be the user's; do not schedule to it.
- [ ] Direct LinkedIn/Facebook scheduling is not verified. Only claim scheduling after a correct authorized account returns success and the Planner entry is confirmed.
- [ ] WhatsApp workflow only prepares a draft and opens WhatsApp; the user must press Send. No background/API sending is claimed.
- [ ] Canva/Figma workspace connections do not prove website-level editing/export permissions.
- [ ] Email sending, ad-spend changes, automatic customer replies and unattended publishing remain unverified/unavailable until separately authorized and end-to-end tested.

## Release decision

**Current status: DEVELOPMENT/DEMO READY; NOT YET PRODUCTION-READY.** Passing CI proves code checks pass. It does not prove that the Cloudflare backend is deployed, that secrets/bindings are configured, or that external publishing works. Do not label the whole system 100% finalized until the live release gate above is completed.
