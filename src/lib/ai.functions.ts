import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAMMOUTH_URL = "https://api.mammouth.ai/v1/chat/completions";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callMammouth(apiKey: string, messages: Msg[], opts?: { json?: boolean }) {
  let lastErr: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 45000);
      const res = await fetch(MAMMOUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "mammouth",
          messages,
          ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      if (res.status === 401) throw new Error("Clé API Mammouth invalide");
      if (res.status === 429) throw new Error("Quota Mammouth dépassé, réessayez plus tard");
      if (!res.ok) throw new Error(`Erreur Mammouth ${res.status}`);
      const data = await res.json();
      return (data?.choices?.[0]?.message?.content ?? "") as string;
    } catch (e) {
      lastErr = e;
      if (i < 2) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Échec appel IA");
}

async function getApiKey(supabase: ReturnType<typeof requireSupabaseAuth> extends never ? never : any, userId: string) {
  const { data, error } = await supabase
    .from("settings")
    .select("mammouth_api_key")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const key = data?.mammouth_api_key?.trim();
  if (!key) throw new Error("Aucune clé API Mammouth configurée. Va dans Paramètres pour l'ajouter.");
  return key;
}

export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: Msg[]; system?: string }) =>
    z.object({
      messages: z.array(z.object({ role: z.enum(["system","user","assistant"]), content: z.string().max(20000) })).min(1).max(50),
      system: z.string().max(8000).optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const key = await getApiKey(context.supabase, context.userId);
    const msgs: Msg[] = data.system ? [{ role: "system", content: data.system }, ...data.messages] : data.messages;
    const output = await callMammouth(key, msgs);
    return { output };
  });

export const aiScoreApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string; cvId?: string | null }) =>
    z.object({ applicationId: z.string().uuid(), cvId: z.string().uuid().nullable().optional() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = await getApiKey(supabase, userId);
    const [{ data: app }, { data: profile }, cvRes] = await Promise.all([
      supabase.from("applications").select("*").eq("id", data.applicationId).single(),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      data.cvId ? supabase.from("cvs").select("*").eq("id", data.cvId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (!app) throw new Error("Candidature introuvable");
    const cv: any = cvRes.data;

    const sys = `Tu es un expert RH. Analyse la compatibilité entre un profil et une offre. Réponds STRICTEMENT en JSON avec la structure :
{
  "global": number 0-100,
  "technical": number 0-100,
  "experience": number 0-100,
  "soft": number 0-100,
  "location": number 0-100,
  "salary": number 0-100,
  "strengths": string[],
  "gaps": string[],
  "recommendation": "POSTULER" | "ADAPTER" | "PASSER",
  "keywords": string[]
}`;

    const userMsg = `OFFRE:
Poste: ${app.title}
Entreprise: ${app.company}
Localisation: ${app.location ?? "?"}
Contrat: ${app.contract_type ?? "?"}
Salaire: ${app.salary_min ?? "?"} - ${app.salary_max ?? "?"} ${app.salary_currency}
Compétences requises: ${(app.required_skills as string[] | null)?.join(", ") ?? ""}
Description: ${(app.description ?? "").slice(0, 4000)}

PROFIL:
Titre: ${profile?.current_title ?? "?"}
Années exp: ${profile?.years_experience ?? 0}
Localisation: ${profile?.location ?? "?"}
Salaire cible: ${profile?.target_salary_min ?? "?"} - ${profile?.target_salary_max ?? "?"}
Hard skills: ${JSON.stringify(profile?.hard_skills ?? [])}
Soft skills: ${JSON.stringify(profile?.soft_skills ?? [])}
${cv ? `CV: ${cv.name} - ATS ${cv.average_ats_score}/100` : ""}`;

    const raw = await callMammouth(key, [
      { role: "system", content: sys },
      { role: "user", content: userMsg },
    ], { json: true });

    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = { global: 50, recommendation: "ADAPTER", strengths: [], gaps: [], keywords: [] }; }

    await supabase.from("applications").update({ ai_score: parsed }).eq("id", data.applicationId);
    await supabase.from("ai_generations").insert({
      user_id: userId, type: "score", application_id: data.applicationId, cv_id: data.cvId ?? null,
      input: { app_id: data.applicationId, cv_id: data.cvId ?? null }, output: JSON.stringify(parsed),
    });
    return parsed;
  });

export const aiGenerateCoverLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { applicationId: string; tone?: string; length?: string }) =>
    z.object({
      applicationId: z.string().uuid(),
      tone: z.enum(["formel", "enthousiaste", "concis", "creatif"]).default("formel"),
      length: z.enum(["courte", "standard", "longue"]).default("standard"),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = await getApiKey(supabase, userId);
    const [{ data: app }, { data: profile }] = await Promise.all([
      supabase.from("applications").select("*").eq("id", data.applicationId).single(),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    if (!app) throw new Error("Candidature introuvable");

    const sys = `Tu écris des lettres de motivation en français, ton ${data.tone}, longueur ${data.length}. Pas de blabla, du concret, des chiffres, du contexte entreprise.`;
    const userMsg = `Écris ma lettre pour:
- Poste: ${app.title} chez ${app.company}
- Description: ${(app.description ?? "").slice(0, 3000)}

Mes infos:
- Prénom: ${profile?.first_name ?? ""}
- Titre actuel: ${profile?.current_title ?? ""}
- Années exp: ${profile?.years_experience ?? 0}
- Bio: ${profile?.bio ?? ""}
- Pitch: ${profile?.pitch_30s ?? ""}
- Hard skills: ${JSON.stringify(profile?.hard_skills ?? [])}`;

    const output = await callMammouth(key, [
      { role: "system", content: sys },
      { role: "user", content: userMsg },
    ]);

    await supabase.from("ai_generations").insert({
      user_id: userId, type: "cover_letter", application_id: data.applicationId,
      input: { tone: data.tone, length: data.length }, output,
    });
    return { output };
  });

export const aiTestKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string }) => z.object({ key: z.string().min(10).max(500) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(MAMMOUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.key}` },
        body: JSON.stringify({ model: "mammouth", messages: [{ role: "user", content: "ping" }] }),
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, status: 0, error: e instanceof Error ? e.message : "unknown" };
    }
  });

export const aiCoachChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: Msg[] }) =>
    z.object({ messages: z.array(z.object({ role: z.enum(["user","assistant"]), content: z.string().max(8000) })).min(1).max(40) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = await getApiKey(supabase, userId);
    const [{ data: apps }, { data: profile }] = await Promise.all([
      supabase.from("applications").select("title,company,status,priority,applied_at").eq("user_id", userId).limit(100),
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    const ctx = `CONTEXTE UTILISATEUR:
Profil: ${profile?.current_title ?? ""}, ${profile?.years_experience ?? 0} ans exp, ${profile?.location ?? ""}
Statut recherche: ${profile?.search_status ?? "active"}
Candidatures (${apps?.length ?? 0}): ${JSON.stringify(apps ?? [])}`;
    const sys = `Tu es un coach carrière personnel, direct, bienveillant, en français. Donne des conseils actionnables. ${ctx}`;
    const output = await callMammouth(key, [{ role: "system", content: sys }, ...data.messages as Msg[]]);
    return { output };
  });
