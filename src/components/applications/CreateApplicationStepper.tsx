import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { motion } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { STATUS_LABELS, STATUS_ORDER, type ApplicationStatus } from "@/types";
import { aiExtractJobFromUrl, aiGenerateCoverLetter, aiScoreApplication } from "@/lib/ai.functions";

const SOURCES = ["LinkedIn", "Indeed", "Welcome to the Jungle", "Réseau", "Autre"];
const CONTRACTS = ["CDI", "CDD", "Freelance", "Stage", "Alternance", "Intérim"];

const step1Schema = z.object({
  source_url: z.string().url().or(z.literal("")).optional(),
  title: z.string().min(1, "Requis"),
  company: z.string().min(1, "Requis"),
  location: z.string().optional(),
  contract_type: z.string().optional(),
  salary_min: z.number().nullable().optional(),
  salary_max: z.number().nullable().optional(),
  status: z.enum(["watchlist","to_apply","applied","follow_up","interview","offer","rejected"]),
});
const step2Schema = z.object({
  cv_used: z.string().nullable().optional(),
  cover_letter: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().or(z.literal("")).optional(),
  applied_at: z.string().optional(),
  source: z.string().optional(),
});

interface State {
  source_url: string;
  title: string;
  company: string;
  location: string;
  contract_type: string;
  salary_min: string;
  salary_max: string;
  status: ApplicationStatus;
  cv_used: string;
  cover_letter: string;
  contact_name: string;
  contact_email: string;
  applied_at: string;
  source: string;
  description: string;
}

const initial: State = {
  source_url: "", title: "", company: "", location: "", contract_type: "",
  salary_min: "", salary_max: "", status: "to_apply",
  cv_used: "", cover_letter: "", contact_name: "", contact_email: "",
  applied_at: new Date().toISOString().slice(0, 10), source: "", description: "",
};

export function CreateApplicationStepper({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<State>(initial);
  const extract = useServerFn(aiExtractJobFromUrl);
  const genLetter = useServerFn(aiGenerateCoverLetter);
  const score = useServerFn(aiScoreApplication);

  const { data: cvs = [] } = useQuery({
    queryKey: ["cvs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cvs").select("id,name").eq("is_archived", false);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const update = (patch: Partial<State>) => setForm((f) => ({ ...f, ...patch }));

  const extractM = useMutation({
    mutationFn: async () => extract({ data: { url: form.source_url } }),
    onSuccess: (d) => {
      update({
        title: d.title || form.title,
        company: d.company || form.company,
        location: d.location || form.location,
        contract_type: d.contract_type || form.contract_type,
        salary_min: d.salary_min != null ? String(d.salary_min) : form.salary_min,
        salary_max: d.salary_max != null ? String(d.salary_max) : form.salary_max,
        description: d.description || form.description,
      });
      toast.success("Offre extraite");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Non connecté");
      const payload = {
        user_id: u.user.id,
        title: form.title,
        company: form.company,
        location: form.location || null,
        contract_type: form.contract_type || null,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        source_url: form.source_url || null,
        description: form.description || null,
        status: form.status,
        cv_used: form.cv_used || null,
        cover_letter: form.cover_letter || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        applied_at: form.applied_at ? new Date(form.applied_at).toISOString() : null,
        source: form.source || null,
        timeline: [{ date: new Date().toISOString(), event: "Candidature créée", type: "created" }],
      };
      const { data, error } = await supabase.from("applications").insert(payload).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Candidature créée");
      qc.invalidateQueries({ queryKey: ["applications"] });
      // Score IA en background
      score({ data: { applicationId: id, cvId: form.cv_used || null } })
        .then(() => qc.invalidateQueries({ queryKey: ["applications"] }))
        .catch(() => {});
      onOpenChange(false);
      setForm(initial);
      setStep(1);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const next = () => {
    if (step === 1) {
      const r = step1Schema.safeParse({
        source_url: form.source_url || undefined,
        title: form.title, company: form.company, location: form.location,
        contract_type: form.contract_type, status: form.status,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
      });
      if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Champs invalides"); return; }
      setStep(2);
    } else if (step === 2) {
      const r = step2Schema.safeParse({
        cv_used: form.cv_used || null,
        cover_letter: form.cover_letter,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        applied_at: form.applied_at,
        source: form.source,
      });
      if (!r.success) { toast.error(r.error.issues[0]?.message ?? "Champs invalides"); return; }
      setStep(3);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { onOpenChange(b); if (!b) { setForm(initial); setStep(1); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle candidature</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 my-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${s <= step ? "gradient-primary text-white" : "bg-muted text-muted-foreground"}`}>
                {s < step ? <Check className="w-3 h-3" /> : s}
              </div>
              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full gradient-primary" initial={false} animate={{ width: s < step ? "100%" : "0%" }} />
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mb-4">Étape {step}/3 — {step === 1 ? "L'offre" : step === 2 ? "Mes infos" : "Récapitulatif"}</div>

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>URL de l'offre</Label>
              <div className="flex gap-2">
                <Input value={form.source_url} onChange={(e) => update({ source_url: e.target.value })} placeholder="https://…" />
                <Button onClick={() => extractM.mutate()} disabled={!form.source_url || extractM.isPending} variant="outline">
                  <Sparkles className="w-4 h-4 mr-1" />{extractM.isPending ? "…" : "Extraire"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Poste *</Label><Input value={form.title} onChange={(e) => update({ title: e.target.value })} /></div>
              <div><Label>Entreprise *</Label><Input value={form.company} onChange={(e) => update({ company: e.target.value })} /></div>
              <div><Label>Localisation</Label><Input value={form.location} onChange={(e) => update({ location: e.target.value })} /></div>
              <div>
                <Label>Contrat</Label>
                <Select value={form.contract_type} onValueChange={(v) => update({ contract_type: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{CONTRACTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Salaire min (€)</Label><Input type="number" value={form.salary_min} onChange={(e) => update({ salary_min: e.target.value })} /></div>
              <div><Label>Salaire max (€)</Label><Input type="number" value={form.salary_max} onChange={(e) => update({ salary_max: e.target.value })} /></div>
            </div>
            <div>
              <Label>Statut initial</Label>
              <Select value={form.status} onValueChange={(v) => update({ status: v as ApplicationStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label>CV utilisé</Label>
              <Select value={form.cv_used} onValueChange={(v) => update({ cv_used: v })}>
                <SelectTrigger><SelectValue placeholder={cvs.length ? "Sélectionner un CV" : "Aucun CV importé"} /></SelectTrigger>
                <SelectContent>{cvs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Lettre de motivation</Label>
              </div>
              <Textarea value={form.cover_letter} onChange={(e) => update({ cover_letter: e.target.value })} className="min-h-28" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contact (nom)</Label><Input value={form.contact_name} onChange={(e) => update({ contact_name: e.target.value })} /></div>
              <div><Label>Contact (email)</Label><Input type="email" value={form.contact_email} onChange={(e) => update({ contact_email: e.target.value })} /></div>
              <div><Label>Date de candidature</Label><Input type="date" value={form.applied_at} onChange={(e) => update({ applied_at: e.target.value })} /></div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => update({ source: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="glass-card rounded-lg p-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">Poste :</span> <span className="font-medium">{form.title}</span></div>
              <div><span className="text-muted-foreground">Entreprise :</span> <span className="font-medium">{form.company}</span></div>
              <div><span className="text-muted-foreground">Localisation :</span> {form.location || "—"}</div>
              <div><span className="text-muted-foreground">Contrat :</span> {form.contract_type || "—"}</div>
              <div><span className="text-muted-foreground">Salaire :</span> {form.salary_min || form.salary_max ? `${form.salary_min || "?"} – ${form.salary_max || "?"} €` : "—"}</div>
              <div><span className="text-muted-foreground">Statut :</span> {STATUS_LABELS[form.status]}</div>
              <div><span className="text-muted-foreground">CV :</span> {cvs.find((c) => c.id === form.cv_used)?.name ?? "—"}</div>
              <div><span className="text-muted-foreground">Source :</span> {form.source || "—"}</div>
              <div><span className="text-muted-foreground">Date :</span> {form.applied_at || "—"}</div>
            </div>
            <p className="text-xs text-muted-foreground">Le score IA sera calculé automatiquement après la création.</p>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : onOpenChange(false)}>
            <ChevronLeft className="w-4 h-4 mr-1" />{step === 1 ? "Annuler" : "Précédent"}
          </Button>
          {step < 3 ? (
            <Button onClick={next} className="gradient-primary text-white border-0">Suivant<ChevronRight className="w-4 h-4 ml-1" /></Button>
          ) : (
            <Button onClick={() => create.mutate()} disabled={create.isPending} className="gradient-primary text-white border-0">
              {create.isPending ? "Création…" : "Créer la candidature"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Bouton "Générer via IA" intégré — exposé via useServerFn dans le futur si besoin contextualisé
export function _useGen() { return useServerFn(aiGenerateCoverLetter); }
