import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { aiTestKey } from "@/lib/ai.functions";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/parametres")({ component: Parametres });

function Parametres() {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [key, setKey] = useState("");
  const [slas, setSlas] = useState({ sla_watchlist: 3, sla_applied: 7, sla_interview: 2 });
  const test = useServerFn(aiTestKey);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("settings").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setKey(settings.mammouth_api_key ?? "");
      setSlas({
        sla_watchlist: settings.sla_watchlist ?? 3,
        sla_applied: settings.sla_applied ?? 7,
        sla_interview: settings.sla_interview ?? 2,
      });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("settings").update({
        mammouth_api_key: key.trim() || null, ...slas,
      }).eq("user_id", u.user.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Paramètres sauvegardés"); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const testKey = useMutation({
    mutationFn: async () => await test({ data: { key } }),
    onSuccess: (r) => r.ok ? toast.success("Connexion OK ✅") : toast.error(`Échec (${r.status})`),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Paramètres" />
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">🔑 Clé API Mammouth AI</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input type={show ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-..." />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button variant="outline" onClick={() => testKey.mutate()} disabled={!key || testKey.isPending}>
            {testKey.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tester"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Obtenez votre clé sur mammouth.ai</p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">🔔 SLAs (jours avant relance)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Veille</Label><Input type="number" value={slas.sla_watchlist} onChange={(e) => setSlas({ ...slas, sla_watchlist: Number(e.target.value) })} /></div>
          <div><Label>Postulé</Label><Input type="number" value={slas.sla_applied} onChange={(e) => setSlas({ ...slas, sla_applied: Number(e.target.value) })} /></div>
          <div><Label>Entretien</Label><Input type="number" value={slas.sla_interview} onChange={(e) => setSlas({ ...slas, sla_interview: Number(e.target.value) })} /></div>
        </div>
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="gradient-primary text-white border-0">
        Sauvegarder
      </Button>
    </div>
  );
}
