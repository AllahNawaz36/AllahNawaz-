# Security Status — Naz Business Assistant Pro

**Last reviewed:** 2026-10-19  
**Review branch:** `audit/free-social-workflow-2026-10-19`

## Current verdict

**Demo/starter only. Not approved for production customer data or unattended outbound actions.** This branch improves error handling and user-facing states, but it does not verify a live Cloudflare deployment or a social-provider account. No post was scheduled or published by this work.

## Controls observed

- The admin token is not hard-coded in `index.html`; the Node API refuses to start if `ADMIN_TOKEN` is shorter than 32 characters. The dashboard now keeps the token in page memory only rather than `sessionStorage`; refresh clears it, but active same-origin JavaScript can still access it.
- Lead CRUD endpoints in the Worker require a Bearer token. Token comparison is length-checked and timing-safe.
- Worker CORS is limited to the configured origin (default: `https://allahnawaz36.github.io`); the deployed `ALLOWED_ORIGIN` must remain restricted to the actual dashboard origin.
- Node API now applies a CORS allowlist (default `https://allahnawaz36.github.io`) and basic per-IP in-memory rate limits (30 lead-route requests/minute; 120 other requests/minute). These limits reset on process restart and do not coordinate between replicas; do not treat them as sufficient standalone production abuse protection.
- Worker request bodies are capped at 1,000,000 bytes while streaming (and rejected early when a larger Content-Length is declared); lead fields are validated. Public chat fails closed when `CHAT_LIMITER` is absent or throws, returning a generic 503 rather than bypassing the limiter. Upstream AI errors are returned as a generic 502 without exposing provider error text or request details.
- Unexpected database errors across Worker lead create, list, lookup, update and delete paths now return generic client-facing messages; detailed database errors are not included in those response bodies.
- Dashboard API calls now time out after 12 seconds rather than remaining pending indefinitely.
- Python workflow defaults to dry-run; workflow stages are planning-only and do not send posts or email.
- Social Publisher remains a draft-and-manual-handoff workflow. Its local checklist is not evidence that a post was scheduled.
- `ADMIN_TOKEN` and provider credentials must remain in Cloudflare Secrets / private deployment configuration, never in browser code, repository files, logs, screenshots, or chat.

## Verification status

- **Repository edits:** committed to feature branch `audit/free-social-workflow-2026-10-19`. Latest UI changes add local SVG icon fallbacks and a downloadable 4:5 LinkedIn UX visual concept in Social Publisher, with direct 1080 × 1350 PNG export plus optional SVG.
- **CI status:** the latest full-suite run on the current PR head, [39285458192](https://github.com/AllahNawaz36/AllahNawaz-/actions/runs/39285458192), completed successfully. It passed `npm run check`, `npm test`, inline JavaScript/HTML checks, Python compilation, Python unit tests, and the dry-run smoke test. This validates repository checks only; it does not prove the Cloudflare Worker, D1 database, AI inference, live website deployment, or Android visual rendering. The workflow cancels superseded PR runs and sets a 15-minute job timeout.te job timeout, but this cannot force GitHub to assign a runner. Do not treat the newest UI tests as passing until a run completes successfully.
- **Workers AI model compatibility:** the old `@cf/meta/llama-3.1-8b-instruct` was deprecated on May 30, 2026. The branch now references `@cf/zai-org/glm-4.7-flash`, which Cloudflare listed as available on Workers Free in its July 28, 2026 update. Live inference is not verified; Workers AI has a shared free daily quota of 10,000 Neurons and may stop responding after that quota is used.
- **Cloudflare build preview:** Cloudflare's PR status reported a failed preview build for commit `f477a07` on 2026-10-19. The config name has now been aligned to the observed `allahnawaz` service and the setup URL example updated. The exact build log was not accessible through repository tools, so the cause is still unconfirmed; inspect Cloudflare Dashboard → Workers & Pages → `allahnawaz` → Builds before claiming deployment success.
- **Live `/api/health`:** not verified in this work session.
- **D1 persistence and schema:** not verified in a deployed Cloudflare account.
- **Wrong-token rejection against deployed Worker:** not verified in production.
- **Social brand/profile ownership:** not verified. The recorded ChatGPT Metricool connection returned a brand that was not confirmed as the user's. Do not use that connection for any outbound action.
- **Free-tier provider eligibility:** not verified against the user's own provider account. Use manual copy-and-schedule unless the signed-in account itself confirms a supported free scheduling option.

## Remaining security risks

1. **Customer privacy and recovery:** a visible `privacy.html` notice is now linked from Settings. It is informational only; a formal reviewed policy, data-minimization controls, enforced retention/deletion, backup/restore test and incident plan are still required before storing real customer data.
2. **Browser token exposure:** the token is now in memory only and is cleared on refresh, reducing persistence. It remains readable by same-origin JavaScript while the page is open; keep scripts trusted and consider a stronger authenticated session for multi-user use.
3. **External runtime assets:** the Lucide CDN and Google Fonts requests were removed from the static pages; built-in icon fallbacks and system fonts are used. Validate visual rendering on target Android browsers.
4. **Dependency pinning:** direct Python packages are exact-pinned; transitive dependency lockfile/hashes remain outstanding.
5. **Public AI rate limiting:** `CHAT_LIMITER` is configured for 10 requests per client IP per 60 seconds. Shared carrier IPs can affect multiple visitors, and this alone is not a complete abuse-prevention solution.
6. **Node API exposure:** basic CORS and per-process rate limits now exist in `server.js`. Set `ALLOWED_ORIGIN` to the exact deployed frontend origin. Limits are not distributed and should be backed by edge/WAF controls before public exposure.
7. **Deployment uncertainty:** configured bindings in `wrangler.toml` are not proof of runtime configuration. Confirm the actual deployed Worker, AI binding, rate-limit binding, D1 binding/schema and HTTPS endpoint.
8. **Social account identity:** no automated scheduling/publishing integration is enabled. Verify your own brand/profile in the provider directly before manually scheduling; do not use the unrelated/unverified connection.

## Mandatory operating rules

- Draft-only by default. Every outbound post/message needs explicit human approval of copy, media, destination and time.
- No automatic publish, auto-send, bulk messaging or ad-spend changes.
- WhatsApp/SMS only for recipients who gave consent; review recipient and text, then send manually.
- Never ask for passwords, OTPs, API tokens or secrets in chat.
- No real customer data until privacy, retention, access control and backup/restore controls are in place.
- Do not claim a feature is live unless the real endpoint/provider confirms it.

## Manual checklist before any production use

- [x] Remove the external icon CDN and Google Fonts requests; add local SVG icon fallback rendering. Visual verification on target Android browsers remains outstanding.
- [ ] Create and test the privacy notice, retention/deletion rules and backup/restore procedure.
- [x] Pin direct Python dependencies to exact versions.
- [ ] Create a reproducible transitive lockfile with hashes after reviewing the resolved dependency tree.
- [ ] Deploy Cloudflare Worker on the free plan; do not approve paid upgrades.
- [ ] Set a random `ADMIN_TOKEN` (32+ characters) as a Cloudflare Secret.
- [ ] Confirm `ALLOWED_ORIGIN` is exactly the GitHub Pages origin.
- [ ] Confirm `CHAT_LIMITER` and Workers AI binding `AI` in the live Worker; smoke-test `@cf/zai-org/glm-4.7-flash` without enabling paid billing.
- [ ] Create D1, apply `schema.sql`, and verify synthetic lead CRUD.
- [ ] Verify `/api/health`; confirm expected fields, then test invalid token and disallowed Origin.
- [ ] Confirm the signed-in social brand/profile is yours and check the plan's free capabilities.
- [ ] Review each post, media, destination and timezone, then schedule manually only after explicit approval.
- [ ] Verify the provider planner entry and actual published post before recording success.

## Mobile UX follow-up (2026-10-20)

- Added responsive layout rules for the account-verification reminder: flexible text column, safe wrapping, readable line height, and accessible-size action buttons on small screens.
- CI passed for commit [880cac4](https://github.com/AllahNawaz36/AllahNawaz-/commit/880cac4c0683d2790013e1fce9bb3e5936a73c6f) in run [39373642729](https://github.com/AllahNawaz36/AllahNawaz-/actions/runs/39373642729). Android visual confirmation, Cloudflare backend deployment, and social-account verification remain outstanding.

## Free-first media and voice directory (2026-10-20)

- Added a dashboard directory linking to official Google Flow, Canva, CapCut, ElevenLabs, ChatGPT Voice, Figma and Metricool pages, with warnings about free-tier quotas, eligibility, commercial-use limits, and unimplemented embedded voice streaming.
- The connected Figma identity check and Metricool brand lookup returned data, but this is not independent proof of social-account ownership. No scheduling/publishing action was performed.
- CI for this new directory commit is pending; deployment and live Android rendering remain unverified. Changes remain on the feature branch.
