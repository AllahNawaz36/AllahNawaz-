# Online Resource Catalog — Naz Business Assistant Pro

**Reviewed:** 2026-10-20  
**Purpose:** Curated, primary-source links and implementation notes for improving this project. This is a research index, not a claim that every service is connected or free at unlimited scale.

## Rules for importing code or data

1. Prefer official product documentation, official SDKs, and reputable open-source repositories with a clear license.
2. Before reusing a GitHub project, check its license, maintenance activity, dependencies, security advisories, and whether its runtime fits Cloudflare Workers / static GitHub Pages. A public repository is not automatically open-licensed.
3. Do not copy secrets, personal data, customer records, or proprietary code. Do not scrape websites or APIs against their terms.
4. Store only curated source links and short implementation notes here; fetch live information when needed instead of pretending this static file is a live data feed.
5. Keep all external actions draft-first and require explicit approval before publishing, messaging, deleting, changing ads, or sharing private data.
6. A green CI test proves code checks passed, not that a provider account, OAuth permission, Worker binding, or live post is working.

## Primary sources and practical use

| Area | Primary source | How this project should use it | Important boundary |
|---|---|---|---|
| GitHub repository API | https://docs.github.com/en/rest | Inspect repository files, commits, workflow runs, and releases through authorized access | Access follows repository permissions; never expose tokens |
| GitHub Actions | https://docs.github.com/en/actions | Run repeatable checks, linting, tests, and low-frequency maintenance | Scheduled jobs are not an always-on agent; quotas and billing rules apply |
| GitHub Pages | https://docs.github.com/en/pages | Host the static dashboard | Pages cannot run the Node/Python backend |
| Cloudflare Workers | https://developers.cloudflare.com/workers/ | Host request-driven API routes | Free plan has quotas and CPU limits; not unlimited compute |
| Cloudflare Workers limits | https://developers.cloudflare.com/workers/platform/limits/ | Check current request, CPU, and subrequest ceilings before designing workflows | Recheck official limits before relying on a quota |
| Cloudflare Workers AI | https://developers.cloudflare.com/workers-ai/ | Optional AI chat/content generation using the existing AI binding | Daily free allocation and model availability can change; handle quota/provider errors |
| Cloudflare D1 | https://developers.cloudflare.com/d1/ | Persist leads and workflow records with schema migrations | Requires a real database and binding; protect customer data and verify backups |
| Cloudflare rate limiting | https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ | Protect public chat and expensive endpoints | Confirm the deployed binding is configured; fail closed if required protection is absent |
| Cloudflare secrets | https://developers.cloudflare.com/workers/configuration/secrets/ | Store ADMIN_TOKEN and provider credentials server-side | Never place secrets in index.html, browser storage, commits, or screenshots |
| LinkedIn API | https://learn.microsoft.com/en-us/linkedin/ | Check supported posting APIs, products, permissions, and OAuth requirements | API access and scopes are account/app dependent; no password automation |
| Meta Graph API | https://developers.facebook.com/docs/graph-api/ | Use approved Page publishing and messaging capabilities when the app has required permissions | Personal profiles and Pages have different rules; never promise personal-profile auto-posting |
| Meta Business Suite | https://www.facebook.com/business/tools/meta-business-suite | Use native Page scheduling and inbox tools where API integration is not configured | User must verify the correct Page/account in Meta |
| Metricool | https://help.metricool.com/ | Verify the exact brand, linked social profiles, plan limits, and available publishing options | Do not assume API access or LinkedIn support on a free plan; the user previously flagged a brand/account mismatch |
| n8n | https://docs.n8n.io/ | Study workflow patterns and self-hosted automation concepts | Self-hosting needs a running host; don't claim it is running from this static site |
| Buffer | https://buffer.com/pricing/ | Compare supported channels and free queue limits | Plan limits and channel support can change |
| Zapier | https://zapier.com/pricing | Compare no-code triggers/actions for simple workflows | Free task quotas and multi-step restrictions apply |
| HubSpot CRM | https://www.hubspot.com/products/crm | Optional CRM reference for contacts and pipeline | Separate account, plan and authorization required |
| Figma developer platform | https://www.figma.com/developers/api | Inspect authorized files and supported API actions | Read/write access depends on token, permissions and plan |
| Canva developer platform | https://www.canva.dev/ | Explore authorized design/export integrations | Do not claim file creation or editing without a confirmed API result |
| OWASP API Security | https://owasp.org/www-project-api-security/ | Review authentication, authorization, input validation and abuse controls | Apply relevant checks to every exposed endpoint |
| MDN Web Docs | https://developer.mozilla.org/ | Use browser, JavaScript, accessibility and web-platform references | Test actual Android browser behaviour, not only desktop assumptions |

## Existing repository assets to reuse first

- `index.html`: current browser dashboard and chatbot UI.
- `worker.mjs`: Cloudflare Worker routes, health status, AI chat, and protected lead operations.
- `wrangler.toml`: Worker configuration and declared bindings.
- `schema.sql`: D1 schema starting point.
- `server.js`: optional Node API; not executed by GitHub Pages.
- `allinone_bot.py`, `approval.py`, `content.py`, `pipeline_stages.py`: local workflow and approval logic.
- `test/` and `tests/`: existing checks to extend before changing behaviour.
- `CLOUDFLARE_SETUP.md`, `METRICOOL_SETUP.md`, `FREE_AUTOMATION_ROADMAP.md`, `PLATFORM_BENCHMARK.md`: setup and integration constraints.

## Implementation order

1. Verify current CI and inspect existing tests before editing code.
2. Verify the live Worker health response, AI binding, rate-limit binding, D1 binding, and allowed origin in the owner's Cloudflare account.
3. Add a small in-dashboard resource/help section that links to this catalog and clearly distinguishes **available**, **needs setup**, and **not supported**.
4. Add integrations one at a time, using official APIs and server-side secrets; begin with read-only or draft operations.
5. Test on Android, including offline/unavailable states, duplicate submissions, empty inputs, and authentication failures.
6. Before calling any integration live, record the exact successful health/API result or a confirmed provider-side action.

## Current known limits

- The catalog is curated documentation, not an automatically refreshed scraper.
- Free tiers are limited and provider terms change; always verify current official plan pages before committing to a design.
- No universal integration can bypass OAuth, app review, account eligibility, paid-only API access, or platform restrictions.
- Never store passwords or private customer data in this catalog.

## Free AI Agent Hub added to the dashboard

The dashboard now includes a **Free AI Agent Hub** with launch links and a local prompt builder. It does not embed or connect these providers' accounts; each service opens separately, and its own terms, regional access and free quota apply.

| Service | Official entry point | Honest usage note |
|---|---|---|
| Google Pomelli Agent | https://labs.google.com/pomelli | Official Google Labs tool; currently free, feature availability varies by country |\n| Arena Agent Mode | https://arena.ai/agent | External agent workspace; verify current access and limits |
| Poe | https://poe.com/ | Freemium; free message/model access is limited |
| Monica | https://monica.im/ | Freemium; some tools may require payment |
| Google AI Studio | https://aistudio.google.com/ | Free quotas may be available; limits and model access vary |
| HuggingChat | https://huggingface.co/chat/ | External chat with available models; model availability can change |
| Duck.ai | https://duck.ai/ | External chat; don't use it as a private customer-record system |

The prompt builder produces reusable instructions for research, LinkedIn content and visual briefs, UI/UX reviews, lead workflows, free-first automation planning and SEO outlines. It saves only in browser-local drafts. It does not run the external agent, retrieve its response, publish content or send messages.

The user confirmed that “Pamoly” meant **Google Pomelli** at https://labs.google.com/pomelli. This official link is now included in the dashboard. Google’s current supported-country list includes Pakistan; language support is English, and feature availability may vary by country. See https://support.google.com/labs/answer/16945066.
