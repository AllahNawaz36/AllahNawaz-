# Naz Business Assistant Pro

[**Open free dashboard (GitHub Pages)**](https://allahnawaz36.github.io/AllahNawaz-/) · [**Deployment status**](https://github.com/AllahNawaz36/AllahNawaz-/actions)

A starter dashboard plus a separate Python workflow runner. This repository is **not** a fully connected AI/social automation service yet.

## What works

- Browser dashboard for leads, tasks, content drafts, campaign planning, manual SEO checks, FAQs and KPI calculations.
- Optional Node.js API for shared lead CRUD, protected by a private `ADMIN_TOKEN`.
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

## Deployment: important distinction

- **GitHub Pages is static hosting only.** It can show the dashboard interface, but cannot run `server.js`; the API buttons will not connect there.
- To use central lead storage, deploy the repository as a Node.js Web Service on a Node-capable host such as Render. Set start command to `npm start` and configure a strong `ADMIN_TOKEN` as a private environment variable.
- If the dashboard is hosted separately from the API, the frontend currently uses same-origin `/api/...` paths; a separate-domain deployment needs a configured API base URL and strict CORS. Do not expose the admin token in client-side source.
- A free host may sleep and/or erase local files. The JSON lead store is demo storage only. Use a persistent database, backups, access controls, privacy notice and retention/deletion process before handling real customer data.

## Honest feature limits

The current code does not publish or schedule LinkedIn/social posts, send email/WhatsApp, connect CRM accounts, export Canva/Figma designs, generate videos, crawl websites, fetch live SEO rankings, or connect analytics accounts. Those stages create plans/drafts only; approval is not the same as an integration and no external action is executed by the current pipeline.

## Checks

```bash
npm run check
npm test
python -m compileall -q allinone_bot.py workflows tests
python -m unittest discover -s tests -v
python allinone_bot.py --brief "CI smoke test"
```

See [AUTH_FIX_INSTALL.md](AUTH_FIX_INSTALL.md) and [RUNBOOK.md](RUNBOOK.md) for additional setup notes.
