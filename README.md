# Naz Business Assistant Pro

[**Open free dashboard (GitHub Pages)**](https://allahnawaz36.github.io/AllahNawaz-/) · [**Open Research Studio**](https://allahnawaz36.github.io/AllahNawaz-/research.html) · [**Open portfolio**](https://allahnawaz36.github.io/AllahNawaz-/portfolio.html) · [**Deployment status**](https://github.com/AllahNawaz36/AllahNawaz-/actions) · [**Platform benchmark & release gates**](PLATFORM_BENCHMARK.md) · [**Online resource catalog**](ONLINE_RESOURCE_CATALOG.md) · [**Connector audit**](CONNECTOR_AUDIT.md)

A browser dashboard, Python workflow runner, Node.js API, and optional Cloudflare Workers + D1 API. This repository is **not** a fully connected AI/social automation service yet.

## What works

- Browser dashboard for leads, tasks, content drafts, campaign planning, manual SEO checks, FAQs and KPI calculations.
- Optional validated structured AI responses in the dashboard (summary, assumptions, next steps, limitations) when the configured Worker supports the request.
- Research Studio for manually captured sources, comparisons, filtering and local Markdown/JSON exports; it does not automatically import live search results.
- Communication Hub with a two-step WhatsApp approval flow: review the recipient and message, approve opening the WhatsApp draft, then press Send inside WhatsApp. Drafts stay in this browser; this is not background/API sending.
- Automation Studio: video-edit briefs (aspect ratios, trim/cut, captions, music and thumbnail checklist), a local publishing approval queue, browser-local reports, and downloadable proposal/invoice/meeting-note/CSV templates.
- Automation Studio outputs are saved in this browser; they do not edit media, send messages, upload files or publish/schedule posts.
- Optional Node.js API for shared lead CRUD, protected by a private `ADMIN_TOKEN` (local/self-hosted).
- Optional Cloudflare Worker API with D1 persistent lead storage, origin restrictions, and private token protection. See [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md).
- Optional Google Gemini API provider for AI chat using a Cloudflare Worker secret; free-tier quota/model access varies. Setup and privacy notes are in [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md).
- Python workflow runner with a brand-aware content prompt, planning stages and an explicit approval gate.
- Safe-by-default Python dry run (`DRY_RUN=1`).

## Run the dashboard + lead API locally

Requires Node.js 18+.

**PowerShell**
```powershell
$env:ADMIN_TOKEN = "replace-this-with-a-random-secret-of-at-least-32-characters"
npm start
```

**macOS/Linux**
```bash
ADMIN_TOKEN="replace-this-with-a-random-secret-of-at-least-32-characters" npm start
```

Open http://127.0.0.1:8080. In the dashboard's Leads area, select **Admin Login** and enter the same token. Do not put the real token in `index.html`, commit it, or share it in screenshots.

Health check: `GET /api/health`. Lead listing/creation/editing/deletion is under `/api/leads` and requires `Authorization: Bearer <ADMIN_TOKEN>`.

## Run the Python workflow

Requires Python 3.10+.

```bash
python -m pip install -r requirements.txt
python allinone_bot.py --brief "Create a helpful introduction post for a small business"
```

The default is dry-run: it builds a prompt and planning output without sending posts or emails. Edit `config/industry.yaml` for your brand, region, language and tone.

For AI content generation, configure `ANTHROPIC_API_KEY` in your environment and then explicitly set `DRY_RUN=0`. Do not commit API keys. The AI stage uses the configured `CONTENT_MODEL` if provided; otherwise it uses the model ID in the code. Confirm your provider account supports that model before live use.

## Current verification status (2026-10-20)

**Latest repository check: PASS** — [run 39411437219](https://github.com/AllahNawaz36/AllahNawaz-/actions/runs/39411437219), commit `62feecdec12ac1d098b8c9d49b2c28f862490b8b`. The job completed successfully: Node syntax checks, JavaScript tests, inline JavaScript/duplicate-ID checks, Python dependency install, Python compilation/tests, and chatbot CLI smoke test.

**Latest code state:** structured AI response validation is covered by tests, including extra JSON keys and response size/count limits. GitHub Pages deployment workflow passed for the prior frontend commit; the current documentation/test-only commit does not change the deployed HTML. CI is evidence of repository checks, not proof of live Worker health.

**Release verdict: NOT FULLY FINALIZED — Cloudflare account-side checks remain a hard blocker.** The live Worker URL is not present in the dashboard source and was not available through the connected GitHub repository. No live `/api/health` or real AI chat test has been performed.

- Intended Worker: `naz-business-assistant-api` in `wrangler.toml`.
- D1 binding is intentionally omitted until a real database ID is configured; persistent leads are not ready until D1 and `schema.sql` are configured and tested.
- Chat requires a working AI provider (`AI` binding or `GEMINI_API_KEY` secret) **and** `CHAT_LIMITER`.
- For chat, require `status: "ready"`, `chatReady: true`, `ai: "configured"`, and `chatProtection: "configured"` from `GET /api/health`.
- For persistent lead storage, additionally require `storage: "d1"` and `admin: "configured"`, then complete authenticated create/list/update/delete and unauthenticated-401 tests.
- The actual Worker HTTPS URL must be entered in **Connections & Settings → API endpoint**. Never put secrets into the frontend or this repository.

If Cloudflare shows **Not Found**, start from https://dash.cloudflare.com/, confirm the correct account, and open Workers & Pages. Do not create a duplicate Worker until the account and existing deployment have been checked. Follow [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md).

## Deployment: important distinction

- **GitHub Pages is static hosting only.** It can show the dashboard interface, but cannot run `server.js`. For a separate backend, open Connections & Settings → API endpoint and enter the deployed HTTPS API base URL.
- For a card-free deployment path, the optional Cloudflare Worker + D1 setup is documented in [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md). It still requires you to sign in to Cloudflare, create the database, configure a private secret, and deploy from your own account. No deployment is claimed until you verify the health endpoint.
- If the dashboard is hosted separately from the API, the frontend currently uses same-origin `/api/...` paths; a separate-domain deployment needs a configured API base URL and strict CORS. Do not expose the admin token in client-side source.
- A free host may sleep and/or erase local files. The JSON lead store is demo storage only. Use a persistent database, backups, access controls, privacy notice and retention/deletion process before handling real customer data.

## Honest feature limits

- **Implemented locally:** planning briefs, templates, task/draft storage in the browser, and a publishing queue whose approval status is only a checklist state.
- **Not implemented as external actions:** actual video rendering/editing, uploading/scheduling LinkedIn/social posts, sending email/WhatsApp, calendar changes, cloud-drive uploads, Canva/Figma file edits, website crawling, live SEO rankings, live competitor research, or connected analytics reports.
- **Integration requirements:** each platform needs its own supported API/OAuth permission, a secure backend and account-specific setup. A saved URL, selected date, or local approval must never be presented as a successful upload or publication.
- **Privacy and safety:** do not put tokens/passwords in dashboard fields or repository files. Get explicit approval before sending customer-facing messages, publishing, deleting, spending money, or sharing private data.

## Checks

```bash
npm run check
npm test
python -m compileall -q allinone_bot.py workflows tests
python -m unittest discover -s tests -v
python allinone_bot.py --brief "CI smoke test"
```

See [AUTH_FIX_INSTALL.md](AUTH_FIX_INSTALL.md) and [RUNBOOK.md](RUNBOOK.md) for additional setup notes.
