import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Copy, Sparkles, FileText, MessageSquare, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, type Application, type ApplicationStatus, type TimelineEvent } from "@/types";
import { aiScoreApplication, aiGenerateCoverLetter, aiInterviewPrep } from "@/lib/ai.functions";

const AVATAR_COLORS = ["oklch(0.65 0.18 280)","oklch(0.68 0.16 30)","oklch(0.68 0.16 155)","oklch(0.70 0.16 230)","oklch(0.75 0.16 70)","oklch(0.55 0.18 25)","oklch(0.65 0.20 320)","oklch(0.65 0.18 200)"];
function hashColor(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]; }
function initials(s: string) { const p = s.trim().split(/\s+/).slice(0, 2); return p.map((x) => x[0]?.toUpperCase() ?? "").join("") || "?"; }

interface Props {
  application: Application | null;
  open: boolean;
  onClose: () => void;
}

export function ApplicationSlideOver({ application, open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && application && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[580px] bg-background border-l border-border z-50 shadow-2xl flex flex-col"
          >
            <SlideOverInner application={application} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SlideOverInner({ application, onClose }: { application: Application; onClose: () => void }) {
  const qc = useQueryClient();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const update = useMutation({
    mutationFn: async (patch: Partial<Application>) => {
      const { error } = await supabase.from("applications").update(patch).eq("id", application.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="p-5 border-b border-border flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: hashColor(application.company) }}>
          {initials(application.company)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold truncate">{application.title}</h2>
          <div className="text-sm text-muted-foreground truncate">{application.company}</div>
          <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `color-mix(in oklab, ${STATUS_COLORS[application.status]} 20%, transparent)`, color: STATUS_COLORS[application.status] }}>
            {STATUS_LABELS[application.status]}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition"><X className="w-4 h-4" /></button>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-5 mt-3 grid grid-cols-3">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex-1 overflow-y-auto p-5 space-y-5 mt-0">
          <DetailsTab application={application} onUpdate={(p) => update.mutate(p)} />
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 overflow-y-auto p-5 mt-0">
          <TimelineTab application={application} onUpdate={(p) => update.mutate(p)} />
        </TabsContent>

        <TabsContent value="ia" className="flex-1 overflow-y-auto p-5 space-y-5 mt-0">
          <IATab application={application} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function DetailsTab({ application: a, onUpdate }: { application: Application; onUpdate: (p: Partial<Application>) => void }) {
  const [notes, setNotes] = useState(a.notes ?? "");
  const [contactName, setContactName] = useState(a.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(a.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(a.contact_phone ?? "");
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    if (notes === (a.notes ?? "")) return;
    t.current = setTimeout(() => onUpdate({ notes }), 1000);
    return () => { if (t.current) clearTimeout(t.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  return (
    <>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Infos</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Localisation" value={a.location} />
          <Info label="Contrat" value={a.contract_type} />
          <Info label="Salaire" value={a.salary_min || a.salary_max ? `${a.salary_min ?? "?"} – ${a.salary_max ?? "?"} ${a.salary_currency}` : null} />
          <Info label="Candidaté" value={a.applied_at ? new Date(a.applied_at).toLocaleDateString("fr-FR") : null} />
        </div>
        {a.source_url && <a href={a.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">{a.source_url}</a>}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Statut</h3>
        </div>
        <Select value={a.status} onValueChange={(v) => onUpdate({ status: v as ApplicationStatus })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Notes <span className="text-xs text-muted-foreground font-normal">(auto-save)</span></h3>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24" placeholder="Ajoute tes notes…" />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Contact</h3>
        <div className="space-y-2">
          <div><Label className="text-xs">Nom</Label><Input value={contactName} onChange={(e) => setContactName(e.target.value)} onBlur={() => contactName !== (a.contact_name ?? "") && onUpdate({ contact_name: contactName || null })} /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} onBlur={() => contactEmail !== (a.contact_email ?? "") && onUpdate({ contact_email: contactEmail || null })} /></div>
          <div><Label className="text-xs">Téléphone</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} onBlur={() => contactPhone !== (a.contact_phone ?? "") && onUpdate({ contact_phone: contactPhone || null })} /></div>
        </div>
      </section>
    </>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function TimelineTab({ application: a, onUpdate }: { application: Application; onUpdate: (p: Partial<Application>) => void }) {
  const [note, setNote] = useState("");
  const events = [...(a.timeline ?? [])].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());

  const add = () => {
    if (!note.trim()) return;
    const e: TimelineEvent = { date: new Date().toISOString(), event: note.trim(), type: "note" };
    onUpdate({ timeline: [...(a.timeline ?? []), e] });
    setNote("");
    toast.success("Note ajoutée");
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note…" onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add} size="sm" className="gradient-primary text-white border-0"><Plus className="w-4 h-4" /></Button>
      </div>

      {events.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">Aucun événement</div>
      ) : (
        <ol className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {events.map((e, i) => (
            <li key={i} className="flex gap-3 relative">
              <span className="w-4 h-4 rounded-full mt-0.5 shrink-0 ring-4 ring-background" style={{ background: typeColor(e.type) }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{e.event}</div>
                <div className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(e.date), { addSuffix: true, locale: fr })}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function typeColor(t: string) {
  if (t === "status") return "oklch(0.65 0.18 280)";
  if (t === "note") return "oklch(0.70 0.16 230)";
  if (t === "follow_up") return "oklch(0.75 0.16 70)";
  return "oklch(0.68 0.16 155)";
}

function IATab({ application: a }: { application: Application }) {
  const scoreFn = useServerFn(aiScoreApplication);
  const letterFn = useServerFn(aiGenerateCoverLetter);
  const prepFn = useServerFn(aiInterviewPrep);
  const qc = useQueryClient();

  const score = useMutation({
    mutationFn: () => scoreFn({ data: { applicationId: a.id, cvId: a.cv_used ?? null } }),
    onSuccess: () => { toast.success("Score calculé"); qc.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const letter = useMutation({
    mutationFn: () => letterFn({ data: { applicationId: a.id } }),
    onError: (e: Error) => toast.error(e.message),
  });
  const prep = useMutation({
    mutationFn: () => prepFn({ data: { applicationId: a.id } }),
    onSuccess: () => { toast.success("Questions générées"); qc.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sc = a.ai_score;
  const radarData = sc ? [
    { axis: "Compétences", v: sc.technical ?? 0 },
    { axis: "Expérience", v: sc.experience ?? 0 },
    { axis: "Soft skills", v: sc.soft ?? 0 },
    { axis: "Localisation", v: sc.location ?? 0 },
    { axis: "Salaire", v: sc.salary ?? 0 },
  ] : [];

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4" />Score IA</h3>
          <Button size="sm" onClick={() => score.mutate()} disabled={score.isPending} className="gradient-primary text-white border-0">
            {score.isPending ? "Calcul…" : sc ? "Recalculer" : "Scorer"}
          </Button>
        </div>
        {score.isPending ? <Skeleton className="h-48 w-full" /> : sc ? (
          <div className="glass-card rounded-xl p-4">
            <div className="text-3xl font-bold text-center mb-2">{sc.global}<span className="text-sm text-muted-foreground">/100</span></div>
            <div className="h-48"><ResponsiveContainer>
              <RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tick={false} /><Radar dataKey="v" stroke="oklch(0.65 0.18 280)" fill="oklch(0.65 0.18 280)" fillOpacity={0.4} /></RadarChart>
            </ResponsiveContainer></div>
            {sc.recommendation && <div className="text-center mt-2 text-sm font-semibold">{sc.recommendation}</div>}
          </div>
        ) : <p className="text-xs text-muted-foreground">Pas encore scoré.</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4" />Lettre de motivation</h3>
          <Button size="sm" onClick={() => letter.mutate()} disabled={letter.isPending} className="gradient-primary text-white border-0">
            {letter.isPending ? "Génération…" : "Générer"}
          </Button>
        </div>
        {letter.isPending ? <Skeleton className="h-32 w-full" /> : letter.data?.output && (
          <div className="space-y-2">
            <Textarea value={letter.data.output} readOnly className="min-h-40 text-xs" />
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(letter.data!.output); toast.success("Copié"); }}><Copy className="w-3 h-3 mr-1" />Copier</Button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" />Préparer entretien</h3>
          <Button size="sm" onClick={() => prep.mutate()} disabled={prep.isPending} className="gradient-primary text-white border-0">
            {prep.isPending ? "…" : "10 questions"}
          </Button>
        </div>
        {prep.isPending ? <Skeleton className="h-40 w-full" /> : (a.interview_questions?.length > 0 || prep.data?.questions) && (
          <ol className="space-y-2 text-sm">
            {(prep.data?.questions ?? a.interview_questions).map((q, i) => (
              <li key={i} className="glass-card rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-primary">{i + 1}.</span>
                  <div className="flex-1">
                    <div>{q.q}</div>
                    <span className="inline-block mt-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted">{q.type}</span>
                    {q.tip && <div className="text-xs text-muted-foreground mt-1.5 italic">💡 {q.tip}</div>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
