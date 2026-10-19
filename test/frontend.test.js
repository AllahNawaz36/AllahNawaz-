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
  assert.doesNotMatch(html, /You confirmed ANJAN MALIK JAN is your parent Metricool account/i);
});


test("support replies are honestly labelled and backend requests have a timeout", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /Customer-support reply draft/);
  assert.match(html, /LOCAL TEMPLATE DRAFT — AI service unavailable/);
  assert.doesNotMatch(html, /DEMO DRAFT — AI backend unavailable/);
  assert.match(html, /setTimeout\(\(\)=>controller\.abort\(\),12000\)/, "API requests should not stay loading forever");
  assert.match(html, /The server took too long to respond/);
});

test("UX research tools split multiline input and produce readable line breaks", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /uxTestTasks"\)\.value\.split\("\\n"\)/, "usability test tasks should split on actual newline characters");
  assert.match(html, /USABILITY TEST PLAN\\nObjective:/, "usability plan should contain readable line breaks");
  assert.match(html, /RESEARCH NOTES — SYNTHESIS TEMPLATE\\nContext/, "research synthesis should contain readable line breaks");
});


test("icon fallbacks preserve aligned icon elements when the icon CDN is unavailable", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /el\.textContent=fallback/, "fallback text should stay inside the icon element");
  assert.match(html, /el\.classList\.add\("icon-fallback"\)/, "fallback icons should receive a dedicated style");
  assert.doesNotMatch(html, /el\.replaceWith\(document\.createTextNode\(fallback\)\)/, "fallback must not destroy the icon wrapper and break alignment");
  assert.match(html, /\.icon-fallback\{display:inline-grid!important;place-items:center/, "fallback icon alignment styles should exist");
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
