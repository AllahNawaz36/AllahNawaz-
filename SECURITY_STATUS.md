# Security Status — Naz Business Assistant Pro

Last reviewed: 2026-10-19

## Current verdict

**Development/demo ready; not yet approved for production customer data or unattended outbound actions.** Passing CI proves the repository's checks pass; it does not prove a deployed Cloudflare service is secure or live.

## External connection and repository review — 2026-10-20

### Checks performed
- GitHub repository metadata confirms this repository is currently **public**. Source and committed configuration are therefore publicly readable. The owner should switch it to private if public source sharing is not intended; this audit did not change repository visibility.
- Latest inspected GitHub Actions run `39383492235` completed successfully. It passed the configured JavaScript checks/tests, inline-JS and duplicate-ID checks, Python compilation/tests, and CLI smoke test. CI success does not prove runtime deployment security.
- Reviewed `.gitignore`, `.env.example`, `wrangler.toml`, `worker.mjs`, and this security status document. The inspected files show environment-file exclusions, server-side token handling, CORS allowlisting, protected API authorization checks, request-size limits, and a configured chat rate-limit binding. This was a targeted review, **not** a complete repository-wide or Git-history secret scan.
- Metricool brand settings and LinkedIn analytics read access responded for the selected brand; the scheduled-post query for 2026-10-20 through 2026-10-27 returned an empty list. These results do not verify LinkedIn publishing authorization.
- Figma identity/workspace lookup and Notion workspace lookup responded. Canva brand-kit lookup returned no brand kits. These are connection/read tests only, not complete permission audits.

### Still unverified
- The deployed Cloudflare Worker URL has not been supplied or found in the dashboard source (the endpoint is configured by the operator in browser settings). Therefore no live `/api/health` check was performed, and deployed secrets, rate limiting, AI binding, and D1 availability remain unverified.
- No full secret scan of every tracked file and historical commit was completed. Treat any credential that may have been committed as potentially exposed until checked; rotate it if found.
- Do not store real customer data or enable unattended external actions until runtime, access controls, backups/retention, and provider permissions have been tested.

## Checks observed in the repository

- `ADMIN_TOKEN` is not configured in public frontend source; the dashboard asks the operator to enter it and keeps it in tab-scoped session storage.
- The Node API refuses to start unless `ADMIN_TOKEN` is at least 32 characters.
- Lead CRUD endpoints require Bearer-token authorization.
- The Worker limits request bodies, validates lead fields, restricts browser CORS to the configured GitHub Pages origin, and does not expose lead endpoints without the admin token.
- `.env`, data files, Python caches, and generated reports are ignored by Git.
- Python workflow defaults to dry-run; current workflow code does not send email or publish social posts.
- Latest repository CI run passed syntax checks, JavaScript tests, Python compilation, Python tests, and dry-run smoke test.

## Open risks / required before real customer use

1. **Basic public-chat rate limiting is now defined in code/config** (`CHAT_LIMITER`, 10 requests per IP per 60 seconds), and the Worker fails closed if the binding is missing. This is not a complete anti-abuse solution: IP-based limits can affect multiple visitors behind shared mobile/carrier networks, and deployment must be verified. Consider an additional challenge such as Turnstile and monitor errors before public launch.
2. **Cloudflare runtime is not verified.** Confirm `/api/health` after deployment; expected fields are `ok: true`, `ai: configured`, and, after D1 setup, `storage: d1`.
3. **D1 is not configured until the owner creates a real database, binds it as `DB`, and runs `schema.sql`.** Do not enter real lead data before that test passes.
4. **Secret setup is owner-only.** Set a unique random `ADMIN_TOKEN` in Cloudflare Worker Settings → Variables and Secrets as a Secret. Never commit it, put it in frontend code, or send it in chat/screenshots.
5. **Outbound actions remain disabled/not implemented.** No automatic LinkedIn/Facebook publishing, outbound email, WhatsApp sending, ad spend changes, or customer replies should be claimed until a provider is connected, permissioned, and a real test action is confirmed.
6. **Privacy controls are not a complete compliance package.** Before storing real customer information, add a privacy notice, retention/deletion process, minimal collection, and a backup/restore plan.
7. **AI limits are not a hard cost guarantee.** Stay on the free plan and do not approve upgrades; Cloudflare Workers AI free allocation is limited and requests can fail at the quota.

## Safe operating rules

- Keep content generation in draft mode by default.
- Require a human approval before sending/publishing, deleting records, changing ads, or emailing customers.
- Hand off uncertain, sensitive, refund/payment/security, legal, or complaint cases to a human.
- Use test data until the health endpoint, auth, database and recovery path have been checked.
- Recheck GitHub Actions after every repository change and inspect failed logs rather than assuming deployment succeeded.

## Manual launch checklist

- [ ] Cloudflare Worker deployed under the expected name.
- [ ] `CHAT_LIMITER` binding deployed and tested; consider additional Turnstile/abuse controls.
- [ ] AI binding named `AI` confirmed.
- [ ] D1 binding named `DB` confirmed and `schema.sql` executed.
- [ ] `ADMIN_TOKEN` stored as a Worker secret (32+ characters).
- [ ] `/api/health` checked from the deployed URL.
- [ ] Synthetic lead CRUD tested; missing/wrong token returns 401.
- [ ] No real customer data entered until all above checks pass.
- [ ] Third-party social/chat accounts authorized through official flows only.
- [ ] First outbound post/reply tested manually with explicit approval.
