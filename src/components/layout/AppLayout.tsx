import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Home, ListChecks, FileText, Sparkles, BarChart3,
  User, Settings, Bell, Search, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/candidatures", label: "Candidatures", icon: ListChecks },
  { to: "/mes-cvs", label: "Mes CVs", icon: FileText },
  { to: "/ia", label: "Outils IA", icon: Sparkles },
  { to: "/stats", label: "Statistiques", icon: BarChart3 },
  { to: "/profil", label: "Mon Profil", icon: User },
  { to: "/parametres", label: "Paramètres", icon: Settings },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function NavLinks({ onClose }: { onClose?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* SIDEBAR DESKTOP */}
      {!isMobile && (
        <aside className="w-56 shrink-0 border-r border-border flex flex-col bg-card/40">
          <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">JobMaster AI</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <div className="p-2 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>
      )}

      {/* DRAWER MOBILE */}
      {isMobile && drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm">JobMaster AI</span>
              </div>
              <button onClick={() => setDrawerOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onClose={() => setDrawerOpen(false)} />
            </div>
            <div className="p-2 border-t border-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-card/40 backdrop-blur sticky top-0 z-10 shrink-0">
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Bell className="w-4 h-4" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
