import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, FolderKanban, Library, SlidersHorizontal, Sparkles, Music2, Film, UserCog, ListChecks, Plug, Settings, LogOut, Clapperboard, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/media", label: "Biblioteca de mídia", icon: Library },
  { to: "/studio", label: "Estúdio de edição", icon: SlidersHorizontal },
  { to: "/director", label: "Diretor IA", icon: Sparkles },
  { to: "/music", label: "Estúdio musical", icon: Music2 },
  { to: "/timeline", label: "Timeline & Preview", icon: Film },
  { to: "/profiles", label: "Perfis de edição", icon: UserCog },
  { to: "/queue", label: "Fila de processamento", icon: ListChecks },
  { to: "/integrations", label: "Integrações", icon: Plug },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
          <Clapperboard className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-base leading-tight text-sidebar-foreground">AI Reel Studio</p>
          <p className="text-[11px] text-muted-foreground">Direção criativa por IA</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV.map((n) => {
          const active = path === n.to || path.startsWith(n.to + "/");
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={signOut} className="m-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </aside>
  );

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {sidebar}
          <button aria-label="Fechar menu" className="flex-1 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <X className="ml-auto mr-4 mt-4 h-5 w-5" />
          </button>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <span className="font-display">AI Reel Studio</span>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
