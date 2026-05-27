import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS, type ApplicationStatus } from "@/types";

interface Props {
  status: ApplicationStatus;
  count: number;
  onDrop: (id: string) => void;
  children: ReactNode;
}

export function KanbanColumn({ status, count, onDrop, children }: Props) {
  const [over, setOver] = useState(false);
  const color = STATUS_COLORS[status];
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("id");
        if (id) onDrop(id);
      }}
      className={cn(
        "min-w-[280px] flex-1 glass-card rounded-xl overflow-hidden transition-all",
        over && "ring-2 ring-primary"
      )}
    >
      <div className="h-1" style={{ background: color }} />
      <div className="p-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5">{count}</span>
        </div>
        <div className="space-y-2 min-h-[40px]">
          {children}
          {count === 0 && <div className="text-xs text-muted-foreground text-center py-6">Vide</div>}
        </div>
      </div>
    </div>
  );
}
