# Backend authentication fix

This patch adds the Node.js backend expected by `index.html`: `GET /api/health`, and token-protected `GET/POST /api/leads` plus `PATCH/DELETE /api/leads/:id`.

## Run locally

Requires Node.js 18 or newer.

**PowerShell**
```powershell
$env:ADMIN_TOKEN = "paste-a-unique-random-secret-at-least-32-characters-long"
npm start
```

Open http://127.0.0.1:8080. In the dashboard's Leads area, use Admin Login and enter the exact same token. The token is kept in the current tab's sessionStorage and is not written into the HTML source.

**Linux/macOS**
```bash
ADMIN_TOKEN="paste-a-unique-random-secret-at-least-32-characters-long" npm start
```

## Deploy

Use a Node.js host such as Render, not GitHub Pages (GitHub Pages serves static files and cannot run this API). Set the start command to `npm start` and configure `ADMIN_TOKEN` in the host's environment-variable settings. Do not commit a real token.

## Security and data notes

- The health endpoint is public and intentionally reveals no credentials.
- All lead API routes require a valid Bearer token; comparisons use `timingSafeEqual`.
- JSON file storage is a demo only. Free hosting may erase files on restart/redeploy. Use a persistent database and backups before storing real customer information.
- Use HTTPS in deployment. Do not share your admin token in screenshots, chat, or source files.
- This patch only fixes the dashboard backend/authentication contract. It does not repair the separate Python workflow's missing `workflows/` and `config/` files or connect AI/social/email providers.
