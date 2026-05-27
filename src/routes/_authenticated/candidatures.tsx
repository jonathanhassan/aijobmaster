import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { STATUS_ORDER, type Application, type ApplicationStatus } from "@/types";
import { KanbanCard } from "@/components/applications/KanbanCard";
import { KanbanColumn } from "@/components/applications/KanbanColumn";
import { ApplicationSlideOver } from "@/components/applications/ApplicationSlideOver";
import { CreateApplicationStepper } from "@/components/applications/CreateApplicationStepper";

export const Route = createFileRoute("/_authenticated/candidatures")({ component: Candidatures });

function Candidatures() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Application[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("sla_watchlist,sla_applied,sla_interview").maybeSingle();
      return {
        sla_watchlist: data?.sla_watchlist ?? 3,
        sla_applied: data?.sla_applied ?? 7,
        sla_interview: data?.sla_interview ?? 2,
      };
    },
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const app = apps.find((a) => a.id === id);
      const timeline = [...(app?.timeline ?? []), { date: new Date().toISOString(), event: `Statut → ${status}`, type: "status" }];
      const { error } = await supabase.from("applications").update({ status, timeline }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const selected = useMemo(() => apps.find((a) => a.id === selectedId) ?? null, [apps, selectedId]);
  const slas = settings ?? { sla_watchlist: 3, sla_applied: 7, sla_interview: 2 };

  return (
    <div>
      <PageHeader
        title="Candidatures"
        description={`${apps.length} candidature${apps.length > 1 ? "s" : ""}`}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gradient-primary text-white border-0">
            <Plus className="w-4 h-4 mr-1" />Nouvelle
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : apps.length === 0 ? (
        <EmptyState
          title="Aucune candidature"
          description="Commencez par ajouter votre première candidature."
          action={<Button onClick={() => setCreateOpen(true)} className="gradient-primary text-white border-0"><Plus className="w-4 h-4 mr-1" />Créer</Button>}
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((s) => {
            const items = apps.filter((a) => a.status === s);
            return (
              <KanbanColumn key={s} status={s} count={items.length} onDrop={(id) => move.mutate({ id, status: s })}>
                {items.map((a) => (
                  <KanbanCard
                    key={a.id}
                    application={a}
                    slas={slas}
                    onClick={() => setSelectedId(a.id)}
                    onDragStart={(e) => e.dataTransfer.setData("id", a.id)}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
      )}

      <CreateApplicationStepper open={createOpen} onOpenChange={setCreateOpen} />
      <ApplicationSlideOver application={selected} open={!!selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
