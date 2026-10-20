const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

test("inline dashboard scripts parse and API settings controls exist", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length > 0, "dashboard should contain inline scripts");
  for (const [index, match] of scripts.entries()) {
    if (match[1].trim()) assert.doesNotThrow(() => new vm.Script(match[1]), `inline script ${index + 1} should parse`);
  }
  for (const id of ["apiEndpoint", "saveApiEndpoint", "clearApiEndpoint", "checkBackend", "adminLogin", "exportBackup", "importBackupButton", "importBackupFile"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `missing expected UI element: ${id}`);
  }
  assert.match(html, /nazProApiBase/, "API endpoint should be stored in browser-local settings");
  assert.doesNotMatch(html, /sessionStorage|nazProAdminToken/, "admin token must not persist in browser storage");
  assert.match(html, /Admin token stays in page memory only/, "admin token lifetime should be disclosed");
});


test("local backup controls and restore validation are present", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /naz-business-assistant-backup-/);
  assert.match(html, /formatVersion:1/);
  assert.match(html, /payload\?\.app!==\"Naz Business Assistant Pro\"/);
  assert.match(html, /Keep the file private/);
});


test("AI chat widget uses the configured backend and reports real connection state", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /id="aiChatPanel"/, "AI chat panel should exist");
  assert.match(html, /id="aiChatLauncher"/, "floating chat launcher should exist");
  assert.match(html, /id="aiChatTopic"/, "chat should offer a topic selector");
  assert.match(html, /fetch\(base\+"\/api\/health"/, "chat should check the configured backend health");
  assert.match(html, /fetch\(base\+"\/api\/chat"/, "chat should send messages to the configured API");
  assert.match(html, /Backend not configured/, "unconfigured backend must be clearly disclosed");
  assert.match(html, /does not publish posts, send messages or change accounts/, "chat must not imply external actions are connected");
  assert.ok(html.indexOf('id="aiChatPanel"') < html.lastIndexOf("<script>"), "chat markup must exist before its initialization script");
});


test("social account reminder does not falsely claim the connected Metricool brand is verified", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /connected publishing account has not been verified/i);
  assert.match(html, /Do not schedule or publish until you confirm the correct brand and LinkedIn profile/i);
  assert.doesNotMatch(html, /You confirmed .* is your parent Metricool account/i);
  assert.match(html, /copyCaptionOpenLinkedIn/);
  assert.match(html, /Open LinkedIn composer/);
  assert.match(html, /Metricool \(optional, if your plan supports it\)/);
  assert.doesNotMatch(html, /openMetricoolPlanner/);
});


test("static pages avoid third-party runtime assets and expose the privacy notice", () => {
  const root = path.join(__dirname, "..");
  const dashboard = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const portfolio = fs.readFileSync(path.join(root, "portfolio.html"), "utf8");
  const privacy = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
  assert.doesNotMatch(dashboard, /fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com\/lucide/);
  assert.doesNotMatch(portfolio, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(dashboard, /href="privacy\.html"/);
  assert.match(privacy, /Do not enter real customer/);
  assert.match(privacy, /does not implement a complete retention schedule or automatic deletion policy/);
});

test("support replies are honestly labelled and backend requests have a timeout", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /Customer-support reply draft/);
  assert.match(html, /LOCAL TEMPLATE DRAFT — AI service unavailable/);
  assert.doesNotMatch(html, /DEMO DRAFT — AI backend unavailable/);
  assert.ok(html.includes("setTimeout(()=>controller.abort(),12000)"), "API requests should not stay loading forever");
  assert.match(html, /The server took too long to respond/);
});

test("UX research tools split multiline input and produce readable line breaks", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /uxTestTasks"\)\.value\.split\("\\n"\)/, "usability test tasks should split on actual newline characters");
  assert.match(html, /USABILITY TEST PLAN\\nObjective:/, "usability plan should contain readable line breaks");
  assert.match(html, /RESEARCH NOTES — SYNTHESIS TEMPLATE\\nContext/, "research synthesis should contain readable line breaks");
});


test("offline icon fallback draws aligned local SVG icons when the icon CDN is unavailable", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /const shapes=\{/, "offline icon paths should be defined locally");
  assert.match(html, /document\.createElementNS\("http:\/\/www\.w3\.org\/2000\/svg","svg"\)/, "fallback should create an inline SVG element");
  assert.match(html, /el\.replaceChildren\(svg\)/, "fallback SVG should stay inside the icon wrapper");
  assert.match(html, /el\.classList\.add\("icon-fallback"\)/, "fallback icons should receive a dedicated style");
  assert.match(html, /\.icon-fallback\{display:inline-grid!important;place-items:center/, "fallback icon alignment styles should exist");
  assert.match(html, /\.icon-fallback svg\{display:block;width:100%;height:100%;min-width:0/, "SVG glyphs should scale to their icon wrapper on desktop and mobile");
  assert.match(html, /"chart-no-axes-combined":\[/, "common dashboard icons should have explicit local paths");
  const iconNames = [...html.matchAll(/data-lucide="([^"]+)"/g)].map(match => match[1]);
  const shapeBlock = html.match(/const shapes=\{([\s\S]*?)\n \};/)?.[1] || "";
  const shapeNames = new Set([...shapeBlock.matchAll(/(?:^|\n\s*)(?:"([^"]+)"|([\w-]+)):\[/g)].map(match => match[1] || match[2]));
  assert.ok(iconNames.length > 0, "dashboard should use named icons");
  assert.deepEqual([...new Set(iconNames)].filter(name => !shapeNames.has(name)), [], "every dashboard icon should have a matching offline SVG shape");
});


test("Social Publisher includes a downloadable accessible LinkedIn visual concept", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /id="socialPosterSvg"[^>]*viewBox="0 0 360 450"/, "visual should use a 4:5 poster artboard");
  assert.match(html, /aria-labelledby="socialPosterTitle socialPosterDesc"/, "poster should expose an accessible title and description");
  assert.match(html, /id="downloadSocialVisual"/, "users should be able to download the vector visual");
  assert.match(html, /clone\.setAttribute\("width","1080"\);clone\.setAttribute\("height","1350"\)/, "download should use a 1080 by 1350 artboard");
  assert.match(html, /image\/svg\+xml;charset=utf-8/, "download should be a valid SVG asset");
  assert.match(html, /id="downloadSocialVisualPng"/, "users should be able to export an upload-ready PNG");
  assert.match(html, /canvas\.toBlob\(blob=>/, "PNG export should rasterize the poster in-browser");
  assert.match(html, /allah-nawaz-linkedin-ux-visual\.png/, "PNG download should use a clear file name");
});

test("mobile navigation keeps icon and label in separate aligned elements", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav, "mobile navigation should exist");
  assert.equal((nav.match(/class="mobile-nav-icon"/g) || []).length, 6, "each primary mobile navigation item should have an icon wrapper");
  assert.equal((nav.match(/class="mobile-nav-label"/g) || []).length, 6, "each primary mobile navigation item should have a dedicated label");
  assert.match(nav, /aria-current="page"/, "the active navigation item should be identified accessibly");
  assert.match(html, /\.mobile-nav button \.mobile-nav-icon \.icon,.mobile-nav button \.mobile-nav-icon svg\{display:block;width:19px;height:19px/, "mobile icons should share consistent dimensions");
  assert.match(html, /\.mobile-nav button \.mobile-nav-label\{display:block;width:100%;height:auto/, "mobile labels should not inherit icon wrapper sizing");
});


test("mobile More menu exposes all secondary pages and supports accessible open/close", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const panel = html.match(/<div id="mobileMorePanel"[\s\S]*?<\/div>/)?.[0];
  assert.ok(panel, "mobile More panel should exist");
  for (const page of ["social", "automation", "seo", "email", "comms", "support", "tasks", "analytics", "settings"]) {
    assert.match(panel, new RegExp('data-page="' + page + '"'), "More menu should expose " + page);
  }
  assert.match(html, /id="mobileMoreButton"[^>]*aria-controls="mobileMorePanel"[^>]*aria-expanded="false"/, "More button should describe its controlled panel");
  assert.match(html, /mobileMoreButton\.addEventListener\("click"/, "More button should open and close the panel");
  assert.match(html, /event\.key==="Escape"/, "Escape should close the panel");
  assert.match(html, /if\(morePanel\)morePanel\.hidden=true/, "choosing a page should close the panel");
  assert.match(html, /\.mobile-more-panel:not\(\[hidden\]\)\{position:fixed/, "open menu should be positioned above the mobile bottom bar");
});


test("icon fallbacks have consistent spacing and More menu uses matching accessible semantics", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const iconTags = [...html.matchAll(/<i\b[^>]*data-lucide="[^"]+"[^>]*>/g)].map(match => match[0]);
  assert.ok(iconTags.length > 0, "dashboard should contain Lucide icons");
  assert.ok(iconTags.every(tag => /data-fallback="[^"]+"/.test(tag)), "every Lucide icon should include a fallback glyph");
  assert.match(html, /\.icon-fallback\{display:inline-grid!important;place-items:center;flex:0 0 var\(--icon-size,18px\);/, "fallback icons should use fixed geometry and centering");
  assert.match(html, /id="mobileMorePanel" class="mobile-more-panel" role="menu" aria-labelledby="mobileMoreButton" hidden/, "More panel should expose an accessible menu label");
  assert.match(html, /\.mobile-more-panel \.icon-fallback\{flex-basis:20px;width:20px;height:20px;min-width:20px\}/, "More menu fallback icons should share consistent sizing");
});


test("Automation Studio lists official Google resources with honest connection labels", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const automationStart = html.indexOf('<section class="page" id="page-automation">');
  const automationEnd = html.indexOf('<section class="page" id="page-seo">', automationStart);
  const automation = automationStart >= 0 && automationEnd > automationStart ? html.slice(automationStart, automationEnd) : "";
  assert.match(automation, /Google growth toolkit/, "Google resource hub should be in Automation Studio");
  for (const label of ["Gemini API \/ AI Studio", "PageSpeed Insights", "Search Console", "Google Trends", "Google Analytics", "Google Apps Script", "Google Drive", "YouTube Studio", "Google Business Profile"]) {
    assert.ok(automation.includes(label), "Google resource hub should include " + label);
  }
  assert.match(automation, /developers\.google\.com\/webmaster-tools\/v1\/how-tos\/authorizing/, "Search Console should link to official authorization docs");
  assert.match(automation, /does not pull analytics data automatically yet/, "directory must not imply Analytics is already connected");
  assert.match(automation, /never put an API key in frontend code/, "API-key safety guidance should be visible");
});


test("Automation Studio lists free-first orchestration platforms with deployment and quota caveats", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const start = html.indexOf('<section class="page" id="page-automation">');
  const end = html.indexOf('<section class="page" id="page-seo">', start);
  const automation = start >= 0 && end > start ? html.slice(start, end) : "";
  assert.match(automation, /Automation & agent platforms/, "automation platform directory should exist");
  for (const name of ["n8n Community Edition", "Groq API", "Cloudflare Workers AI", "GitHub Actions", "Hugging Face", "Ollama", "Make", "Zapier"]) {
    assert.ok(automation.includes(name), "directory should include " + name);
  }
  assert.match(automation, /GitHub Pages alone cannot run n8n/, "static hosting limitation should be explicit");
  assert.match(automation, /never paste passwords, access tokens or API keys into this page/i, "secret-handling guidance should be explicit");
  assert.match(automation, /not a guaranteed always-on server/, "scheduled CI should not be presented as always-on hosting");
});
