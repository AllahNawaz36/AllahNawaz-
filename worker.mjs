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
      const geminiConfigured = typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY.trim().length > 0;
      const workersAiConfigured = Boolean(env.AI && typeof env.AI.run === "function");
      const aiConfigured = geminiConfigured || workersAiConfigured;
      const chatProtectionConfigured = Boolean(env.CHAT_LIMITER && typeof env.CHAT_LIMITER.limit === "function");
      const adminConfigured = String(env.ADMIN_TOKEN || "").length >= 32;
      const chatReady = aiConfigured && chatProtectionConfigured;
      return response({
        ok: true,
        status: chatReady ? "ready" : "degraded",
        service: "naz-business-assistant",
        storage: env.DB ? "d1" : "not-configured",
        ai: aiConfigured ? "configured" : "not-configured",
        aiProvider: geminiConfigured ? "gemini" : (workersAiConfigured ? "workers-ai" : "none"),
        chatProtection: chatProtectionConfigured ? "configured" : "not-configured",
        admin: adminConfigured ? "configured" : "not-configured",
        chatReady
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
      const geminiAvailable = typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY.trim().length > 0;
      const workersAiAvailable = Boolean(env.AI && typeof env.AI.run === "function");
      if (!geminiAvailable && !workersAiAvailable) {
        return response({ error: "AI is not configured. Add a Gemini API key or the Workers AI binding named AI." }, 503, cors);
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
        const structuredMode = input.responseFormat === "structured";
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
          "If the user asks for an action that is not connected, explain the limitation honestly and offer to prepare the draft or checklist instead. Do not request passwords, access tokens, or sensitive customer data.",
          structuredMode ? "Return ONLY one valid JSON object with exactly these keys: summary (string), assumptions (array of strings), nextSteps (array of strings), limitations (array of strings). No markdown fences or extra keys. Use empty arrays when none apply. Keep summary concise, nextSteps to at most 5 items, assumptions and limitations to at most 5 items each. Do not include facts not supported by the user input or supplied context." : ""
        ].filter(Boolean).join(" ");
        let answer = "";
        let aiProvider = "workers-ai";
        if (typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY.trim()) {
          aiProvider = "gemini";
          const model = String(env.GEMINI_MODEL || "gemini-2.5-flash").trim();
          if (!/^[a-zA-Z0-9._-]{1,100}$/.test(model)) {
            return response({ error: "Invalid GEMINI_MODEL configuration." }, 500, cors);
          }
          const geminiFetch = typeof env.GEMINI_FETCH === "function" ? env.GEMINI_FETCH : fetch;
          const geminiResponse = await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY.trim()
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: "user", parts: [{ text: message }] }],
              generationConfig: structuredMode ? { maxOutputTokens: 600, temperature: 0.2, responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { summary: { type: "STRING" }, assumptions: { type: "ARRAY", items: { type: "STRING" } }, nextSteps: { type: "ARRAY", items: { type: "STRING" } }, limitations: { type: "ARRAY", items: { type: "STRING" } } }, required: ["summary", "assumptions", "nextSteps", "limitations"] } } : { maxOutputTokens: 500, temperature: 0.5 }
            })
          });
          const payload = await geminiResponse.json().catch(() => ({}));
          if (!geminiResponse.ok) {
            const status = geminiResponse.status === 429 ? 429 : (geminiResponse.status === 401 || geminiResponse.status === 403 ? 503 : 502);
            return response({ error: status === 429 ? "Gemini free-tier limit reached. Wait and try again, or review the model quota in Google AI Studio." : (status === 503 ? "Gemini API key was rejected or lacks access. Check the secret and model access in Google AI Studio." : "Gemini service is temporarily unavailable. Try again shortly.") }, status, cors);
          }
          answer = (payload.candidates?.[0]?.content?.parts || []).map(part => typeof part.text === "string" ? part.text : "").join("").trim();
          if (!answer && payload.promptFeedback?.blockReason) {
            return response({ error: "Gemini did not answer because the request was blocked by its safety filters. Please rephrase it." }, 400, cors);
          }
        } else {
          if (!env.AI || typeof env.AI.run !== "function") {
            return response({ error: "No AI provider is configured. Add GEMINI_API_KEY as a Worker secret, or configure the Workers AI binding named AI." }, 503, cors);
          }
          const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ],
            max_tokens: structuredMode ? 600 : 350,
            ...(structuredMode ? { response_format: { type: "json_object" } } : {})
          });
          answer = typeof result?.response === "string" ? result.response.trim() : "";
        }
        if (!answer) return response({ error: "AI returned an empty response. Please try again." }, 502, cors);
        if (structuredMode) {
          let structured;
          try { structured = JSON.parse(answer); } catch { return response({ error: "AI returned invalid structured data. Please retry with a simpler request." }, 502, cors); }
          const validString = value => typeof value === "string" && value.trim().length > 0 && value.length <= 2000;
          const validList = value => Array.isArray(value) && value.length <= 5 && value.every(item => typeof item === "string" && item.length <= 500);
          if (!structured || typeof structured !== "object" || Array.isArray(structured) || !validString(structured.summary) || !validList(structured.assumptions) || !validList(structured.nextSteps) || !validList(structured.limitations)) {
            return response({ error: "AI output did not match the required schema. Please retry." }, 502, cors);
          }
          return response({ answer: structured.summary.trim(), structured: { summary: structured.summary.trim(), assumptions: structured.assumptions, nextSteps: structured.nextSteps, limitations: structured.limitations }, mode: "ai", provider: aiProvider, platform, responseFormat: "structured" }, 200, cors);
        }
        return response({ answer, mode: "ai", provider: aiProvider, platform }, 200, cors);
      } catch (error) {
        return response({ error: error.status ? error.message : "AI service temporarily unavailable." }, error.status || 502, cors);
      }
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
