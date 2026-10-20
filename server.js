"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const MAX_BODY_BYTES = 1024 * 1024;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://allahnawaz36.github.io";
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map();

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && origin !== ALLOWED_ORIGIN) {
    send(res, 403, { error: "Origin not allowed." });
    return false;
  }
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  return true;
}

function rateLimited(req, pathname) {
  if (!pathname.startsWith("/api/")) return false;
  const now = Date.now();
  const group = pathname.startsWith("/api/leads") ? "leads" : "general";
  const key = (req.socket.remoteAddress || "unknown") + ":" + group;
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (rateBuckets.size > 1000) {
    for (const [candidate, value] of rateBuckets) {
      if (now - value.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(candidate);
    }
  }
  return bucket.count > (group === "leads" ? 30 : 120);
}

if (ADMIN_TOKEN.length < 32) {
  console.error("Startup blocked: set ADMIN_TOKEN to a random secret of at least 32 characters.");
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]\n", { flag: "wx" });

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

function authorized(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const supplied = Buffer.from(match[1], "utf8");
  const expected = Buffer.from(ADMIN_TOKEN, "utf8");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

function readLeads() {
  try {
    const parsed = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read lead store:", error.message);
    throw new Error("Lead storage is unavailable.");
  }
}

function writeLeads(leads) {
  const temp = LEADS_FILE + "." + crypto.randomUUID() + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(leads, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(temp, LEADS_FILE);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    let settled = false;
    let tooLarge = false;
    const rejectOnce = error => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const declaredLength = Number(req.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      rejectOnce(Object.assign(new Error("Request body too large."), { status: 413 }));
      req.resume();
      return;
    }
    req.setEncoding("utf8");
    req.on("data", chunk => {
      if (tooLarge || settled) return;
      bytes += Buffer.byteLength(chunk, "utf8");
      if (bytes > MAX_BODY_BYTES) {
        tooLarge = true;
        body = "";
        rejectOnce(Object.assign(new Error("Request body too large."), { status: 413 }));
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (settled || tooLarge) return;
      if (!body) {
        settled = true;
        return resolve({});
      }
      try {
        const parsed = JSON.parse(body);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return rejectOnce(Object.assign(new Error("JSON object required."), { status: 400 }));
        }
        settled = true;
        resolve(parsed);
      } catch {
        rejectOnce(Object.assign(new Error("Invalid JSON body."), { status: 400 }));
      }
    });
    req.on("error", error => rejectOnce(error));
  });
}

function validateLead(input, partial = false) {
  const fields = ["name", "email", "source", "service", "project", "budget", "stage", "notes"];
  const lead = {};
  for (const key of fields) {
    if (partial && !(key in input)) continue;
    if (!(key in input) && !partial) continue;
    lead[key] = input[key];
  }
  if (!partial) {
    if (typeof lead.name !== "string" || !lead.name.trim()) throw Object.assign(new Error("Name is required."), { status: 400 });
    if (typeof lead.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) throw Object.assign(new Error("A valid email is required."), { status: 400 });
    if (typeof lead.project !== "string" || !lead.project.trim()) throw Object.assign(new Error("Project is required."), { status: 400 });
    lead.stage = Number.isInteger(lead.stage) && lead.stage >= 0 && lead.stage <= 20 ? lead.stage : 0;
  } else if ("stage" in lead && (!Number.isInteger(lead.stage) || lead.stage < 0 || lead.stage > 20)) {
    throw Object.assign(new Error("Invalid lead stage."), { status: 400 });
  }
  for (const key of ["name", "email", "source", "service", "project", "budget", "notes"]) {
    if (key in lead && (typeof lead[key] !== "string" || lead[key].length > 5000)) {
      throw Object.assign(new Error("Invalid " + key + " field."), { status: 400 });
    }
    if (typeof lead[key] === "string") lead[key] = lead[key].trim();
  }
  return lead;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");

    if (!applyCors(req, res)) return;
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return send(res, 400, { error: "Invalid URL encoding." });
    }
    if (req.method === "OPTIONS") {
      if (!req.headers.origin) return send(res, 400, { error: "Origin header required." });
      res.writeHead(204);
      return res.end();
    }
    if (rateLimited(req, pathname)) {
      res.setHeader("Retry-After", "60");
      return send(res, 429, { error: "Too many requests. Wait a minute and try again." });
    }

    if (req.method === "GET" && pathname === "/api/health") {
      return send(res, 200, { ok: true, service: "naz-business-assistant" });
    }

    if (pathname === "/api/leads" || pathname.startsWith("/api/leads/")) {
      if (!authorized(req)) return send(res, 401, { error: "Admin token required or invalid." });

      if (req.method === "GET" && pathname === "/api/leads") {
        return send(res, 200, { leads: readLeads() });
      }

      if (req.method === "POST" && pathname === "/api/leads") {
        const input = await readBody(req);
        const lead = validateLead(input);
        lead.id = crypto.randomUUID();
        lead.createdAt = new Date().toISOString();
        const leads = readLeads();
        leads.unshift(lead);
        writeLeads(leads);
        return send(res, 201, { lead });
      }

      const id = pathname.startsWith("/api/leads/") ? pathname.slice("/api/leads/".length) : "";
      if (!id || id.includes("/")) return send(res, 404, { error: "Lead not found." });
      const leads = readLeads();
      const index = leads.findIndex(item => item.id === id);
      if (index < 0) return send(res, 404, { error: "Lead not found." });

      if (req.method === "PATCH") {
        const input = await readBody(req);
        const patch = validateLead(input, true);
        leads[index] = { ...leads[index], ...patch, id: leads[index].id, createdAt: leads[index].createdAt };
        writeLeads(leads);
        return send(res, 200, { lead: leads[index] });
      }
      if (req.method === "DELETE") {
        leads.splice(index, 1);
        writeLeads(leads);
        return send(res, 200, { ok: true });
      }
      return send(res, 405, { error: "Method not allowed." });
    }

    if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "frame-ancestors 'none'"
      });
      return fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
    }

    return send(res, 404, { error: "Not found." });
  } catch (error) {
    if (!res.headersSent) send(res, error.status || 500, { error: error.status ? error.message : "Internal server error." });
    if (!error.status) console.error("Request failed:", error.message);
  }
});

server.listen(PORT, HOST, () => console.log("Naz Business Assistant listening on " + HOST + ":" + PORT));
