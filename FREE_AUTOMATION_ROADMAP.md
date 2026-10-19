# Free-First Automation & Live Support Plan

This plan is the implementation boundary for Naz Business Assistant Pro. It prioritizes free tiers, least privilege, and honest status reporting. It is not proof that any third-party account is connected.

## Recommended stack

| Need | First choice | Free-tier reality | Safety rule |
|---|---|---|---|
| Public dashboard | GitHub Pages | Static hosting; does not run Node/Python server code | Never put API secrets in browser files |
| API + AI chat | Cloudflare Workers + Workers AI | Free quotas apply; AI has a daily free allocation and requests can fail at limits | Fail closed; display an honest unavailable state |
| Lead database | Cloudflare D1 | Free limits apply; requires real database ID, schema, and binding | Admin routes require a secret; do not store sensitive data without privacy controls |
| Website human live chat | tawk.to | Core website live chat is free; AI Assist has separate limited/free and paid tiers | Add the official widget only after the owner creates a property and supplies its embed code; never invent a widget ID |
| Facebook Page publishing and inbox | Meta Business Suite | Native scheduling and inbox tools are available through Meta's app | Use official OAuth/app flows; never automate personal-account passwords |
| Social calendar | Metricool | Free plan is limited to one brand and 20 published posts/month; current plan docs say LinkedIn and Make/Zapier are not included in Free | Do not promise LinkedIn scheduling through Metricool Free; verify connected networks and plan in the user's account |
| CRM | Start with the project's protected D1 leads; optional HubSpot Free CRM if the user wants a separate vendor | External connector permissions and plan limits vary | Connect only after explicit authorization; don't sync data until fields and retention are agreed |
| Background automation | GitHub Actions for low-frequency maintenance/tests; Cloudflare Worker for request-driven tasks | CI minutes, runtime and platform quotas apply; Actions are not an always-on agent | Scheduled jobs must be idempotent, logged, rate-limited, and safe to retry |
| Design assets | Canva/Figma manual or authorized connected workflow | Account plan and connector access determine write capability | Never claim an asset was created/edited unless the platform confirms it |

## Safe automation design

1. **Draft by default:** generate content, reply suggestions, task plans, and lead summaries without external side effects.
2. **Approval gate:** require explicit approval before sending a customer reply, publishing a post, changing an ad, deleting a record, or sending email.
3. **Live-reply states:** show draft, awaiting approval, sent/confirmed, failed, or not connected. Never label a draft as sent.
4. **Human handoff:** for refund/payment/security complaints, legal/medical issues, angry customers, or uncertain facts, stop automatic answering and route to a human.
5. **Least privilege:** use provider OAuth or scoped tokens, keep secrets in Worker secrets/environment variables, rotate credentials, and never ask users to paste passwords into chat.
6. **Abuse controls:** validate input size and type, add rate limits, avoid logging full personal messages, and protect admin routes.
7. **Reliability:** retries must not duplicate posts/messages; use idempotency keys and a small action log. Show errors rather than silently falling back to fake success.
8. **Privacy:** collect only required lead fields; add a privacy notice, retention/deletion process, and backup plan before production use.

## Rollout order

### Phase 1 — Stabilize the backend
- Deploy Worker naz-business-assistant-api.
- Verify GET /api/health reports ok: true and ai: configured.
- Create the D1 database, bind it as DB, run schema.sql, and verify storage: d1.
- Add a strong ADMIN_TOKEN as a Worker secret; never place it in frontend code.
- Save the Worker URL in the dashboard and test with a synthetic lead.

### Phase 2 — Website live support
- Create a tawk.to property and configure business hours, greetings, and human handoff.
- Add its real embed snippet to the site through a reviewed repository change.
- Test mobile widget, notification delivery, privacy disclosure, and human replies.
- Keep the AI chatbot and human inbox distinct until an official, supported integration is configured.

### Phase 3 — Social publishing and replies
- Use Meta Business Suite directly for Facebook Page scheduling and messages first.
- Inspect Metricool's actual plan and connected profiles. Do not assume LinkedIn is available on Free.
- Only add an API-based publishing integration after account authorization, permission review, and a test draft. Require approval before first live post.

### Phase 4 — CRM and agent workflows
- Add lead capture, deduplication, source attribution, follow-up reminders, and daily summaries.
- Keep all outbound messages in draft/approval mode initially.
- Add a connected CRM only if the free plan and data-processing requirements fit.

## Current verified state (update this section when tests run)

- GitHub Pages deployment has previously succeeded.
- Repository CI checks have previously succeeded; latest runs should be rechecked after each commit.
- Cloudflare Worker deployment and runtime health are not yet verified.
- D1 database binding is intentionally omitted until a real database ID exists.
- AI chat requires a real Workers AI binding named AI.
- Metricool brand settings were retrievable through the connected Metricool tool; this alone does not prove that publishing is enabled for every network or that the Free plan includes LinkedIn.
- No automatic publishing, outbound email, WhatsApp messaging, or customer live-reply integration should be represented as active until a provider confirms a real action.

## Acceptance checklist

- [ ] Worker deployed without a paid-plan upgrade.
- [ ] /api/health confirms AI and D1 status.
- [ ] Secret ADMIN_TOKEN stored only in provider secrets.
- [ ] Synthetic lead create/list/update/delete works only with authorization.
- [ ] Chat handles provider errors without claiming success.
- [ ] Website live chat receives and sends a real test message.
- [ ] Social post is first tested as a draft and then approved manually.
- [ ] Logs omit unnecessary personal information.
- [ ] README and dashboard status accurately reflect what is connected.
