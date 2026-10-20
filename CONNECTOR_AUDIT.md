# Connector and integration audit

**Reviewed:** 2026-10-20  
**Scope:** Naz Business Assistant Pro repository, available connected-app tools, integration boundaries, and production verification gaps.

## Executive result

The GitHub repository is accessible through the connected GitHub integration, and read-only account/workspace checks succeeded for Metricool, Figma, Notion, and Canva. This confirms those connectors can return account data in this ChatGPT session; it does **not** mean every external account is linked to this website, that every file is editable, or that social publishing is fully authorized.

The live Cloudflare account and Worker bindings were not accessible through a dedicated Cloudflare connector in this review. The production backend therefore remains **unverified**. Do not describe the project as fully automated or production-ready until the release checks below pass.

## Connector status

| Tool / platform | Verified in this review | Important boundary / next action |
|---|---|---|
| GitHub | Repository `AllahNawaz36/AllahNawaz-` is accessible; default branch is `main`; connector reports repository write permission; recent documentation commits were fetched back successfully. | A commit existing does not prove the app deployed. The combined commit-status endpoint returned no status entries at inspection time. The repository Actions API showed Project checks runs in progress for recent documentation commits; inspect the latest run before claiming CI is green. |
| Metricool | The connected account returned a brand named `ANJAN MALIK JAN`, timezone `Asia/Karachi`, and network references for LinkedIn, TikTok, and YouTube. | Confirm the exact target LinkedIn profile and brand inside Metricool before any publishing. Do not infer Facebook is connected from this result. Do not schedule anything during an audit. The Metricool connector has scheduling-capable tools, but actual plan, network permissions, media requirements and target identity still govern use. |
| Figma | Authenticated account information and multiple teams/plans were returned. Some seats are Full and at least one is View; Code Layers were reported disabled. | File-level access is separate. View seats and disabled Code Layers restrict some edit/implementation workflows. Open the exact file and verify write access before editing. |
| Notion | Authenticated workspace identity returned successfully. | Workspace connection does not prove that this project has synced tasks, records, or documentation. Search for an existing project page/database before creating duplicates. |
| Canva | Design search returned results. | Search results did not establish an exact Naz Business Assistant Pro design. Inspect the intended design and permissions before editing or exporting. |
| Cloudflare Workers / D1 | Source code and `wrangler.toml` exist in the repository. | No live Cloudflare account, Worker URL, deployed version, secret, AI binding, rate limiter or D1 database was verified in this review. The `DB` D1 binding is intentionally omitted from config until a real database ID is supplied. |
| GitHub Pages | Repository includes a Pages deployment workflow and static dashboard source. | Pages serves the frontend only; it cannot run the separate Node.js API. The browser's API endpoint must be set to the actual HTTPS backend URL for remote API calls. |
| Google Gemini / Workers AI | Worker code supports Gemini via secret or Workers AI via binding. | Neither provider is proven live until the health endpoint and a real harmless chat request pass. API quotas and plan access can change. Never place secrets in browser code. |
| LinkedIn / Facebook direct APIs | No direct platform API deployment or authorization was verified in this review. | Treat posting as unavailable unless a connected, authorized publishing workflow returns a success confirmation. Metricool can be a separate publishing route when the correct account and plan support the action. |
| Automation scheduler | Repository contains planning/dry-run workflow code. | A local Python script or GitHub workflow is not automatically an always-on hosted agent. Verify triggers, credentials, execution logs, retries and failure notifications before promising background automation. |
| n8n, Google Flow, email, WhatsApp, ads | No live integration or successful end-to-end action was verified here. | Do not label these connected or operational without actual credentials/authorization, configured workflows, and an end-to-end test. Never request account passwords in chat. |

## Source-code observations

- The dashboard stores its API base URL in this browser's local storage. Saving an endpoint on one browser does not configure every device or user.
- The Worker health route can return HTTP 200 with `ok: true` while its status is `degraded`. Check the component fields, not HTTP status alone.
- Public chat deliberately requires both an AI provider and `CHAT_LIMITER`; it should return an unavailable error if protection is missing.
- Lead routes require a private `ADMIN_TOKEN` and a configured D1 binding. The D1 block is currently commented out in `wrangler.toml`; persistent Cloudflare CRM is not ready until a real database is created, bound as `DB`, and initialized with `schema.sql`.
- The dashboard and portfolio contain honest limits around publishing and actions. Keep those safeguards; never replace them with fake success messages.
- The repository has Node tests in `test/worker.test.js` and `test/server.test.js`, but test execution was not performed in the connected GitHub API review. Do not infer passing tests from the presence of test files.

## Release checklist

- [ ] Check the latest GitHub Actions runs for the current `main` commit; syntax and tests must pass.
- [ ] Open the live Cloudflare dashboard, verify the intended Worker and latest successful deployment.
- [ ] Open `<actual-worker-url>/api/health`; for AI chat require `status: "ready"`, `chatReady: true`, `ai: "configured"`, and `chatProtection: "configured"`.
- [ ] For persistent CRM require `storage: "d1"` and `admin: "configured"`; apply `schema.sql` to the actual D1 database.
- [ ] Test a harmless real AI chat request and inspect Worker logs for errors.
- [ ] Test synthetic lead create/list/update/delete with the private token, then delete the test lead and verify unauthenticated requests receive 401.
- [ ] Confirm the exact LinkedIn/Facebook destination profile, network, timezone, media, and publishing permissions in the scheduling platform before a reviewed test post.
- [ ] Verify backups and restore, mobile layout, API error handling, privacy/retention notes, and that no secrets are present in public source.
- [ ] Verify each additional integration (Notion, Canva, Figma, n8n, email, WhatsApp, ads) independently before calling it operational.

## Completion rule

This audit is complete as a repository/connector review, but it is **not a production sign-off**. A green sign-off requires live owner-account access and passing end-to-end checks. No posts were scheduled, no external messages were sent, and no paid services were activated during this audit.
