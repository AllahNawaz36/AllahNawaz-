# Online Research & Platform Comparison — Naz Business Assistant Pro

**Research date:** 2026-10-20  
**Purpose:** Use current official documentation to prioritize safe, free-first improvements. This is a research synthesis, not proof that the services are connected to this website or that a live action succeeded.

## Executive recommendation

Build this project as a small, modular **research → draft → review → approved action → result verification** workspace. Do not try to clone every feature of Google, YouTube, n8n, Metricool, Canva, Figma, or commercial AI agents in one frontend. Keep the dashboard lightweight and put credentials and integrations behind a server-side API.

The highest-value order is:
1. Make backend health and integration state explicit.
2. Add a source-backed research workflow that records title, URL, source type, date checked, summary, and confidence.
3. Produce a comparison matrix and draft content from collected sources.
4. Require user approval before public posts, messages, deletes, ads, or spending.
5. Add one real integration at a time, with an end-to-end test and visible action result.

## Research findings

### 1. Google Search and web research
- Search results are discovery, not final evidence. Prefer official docs for platform capabilities, then corroborate important claims with a second reliable source.
- Save source URL, page title, checked date, short paraphrase, and a confidence/verification note. Re-check time-sensitive pricing and limits before decisions.
- Google Search grounding through a model or a search API is a separate capability and may require billing, keys, quota, or product eligibility. Do not imply that a regular chatbot automatically has live Google Search access.
- Suggested implementation: a source ledger and research summary with clickable citations, a “last checked” label, and clear separation between verified facts and recommendations.

Official references:
- Google Gemini API billing: https://ai.google.dev/gemini-api/docs/billing/
- Gemini API pricing and free-tier limits: https://ai.google.dev/gemini-api/docs/pricing
- Google Search / Gemini model tool access must be checked against the selected model and current account tier.

### 2. YouTube research
- The official YouTube Data API v3 search.list method can find videos, channels, and playlists and return metadata such as title, channel, publication date, and description.
- The official documentation lists a quota cost for searches. API key/OAuth configuration and quota apply; a search result is metadata, not a transcript or proof that the video supports a claim.
- Suggested implementation: search by topic, filter by date/language/channel, store video URL and metadata, summarize only content actually accessible, and label whether a transcript was available. Do not scrape around access controls or invent transcript summaries.
- YouTube search API reference: https://developers.google.com/youtube/v3/docs/search/list
- Search request guide: https://developers.google.com/youtube/v3/guides/implementation/search

### 3. AI providers: Cloudflare Workers AI and Google Gemini
- Cloudflare Workers can call built-in Workers AI or external providers; model availability, quotas, and provider credentials still apply.
- Gemini has a free tier for selected models, but free access has model/rate limits and Google's pricing page says submitted free-tier content may be used to improve products. Do not send private customer data or secrets without reviewing provider terms and obtaining appropriate consent.
- For this repo, worker.mjs already supports a Cloudflare AI binding or a Gemini API key secret. Only one should be called “live” after a real harmless prompt returns a non-empty response from the deployed Worker.
- Keep provider keys in Cloudflare secrets; never expose them in index.html, local storage, GitHub commits, screenshots, or client-side JavaScript.
- Cloudflare AI models guide: https://developers.cloudflare.com/agents/runtime/operations/using-ai-models/
- Gemini billing: https://ai.google.dev/gemini-api/docs/billing/
- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing

### 4. Social publishing: Metricool, LinkedIn, and Facebook
- Metricool's current help page says its Free plan includes a limited planner (up to 20 posts/month) but excludes LinkedIn connection and API access; its API guide says API access requires Advanced or Custom. Plan details may change and the user's actual account must be checked before scheduling.
- The user previously reported a LinkedIn profile in Metricool, but a connected ChatGPT connector is not the same as an API connection from this website. Confirm the selected brand and destination profile before every publish.
- LinkedIn's official Posts API supports organic text, image, video, document, article, and multi-image posts, but requires appropriate product access and OAuth scopes. Member posting and organization posting use different permissions. This is not a general public endpoint that works without approval.
- Recommended route: use the authorized Metricool connector/app for an actual scheduled action if the plan and destination support it; otherwise generate the draft and give a transparent manual hand-off. Never say “scheduled” unless the platform returns a post/schedule identifier or the scheduled post is visible in its planner.
- Metricool Free plan comparison: https://help.metricool.com/main-differences-between-free-and-paid-plans-bl0v9
- Metricool API guide: https://help.metricool.com/basic-guide-for-api-integration-r97af
- Metricool API access details: https://help.metricool.com/api-access-export-your-metricool-data-to-other-tools-and-automate-tasks-x8ln5
- LinkedIn Posts API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api

### 5. Canva and Figma
- Connected account access or search results do not prove that a specific file can be edited or exported. Verify exact design/file identity and write permissions before changes.
- Use the existing connected Canva/Figma tools for user-authorized work, but keep the web dashboard's integration status separate from ChatGPT connector status.
- Suggested workflow: draft a visual brief, generate a post caption, identify a specific design file, confirm permission, apply a requested edit, then verify the saved design/export.
- Figma developer API: https://www.figma.com/developers/api
- Canva developer platform: https://www.canva.dev/

### 6. Automation patterns: n8n, GitHub Actions, and serverless functions
- n8n documentation is useful for trigger/action, credential, retry, and error-handling patterns. Self-hosting requires an actually running host; a static GitHub Pages site does not run n8n.
- GitHub Actions is useful for repeatable tests and low-frequency scheduled jobs, but a workflow file alone does not create an always-on agent. Confirm schedule triggers, secrets, logs, retries, and quotas.
- Cloudflare Workers can serve API requests; D1 is required for the current persistent lead database design. In this repository the D1 binding is deliberately commented out until a real database ID is provided.
- n8n docs: https://docs.n8n.io/
- GitHub Actions docs: https://docs.github.com/en/actions
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Cloudflare D1 docs: https://developers.cloudflare.com/d1/

## Comparative fit for this project

| Need | Best-fit approach | Cost / access caveat | Current project status |
|---|---|---|---|
| Online research | Search + source ledger + citations | API/search quotas; live grounding may need provider setup | Resource catalog exists; live research UI not verified |
| YouTube topic discovery | YouTube Data API search metadata | API key/OAuth and quota; metadata is not transcript | Not implemented as a live connected workflow |
| AI chat | Cloudflare Workers AI or Gemini through Worker | Model quota, key/binding, provider terms | Source code exists; live backend not verified |
| Content drafts | Dashboard + AI prompt + review | Model limits and factual review | Draft/planning tools exist |
| LinkedIn publishing | Authorized Metricool workflow or approved LinkedIn API | Plan, OAuth, product access and scopes | No direct website publishing verified |
| Facebook Page publishing | Approved Meta Page API or native Meta tools | App review/permissions and Page roles | No direct website publishing verified |
| Design workflow | Connected Figma/Canva tool with file-level permissions | Plan and file permissions | No automatic website-to-design sync verified |
| Persistent leads | Cloudflare Worker + D1 + protected admin routes | Requires actual D1 database, binding, schema, secret | D1 config intentionally not active yet |
| Background automation | Explicit scheduler + logged job + retry/failure alert | Hosting and provider quotas; not unlimited/free by default | Dry-run/local planning exists; always-on agent not verified |

## Safe acceptance criteria

A feature is “working” only when:
1. The user can see which provider/account is selected.
2. The operation uses authorized credentials on the server side.
3. Input validation, permission checks, and sensible rate limits are active.
4. The provider returns a success result and a durable ID/URL where applicable.
5. The UI reports success only after that result; failures show a useful message.
6. Tests cover success, missing configuration, permission denial, rate limiting, and provider failure.
7. No secrets or private customer data appear in browser code or public repository files.

## Recommended next sprint

1. Add a Research dashboard module that accepts a question and stores sources, summaries, dates checked, and confidence.
2. Start with manually supplied URLs and official documentation links; add Google/YouTube APIs only after keys, quotas, and terms are reviewed.
3. Add an evidence-based comparison table and exportable research report.
4. Add “Create content draft from selected sources,” with citations and a human review gate.
5. Keep social scheduling as a separate action requiring explicit target account, timezone, media validation, approval, and confirmation from the publishing provider.
6. Keep the production release gate unchanged: test live health, real AI chat, D1 lead CRUD, and actual social scheduling separately.

**Important:** This research file does not mean that Google Search, YouTube, Gemini, Metricool, Figma, Canva, or n8n has been integrated into the deployed website. It documents the verified public-source findings and the implementation boundaries.
