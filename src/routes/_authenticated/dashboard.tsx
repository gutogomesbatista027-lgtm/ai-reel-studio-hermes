import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, CheckCircle2, Clock, Loader2, AlertTriangle, Video, Timer, Plus, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, Panel, Stat, EmptyState, StatusPill, DemoBadge } from "@/components/studio/ui";
import { useProjects, useAssets, useJobs, useRenders, useLiveJobs, useDemoMode, type Project } from "@/lib/data";
import { PROJECT_STATUS, JOB_STATUS, JOB_TYPES, STYLES, formatDate, formatDateTime, formatDuration } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AI Reel Studio" }, { name: "description", content: "Visão geral dos seus projetos e renders." }] }),
  component: Dashboard,
});

const DEMO_PROJECTS: Partial<Project>[] = [
  { id: "demo-1", name: "Lisboa ao entardecer", status: "rendering", target_duration: 30, editing_style: ["cinematic", "travel"], created_at: new Date().toISOString() },
  { id: "demo-2", name: "Trilha na Chapada", status: "review", target_duration: 15, editing_style: ["adventure", "montage"], created_at: new Date().toISOString() },
];

function Dashboard() {
  useLiveJobs();
  const [demo] = useDemoMode();
  const { data: projects = [] } = useProjects();
  const { data: assets = [] } = useAssets();
  const { data: jobs = [] } = useJobs();
  const { data: renders = [] } = useRenders();

  const count = (s: string) => projects.filter((p) => p.status === s).length;
  const totalSource = assets.reduce((a, x) => a + Number(x.duration ?? 0), 0);
  const failed = jobs.filter((j) => j.status === "failed").length;
  const showDemo = demo && projects.length === 0;
  const list = showDemo ? (DEMO_PROJECTS as Project[]) : projects.slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Painel de controle"
        title="Bem-vindo ao estúdio"
        description="Acompanhe projetos, processamento e renders em tempo real."
        actions={<Button asChild><Link to="/studio"><Plus className="mr-1 h-4 w-4" />Novo projeto</Link></Button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Projetos" value={projects.length} icon={<FolderKanban className="h-4 w-4" />} />
        <Stat label="Concluídos" value={count("completed")} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Stat label="Aguardando" value={count("draft") + count("awaiting_media") + count("queued")} icon={<Clock className="h-4 w-4" />} />
        <Stat label="Renderizando" value={count("rendering")} icon={<Loader2 className="h-4 w-4" />} />
        <Stat label="Falhas" value={failed} icon={<AlertTriangle className="h-4 w-4" />} />
        <Stat label="Vídeos" value={assets.length} icon={<Video className="h-4 w-4" />} />
        <Stat label="Material bruto" value={formatDuration(totalSource)} icon={<Timer className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Panel title="Projetos recentes" className="xl:col-span-2" action={<Link to="/projects" className="text-sm text-primary">Ver todos</Link>}>
          {list.length === 0 ? (
            <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="Nenhum projeto ainda" description="Crie seu primeiro projeto e envie os vídeos pelo Telegram." action={<Button asChild size="sm"><Link to="/studio">Criar projeto</Link></Button>} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((p) => <ProjectCard key={p.id} p={p} demo={showDemo} assetCount={assets.filter((a) => a.project_id === p.id).length} renderCount={renders.filter((r) => r.project_id === p.id).length} />)}
            </div>
          )}
        </Panel>
        <Panel title="Atividade de processamento">
          {jobs.length === 0 ? (
            <EmptyState title="Sem atividade" description="Jobs de análise e render aparecerão aqui." />
          ) : (
            <ul className="space-y-3">
              {jobs.slice(0, 8).map((j) => {
                const s = JOB_STATUS[j.status] ?? { label: j.status, tone: "muted" as const };
                return (
                  <li key={j.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{JOB_TYPES[j.job_type] ?? j.job_type}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(j.created_at)}</p>
                    </div>
                    <StatusPill {...s} />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Renders recentes" className="mt-6">
        {renders.length === 0 ? (
          <EmptyState icon={<Film className="h-6 w-6" />} title="Nenhum render ainda" description="Quando o worker devolver um vídeo final, ele aparece aqui." />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {renders.slice(0, 6).map((r) => (
              <Link key={r.id} to="/projects/$id" params={{ id: r.project_id }} className="rounded-lg border border-border p-3 hover:border-primary/50">
                <p className="font-medium">Versão {r.version}</p>
                <p className="text-xs text-muted-foreground">{r.resolution ?? "—"} · {formatDuration(Number(r.duration))} · {formatDate(r.created_at)}</p>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function ProjectCard({ p, demo, assetCount, renderCount }: { p: Project; demo?: boolean; assetCount: number; renderCount: number }) {
  const s = PROJECT_STATUS[p.status] ?? { label: p.status, tone: "muted" as const };
  const progress = { draft: 5, awaiting_media: 10, queued: 20, analyzing: 40, planning: 60, rendering: 80, review: 90, completed: 100, failed: 100 }[p.status] ?? 0;
  const inner = (
    <div className="group rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/50">
      <div className="mb-3 flex aspect-[16/7] items-center justify-center rounded-md bg-gradient-to-br from-accent to-muted">
        <Film className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{p.name}</p>
        {demo ? <DemoBadge /> : <StatusPill {...s} />}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatDate(p.created_at)} · {assetCount} vídeos · alvo {p.target_duration}s · {renderCount ? `v${renderCount}` : "sem render"}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{(p.editing_style ?? []).map((x) => STYLES[x] ?? x).join(", ") || "Sem estilo"}</p>
      <Progress value={progress} className="mt-3 h-1" />
    </div>
  );
  return demo ? inner : <Link to="/projects/$id" params={{ id: p.id }}>{inner}</Link>;
}
