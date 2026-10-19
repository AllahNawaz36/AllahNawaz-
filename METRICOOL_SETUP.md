# Metricool + Naz Business Assistant Pro Setup

## Latest live connection test — 2026-10-19

- The Metricool connector currently returns one brand: `ANJAN MALIK JAN`.
- The returned brand has LinkedIn, Instagram, TikTok and YouTube network entries, but the user has explicitly confirmed this brand is **not theirs**.
- **Safety result: BLOCKED.** Do not schedule, edit, approve, or publish anything to this brand. No posts were scheduled during this test.
- This result confirms that the Metricool connection available to ChatGPT is pointing at the wrong Metricool account/brand. It does not prove which account is signed in to the user's Android browser.
- Do not copy the returned brand ID or network identifiers into the user's project configuration.

## What is already in place
- The Social Publisher page in `index.html` can draft a LinkedIn caption, create a visual design brief, save the draft locally, copy text, and open Metricool.
- The website is hosted on GitHub Pages. GitHub Pages serves static HTML and cannot securely store private API tokens.
- The separate Metricool connector in ChatGPT can access the Metricool account from ChatGPT, but the public website cannot call ChatGPT's connected tools.

## Correct-account recovery — Android

1. Open https://app.metricool.com/ in Chrome.
2. Sign out of Metricool, then sign in using the user's own existing Metricool login method (email/Google/etc.). If Google sign-in is used, explicitly choose the correct Google account.
3. Open the top-right menu → **Connections**. Confirm the displayed brand and account belong to the user. Do not connect the user's social accounts to the unrelated `ANJAN MALIK JAN` brand.
4. If the browser shows the user's correct brand, return to ChatGPT → Settings → Apps/Connectors → Metricool. Disconnect the wrong connection if that option is shown, then reconnect and authorize using the user's own Metricool account.
5. Re-run the Metricool brand check. Continue only when the returned brand is clearly the user's. If the wrong brand still appears, stop and inspect the Metricool sign-in/connection account before any scheduling.

Official connection dashboard: https://help.metricool.com/connection-dashboard-kn7ow

## Choose the correct path

### Option A — Free-first (no Metricool API)
1. Open the Naz Business Assistant Pro website.
2. Open **Social Publisher**.
3. Fill in the topic, audience, key point and visual brief.
4. Tap **Build post draft** and review the copy.
5. Tap **Copy caption**; create/export the visual in a design app if needed.
6. Open Metricool, select the verified intended brand/profile, paste the caption, add media, choose a future time in `Asia/Karachi`, and schedule only after user approval.
7. Confirm the post appears in Metricool's Planner. After the scheduled time, verify the post on the social network.

This path is assisted/manual scheduling. The website does not claim a post was scheduled or published.

### Option B — Direct scheduling from the website
Metricool's current plan documentation says API access is available on **Advanced and Custom** plans, not Free or Starter. LinkedIn connection is also not included on the Free plan. If the account has an eligible plan:
1. In Metricool, open **Account Settings → API** and create/copy the API access token.
2. Keep the token private. Never put it in `index.html`, GitHub files, screenshots, browser storage, or chat messages.
3. Deploy the Cloudflare Worker from `worker.mjs` and set the Metricool token as a Worker secret (for example `METRICOOL_API_TOKEN`). Set required account identifiers as server-side variables/secrets as appropriate.
4. Add authenticated server endpoints that validate the admin session, content, provider, timezone and future publication time before forwarding a request to Metricool's scheduler API.
5. Keep a human confirmation step before a live schedule/publish action; log the returned post ID and status without logging the token.
6. Test with a draft or a low-risk future post on the verified brand, verify it in Metricool Planner, then verify actual publication.

Official plan guide: https://help.metricool.com/main-differences-between-free-and-paid-plans-bl0v9
Official API plan guide: https://help.metricool.com/plans-add-ons-and-api-access-explained-xux1u
Official scheduler example: https://help.metricool.com/wli-scheduler-endpoint-example-on-a-custom-backend-proxy-frko7

## Security and truthfulness checklist
- Do not ask for a Facebook/LinkedIn password or OTP.
- Never expose API tokens in frontend JavaScript or a public repository.
- The `ADMIN_TOKEN` for this dashboard is not a Metricool API token.
- ChatGPT's Metricool connection is separate from the hosted website's backend.
- If the website has no valid Metricool API secret, it must show “not configured” and must not pretend to schedule posts.
- A successful API response means the post was accepted by Metricool; verify the planner entry and final network publication separately.
- Media must be hosted at a public, non-expiring URL and supported by the selected network; otherwise a post may be scheduled without the intended visual.
- Never run schedule/create/update/review/publish actions against the currently verified wrong brand.
- Routine content drafting may be automated, but a human must approve before a live post is scheduled or published.

## Current state
- Social Publisher UI and free-first handoff are implemented.
- Latest ChatGPT Metricool connection check is **not safe for publishing** because the only returned brand is not the user's.
- Direct scheduling from the public website is **not enabled** until an eligible Metricool API plan, a private server-side token, and an authenticated Worker endpoint are configured and tested.
- No posts were scheduled during the latest connection test.
