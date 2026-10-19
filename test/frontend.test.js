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
  assert.match(html, /connected Metricool brand has not been verified as your account/i);
  assert.match(html, /Do not publish or schedule from it until you confirm the correct brand/i);
  assert.doesNotMatch(html, /You confirmed ANJAN MALIK JAN is your parent Metricool account/i);
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
  assert.equal((nav.match(/class="mobile-nav-icon"/g) || []).length, 8, "each mobile navigation item should have an icon wrapper");
  assert.equal((nav.match(/class="mobile-nav-label"/g) || []).length, 8, "each mobile navigation item should have a dedicated label");
  assert.match(nav, /aria-current="page"/, "the active navigation item should be identified accessibly");
  assert.match(html, /\.mobile-nav button \.mobile-nav-icon \.icon,.mobile-nav button \.mobile-nav-icon svg\{display:block;width:19px;height:19px/, "mobile icons should share consistent dimensions");
  assert.match(html, /\.mobile-nav button \.mobile-nav-label\{display:block;width:100%;height:auto/, "mobile labels should not inherit icon wrapper sizing");
});
