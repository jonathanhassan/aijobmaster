import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Home, ListChecks, FileText, Sparkles, BarChart3,
  User, Settings, LogOut, Bell, Search, Briefcase, Menu, X,
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = useIsMobile();

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    router.navigate({ to: "/auth" });
  };

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = path === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              active
                ? "gradient-primary text-white font-medium shadow"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const SidebarFooter = ({ onNav }: { onNav?: () => void }) => (
    <div className="p-2 border-t border-border">
      <button
        onClick={() => { logout(); onNav?.(); }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Déconnexion</span>
      </button>
    </div>
  );

  const SidebarHeader = () => (
    <div className="flex items-center gap-2 p-4 border-b border-border h-14 shrink-0">
      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
        <Briefcase className="w-4 h-4 text-white" />
      </div>
      <span className="font-bold text-sm gradient-text">JobMaster AI</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ========== SIDEBAR DESKTOP UNIQUEMENT ========== */}
      {!isMobile && (
        <aside
          className="flex flex-col border-r border-border bg-sidebar transition-all duration-300 sticky top-0 h-screen"
          style={{ width: collapsed ? 64 : 240 }}
        >
          <SidebarHeader />
          {!collapsed && <NavLinks />}
          {!collapsed && <SidebarFooter />}

          {/* Toggle collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-16 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors z-10"
          >
            {collapsed ? (
              <span className="text-xs">›</span>
            ) : (
              <span className="text-xs">‹</span>
            )}
          </button>
        </aside>
      )}

      {/* ========== DRAWER MOBILE ========== */}
      {isMobile && drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <aside className="fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-border z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border h-14">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm gradient-text">JobMaster AI</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover
