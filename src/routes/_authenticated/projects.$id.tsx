import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, EmptyState, StatusPill } from "@/components/studio/ui";
import { useProject, useAssets, useMusic, usePlans, useRenders, useJobs, useLiveJobs } from "@/lib/data";
import { PROJECT_STATUS, JOB_STATUS, JOB_TYPES, STYLES, PACES, NARRATIVES, formatBytes, formatDate, formatDateTime, formatDuration } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Projeto — AI Reel Studio" }, { name: "description", content: "Detalhes do projeto." }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  useLiveJobs();
  const { data: p, isLoading } = useProject(id);
  const { data: assets = [] } = useAssets(id);
  const { data: music = [] } = useMusic(id);
  const { data: plans = [] } = usePlans(id);
  const { data: renders = [] } = useRenders(id);
  const { data: jobs = [] } = useJobs(id);
  const { data: analyses = [] } = useQuery({
    queryKey: ["video_analysis", id],
    queryFn: async () => (await supabase.from("video_analysis").select("*").eq("project_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: feedback = [] } = useQuery({
    queryKey: ["feedback", id],
    queryFn: async () => (await supabase.from("feedback").select("*").eq("project_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!p) return <EmptyState title="Projeto não encontrado" action={<Button asChild size="sm"><Link to="/projects">Voltar</Link></Button>} />;
  const s = PROJECT_STATUS[p.status] ?? { label: p.status, tone: "muted" as const };

  return (
    <>
      <PageHeader
        eyebrow="Projeto"
        title={p.name}
        description={p.description ?? undefined}
        actions={
          <>
            <StatusPill {...s} />
            <Button variant="outline" asChild><Link to="/studio" search={{ id: p.id }}><Pencil className="mr-1 h-4 w-4" />Editar</Link></Button>
            <Button asChild><Link to="/director" search={{ project: p.id }}><Sparkles className="mr-1 h-4 w-4" />Diretor IA</Link></Button>
          </>
        }
      />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Info k="Duração alvo" v={`${p.target_duration}s`} />
        <Info k="Formato" v={`${p.aspect_ratio} · ${p.resolution} · ${p.frame_rate}fps`} />
        <Info k="Ritmo" v={PACES[p.editing_pace ?? ""] ?? "—"} />
        <Info k="Narrativa" v={NARRATIVES[p.narrative_objective ?? ""] ?? "—"} />
      </div>
      <Panel className="mb-6" title="Enviar mídia pelo Telegram">
        <p className="text-sm text-muted-foreground">Envie vídeos, música e instruções ao seu bot usando o código do projeto:</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 text-xs">{p.id}</code>
          <Button size="icon" variant="ghost" aria-label="Copiar" onClick={() => { navigator.clipboard.writeText(p.id); toast.success("Copiado"); }}><Copy className="h-4 w-4" /></Button>
        </div>
      </Panel>
      <Tabs defaultValue="media">
        <TabsList className="flex-wrap">
          <TabsTrigger value="media">Mídia ({assets.length})</TabsTrigger>
          <TabsTrigger value="music">Música ({music.length})</TabsTrigger>
          <TabsTrigger value="analysis">Análises ({analyses.length})</TabsTrigger>
          <TabsTrigger value="plans">Planos ({plans.length})</TabsTrigger>
          <TabsTrigger value="renders">Renders ({renders.length})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="feedback">Feedback ({feedback.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="media"><Panel>{assets.length === 0 ? <EmptyState title="Sem vídeos" description="Os vídeos enviados ao bot do Telegram aparecerão aqui." /> : (
          <ul className="divide-y divide-border">{assets.map((a) => <li key={a.id} className="flex justify-between py-2 text-sm"><span>{a.filename ?? a.telegram_file_id}</span><span className="text-muted-foreground">{formatDuration(Number(a.duration))} · {formatBytes(Number(a.file_size))} · {a.analysis_status}</span></li>)}</ul>)}</Panel></TabsContent>
        <TabsContent value="music"><Panel>{music.length === 0 ? <EmptyState title="Sem músicas" /> : (
          <ul className="divide-y divide-border">{music.map((m) => <li key={m.id} className="flex justify-between py-2 text-sm"><span>{m.filename}</span><span className="text-muted-foreground">{m.bpm ? `${m.bpm} BPM` : "BPM pendente"} · {formatDuration(Number(m.duration))}</span></li>)}</ul>)}</Panel></TabsContent>
        <TabsContent value="analysis"><Panel>{analyses.length === 0 ? <EmptyState title="Sem análises" description="O worker envia a análise visual de cada vídeo." /> : (
          <ul className="space-y-2">{analyses.map((a) => <li key={a.id}><pre className="max-h-48 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(a.analysis_data, null, 2)}</pre></li>)}</ul>)}</Panel></TabsContent>
        <TabsContent value="plans"><Panel>{plans.length === 0 ? <EmptyState title="Sem planos" description="Peça um plano ao Diretor IA." /> : (
          <ul className="space-y-3">{plans.map((pl) => <li key={pl.id} className="rounded border border-border p-3"><p className="font-medium">Versão {pl.version} <span className="text-xs text-muted-foreground">· {formatDateTime(pl.created_at)}</span></p><p className="mt-1 text-sm text-muted-foreground">{pl.creative_explanation ?? "Sem explicação"}</p></li>)}</ul>)}</Panel></TabsContent>
        <TabsContent value="renders"><Panel>{renders.length === 0 ? <EmptyState title="Sem renders" /> : (
          <ul className="divide-y divide-border">{renders.map((r) => <li key={r.id} className="flex justify-between py-2 text-sm"><span>Versão {r.version}</span><span className="text-muted-foreground">{r.resolution} · {formatDate(r.created_at)}</span></li>)}</ul>)}</Panel></TabsContent>
        <TabsContent value="jobs"><Panel>{jobs.length === 0 ? <EmptyState title="Sem jobs" /> : (
          <ul className="divide-y divide-border">{jobs.map((j) => <li key={j.id} className="flex items-center justify-between py-2 text-sm"><span>{JOB_TYPES[j.job_type] ?? j.job_type} · {j.progress}%</span><StatusPill {...(JOB_STATUS[j.status] ?? { label: j.status, tone: "muted" })} /></li>)}</ul>)}</Panel></TabsContent>
        <TabsContent value="feedback"><Panel>{feedback.length === 0 ? <EmptyState title="Sem feedback" /> : (
          <ul className="space-y-2">{feedback.map((f) => <li key={f.id} className="rounded border border-border p-3 text-sm"><p>{f.feedback_text}</p><p className="mt-1 text-xs text-muted-foreground">{f.feedback_type} · {formatDateTime(f.created_at)}</p></li>)}</ul>)}</Panel></TabsContent>
      </Tabs>
      <p className="mt-4 text-xs text-muted-foreground">Estilos: {(p.editing_style ?? []).map((x) => STYLES[x] ?? x).join(", ") || "—"}</p>
    </>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="panel p-3"><p className="text-xs uppercase tracking-wider text-muted-foreground">{k}</p><p className="mt-1 text-sm">{v}</p></div>;
}
