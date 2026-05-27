import { memo } from "react";
import { Building2, MapPin, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Application } from "@/types";
import { getSLAStatus } from "@/lib/sla";

const AVATAR_COLORS = [
  "oklch(0.65 0.18 280)", "oklch(0.68 0.16 30)", "oklch(0.68 0.16 155)",
  "oklch(0.70 0.16 230)", "oklch(0.75 0.16 70)", "oklch(0.55 0.18 25)",
  "oklch(0.65 0.20 320)", "oklch(0.65 0.18 200)",
];

function hashColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(s: string) {
  const parts = s.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

interface Props {
  application: Application;
  slas: { sla_watchlist: number; sla_applied: number; sla_interview: number };
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export const KanbanCard = memo(function KanbanCard({ application: a, slas, onClick, onDragStart }: Props) {
  const sla = getSLAStatus(a, slas);
  const score = a.ai_score?.global ?? null;
  const scoreColor = score == null ? "" : score > 70 ? "oklch(0.68 0.16 155)" : score > 40 ? "oklch(0.75 0.16 70)" : "oklch(0.55 0.18 25)";
  const updated = formatDistanceToNow(new Date(a.updated_at), { addSuffix: true, locale: fr });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="p-3 rounded-lg bg-card border border-border hover:border-primary/60 hover:shadow-lg cursor-pointer transition-all"
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: hashColor(a.company) }}
        >
          {initials(a.company)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{a.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{a.company}</span>
          </div>
          {a.location && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{a.location}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">{updated}</span>
            <div className="flex items-center gap-1.5">
              {sla.overdue && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive">
                  <AlertCircle className="w-3 h-3 animate-pulse" />
                  {sla.days}j
                </span>
              )}
              {score != null && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ color: scoreColor, background: `color-mix(in oklab, ${scoreColor} 15%, transparent)` }}>
                  {score}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
