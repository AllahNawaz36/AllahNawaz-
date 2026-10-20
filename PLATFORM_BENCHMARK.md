# Platform benchmark — Naz Business Assistant Pro

**Reviewed:** 2026-10-19  
**Scope:** Free-first, Android-friendly business workspace; honest comparison with established products. This is a feature/architecture benchmark, not a claim that this project matches the reliability, support, integrations, or scale of mature SaaS products.

## Summary

Naz Business Assistant Pro is currently a **custom dashboard + local planning tools + optional backend**, not a fully connected all-in-one automation service. Its advantage is that the owner can keep a single lightweight workspace and choose a free-first backend. Established platforms remain stronger in their dedicated areas.

| Platform / product pattern | What the established product provides | Free-tier / integration reality to plan around | Current Naz status | Practical next step |
|---|---|---|---|---|
| **Buffer — social publishing** | Multi-channel post drafts, a calendar and scheduling | Official pricing currently lists up to 3 channels and 10 queued posts per channel on Free; supported channels and publishing behaviour vary | Caption/visual briefs, local queue and manual hand-off; no verified direct publishing | Keep the safe manual workflow until the target accounts and a supported API are verified. Use Buffer only if it fits the user's free-channel limits. |
| **Metricool — social calendar and analytics** | Planner, social scheduling and analytics | Metricool API access and channel permissions depend on plan; confirm the current plan limits in the account and official guide | Connected brand metadata returned the label ANJAN MALIK JAN and LinkedIn/TikTok/YouTube references; the user has said the connected LinkedIn profile is theirs, but the exact destination still needs confirmation before each publish. No post was scheduled during this audit | Reconnect the correct brand, verify the LinkedIn/Facebook profiles and plan, then manually schedule a reviewed draft. Direct API scheduling is not a free-plan assumption. |
| **HubSpot — CRM and customer pipeline** | Hosted CRM, contact records, pipeline and selected marketing/service tools | Official free-tools page currently lists up to 1,000 contacts and up to 2 users; feature limits vary by hub | Local browser leads and optional protected API/D1 storage; no HubSpot sync | Use current lead storage for a test dataset first; add HubSpot only after explicit authorization and field mapping. |
| **Zapier — app-to-app workflows** | Hosted triggers/actions across connected services | Official Free plan currently includes 100 tasks/month and two-step workflows; premium app and multi-step availability vary | Python planning workflow and optional API; no Zapier workflow is configured by default | Start with one low-risk trigger/action and idempotent logs only after connecting accounts. Do not imply always-on automation from GitHub Actions. |
| **Cloudflare Workers + Workers AI + D1 — custom backend** | Serverless API, optional model calls, and database | Free usage is quota-limited; the Workers Free plan currently documents up to 100,000 requests/day and 10 ms CPU per request. AI quotas are separate and can fail | Worker source, health endpoint, protected lead routes, chat endpoint and rate-limit configuration exist; actual Worker, AI binding, limiter, D1 database and secret still require owner-account setup and live verification | Deploy using the free plan, configure secrets/bindings, then verify health, AI chat and synthetic lead CRUD before storing real leads. |
| **tawk.to — website live chat** | Hosted human live-chat inbox and website widget | Core human live chat is free; AI Assist and add-ons have separate limits/pricing | No verified widget property/embed has been supplied or installed | Create a property in the user's account and add its genuine embed code only after reviewing privacy and mobile behaviour. |
| **Figma / Canva — design creation** | Design files, components, collaboration and visual asset creation | API and connector access depend on account, plan, seat and permissions; file access does not automatically imply write/export access | Design briefs and copy are available; no automatic Figma/Canva file edits or exports are claimed | Use the connected platform for authorized work; verify the specific file and requested write action before claiming completion. |

## What is implemented in this repository

- Responsive GitHub Pages dashboard and portfolio.
- Local-first tasks, drafts, campaign/content planning, lead forms, checklists, reports and backup/restore controls.
- Optional Node API for local/self-hosted lead CRUD.
- Optional Cloudflare Worker API source for health, Workers AI chat and token-protected D1 lead CRUD.
- Human-review-first publishing/communication flows.
- A floating AI chat interface that calls `/api/health` and `/api/chat` only when an API base URL is configured; it reports missing/unavailable backend states rather than inventing answers.

## Not yet production-verified

- Live Cloudflare deployment, AI binding/quota, rate-limit binding, D1 schema and private token.
- Real browser/device rendering and accessibility audit on Android.
- Correct Metricool brand and connected social profiles.
- Direct LinkedIn/Facebook scheduling/publishing, inbox replies, email sending, WhatsApp API sending, ads, Canva/Figma file writes, video rendering or connected analytics.
- Production privacy notice, retention/deletion policy and backup/restore test.

## Release gate

Do not call the system “100% finalized” until the repository CI is green **and** the owner-account tests below pass:

1. Open the live site on Android; check responsive layout, icon alignment, navigation and chat controls.
2. Confirm `/api/health` returns `ok: true`, `ai: configured`, and (after setup) `storage: d1`.
3. Test AI chat with a harmless prompt and verify a genuine response.
4. Test synthetic lead create/list/update/delete; confirm unauthorized requests return 401.
5. Verify the actual social brand/profile before scheduling any test post; require explicit human confirmation and verify the post in the provider's planner.
6. Confirm no secrets appear in frontend source, repository history, screenshots or logs.
7. Test backup export and restore with synthetic data.

## Official references

- [Buffer pricing](https://buffer.com/pricing)
- [Metricool API integration guide](https://help.metricool.com/basic-guide-for-api-integration-r97af)
- [Metricool API access and automation](https://help.metricool.com/api-access-export-your-metricool-data-to-other-tools-and-automate-tasks-x8ln5)
- [HubSpot free CRM/tools](https://www.hubspot.com/pricing/crm)
- [Zapier Free plan](https://help.zapier.com/hc/en-us/articles/32337438839565-What-s-included-in-Zapier-s-Free-plan)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [tawk.to free model](https://www.tawk.to/why-free/)
- [Figma API rate limits](https://developers.figma.com/docs/rest-api/rate-limits/)
