import { differenceInDays } from "date-fns";
import type { Application } from "@/types";

export function getSLAStatus(app: Application, slas: { sla_watchlist: number; sla_applied: number; sla_interview: number }) {
  const now = new Date();
  const ref = new Date(app.updated_at);
  const days = differenceInDays(now, ref);
  let limit = Infinity;
  if (app.status === "watchlist") limit = slas.sla_watchlist;
  else if (app.status === "applied" || app.status === "follow_up") limit = slas.sla_applied;
  else if (app.status === "interview") limit = slas.sla_interview;
  const overdue = days > limit;
  return { days, limit, overdue, label: overdue ? `Relancer (${days}j)` : `${days}j` };
}
