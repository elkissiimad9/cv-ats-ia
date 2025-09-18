// api/generate.js  (Vercel Edge Function)
export const config = { runtime: "edge" };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  let body = {};
  try { body = await req.json(); } catch {}
  const jd = (body.jd || "").trim();
  const locale = body.locale || "fr";

  if (!jd) {
    return new Response(JSON.stringify({ error: "Missing jd" }), { status: 400, headers: cors });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500, headers: cors });
  }

  // Prompt RH/ATS (fr) + schéma JSON (Structured Outputs)
  const system = `
Tu es un expert RH/ATS francophone. Analyse la JD et retourne:
- title: intitulé exact du poste visé.
- summary: résumé professionnel (3 phrases, riche, outils/canaux/KPI de la JD).
- skills: 5–7 items {category, details} (ex: "Stratégie digitale & réseaux sociaux : Instagram, LinkedIn, TikTok…").
- experiences: 2 blocs {role, company, period, bullets[4..6]} ancrés dans la JD, KPI plausibles.
Langue: FR. Pas d'inventions farfelues. Style pro, ATS-friendly.
`.trim();

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      skills: {
        type: "array", minItems: 5, maxItems: 8,
        items: {
          type: "object",
          properties: { category: { type: "string" }, details: { type: "string" } },
          required: ["category", "details"], additionalProperties: false
        }
      },
      experiences: {
        type: "array", minItems: 2, maxItems: 2,
        items: {
          type: "object",
          properties: {
            role: { type: "string" },
            company: { type: "string" },
            period: { type: "string" },
            bullets: { type: "array", minItems: 4, maxItems: 6, items: { type: "string" } }
          },
          required: ["role", "company", "period", "bullets"], additionalProperties: false
        }
      }
    },
    required: ["title", "summary", "skills", "experiences"],
    additionalProperties: false
  };

  // Appel OpenAI Responses API (modèle léger, économique)
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: `Langue: ${locale}\n\nJD:\n${jd}` }
      ],
      temperature: 0.6,
      response_format: {
        type: "json_schema",
        json_schema: { name: "CvFromJD", schema, strict: true }
      }
    })
  });

  if (!r.ok) {
    const text = await r.text();
    return new Response(JSON.stringify({ error: "OpenAI error", details: text }), { status: 500, headers: cors });
  }

  const data = await r.json();
  // Récup JSON renvoyé
  const content = data?.output?.[0]?.content?.[0]?.text ?? data?.output_text ?? "";
  let payload;
  try { payload = JSON.parse(content); } catch { payload = null; }

  if (!payload) {
    return new Response(JSON.stringify({ error: "Invalid JSON returned" }), { status: 500, headers: cors });
  }
  return new Response(JSON.stringify(payload), { status: 200, headers: cors });
}