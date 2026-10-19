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
