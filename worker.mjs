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
        ai: env.AI && typeof env.AI.run === "function" ? "configured" : "not-configured",
        chatProtection: env.CHAT_LIMITER && typeof env.CHAT_LIMITER.limit === "function" ? "configured" : "not-configured"
      }, 200, cors);
    }

    if (origin === "" && request.headers.has("Origin")) {
      return response({ error: "Origin not allowed." }, 403);
    }

    if (path === "/api/chat") {
      if (request.method !== "POST") return response({ error: "Method not allowed." }, 405, cors);
      // Fail closed if rate limiting is not configured; public AI calls can consume quota.
      if (!env.CHAT_LIMITER || typeof env.CHAT_LIMITER.limit !== "function") {
        return response({ error: "Chat protection is not configured. Add the CHAT_LIMITER binding before enabling public AI chat." }, 503, cors);
      }
      const clientKey = request.headers.get("cf-connecting-ip") || "unknown-client";
      const rateLimit = await env.CHAT_LIMITER.limit({ key: clientKey });
      if (!rateLimit.success) return response({ error: "Too many chat requests. Please wait a minute and try again." }, 429, cors);
      if (!env.AI || typeof env.AI.run !== "function") {
        return response({ error: "AI is not configured. Add the Workers AI binding named AI." }, 503, cors);
      }
      try {
        const input = await bodyObject(request);
        const message = typeof input.message === "string" ? input.message.trim() : "";
        const platforms = new Set(["general", "uiux", "website", "saas", "ecommerce", "branding", "seo", "automation", "figma-canva", "social-platforms", "hire"]);
        const platform = platforms.has(input.platform) ? input.platform : "general";
        if (!message) return response({ error: "A message is required." }, 400, cors);
        if (message.length > 1000) return response({ error: "Message must be 1000 characters or fewer." }, 413, cors);
        const platformGuidance = {
          general: "Answer general client questions about design services and project enquiries.",
          uiux: "Focus on UX research framing, user journeys, wireframes, prototypes, accessibility, product strategy and design systems.",
          website: "Focus on website/landing-page structure, responsive UI, conversion goals, content hierarchy and handoff.",
          saas: "Focus on SaaS workflows, dashboards, roles, data hierarchy, UI states, reusable components and responsive behaviour.",
          ecommerce: "Focus on product pages, catalogue UX, offer hierarchy, checkout friction and e-commerce creative design.",
          branding: "Focus on brand consistency, social media creatives, campaign concepts, typography, layout and platform-specific visual content.",
          seo: "Focus on SEO planning, search intent, content briefs, on-page basics, digital marketing and measurable KPIs; never guarantee rankings.",
          automation: "Focus on workflow mapping, triggers, integrations, human approvals, error handling and realistic automation boundaries.",
          "figma-canva": "Focus on Figma/Canva workflows, components, templates, brand kits, collaboration and exports. Never claim access to private files unless a connection is confirmed.",
          "social-platforms": "Focus on LinkedIn/Facebook post copy, content planning, creative briefs and scheduling requirements. Never claim content was published/scheduled unless a real tool confirms it.",
          hire: "Help clarify client goals, deliverables, budget range, timeline and next steps. Do not invent a price, availability or binding quote."
        };
        const task = input.task === "support-reply" ? "support-reply" : "client-chat";
        const systemPrompt = [
          task === "support-reply"
            ? "You are a careful customer-support reply drafting assistant. Draft a message on behalf of the business represented by the customer context; do not identify yourself as Allah Nawaz or claim to represent his portfolio."
            : "You are the client-facing AI design and digital-workflow assistant for Allah Nawaz, a UI/UX and Product Designer based in Islamabad, Pakistan.",
          task === "support-reply"
            ? "Write a ready-to-review reply to the supplied customer message. Match the requested tone and the selected topic (" + platform + "). Do not invent company policies, refunds, order status, prices, delivery dates, warranties, technical fixes, or promises. If facts are missing, acknowledge the issue and ask for only the minimum safe details. Do not repeat sensitive personal information from the customer message."
            : "The visitor selected this topic: " + platform + ". " + platformGuidance[platform],
          "Answer the actual question directly, clearly, warmly, and practically. Match the user's language: English, Urdu script, or Roman Urdu. Prefer concise answers and ask at most one relevant follow-up question when it helps scope the request.",
          "Known portfolio: https://www.behance.net/allahnawaz175. LinkedIn: https://www.linkedin.com/in/allah-nawaz-productdesigner/.",
          "Known projects include WellnessWell Shilajit social creatives, Jalal Electronics product marketing ads, Prime Estimate web app design, Conectly SaaS interface design, and an influencer-marketing concept. T-Tech Solutions experience included responsive web/mobile interfaces, reusable UI patterns and marketing visuals.",
          "Never invent client results, metrics, testimonials, prices, dates, availability, service guarantees, or credentials. Pricing depends on confirmed scope and should be discussed rather than guessed.",
          "This chat can explain, advise, qualify a project brief, and draft content. It cannot publish/schedule posts, send messages/emails, change ad spend, edit private Canva/Figma files, access customer accounts, or perform other external actions unless a separately connected and authorised integration actually confirms the action.",
          "If the user asks for an action that is not connected, explain the limitation honestly and offer to prepare the draft or checklist instead. Do not request passwords, access tokens, or sensitive customer data."
        ].join(" ");
        const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_completion_tokens: 350
        });
        const answer = typeof result?.response === "string" ? result.response.trim() : "";
        if (!answer) return response({ error: "AI returned an empty response. Please try again." }, 502, cors);
        return response({ answer, mode: "ai", platform }, 200, cors);
      } catch {
        // Do not expose upstream provider messages, request IDs, or internal details to public clients.
        return response({ error: "AI service temporarily unavailable. Please try again." }, 502, cors);
      }
    }

    if (path === "/api/leads" || path.startsWith("/api/leads/")) {
      if (!authorized(request, env)) return response({ error: "Admin token required or invalid." }, 401, cors);
      if (!env.DB) return response({ error: "Database is not configured. Follow CLOUDFLARE_SETUP.md." }, 503, cors);

      if (request.method === "GET" && path === "/api/leads") {
        try {
          const result = await env.DB.prepare(
            "SELECT id, name, email, source, service, project, budget, stage, notes, createdAt FROM leads ORDER BY createdAt DESC"
          ).all();
          return response({ leads: result.results || [] }, 200, cors);
        } catch {
          return response({ error: "Unable to load leads. Please try again." }, 503, cors);
        }
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
          const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
          const message = status < 500 ? error.message : "Unable to create lead. Please try again.";
          return response({ error: message }, status, cors);
        }
      }

      const id = path.startsWith("/api/leads/") ? decodeURIComponent(path.slice("/api/leads/".length)) : "";
      if (!id || id.includes("/")) return response({ error: "Lead not found." }, 404, cors);
      let found;
      try {
        found = await env.DB.prepare("SELECT id, name, email, source, service, project, budget, stage, notes, createdAt FROM leads WHERE id = ?").bind(id).first();
      } catch {
        return response({ error: "Unable to load lead. Please try again." }, 503, cors);
      }
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
          const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
          const message = status < 500 ? error.message : "Unable to update lead. Please try again.";
          return response({ error: message }, status, cors);
        }
      }
      if (request.method === "DELETE") {
        try {
          await env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(id).run();
          return response({ ok: true }, 200, cors);
        } catch {
          return response({ error: "Unable to delete lead. Please try again." }, 503, cors);
        }
      }
      return response({ error: "Method not allowed." }, 405, cors);
    }
    return response({ error: "Not found." }, 404, cors);
  }
};
