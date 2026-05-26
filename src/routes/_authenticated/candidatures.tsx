import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS, STATUS_ORDER, STATUS_COLORS, type ApplicationStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/candidatures")({ component: Candidatures });

function Candidatures() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", location: "", source_url: "", description: "" });

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Non connecté");
      const { error } = await supabase.from("applications").insert({ ...form, user_id: u.user.id, status: "to_apply" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Candidature créée");
      qc.invalidateQueries({ queryKey: ["applications"] });
      setOpen(false);
      setForm({ title: "", company: "", location: "", source_url: "", description: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });

  const byStatus = (s: ApplicationStatus) => apps.filter((a: any) => a.status === s);

  return (
    <div>
      <PageHeader
        title="Candidatures"
        description={`${apps.length} candidature${apps.length > 1 ? "s" : ""}`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white border-0"><Plus className="w-4 h-4 mr-1" />Nouvelle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle candidature</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Poste *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Entreprise *</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                <div><Label>Localisation</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>URL de l'offre</Label><Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} /></div>
                <div><Label>Description</Label><textarea className="w-full min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <Button onClick={() => create.mutate()} disabled={!form.title || !form.company || create.isPending} className="w-full gradient-primary text-white border-0">Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement...</div>
      ) : apps.length === 0 ? (
        <EmptyState title="Aucune candidature" description="Commencez par ajouter votre première candidature." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((s) => {
            const items = byStatus(s);
            return (
              <div key={s} className="min-w-[280px] flex-1 glass-card rounded-xl p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("id");
                  if (id) move.mutate({ id, status: s });
                }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                    <span className="text-sm font-semibold">{STATUS_LABELS[s]}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((a: any) => (
                    <div key={a.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", a.id)}
                      className="p-3 rounded-lg bg-card border border-border hover:border-primary/40 cursor-grab active:cursor-grabbing transition">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {a.company?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{a.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" />{a.company}
                          </div>
                          {a.location && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{a.location}</div>}
                          {a.ai_score?.global != null && (
                            <div className="mt-2 text-xs font-semibold" style={{ color: a.ai_score.global > 70 ? "var(--success)" : a.ai_score.global > 40 ? "var(--warning)" : "var(--destructive)" }}>
                              {a.ai_score.global}/100
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">Vide</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
