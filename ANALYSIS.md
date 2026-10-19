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

### Medium

1. **CDN integrity protection remains incomplete** — `index.html:21`. Lucide is pinned to version `0.468.0`, preventing floating `@latest` behavior, but Subresource Integrity (SRI) is not present. Before calling this fully hardened, add a verified integrity hash or vendor a reviewed local copy. Do not guess an SRI hash.
2. **Browser-stored admin token increases XSS impact** — `index.html:649-650`. The token is not embedded in source and is tab-scoped, but JavaScript running in the page can read it. Keep the page's scripts/dependencies tightly controlled; a stronger authenticated session is preferable if this becomes a multi-user service.
3. **Public chat abuse controls require deployment testing** — `worker.mjs:115-125`, `wrangler.toml:20-27`. The Worker fails closed without `CHAT_LIMITER`, and the configured IP limit is 10 requests/60 seconds. Shared mobile/carrier IPs can affect multiple users; this is not a complete anti-abuse system.
4. **Node API is for trusted/self-hosted use** — `server.js:8-18, 112-173`. It requires a 32+ character admin token and checks protected lead routes, but no explicit CORS/rate-limit middleware is apparent. Do not expose it publicly without additional hardening.
5. **Dependency reproducibility needs work** — `requirements.txt:1-3`. Python packages use lower bounds rather than a lockfile/exact pins. Adopt a tested, reviewed lock/pin strategy; do not pin to unverified or outdated versions merely to create exact numbers.
6. **External font requests remain** — `index.html:22-23`, `portfolio.html` head. Google Fonts add third-party requests and can slow rendering on mobile networks. Test fallback fonts and consider self-hosting if offline/third-party-minimal behavior is required.
7. **AI service must not be implied by local fallbacks** — `index.html:546, 747`, `worker.mjs:124-175`. The support reply UI now uses honest draft wording and a local fallback; live AI requires the configured backend. Do not paste private customer messages into the demo or use it as an automated response sender.
8. **Health checks need real runtime evidence** — `index.html:639-644`, `worker.mjs:101-108`. The dashboard can show local-only or unavailable states. A configured URL or visible binding label is not proof of database persistence or provider connectivity.

### Low

1. **Social scheduling remains a manual handoff** — `index.html:255-304, 410-420`. The UI creates drafts, copies text, and opens Metricool. The checklist is local state only and does not prove scheduling.
2. **Accessibility needs device-level validation** — `index.html:571-609`, `portfolio.html:203-225, 285-316`. Focus styles, labels, ARIA, reduced-motion and keyboard Escape behavior exist. Verify keyboard/focus order, screen-reader announcements and Android touch targets in a real browser.
3. **SEO/social metadata needs live validation** — `index.html:4-16`, `portfolio.html:4-20`. Canonical and Open Graph metadata exist. Confirm the published canonical URLs and social preview after deployment.
4. **Python tests are smoke tests** — `tests/test_workflow_smoke.py:1-32`. They cover dry-run and empty approval safety, not a live provider integration. Do not infer successful scheduling from these tests.

## Implemented in this branch

- Added a 12-second timeout to shared dashboard API requests and a user-facing timeout message, avoiding indefinite pending states.
- Renamed the support tool to **Customer-support reply draft** and removed raw backend error text from its local fallback.
- Updated regression tests to match the current account-verification warning and cover request timeout / honest draft wording.
- Changed Worker lead create/update handlers to return generic 500 messages for unexpected database failures while preserving expected 4xx validation messages.
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

The repository defines `npm run check`, `npm test`, Python compilation, `python -m unittest discover -s tests -v`, and a dry-run smoke command in `.github/workflows/ci.yml`. This document does not claim those commands passed for this branch until the pull-request CI run completes. A passing test suite still does not verify live Cloudflare bindings or a third-party social account.

## Remaining risks

- SRI/local vendoring for the Lucide CDN is not complete.
- Python dependency lock/pin strategy is not complete.
- Deployed Cloudflare Worker, D1 schema, rate limiting and health endpoint are not verified from this repository session.
- Correct social account identity is still a manual prerequisite; no scheduling or publishing action was taken.
- Privacy notice, retention/deletion, backup/restore and production incident monitoring are still required before real customer data.
