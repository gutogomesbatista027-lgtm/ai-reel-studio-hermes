import { createFileRoute, Link } from "@tanstack/react-router";
import { studioHead } from "@/lib/page-head";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, Copy, MoreHorizontal, Pencil, Plus, Trash2, FolderKanban, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, Panel, EmptyState, StatusPill } from "@/components/studio/ui";
import { useProjects, type Project } from "@/lib/data";
import { PROJECT_STATUS, STYLES, formatDate } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => studioHead("Projetos — AI Reel Studio", "Gerencie seus projetos de edição."),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: projects = [], isLoading } = useProjects(showArchived);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["projects"] });

  async function duplicate(p: Project) {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = p;
    const { error } = await supabase.from("projects").insert({ ...rest, name: p.name + " (cópia)", status: "draft" });
    if (error) return toast.error(error.message);
    toast.success("Projeto duplicado");
    refresh();
  }
  async function toggleArchive(p: Project) {
    const { error } = await supabase.from("projects").update({ archived: !p.archived }).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function remove(p: Project) {
    if (!confirm(`Excluir "${p.name}"? Isso remove mídias, planos e renders associados.`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Projeto excluído");
    refresh();
  }

  return (
    <>
      <PageHeader
        eyebrow="Gestão"
        title="Projetos"
        actions={
          <>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={showArchived} onCheckedChange={setShowArchived} />Mostrar arquivados</label>
            <Button asChild><Link to="/studio"><Plus className="mr-1 h-4 w-4" />Novo projeto</Link></Button>
          </>
        }
      />
      <Panel>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : projects.length === 0 ? (
          <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="Nenhum projeto" description="Comece configurando um projeto no Estúdio de edição." action={<Button asChild size="sm"><Link to="/studio">Criar projeto</Link></Button>} />
        ) : (
          <div className="divide-y divide-border">
            {projects.map((p) => {
              const s = PROJECT_STATUS[p.status] ?? { label: p.status, tone: "muted" as const };
              return (
                <div key={p.id} className="flex items-center gap-4 py-3">
                  <Link to="/projects/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                    <p className="font-medium">{p.name} {p.archived && <span className="text-xs text-muted-foreground">(arquivado)</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(p.created_at)} · {p.target_duration}s · {p.aspect_ratio} · {(p.editing_style ?? []).map((x) => STYLES[x] ?? x).join(", ") || "Sem estilo"}
                    </p>
                  </Link>
                  <StatusPill {...s} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><Link to="/studio" search={{ id: p.id }}><Pencil className="mr-2 h-4 w-4" />Editar</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(p)}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleArchive(p)}>{p.archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}{p.archived ? "Restaurar" : "Arquivar"}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => remove(p)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
