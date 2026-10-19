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
