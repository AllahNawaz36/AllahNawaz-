# Naz Business Assistant — Professional Starter

## Included modules
- Overview dashboard
- Lead CRM with source, service, stage, budget and notes
- Marketing campaign planner
- Content studio for social posts, email drafts, short-video scripts and blog outlines
- Manual on-page SEO checks and keyword brainstorming (no live volume data)
- Email and follow-up message templates (drafts only; not sent)
- Customer-support reply helper and FAQ library
- Local task board
- Manual KPI calculator
- Settings / backend status page

## Run locally (Node.js 18+; no npm packages)
From this folder:

**Windows PowerShell**
```powershell
$env:ADMIN_TOKEN="replace-with-a-long-random-secret"
node server.js
```

**macOS / Linux**
```bash
ADMIN_TOKEN="replace-with-a-long-random-secret" node server.js
```

Open `http://127.0.0.1:8080`.

## Storage
- Leads: `data/leads.json` when backend is running. Central lead listing/edit/delete requires the `ADMIN_TOKEN`.
- If backend is unavailable, leads fall back to this browser's localStorage; they are not shared across devices.
- Tasks, FAQs, drafts, theme and checklists are stored in the current browser only.

## Honest limitations
This starter does **not** connect an AI model, crawl websites, fetch live keyword volumes/rankings, send email/WhatsApp, publish/schedule social posts, or connect analytics accounts. The content and campaign tools use local templates. The SEO page checks the values you manually enter and is not a full SEO audit.

## Free online demo deployment (Android-friendly)
1. Upload `index.html`, `server.js`, and `package.json` to a GitHub repository. The server creates its `data` folder automatically.
2. In Render, create a new **Web Service** and connect that GitHub repository.
3. Use build command `npm install` (there are no third-party dependencies) and start command `npm start`.
4. Choose the **Free** instance. Add an environment variable named `ADMIN_TOKEN` with a long, random secret.
5. Deploy, open the `onrender.com` URL, then open Settings / Connections and confirm backend status.

**Important:** Render free web services use an ephemeral filesystem and may sleep after inactivity. Lead records stored in the included JSON file can be lost after restart, sleep, or redeploy. Treat this as a demo only; do not store real customer data until persistent database storage and privacy/security controls are added.

## Before public deployment
- Deploy behind HTTPS on a Node.js-capable host. Plain static hosting such as GitHub Pages cannot run this backend.
- Use a strong private `ADMIN_TOKEN`; never place it in public HTML.
- Add persistent database storage, automated backups, stricter rate limits, abuse monitoring, privacy notice/consent, and data retention/deletion processes.
- The included JSON file storage is a starter for low-volume use, not a production CRM database.
- Add official API integrations only after reviewing each provider's current policies and permissions.
