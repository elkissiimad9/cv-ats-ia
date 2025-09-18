/* =====================  ATS CV — app.js (complet, avec IA DeepSeek)  ===================== */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* === ENDPOINT IA (serveur Vercel: api/deepseek-generate.js) === */
const AI_ENDPOINT = "/api/deepseek-generate";
async function generateWithAI(jd) {
  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd, locale: "fr" })
  });
  if (!res.ok) throw new Error("IA indisponible");
  return await res.json(); // { title, summary, skills[], experiences[] }
}

const state = {
  jd: "",
  autoGen: true,
  profile: {
    name: "NOM PRÉNOM",
    title: "SOCIAL MANAGER",
    email: "email@exemple.com",
    phone: "+212 6 00 00 00 00",
    location: "Ville, Pays",
    summary: "Résumé professionnel généré automatiquement.",
    skills: [],
    education: [
      { degree: "Master en Marketing Digital & E-commerce", org: "Université Mohammed V, Souissi", period: "Sept. 2024 – Juin 2025" },
      { degree: "Licence d’excellence en Marketing Management Digital et E-commerce", org: "Université Mohammed V, Souissi", period: "Sept. 2023 – Juin 2024" },
    ],
    experiences: [],
  },
};

/* ===================== IA locale améliorée (fallback) ===================== */
// utils
const cap  = s => s.replace(/(^.|[\s-].)/g, m => m.toUpperCase());
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const uniq = arr => [...new Set(arr.filter(Boolean))];
const pct  = () => (10 + Math.floor(Math.random()*60)) + "%";

const ROLE_FAMILIES = [
  { id:"marketing",  match:["social media","community","seo","sem","paid","ads","campaign","brand","content","tiktok","instagram","linkedin","facebook","pinterest","ga4","semrush","meta"] },
  { id:"product",    match:["product manager","roadmap","user story","backlog","prioriti","ux research","go-to-market","g2m","growth"] },
  { id:"data",       match:["sql","python","powerbi","looker","ga4","analytics","tableau","dash","kpi","etl","dataviz","statistic"] },
  { id:"engineering",match:["developer","frontend","backend","full stack","react","node","typescript","api","docker","kubernetes","devops"] },
  { id:"design",     match:["ui","ux","figma","sketch","wireframe","prototype","design system","brand identity"] },
  { id:"sales",      match:["sales","crm","pipeline","closing","prospection","quota","b2b","b2c","deal"] },
  { id:"hr",         match:["talent","recrut","rh","onboarding","offboarding","payroll","carrières"] },
];

function familyFromJD(jd){
  const t=(jd||"").toLowerCase();
  for (const fam of ROLE_FAMILIES){ if (fam.match.some(k => t.includes(k))) return fam.id; }
  return "marketing";
}
function inferRoleFromJD(jd, fallback="Social Media Manager"){
  const t=(jd||"").toLowerCase();
  const exp = /(senior|junior)?\s*(social media manager|community manager|seo specialist|marketing manager|content manager|product manager|data analyst|frontend developer|full[-\s]?stack developer|ui\/ux designer)/i;
  const m = t.match(exp);
  if (m) return cap(m[0]);
  const fam = familyFromJD(jd);
  const map = { marketing:"Social Media Manager", product:"Product Manager", data:"Data Analyst", engineering:"Frontend Developer", design:"UI/UX Designer", sales:"Sales Executive", hr:"Talent Acquisition Specialist" };
  return map[fam] || fallback;
}
function extractKeywords(text){
  const stop = new Set("a,an,and,are,as,at,be,by,for,from,has,he,in,is,it,its,of,on,that,the,to,was,were,will,with,la,le,les,des,un,une,et,ou,mais,donc,or,ni,car,du,de,d',l',au,aux,par,pour,chez,sur,sous,entre,vers,ce,cet,cette,ces,que,qui,quoi,quand,où,comment,plus,moins,est,sont,être,été,ayant,ainsi,vos,notre,nous,vous,votre,vos,dans,avec,selon,sans,chez".split(","));
  return (text||"").toLowerCase().replace(/[^a-zàâäãåçéèêëîïìôöòõùûüúÿñ0-9\s\-]/gi," ")
    .split(/\s+/).filter(w=>w && !stop.has(w) && w.length>2)
    .reduce((m,w)=> (m.set(w,(m.get(w)||0)+1),m), new Map());
}
const topKeywords = (map, n=12) => [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k])=>k);

const BANK = {
  marketing: {
    channels:["Instagram","LinkedIn","Facebook","TikTok","YouTube","Pinterest"],
    tools:["Meta Ads","Google Ads","GA4","Looker Studio","WordPress","Canva","Photoshop","Illustrator","Premiere Pro","CapCut","Hootsuite","Buffer","Later","Semrush","Ahrefs","Yoast"],
    themes:["acquisition payante","stratégie éditoriale","community management","SEO & visibilité","reporting & KPI","brand content","AB testing","influence"],
    bullets:[
      "Pilotage de campagnes {topic} avec optimisation continue ({kpi}).",
      "Conception de stratégies {topic} sur {channels}, alignées aux objectifs business.",
      "Mise en place de tableaux de bord {kpi} (GA4/Looker Studio) pour un suivi hebdomadaire.",
      "Production et planification de contenus multi-formats (reels, stories, posts) sur {channels}.",
      "Coordination créa & media pour accélérer les itérations ({kpi}).",
      "Optimisation SEO on-page / contenu, amélioration du trafic organique {pct}."
    ],
    kpis:["CTR","ROAS","conversion","CPC","CPA","engagement"],
  },
  product: { tools:["Jira","Linear","Figma","Amplitude","Mixpanel","GA4"],
    themes:["discovery utilisateur","priorisation backlog","roadmap trimestrielle","expérimentations growth","spécifications fonctionnelles","go-to-market"],
    bullets:[
      "Conduite de {topic} avec interviews et synthèse en insights actionnables.",
      "Priorisation du backlog (RICE/MoSCoW) et arbitrages multi-équipes.",
      "Rédaction d’US & critères d’acceptation ; accompagnement dev/design.",
      "Mise en place d’expériences A/B, suivi {kpi} et décisions data-driven.",
      "Préparation du lancement (GTM), messaging et formation des équipes."
    ],
    kpis:["activation","rétention","conversion","NPS"]
  },
  data: { tools:["SQL","Python","dbt","BigQuery","Looker Studio","Tableau","Power BI","GA4"],
    themes:["modélisation","ETL/ELT","dataviz","fiabilité des données","segmentation clients","prévisions"],
    bullets:[
      "Construction de pipelines {topic} fiabilisés (tests + monitoring).",
      "Modélisation analytique (dbt/SQL) et documentation technique.",
      "Conception de dashboards {topic} pour les équipes métier.",
      "Analyses ad-hoc pour éclairer décisions produits/marketing ({kpi}).",
      "Optimisation des requêtes et coûts ; gouvernance et qualité des données."
    ],
    kpis:["taux de conversion","LTV","churn","CAC","revenu"]
  },
  engineering:{ tools:["React","TypeScript","Node.js","Express","REST","GraphQL","Docker","CI/CD","Playwright","Jest"],
    themes:["performance front","accessibilité","qualité code","API","CI/CD","optimisation bundle"],
    bullets:[
      "Développement de fonctionnalités {topic} en {tools}, revues de code & tests.",
      "Refactorisation et amélioration des performances (TTI, LCP, bundle).",
      "Conception d’API {topic} (REST/GraphQL) sécurisées et documentées.",
      "Mise en place CI/CD et tests end-to-end pour livraisons fiables.",
      "Collaboration produit/design, focus DX et maintainability."
    ],
    kpis:["LCP","CLS","TTFB","taux d’erreur","couverture de tests"]
  },
  design:{ tools:["Figma","Design System","Prototype","User tests","Illustrator","Photoshop"],
    themes:["UX research","wireframes","prototypage","design system","accessibilité","UI motion"],
    bullets:[
      "Conduite de {topic} et restitution d’insights priorisés.",
      "Conception de parcours utilisateur & wireframes fidèles aux objectifs.",
      "Prototypes interactifs testés avec les utilisateurs (itérations rapides).",
      "Contribution au Design System (tokens, composants, guidelines).",
      "Collaboration étroite avec produit/dev pour des livraisons cohérentes."
    ],
    kpis:["tâches réussies","satisfaction","temps de parcours"]
  },
  sales:{ tools:["CRM (HubSpot/Salesforce)","Prospection","Cold email","Demo","Closing"],
    themes:["qualification BANT","pipeline","nurturing","prévisions","closing"],
    bullets:[
      "Développement de pipeline via {topic}, qualification et discovery.",
      "Démos produits orientées valeur, suivi d’objections et négociation.",
      "Prévisions hebdo, hygiène CRM et alignement marketing.",
      "Accélération du cycle de vente par séquences multicanales."
    ],
    kpis:["taux de closing","ARR","cycle de vente"]
  },
  hr:{ tools:["ATS","sourcing","entretiens","onboarding","marque employeur"],
    themes:["sourcing ciblé","entretiens structurés","offres","onboarding","projets RH"],
    bullets:[
      "Sourcing {topic} (job boards, LinkedIn) et pré-qualification efficace.",
      "Entretiens structurés et gestion du pipeline ATS.",
      "Onboarding et coordination avec managers & IT.",
      "Projets RH transverses (process, marque employeur)."
    ],
    kpis:["time-to-hire","satisfaction candidats"]
  }
};

function detectToolsAndChannels(jd, fam){
  const t=(jd||"").toLowerCase();
  const bank = BANK[fam];
  const tools = bank.tools.filter(x => t.includes(x.toLowerCase().replace(/\./g,"")));
  const channels = (BANK.marketing.channels||[]).filter(x => t.includes(x.toLowerCase()));
  return { tools: uniq(tools), channels: uniq(channels) };
}

function generateSummaryFromJD(jd, role){
  const fam = familyFromJD(jd);
  const {tools, channels} = detectToolsAndChannels(jd, fam);
  const kws = topKeywords(extractKeywords(jd), 10);
  const themes = (BANK[fam].themes||[]).filter(x => kws.join(" ").includes(x.split(" ")[0])) || BANK[fam].themes;

  const chTxt = channels.length ? channels.slice(0,4).join(", ") : (fam==="marketing" ? "réseaux sociaux majeurs" : "écosystèmes digitaux");
  const tlTxt = tools.length ? tools.slice(0,5).join(", ") : (BANK[fam].tools.slice(0,4).join(", "));
  const thTxt = uniq(themes.slice(0,3)).join(", ");

  const s1 = `${cap(inferRoleFromJD(jd, role))} orienté·e résultats, spécialisé·e en ${thTxt}.`;
  const s2 = fam==="marketing"
    ? `Expérience sur ${chTxt} et activation full-funnel (paid/owned/earned) avec approche data-driven.`
    : `Pilotage de projets ${fam} avec méthodes modernes et décisions guidées par la donnée.`;
  const s3 = `Maîtrise de ${tlTxt}; collaboration multi-équipes, respect des délais et culture KPI.`;
  return [s1,s2,s3].join(" ");
}

function generateSkillsFromJD(jd){
  const t=(jd||"").toLowerCase();
  const has = (w)=>t.includes(w);
  const networks = uniq([
    has("instagram")&&"Instagram",
    has("linkedin")&&"LinkedIn",
    has("facebook")&&"Facebook",
    has("pinterest")&&"Pinterest",
    (has("tiktok")||has("tik tok"))&&"TikTok",
    has("youtube")&&"YouTube"
  ]);
  return [
    { category:"Stratégie digitale & réseaux sociaux", details:(networks.length?networks:["Instagram","LinkedIn","Facebook","Pinterest","TikTok"]).join(", ") },
    { category:"Community management", details:"planification (Hootsuite, Buffer, Later), animation, modération" },
    { category:"Création de contenus", details:"Canva, Adobe Photoshop, Illustrator, Premiere Pro, CapCut" },
    { category:"Vidéo & storytelling", details:"conception de reels, stories, teasers, montages créatifs" },
    { category:"Rédaction & communication", details:"posts impactants, newsletters, articles web" },
    { category:"Web & SEO", details:"mise à jour site WordPress, optimisation SEO (Yoast, Semrush)" },
  ];
}
function makeBullet(fam, topic, kpis, channels){
  const b = BANK[fam]; const tpl = pick(b.bullets);
  const ch = channels && channels.length ? channels.slice(0,2).join(", ") : pick(["canaux pertinents","priorité business"]);
  const k  = pick(kpis || b.kpis);
  return tpl.replace("{topic}", topic).replace("{kpi}", k).replace("{channels}", ch).replace("{pct}", pct());
}
function generateExperiencesFromJD(jd, currentTitle){
  const fam = familyFromJD(jd);
  const role = inferRoleFromJD(jd, currentTitle);
  const kws = topKeywords(extractKeywords(jd), 16);
  const themes = (BANK[fam].themes||[]).filter(th => kws.some(k => th.toLowerCase().includes(k.slice(0,4))))
                 .concat(BANK[fam].themes).slice(0,6);
  const {channels} = detectToolsAndChannels(jd, fam);
  const kpis = BANK[fam].kpis;

  const bullets1 = uniq(themes.slice(0,3)).map(t => makeBullet(fam, t, kpis, channels));
  const bullets2 = uniq(themes.slice(3,6)).map(t => makeBullet(fam, t, kpis, channels));

  const y = new Date().getFullYear();
  return [
    { role: cap(role), company:"Entreprise cible", period:`Mars. ${y} – Sep. ${y}`, bullets: bullets1 },
    { role: fam==="marketing" ? "Social Media & Content Manager" : `${cap(role)} (mission)`,
      company:"Projet pertinent", period:`Sept. ${y-1} – Nov. ${y-1}`, bullets: bullets2 }
  ];
}

/* ================ Rendu & Éditeurs ================ */
const skillsToText = (skills)=> (skills||[]).map(s=>`${s.category} : ${s.details}`).join("\n");
function textToSkills(text){
  if(!text?.trim()) return [];
  return text.split(/\n+/).map(l=>l.trim()).filter(Boolean).map(l=>{
    const [cat,...rest]=l.split(":"); return { category:(cat||"Catégorie").trim(), details:rest.join(":").trim() };
  });
}

function updatePreview(){
  $("#p_name").textContent = state.profile.name;
  $("#p_title").textContent = state.profile.title;
  $("#p_contacts").textContent = `${state.profile.email} | ${state.profile.phone}`;
  $("#p_summary").textContent = state.profile.summary;

  const pe=$("#p_experiences"); pe.innerHTML="";
  state.profile.experiences.forEach(exp=>{
    const div=document.createElement("div");
    div.className="block";
    div.innerHTML = `
      <div class="block-head">
        <div class="role">${exp.role}, <span class="company">${exp.company}</span></div>
        <div class="period">${exp.period}</div>
      </div>
      <ul class="bullets">${exp.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>`;
    pe.appendChild(div);
  });

  const edu=$("#p_education"); edu.innerHTML="";
  state.profile.education.forEach(ed=>{
    const d=document.createElement("div");
    d.className="edu-item";
    d.innerHTML = `<div class="edu-left"><div class="degree">${ed.degree}</div><div class="org">${ed.org}</div></div><div class="period">${ed.period}</div>`;
    edu.appendChild(d);
  });

  const ps=$("#p_skills"); ps.innerHTML="";
  state.profile.skills.forEach(s=>{
    const li=document.createElement("li");
    li.innerHTML = `<b>${s.category} :</b> ${s.details}`;
    ps.appendChild(li);
  });
}

function renderEditors(){
  const list=$("#expList"); list.innerHTML="";
  state.profile.experiences.forEach((exp,i)=>{
    const d=document.createElement("div");
    d.className="exp-edit";
    d.innerHTML = `
      <div class="cols">
        <input class="input" data-k="role" data-i="${i}" value="${exp.role}">
        <input class="input" data-k="company" data-i="${i}" value="${exp.company}">
      </div>
      <div class="cols3" style="margin-top:8px">
        <input class="input" data-k="period" data-i="${i}" value="${exp.period}">
        <textarea class="input" data-k="bullets" data-i="${i}" rows="3">${exp.bullets.join("\n")}</textarea>
        <button class="btn ghost" data-k="remove" data-i="${i}">Supprimer</button>
      </div>`;
    list.appendChild(d);
  });
  $$("#expList input, #expList textarea, #expList button").forEach(el=>{
    const i=+el.getAttribute("data-i"); const k=el.getAttribute("data-k");
    if(k==="remove"){ el.onclick=()=>{ state.profile.experiences.splice(i,1); renderEditors(); updatePreview(); }; }
    else if(k==="bullets"){ el.oninput=e=>{ state.profile.experiences[i].bullets=e.target.value.split("\n").map(x=>x.trim()).filter(Boolean); updatePreview(); }; }
    else { el.oninput=e=>{ state.profile.experiences[i][k]=e.target.value; updatePreview(); }; }
  });
}
function renderEduEditors(){
  const list = document.getElementById("eduList"); if(!list) return;
  list.innerHTML = "";
  state.profile.education.forEach((ed, i)=>{
    const d = document.createElement("div");
    d.className = "exp-edit";
    d.innerHTML = `
      <div class="cols">
        <input class="input" data-type="edu" data-k="degree" data-i="${i}" value="${ed.degree}">
        <input class="input" data-type="edu" data-k="org"    data-i="${i}" value="${ed.org}">
      </div>
      <div class="cols3" style="margin-top:8px">
        <input class="input" data-type="edu" data-k="period" data-i="${i}" value="${ed.period}">
        <div></div>
        <button class="btn ghost" data-type="edu" data-k="remove" data-i="${i}">Supprimer</button>
      </div>`;
    list.appendChild(d);
  });
  Array.from(list.querySelectorAll("input,button")).forEach(el=>{
    const i = +el.getAttribute("data-i"), k = el.getAttribute("data-k");
    if(k==="remove"){ el.onclick = ()=>{ state.profile.education.splice(i,1); renderEduEditors(); updatePreview(); }; }
    else { el.oninput = e=>{ state.profile.education[i][k]=e.target.value; updatePreview(); }; }
  });
}

/* ================ UI & Export ================ */
function bind(){
  $("#jd").oninput    = e=>{ state.jd=e.target.value; maybeAutoGen(); renderEditors(); renderEduEditors(); updatePreview(); };
  $("#autogen").onchange = e=>{ state.autoGen=e.target.checked; maybeAutoGen(); renderEditors(); renderEduEditors(); updatePreview(); };

  $("#name").oninput  = e=>{ state.profile.name=e.target.value; updatePreview(); };
  $("#title").oninput = e=>{ state.profile.title=e.target.value; updatePreview(); };
  $("#email").oninput = e=>{ state.profile.email=e.target.value; updatePreview(); };
  $("#phone").oninput = e=>{ state.profile.phone=e.target.value; updatePreview(); };
  $("#location").oninput = e=>{ state.profile.location=e.target.value; updatePreview(); };

  $("#summary").oninput  = e=>{ state.profile.summary=e.target.value; updatePreview(); };
  $("#skills").oninput   = e=>{ state.profile.skills=textToSkills(e.target.value); updatePreview(); };

  $("#addExp").onclick = ()=>{ state.profile.experiences.push({role:state.profile.title,company:"Entreprise",period:"Mois. Année – Mois. Année",bullets:["Responsabilité clé","Résultat mesurable"]}); renderEditors(); updatePreview(); };
  $("#addEdu").onclick = ()=>{ state.profile.education.push({degree:"Intitulé du diplôme", org:"Établissement", period:"Année – Année"}); renderEduEditors(); updatePreview(); };

  $("#reset").onclick = ()=>{
    state.jd=""; $("#jd").value="";
    state.autoGen=true; $("#autogen").checked=true;
    Object.assign(state.profile,{ name:"NOM PRÉNOM", title:"SOCIAL MANAGER", email:"email@exemple.com", phone:"+212 6 00 00 00 00", location:"Ville, Pays", summary:"Résumé professionnel généré automatiquement.", skills:[], experiences:[] });
    $("#summary").value = state.profile.summary;
    $("#skills").value  = "";
    maybeAutoGen(); renderEditors(); renderEduEditors(); updatePreview();
  };

  $("#print").onclick = ()=> window.print();
  $("#download").onclick = async ()=>{
    try{
      const el=$("#preview"); if(!el) throw new Error("preview introuvable");
      $("#exportInfo").textContent="Génération du PDF…";
      const { jsPDF } = window.jspdf; const pdf=new jsPDF("p","mm","a4",true);
      await pdf.html(el,{ html2canvas:{scale:2,backgroundColor:"#ffffff",useCORS:true,allowTaint:true,windowWidth:el.scrollWidth}, autoPaging:"text" });
      pdf.save("CV-ATS.pdf"); $("#exportInfo").textContent="PDF téléchargé ✅"; setTimeout(()=>$("#exportInfo").textContent="",1500);
    }catch(err){ console.error(err); $("#exportInfo").textContent="Échec export (utilise le bouton fiable)"; setTimeout(()=>$("#exportInfo").textContent="",2000); }
  };
}

/* ================ Auto-génération (via IA DeepSeek, fallback local) ================ */
async function maybeAutoGen(){
  if(!state.autoGen || !state.jd.trim()) return;

  // 1) Essaye l'IA DeepSeek
  try{
    const out = await generateWithAI(state.jd);

    state.profile.title       = out.title || state.profile.title;
    state.profile.summary     = out.summary || state.profile.summary;
    state.profile.skills      = (out.skills || []).map(s => ({ category: s.category, details: s.details }));
    state.profile.experiences = (out.experiences || []).map(e => ({
      role: e.role, company: e.company, period: e.period, bullets: e.bullets
    }));

  }catch(err){
    console.warn("DeepSeek indisponible, fallback local.", err);

    // 2) Fallback local (ton ancienne logique)
    const role = inferRoleFromJD(state.jd, state.profile.title);
    state.profile.title   = role;
    state.profile.summary = generateSummaryFromJD(state.jd, role);
    state.profile.skills  = generateSkillsFromJD(state.jd);
    state.profile.experiences = generateExperiencesFromJD(state.jd, role);
  }

  // 3) refléter pour modification + rafraîchir l’UI
  document.getElementById("title").value   = state.profile.title;
  document.getElementById("summary").value = state.profile.summary;
  document.getElementById("skills").value  = skillsToText(state.profile.skills);

  renderEditors();
  renderEduEditors();
  updatePreview();
}

/* ================ Init + petits tests ================ */
(function tests(){
  const km = extractKeywords("senior react developer react marketing");
  console.assert((km.get("react")||0)===2, "TEST keywords");
  const gens = generateExperiencesFromJD("react developer ci/cd api performance ux", "");
  console.assert(gens.length>=2 && gens[0].bullets.length>=2, "TEST experiences");
})();
bind();
maybeAutoGen();
renderEduEditors();
renderEditors();
updatePreview();