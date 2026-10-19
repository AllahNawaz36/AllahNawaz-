const { test } = require("node:test");
const assert = require("node:assert/strict");
const getWorker = async () => (await import("../worker.mjs")).default;

test("worker health endpoint responds without database credentials", async () => {\n  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/health"), {}, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "naz-business-assistant",
    storage: "not-configured"
  });
});

test("worker permits the configured dashboard origin and rejects other origins", async () => {\n  const worker = await getWorker();
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

test("worker protects lead endpoints with a bearer token", async () => {\n  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/leads", {
    headers: { Origin: "https://allahnawaz36.github.io" }
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars"
  });
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /token/i);
});

test("worker rejects invalid JSON with a client error instead of crashing", async () => {\n  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/leads", {
    method: "POST",
    headers: {
      Origin: "https://allahnawaz36.github.io",
      Authorization: "Bearer this-is-a-long-test-token-that-is-over-32-chars",
      "Content-Type": "application/json"
    },
    body: "{"
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars",
    DB: { prepare() { return { async all() { return { results: [] }; } }; } }
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Invalid JSON/i);
});

test("worker validates fields during partial updates", async () => {\n  const worker = await getWorker();
  const db = {
    prepare(query) {
      return {
        bind() {
          return {
            async first() {
              return { id: "lead-1", name: "Ada", email: "ada@example.com", source: "", service: "", project: "Design", budget: "", stage: 0, notes: "", createdAt: "2026-01-01T00:00:00.000Z" };
            },
            async run() { return { success: true }; },
            async all() { return { results: [] }; }
          };
        }
      };
    }
  };
  const response = await worker.fetch(new Request("https://example.workers.dev/api/leads/lead-1", {
    method: "PATCH",
    headers: {
      Origin: "https://allahnawaz36.github.io",
      Authorization: "Bearer this-is-a-long-test-token-that-is-over-32-chars",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: "not-an-email" })
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars",
    DB: db
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid email/i);
});
