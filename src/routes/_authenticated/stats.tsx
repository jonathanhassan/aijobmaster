import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { STATUS_LABELS, STATUS_COLORS, type ApplicationStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/stats")({ component: Stats });

function Stats() {
  const { data: apps = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => (await supabase.from("applications").select("*")).data ?? [],
  });

  const byStatus = (Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => ({
    name: STATUS_LABELS[s], value: apps.filter((a: any) => a.status === s).length, color: STATUS_COLORS[s],
  })).filter((x) => x.value > 0);

  return (
    <div>
      <PageHeader title="Statistiques" description="Analysez votre recherche" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold mb-4">Répartition par statut</h3>
          {byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Pas encore de données.</p>}
        </div>
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold mb-4">Volume par statut</h3>
          {byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byStatus}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="oklch(0.58 0.22 295)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Pas encore de données.</p>}
        </div>
      </div>
    </div>
  );
}
