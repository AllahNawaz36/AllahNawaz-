# Metricool + Naz Business Assistant Pro Setup

## What is already in place
- The Social Publisher page in `index.html` can draft a LinkedIn caption, create a visual design brief, save the draft locally, copy text, and open Metricool.
- The website is hosted on GitHub Pages. GitHub Pages serves static HTML and cannot securely store private API tokens.
- The separate Metricool connector in ChatGPT can access the Metricool account from ChatGPT, but the public website cannot call ChatGPT's connected tools.

## Choose the correct path

### Option A — Free-first (no Metricool API)
1. Open the Naz Business Assistant Pro website.
2. Open **Social Publisher**.
3. Fill in the topic, audience, key point and visual brief.
4. Tap **Build post draft** and review the copy.
5. Tap **Copy caption**; create/export the visual in a design app if needed.
6. Open Metricool, select the intended LinkedIn profile, paste the caption, add media, choose a future time in `Asia/Karachi`, and schedule.
7. Confirm the post appears in Metricool's Planner. After the scheduled time, verify the post on LinkedIn.

This path is assisted/manual scheduling. The website does not claim a post was scheduled or published.

### Option B — Direct scheduling from the website
Metricool's current API guide says API access is available on **Advanced and Custom** plans, not Free or Starter. If the account has an eligible plan:
1. In Metricool, open **Account Settings → API** and create/copy the API access token.
2. Keep the token private. Never put it in `index.html`, GitHub files, screenshots, browser storage, or chat messages.
3. Deploy the Cloudflare Worker from `worker.mjs` and set the Metricool token as a Worker secret (for example `METRICOOL_API_TOKEN`). Set the required account identifiers as server-side variables/secrets as appropriate.
4. Add authenticated server endpoints that validate the admin session, content, provider, timezone and future publication time before forwarding a request to Metricool's scheduler API.
5. Keep a human confirmation step before a live schedule/publish action; log the returned post ID and status without logging the token.
6. Test with a draft or a low-risk future post, verify it in Metricool Planner, then verify actual publication.

Official Metricool guide: https://help.metricool.com/basic-guide-for-api-integration-r97af
Official scheduler example: https://help.metricool.com/wli-scheduler-endpoint-example-on-a-custom-backend-proxy-frko7

## Security and truthfulness checklist
- Do not ask for a Facebook/LinkedIn password or OTP.
- Never expose API tokens in frontend JavaScript or a public repository.
- The `ADMIN_TOKEN` for this dashboard is not a Metricool API token.
- ChatGPT's Metricool connection is separate from the hosted website's backend.
- If the website has no valid Metricool API secret, it must show “not configured” and must not pretend to schedule posts.
- A successful API response means the post was accepted by Metricool; verify the planner entry and final network publication separately.
- Media must be hosted at a public, non-expiring URL and supported by the selected network; otherwise a post may be scheduled without the intended visual.

## Current state
The Social Publisher UI and free-first handoff are implemented. Direct scheduling from the public website is **not enabled** until an eligible Metricool API plan, a private server-side token, and the authenticated Worker endpoint are configured and tested.
