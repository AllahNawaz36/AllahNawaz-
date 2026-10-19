# Repository Analysis — Naz Business Assistant Pro

**Review date:** 2026-10-19  
**Review branch:** `audit/free-social-workflow-2026-10-19`  
**Scope:** `index.html`, `portfolio.html`, `server.js`, `worker.mjs`, Python workflow, tests, CI and setup/security documentation.

## Executive summary

This repository is a useful demo/starter with honest feature limits, a local-first dashboard, an optional Node API, an optional Cloudflare Worker + D1 API, and a Python workflow that defaults to dry-run. It is **not yet a production social-publishing service**. The website can prepare drafts and hand off to a scheduling tool; the website itself does not confirm a post was scheduled or published.

The free-first path remains **draft → human review → copy caption/media → schedule manually in the verified provider account → verify the planner entry**. Direct Metricool API scheduling is not enabled. The recorded ChatGPT Metricool connection returned a brand that was not verified as the user's, so no provider action is permitted until the user independently confirms the correct brand/profile.

## Findings by severity

### High

1. **Customer-data lifecycle is incomplete** — `index.html:566-567`, `schema.sql:1-15`, `SECURITY_STATUS.md`. A full privacy notice, retention/deletion process and tested backup/restore plan are not established. Do not enter real customer data until these controls exist and the deployed API/authentication have been verified.
2. **Provider account is unverified** — `index.html:283-304`, `METRICOOL_SETUP.md:5-15`. The UI correctly pauses publishing and documents that the returned Metricool brand is not verified as the user's. Do not schedule or publish through that connection. Manual scheduling is allowed only after the user checks their own account/brand and explicitly approves the post.
3. **Live Worker is not proven by repository code** — `worker.mjs:101-108, 115-125`, `CLOUDFLARE_SETUP.md`, `SECURITY_STATUS.md`. A health handler and binding checks exist, but they do not establish that production bindings, auth, database schema, rate limiting, and recovery are correctly configured. Test the deployed `/api/health`, wrong-token rejection, synthetic lead CRUD, and restore path before real data.
4. **AI model compatibility needed refresh** — the previous `@cf/meta/llama-3.1-8b-instruct` model was deprecated by Cloudflare on May 30, 2026. The branch now uses `@cf/zai-org/glm-4.7-flash`, which Cloudflare listed as available on the Workers Free plan in its July 28, 2026 update. Availability, model output, account limits and daily free quota still need a live account test.

### Medium

1. **Third-party runtime assets removed** — `index.html`, `portfolio.html`. The dashboard no longer loads Lucide from a CDN, and both static pages use system fonts instead of Google Fonts. This removes these external runtime requests; it is not a full CSP review.
2. **Admin token remains exposed to active page JavaScript** — `index.html` admin login handlers. The token is now kept in memory only and is cleared on refresh; this reduces persistence but same-origin script can still read it while the page is open. A stronger authenticated session is preferable for multi-user service.
3. **Public chat abuse controls require deployment testing** — `worker.mjs:115-125`, `wrangler.toml:20-27`. The Worker fails closed without `CHAT_LIMITER`, and the configured IP limit is 10 requests/60 seconds. Shared mobile/carrier IPs can affect multiple users; this is not a complete anti-abuse system.
4. **Node API basic CORS/rate limiting added, not production-grade** — `server.js:13-56, 142-160`. Cross-origin browser requests are limited to `ALLOWED_ORIGIN` (defaults to the GitHub Pages origin) and in-memory per-IP request limits now apply. Limits reset on restart and do not coordinate across instances; a reverse proxy/WAF and deployment-specific review are still needed before public exposure.
5. **Dependency reproducibility needs work** — `requirements.txt:1-3`. Direct Python dependencies are now exact-pinned to `anthropic==1.13.0`, `PyYAML==6.0.3`, and `requests==2.34.2`. Transitive dependencies are still resolved by pip and are not locked with hashes.
6. **Font rendering needs device-level review** — `index.html`, `portfolio.html`. System fonts avoid external font requests; verify visual hierarchy and wrapping on target Android browsers.
7. **AI service must not be implied by local fallbacks** — `index.html:546, 747`, `worker.mjs:124-175`. The support reply UI now uses honest draft wording and a local fallback; live AI requires the configured backend. Do not paste private customer messages into the demo or use it as an automated response sender.
8. **Health checks need real runtime evidence** — `index.html:639-644`, `worker.mjs:101-108`. The dashboard can show local-only or unavailable states. A configured URL or visible binding label is not proof of database persistence or provider connectivity.

### Low

1. **Social scheduling remains a manual handoff** — `index.html:255-304, 410-420`. The UI creates drafts, copies text, and opens Metricool. The checklist is local state only and does not prove scheduling.
2. **Accessibility needs device-level validation** — `index.html:571-609`, `portfolio.html:203-225, 285-316`. Focus styles, labels, ARIA, reduced-motion and keyboard Escape behavior exist. Verify keyboard/focus order, screen-reader announcements and Android touch targets in a real browser.
3. **SEO/social metadata needs live validation** — `index.html:4-16`, `portfolio.html:4-20`. Canonical and Open Graph metadata exist. Confirm the published canonical URLs and social preview after deployment. A user-facing `privacy.html` notice now explains local/server storage limits and the no-real-customer-data rule.
4. **Python tests are smoke tests** — `tests/test_workflow_smoke.py:1-32`. They cover dry-run and empty approval safety, not a live provider integration. Do not infer successful scheduling from these tests.

## Implemented in this branch

- Added a 12-second timeout to shared dashboard API requests and a user-facing timeout message, avoiding indefinite pending states.
- Removed the external Lucide CDN script and Google Fonts requests; the dashboard uses built-in icon fallbacks and system fonts, avoiding the unverified-SRI dependency.
- Added a user-facing `privacy.html` notice and linked it from Settings; it explicitly warns against real customer data because automated retention/deletion is not implemented.
- Pinned direct Python dependencies to exact release versions.
- Changed the dashboard admin token from `sessionStorage` persistence to in-memory-only handling; refresh clears it.
- Added Node API CORS allowlisting and per-IP in-memory rate limits; added tests for disallowed origins, allowed preflight and repeated-request limiting.
- Renamed the support tool to **Customer-support reply draft** and removed raw backend error text from its local fallback.
- Updated regression tests to match the current account-verification warning and cover request timeout / honest draft wording.
- Changed Worker lead create/update handlers to return generic 500 messages for unexpected database failures while preserving expected 4xx validation messages.
- Replaced Cloudflare's deprecated `@cf/meta/llama-3.1-8b-instruct` model with `@cf/zai-org/glm-4.7-flash`, updated the model assertion, and refreshed the card-free setup guide. Current Cloudflare docs show GLM-4.7-Flash remains available on Workers Free, subject to the shared 10,000-Neuron daily allowance.
- Added a Worker regression test to ensure internal database error strings are not returned to API clients.
- Updated this analysis and the security status.

## Free social workflow

1. Draft the caption and visual brief in the dashboard.
2. Review the facts, voice, hashtags, links, and image/video yourself.
3. Confirm that the signed-in Metricool/Typefully account and selected brand/profile are yours.
4. If the free plan supports the desired scheduling action, copy the caption and schedule manually in the provider. Otherwise use the social platform's own composer and schedule options where available.
5. Do not schedule/publish until you explicitly approve the final copy, media, destination and time.
6. Verify the scheduled item in the provider planner; later verify the actual post on the social network.

**No API token is needed for manual copy-and-schedule.** Do not add a direct Metricool API implementation unless your own account/plan explicitly permits it. No paid upgrade is proposed.

## CI and verification status

The latest observed GitHub Actions run on commit `c51b64c5e1bd421956291b0a500ff733ebdc9920` passed, including the in-memory admin-token change, Node CORS allowlist, API-only per-IP rate limiting, and regression tests. Later documentation updates should trigger CI again before merge. A passing test suite still does not verify live Cloudflare bindings or a third-party social account.

## Remaining risks

- Python direct dependencies are pinned, but a fully reproducible transitive lockfile with hashes is not complete.
- The privacy notice is informational; automated retention/deletion and tested backup/restore are still not implemented.
- Deployed Cloudflare Worker, D1 schema, rate limiting and health endpoint are not verified from this repository session.
- Node API rate limits are process-local and not a replacement for edge/WAF controls; confirm the correct `ALLOWED_ORIGIN` for the actual deployment.
- Correct social account identity is still a manual prerequisite; no scheduling or publishing action was taken.
- Privacy notice, retention/deletion, backup/restore and production incident monitoring are still required before real customer data.
