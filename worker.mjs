/**
 * Naz Business Assistant Pro — Cloudflare Workers API
 * Requires D1 binding named DB and secret ADMIN_TOKEN.
 * Public origin is restricted through ALLOWED_ORIGIN.
 */
const DEFAULT_ORIGIN = "https://allahnawaz36.github.io";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
};

function response(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGIN || DEFAULT_ORIGIN)
    .split(",").map(value => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

function corsHeaders(origin) {
  return origin ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    "access-control-max-age": "86400",
    "vary": "Origin"
  } : { "vary": "Origin" };
}

function authorized(request, env) {
  const expected = String(env.ADMIN_TOKEN || "");
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("Authorization") || "");
  if (expected.length < 32 || !match || match[1].length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ match[1].charCodeAt(i);
  return mismatch === 0;
}

async function bodyObject(request) {
  const text = await request.text();
  if (text.length > 1_000_000) throw Object.assign(new Error("Request body too large."), { status: 413 });
  if (!text) return {};
  let value;
  try { value = JSON.parse(text); } catch { throw Object.assign(new Error("Invalid JSON body."), { status: 400 }); }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error("JSON object required."), { status: 400 });
  }
  return value;
}

function validateLead(input, partial = false) {
  const keys = ["name", "email", "source", "service", "project", "budget", "stage", "notes"];
  const lead = {};
  for (const key of keys) {
    if (Object.hasOwn(input, key)) lead[key] = input[key];
    else if (!partial && ["name", "email", "project"].includes(key)) {
      throw Object.assign(new Error(key.charAt(0).toUpperCase() + key.slice(1) + " is required."), { status: 400 });
    }
  }
  if (!partial || "name" in lead) {
    if (typeof lead.name !== "string" || !lead.name.trim()) throw Object.assign(new Error("Name is required."), { status: 400 });
  }
  if (!partial || "email" in lead) {
    if (typeof lead.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) throw Object.assign(new Error("A valid email is required."), { status: 400 });
  }
  if (!partial || "project" in lead) {
    if (typeof lead.project !== "string" || !lead.project.trim()) throw Object.assign(new Error("Project is required."), { status: 400 });
  }
  if ("stage" in lead && (!Number.isInteger(lead.stage) || lead.stage < 0 || lead.stage > 20)) {
    throw Object.assign(new Error("Invalid lead stage."), { status: 400 });
  }
  for (const key of ["name", "email", "source", "service", "project", "budget", "notes"]) {
    if (key in lead && (typeof lead[key] !== "string" || lead[key].length > 5000)) {
      throw Object.assign(new Error("Invalid " + key + " field."), { status: 400 });
    }
    if (typeof lead[key] === "string") lead[key] = lead[key].trim();
  }
  if (!partial && !("stage" in lead)) lead.stage = 0;
  return lead;
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") {
      if (!origin) return response({ error: "Origin not allowed." }, 403);
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET" && path === "/api/health") {
      return response({
        ok: true,
        service: "naz-business-assistant",
        storage: env.DB ? "d1" : "not-configured",
        ai: env.AI ? "configured" : "not-configured"
      }, 200, cors);
    }

    if (origin === "" && request.headers.has("Origin")) {
      return response({ error: "Origin not allowed." }, 403);
    }

    if (path === "/api/chat") {
      if (request.method !== "POST") return response({ error: "Method not allowed." }, 405, cors);
      if (!env.AI || typeof env.AI.run !== "function") {
        return response({ error: "AI is not configured. Add the Workers AI binding named AI." }, 503, cors);
      }
      try {
        const input = await bodyObject(request);
        const message = typeof input.message === "string" ? input.message.trim() : "";
        if (!message) return response({ error: "A message is required." }, 400, cors);
        if (message.length > 1000) return response({ error: "Message must be 1000 characters or fewer." }, 413, cors);
        const systemPrompt = [
          "You are Allah Nawaz's portfolio assistant.",
          "Answer accurately and concisely about UI/UX design, product design, portfolio projects, skills, and hiring enquiries.",
          "Known details: Allah Nawaz is a UI/UX and Product Designer based in Islamabad, Pakistan.",
          "Portfolio: https://www.behance.net/allahnawaz175",
          "LinkedIn: https://www.linkedin.com/in/allah-nawaz-productdesigner/",
          "Projects include WellnessWell social creatives, Jalal Electronics product marketing ads, and a T-Tech Solutions SaaS UX concept.",
          "Do not invent client results, prices, availability, testimonials, or experience. If unsure, say so and direct visitors to LinkedIn.",
          "Do not claim to book work, send messages, or perform actions outside this chat."
        ].join(" ");
        const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 300
        });
        const answer = typeof result?.response === "string" ? result.response.trim() : "";
        if (!answer) return response({ error: "AI returned an empty response. Please try again." }, 502, cors);
        return response({ answer, mode: "ai" }, 200, cors);
      } catch (error) {
        return response({ error: error.status ? error.message : "AI service temporarily unavailable." }, error.status || 502, cors);
      }
    }
      return response({ error: "Origin not allowed." }, 403);
    }

    if (path === "/api/leads" || path.startsWith("/api/leads/")) {
      if (!authorized(request, env)) return response({ error: "Admin token required or invalid." }, 401, cors);
      if (!env.DB) return response({ error: "Database is not configured. Follow CLOUDFLARE_SETUP.md." }, 503, cors);

      if (request.method === "GET" && path === "/api/leads") {
        const result = await env.DB.prepare(
          "SELECT id, name, email, source, service, project, budget, stage, notes, createdAt FROM leads ORDER BY createdAt DESC"
        ).all();
        return response({ leads: result.results || [] }, 200, cors);
      }

      if (request.method === "POST" && path === "/api/leads") {
        try {
          const lead = validateLead(await bodyObject(request));
          lead.id = crypto.randomUUID();
          lead.createdAt = new Date().toISOString();
          await env.DB.prepare(
            "INSERT INTO leads (id,name,email,source,service,project,budget,stage,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)"
          ).bind(lead.id, lead.name, lead.email, lead.source || "", lead.service || "", lead.project, lead.budget || "", lead.stage, lead.notes || "", lead.createdAt).run();
          return response({ lead }, 201, cors);
        } catch (error) {
          return response({ error: error.message || "Unable to create lead." }, error.status || 500, cors);
        }
      }

      const id = path.startsWith("/api/leads/") ? decodeURIComponent(path.slice("/api/leads/".length)) : "";
      if (!id || id.includes("/")) return response({ error: "Lead not found." }, 404, cors);
      const found = await env.DB.prepare("SELECT id, name, email, source, service, project, budget, stage, notes, createdAt FROM leads WHERE id = ?").bind(id).first();
      if (!found) return response({ error: "Lead not found." }, 404, cors);

      if (request.method === "PATCH") {
        try {
          const patch = validateLead(await bodyObject(request), true);
          const merged = { ...found, ...patch, id: found.id, createdAt: found.createdAt };
          await env.DB.prepare(
            "UPDATE leads SET name=?, email=?, source=?, service=?, project=?, budget=?, stage=?, notes=? WHERE id=?"
          ).bind(merged.name, merged.email, merged.source || "", merged.service || "", merged.project, merged.budget || "", merged.stage, merged.notes || "", id).run();
          return response({ lead: merged }, 200, cors);
        } catch (error) {
          return response({ error: error.message || "Unable to update lead." }, error.status || 500, cors);
        }
      }
      if (request.method === "DELETE") {
        await env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(id).run();
        return response({ ok: true }, 200, cors);
      }
      return response({ error: "Method not allowed." }, 405, cors);
    }
    return response({ error: "Not found." }, 404, cors);
  }
};
