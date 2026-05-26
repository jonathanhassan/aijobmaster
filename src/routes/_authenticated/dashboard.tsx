import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Briefcase, Calendar, Trophy, TrendingUp, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function KPI({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string | number; hint?: string }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  const { data: apps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*").order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const active = apps.filter((a: any) => !["rejected"].includes(a.status)).length;
  const interviews = apps.filter((a: any) => a.status === "interview").length;
  const offers = apps.filter((a: any) => a.status === "offer").length;
  const applied = apps.filter((a: any) => a.status === "applied" || a.status === "interview" || a.status === "offer").length;
  const responseRate = applied > 0 ? Math.round((interviews + offers) / applied * 100) : 0;
  const avgScore = (() => {
    const scored = apps.filter((a: any) => a.ai_score?.global);
    if (!scored.length) return 0;
    return Math.round(scored.reduce((s: number, a: any) => s + (a.ai_score?.global ?? 0), 0) / scored.length);
  })();

  return (
    <div>
      <PageHeader title="Dashboard" description="Vue d'ensemble de votre recherche" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KPI icon={Briefcase} label="Actives" value={active} />
        <KPI icon={Calendar} label="Entretiens" value={interviews} />
        <KPI icon={Trophy} label="Offres" value={offers} />
        <KPI icon={TrendingUp} label="Taux réponse" value={`${responseRate}%`} />
        <KPI icon={Sparkles} label="Score IA moyen" value={`${avgScore}/100`} />
        <KPI icon={Clock} label="Total" value={apps.length} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-4">🎯 Plan d'action aujourd'hui</h2>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ajoutez votre première candidature pour démarrer.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {apps.slice(0, 5).map((a: any) => (
                <li key={a.id} className="flex justify-between p-2 rounded-lg hover:bg-accent">
                  <span>{a.title} · {a.company}</span>
                  <span className="text-xs text-muted-foreground">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-4">📋 Activité récente</h2>
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {apps.slice(0, 8).map((a: any) => (
                <li key={a.id} className="text-xs text-muted-foreground">
                  <span className="text-foreground">{a.company}</span> — {new Date(a.updated_at).toLocaleDateString("fr-FR")}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
