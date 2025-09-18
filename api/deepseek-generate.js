// api/deepseek-generate.js — Vercel serverless (Node)
// Appelle DeepSeek (API OpenAI-compatible) et renvoie un JSON {title, summary, skills[], experiences[]}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { jd, locale = "fr" } = req.body ?? {};
  if (!jd || !jd.trim()) return res.status(400).json({ error: "Missing jd" });

  const apiKey = process.env.DEEPSEEK_API_KEY; // <- définie dans Vercel Settings (jamais dans le front)
  if (!apiKey) return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });

  // Prompt qui force une réponse JSON exploitable par ton front
  const sys = `
Tu es un expert RH/ATS francophone.
À partir de la description de poste, rends UNIQUEMENT un JSON valide (aucune explication hors JSON) :
{
  "title": "intitulé de poste déduit de la JD",
  "summary": "Résumé professionnel en 3 phrases, avec outils/canaux/KPI présents dans la JD (ton pro, FR).",
  "skills": [
    {"category":"Stratégie digitale & réseaux sociaux","details":"Instagram, LinkedIn, TikTok..."},
    {"category":"...","details":"..."}
  ],
  "experiences": [
    {"role":"Intitulé généré","company":"Entreprise cible","period":"Mois. AAAA – Mois. AAAA","bullets":["puce 1","puce 2","puce 3","puce 4"]},
    {"role":"Intitulé généré (mission)","company":"Projet pertinent","period":"Mois. AAAA – Mois. AAAA","bullets":["puce 1","puce 2","puce 3","puce 4"]}
  ]
}
Respecte la langue FR, le style ATS-friendly et le lien strict avec la JD.
`.trim();

  try {
    const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat", // ou "deepseek-reasoner" si tu veux la version reasoning
        temperature: 0.6,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Langue: ${locale}\n\nJD:\n${jd}` }
        ]
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "DeepSeek API error", details: t });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    // Extraire le JSON { ... } même si le modèle ajoute du texte autour
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return res.status(200).json({ summary: text }); // fallback si pas de JSON strict

    const payload = JSON.parse(m[0]);
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message || "server error" });
  }
}