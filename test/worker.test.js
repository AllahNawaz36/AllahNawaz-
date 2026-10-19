const { test } = require("node:test");
const assert = require("node:assert/strict");
const worker = require("../worker.mjs").default;

test("worker health endpoint responds without database credentials", async () => {
  const response = await worker.fetch(new Request("https://example.workers.dev/api/health"), {}, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "naz-business-assistant",
    storage: "not-configured"
  });
});

test("worker permits the configured dashboard origin and rejects other origins", async () => {
  const env = { ALLOWED_ORIGIN: "https://allahnawaz36.github.io" };
  const allowed = await worker.fetch(new Request("https://example.workers.dev/api/health", {
    headers: { Origin: "https://allahnawaz36.github.io" }
  }), env);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "https://allahnawaz36.github.io");

  const denied = await worker.fetch(new Request("https://example.workers.dev/api/leads", {
    headers: { Origin: "https://attacker.example" }
  }), env);
  assert.equal(denied.status, 403);
});

test("worker protects lead endpoints with a bearer token", async () => {
  const response = await worker.fetch(new Request("https://example.workers.dev/api/leads", {
    headers: { Origin: "https://allahnawaz36.github.io" }
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars"
  });
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /token/i);
});
