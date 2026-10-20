const { test } = require("node:test");
const assert = require("node:assert/strict");
const getWorker = async () => (await import("../worker.mjs")).default;

test("worker health endpoint responds without database credentials", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/health"), {}, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    status: "degraded",
    service: "naz-business-assistant",
    storage: "not-configured",
    ai: "not-configured",
    chatProtection: "not-configured",
    admin: "not-configured",
    chatReady: false
  });
});

test("worker health reports chat readiness separately from API liveness", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/health"), {
    AI: { async run() { return { response: "test" }; } },
    CHAT_LIMITER: { async limit() { return { success: true }; } },
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars"
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.status, "ready");
  assert.equal(data.chatReady, true);
  assert.equal(data.ai, "configured");
  assert.equal(data.chatProtection, "configured");
  assert.equal(data.admin, "configured");
});

test("worker permits the configured dashboard origin and rejects other origins", async () => {
  const worker = await getWorker();
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
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/leads", {
    headers: { Origin: "https://allahnawaz36.github.io" }
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    CHAT_LIMITER: { async limit() { return { success: true }; } },
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars"
  });
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /token/i);
});

test("worker rejects invalid JSON with a client error instead of crashing", async () => {
  const worker = await getWorker();
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
    CHAT_LIMITER: { async limit() { return { success: true }; } },
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars",
    DB: { prepare() { return { async all() { return { results: [] }; } }; } }
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Invalid JSON/i);
});

test("worker validates fields during partial updates", async () => {
  const worker = await getWorker();
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
    CHAT_LIMITER: { async limit() { return { success: true }; } },
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars",
    DB: db
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid email/i);
});

test("worker chat clearly reports when Workers AI is not configured", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/chat", {
    method: "POST",
    headers: { Origin: "https://allahnawaz36.github.io", "Content-Type": "application/json" },
    body: JSON.stringify({ message: "What projects are in this portfolio?" })
  }), { ALLOWED_ORIGIN: "https://allahnawaz36.github.io", CHAT_LIMITER: { async limit() { return { success: true }; } } });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /AI is not configured/i);
});


test("worker fails closed when the public chat rate limiter is missing", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/chat", {
    method: "POST",
    headers: { Origin: "https://allahnawaz36.github.io", "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello" })
  }), { ALLOWED_ORIGIN: "https://allahnawaz36.github.io", AI: { async run() { return { response: "Should not run" }; } } });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /CHAT_LIMITER/i);
});

test("worker returns 429 when the public chat rate limit is exceeded", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/chat", {
    method: "POST",
    headers: { Origin: "https://allahnawaz36.github.io", "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello" })
  }), { ALLOWED_ORIGIN: "https://allahnawaz36.github.io", CHAT_LIMITER: { async limit() { return { success: false }; } }, AI: { async run() { return { response: "Should not run" }; } } });
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /Too many chat requests/i);
});

test("worker chat returns the AI response when a Workers AI binding is configured", async () => {
  const worker = await getWorker();
  let modelName = "";
  const response = await worker.fetch(new Request("https://example.workers.dev/api/chat", {
    method: "POST",
    headers: { Origin: "https://allahnawaz36.github.io", "Content-Type": "application/json" },
    body: JSON.stringify({ message: "What design services are offered?", platform: "saas" })
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    CHAT_LIMITER: { async limit() { return { success: true }; } },
    AI: { async run(model, input) {
      modelName = model;
      assert.equal(input.messages.at(-1).content, "What design services are offered?");
      assert.match(input.messages[0].content, /saas/i);
      assert.match(input.messages[0].content, /dashboards/i);
      return { response: "UI/UX and product design services." };
    } }
  });
  assert.equal(response.status, 200);
  assert.equal(modelName, "@cf/meta/llama-3.1-8b-instruct");
  assert.deepEqual(await response.json(), { answer: "UI/UX and product design services.", mode: "ai", platform: "saas" });
});

test("worker supports customer-support reply drafting without inventing policy context", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/chat", {
    method: "POST",
    headers: { Origin: "https://allahnawaz36.github.io", "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Customer says their order is late. Draft a warm reply.",
      platform: "ecommerce",
      task: "support-reply"
    })
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    CHAT_LIMITER: { async limit() { return { success: true }; } },
    AI: { async run(model, input) {
      assert.match(input.messages[0].content, /customer-support reply drafting assistant/i);
      assert.match(input.messages[0].content, /Do not invent company policies/i);
      assert.match(input.messages[0].content, /ecommerce/i);
      return { response: "Thanks for reaching out. Could you share your order reference so we can check?" };
    } }
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.mode, "ai");
  assert.equal(data.platform, "ecommerce");
  assert.match(data.answer, /order reference/i);
});
