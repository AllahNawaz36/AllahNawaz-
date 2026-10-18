const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

test("backend health and token-protected lead CRUD", async () => {
  const port = await freePort();
  const token = "test-secret-that-is-at-least-32-characters-long";
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "naz-assistant-test-"));
  const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", ADMIN_TOKEN: token, DATA_DIR: dataDir },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stderr = "";
  child.stderr.on("data", chunk => { stderr += chunk.toString(); });
  const base = `http://127.0.0.1:${port}`;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (child.exitCode !== null) throw new Error(`Server exited early: ${stderr}`);
      try {
        const response = await fetch(base + "/api/health");
        if (response.ok) { ready = true; break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, `server did not start: ${stderr}`);

    const health = await fetch(base + "/api/health");
    assert.deepEqual(await health.json(), { ok: true, service: "naz-business-assistant" });

    const unauthorized = await fetch(base + "/api/leads");
    assert.equal(unauthorized.status, 401);

    const createdResponse = await fetch(base + "/api/leads", {
      method: "POST", headers,
      body: JSON.stringify({ name: "Test Person", email: "test@example.com", project: "Smoke test", stage: 0 })
    });
    assert.equal(createdResponse.status, 201);
    const created = (await createdResponse.json()).lead;
    assert.ok(created.id);

    const listed = await fetch(base + "/api/leads", { headers });
    assert.equal((await listed.json()).leads.length, 1);

    const patched = await fetch(base + "/api/leads/" + encodeURIComponent(created.id), {
      method: "PATCH", headers, body: JSON.stringify({ stage: 2 })
    });
    assert.equal(patched.status, 200);
    assert.equal((await patched.json()).lead.stage, 2);

    const deleted = await fetch(base + "/api/leads/" + encodeURIComponent(created.id), { method: "DELETE", headers });
    assert.equal(deleted.status, 200);
    const afterDelete = await fetch(base + "/api/leads", { headers });
    assert.equal((await afterDelete.json()).leads.length, 0);
  } finally {
    child.kill("SIGTERM");
    await new Promise(resolve => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
      setTimeout(resolve, 1000);
    });
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
