import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Home, ListChecks, FileText, Sparkles, BarChart3, User, Settings,
  ChevronLeft, ChevronRight, LogOut, Bell, Search, Briefcase,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/candidatures", label: "Candidatures", icon: ListChecks },
  { to: "/mes-cvs", label: "Mes CVs", icon: FileText },
  { to: "/ia", label: "Outils IA", icon: Sparkles },
  { to: "/stats", label: "Statistiques", icon: BarChart3 },
  { to: "/profil", label: "Mon Profil", icon: User },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex w-full" style={{ background: "var(--gradient-bg)" }}>
      <aside
        className="flex flex-col border-r border-border bg-sidebar transition-all duration-300 sticky top-0 h-screen"
        style={{ width: collapsed ? 64 : 240 }}
      >
        <div className="flex items-center gap-2 p-4 border-b border-border h-14">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-sm gradient-text">JobMaster AI</span>}
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path.startsWith(to);
            return (
              <Link
                key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? "gradient-primary text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border space-y-1">
          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40 backdrop-blur sticky top-0 z-10">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Rechercher... (Cmd+K)"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="ghost" size="icon"><Bell className="w-4 h-4" /></Button>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
