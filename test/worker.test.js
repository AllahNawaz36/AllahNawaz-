const { test } = require("node:test");
const assert = require("node:assert/strict");
const getWorker = async () => (await import("../worker.mjs")).default;

test("worker health endpoint responds without database credentials", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/health"), {}, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "naz-business-assistant",
    storage: "not-configured",
    ai: "not-configured",
    chatProtection: "not-configured"
  });
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

test("worker hides internal database errors from API clients", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/leads", {
    method: "POST",
    headers: {
      Origin: "https://allahnawaz36.github.io",
      Authorization: "Bearer this-is-a-long-test-token-that-is-over-32-chars",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: "Ada", email: "ada@example.com", project: "Design" })
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    ADMIN_TOKEN: "this-is-a-long-test-token-that-is-over-32-chars",
    DB: { prepare() { return { bind() { return { async run() { throw new Error("internal-db-secret-path"); } }; } }; } }
  });
  assert.equal(response.status, 500);
  const data = await response.json();
  assert.equal(data.error, "Unable to create lead. Please try again.");
  assert.doesNotMatch(JSON.stringify(data), /internal-db-secret-path/);
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
  assert.equal(modelName, "@cf/zai-org/glm-4.7-flash");
  // GLM supports max_completion_tokens; avoid the deprecated max_tokens parameter.
  assert.equal(response.status, 200);
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

test("worker hides upstream AI error details from public clients", async () => {
  const worker = await getWorker();
  const response = await worker.fetch(new Request("https://example.workers.dev/api/chat", {
    method: "POST",
    headers: { Origin: "https://allahnawaz36.github.io", "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Please help", platform: "general" })
  }), {
    ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
    CHAT_LIMITER: { async limit() { return { success: true }; } },
    AI: { async run() { throw Object.assign(new Error("provider-internal-token-or-request-id"), { status: 500 }); } }
  });
  assert.equal(response.status, 502);
  const data = await response.json();
  assert.equal(data.error, "AI service temporarily unavailable. Please try again.");
  assert.doesNotMatch(JSON.stringify(data), /provider-internal-token-or-request-id/);
});


test("worker hides internal database errors for lead reads and deletes", async () => {
  const worker = await getWorker();
  const token = "this-is-a-long-test-token-that-is-over-32-chars";
  const lead = { id: "lead-1", name: "Ada", email: "ada@example.com", source: "", service: "", project: "Design", budget: "", stage: 0, notes: "", createdAt: "2026-01-01T00:00:00.000Z" };
  const cases = [
    {
      method: "GET",
      path: "/api/leads",
      expected: "Unable to load leads. Please try again.",
      DB: { prepare() { return { async all() { throw new Error("private-db-read-detail"); } }; } }
    },
    {
      method: "GET",
      path: "/api/leads/lead-1",
      expected: "Unable to load lead. Please try again.",
      DB: { prepare() { return { bind() { return { async first() { throw new Error("private-db-lookup-detail"); } }; } }; } }
    },
    {
      method: "DELETE",
      path: "/api/leads/lead-1",
      expected: "Unable to delete lead. Please try again.",
      DB: { prepare(query) { return { bind() { return {
        async first() { return lead; },
        async run() { throw new Error("private-db-delete-detail"); }
      }; } }; } }
    }
  ];

  for (const item of cases) {
    const response = await worker.fetch(new Request("https://example.workers.dev" + item.path, {
      method: item.method,
      headers: {
        Origin: "https://allahnawaz36.github.io",
        Authorization: "Bearer " + token
      }
    }), {
      ALLOWED_ORIGIN: "https://allahnawaz36.github.io",
      ADMIN_TOKEN: token,
      DB: item.DB
    });
    assert.equal(response.status, 503, item.method + " " + item.path);
    const data = await response.json();
    assert.equal(data.error, item.expected);
    assert.doesNotMatch(JSON.stringify(data), /private-db-(read|lookup|delete)-detail/);
  }
});
