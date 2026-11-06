import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, EmptyState, StatusPill } from "@/components/studio/ui";
import { ProjectSelect } from "@/components/studio/ProjectSelect";
import { useProjects, usePlans, useJobs, useLiveJobs } from "@/lib/data";
import { dispatchJob } from "@/lib/jobs.functions";
import { JOB_STATUS, formatDateTime } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/director")({
  validateSearch: (s: Record<string, unknown>): { project?: string } => ({ project: typeof s.project === "string" ? s.project : undefined }),
  head: () => ({ meta: [{ title: "Diretor IA — AI Reel Studio" }, { name: "description", content: "Peça ao Hermes um plano de edição." }] }),
  component: Director,
});

function Director() {
  useLiveJobs();
  const search = Route.useSearch();
  const { data: projects = [] } = useProjects();
  const [pid, setPid] = useState<string | undefined>(search.project);
  useEffect(() => { if (!pid && projects[0]) setPid(projects[0].id); }, [projects, pid]);
  const project = projects.find((p) => p.id === pid);
  const { data: plans = [] } = usePlans(pid);
  const { data: jobs = [] } = useJobs(pid);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useServerFn(dispatchJob);
  const directionJobs = jobs.filter((j) => j.job_type === "ai_direction");

  async function ask() {
    if (!pid) return;
    setBusy(true);
    try {
      const r = await dispatch({ data: { projectId: pid, jobType: "ai_direction", payload: { extra_instructions: note } } });
      toast[r.sent ? "success" : "warning"](r.sent ? "Briefing enviado ao Hermes" : "Pedido registrado — o worker/Hermes ainda não está conectado");
      setNote("");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Hermes Agent" title="Diretor IA" description="O Hermes lê seu briefing, as análises de vídeo e música, e propõe um plano de edição. O FFmpeg executa." actions={<ProjectSelect projects={projects} value={pid} onChange={setPid} />} />
      {!project ? <Panel><EmptyState title="Crie um projeto primeiro" /></Panel> : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel title="Briefing" className="lg:col-span-1">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.creative_brief || "Sem instruções criativas ainda."}</p>
            <Textarea className="mt-4" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Instruções extras para esta versão…" />
            <Button className="mt-3 w-full" onClick={ask} disabled={busy}><Sparkles className="mr-1 h-4 w-4" />{busy ? "Enviando…" : "Pedir plano de edição"}</Button>
            {directionJobs.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {directionJobs.slice(0, 5).map((j) => (
                  <li key={j.id} className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{formatDateTime(j.created_at)}</span><StatusPill {...(JOB_STATUS[j.status] ?? { label: j.status, tone: "muted" })} /></li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Planos propostos" className="lg:col-span-2">
            {plans.length === 0 ? <EmptyState icon={<Sparkles className="h-6 w-6" />} title="Nenhum plano ainda" description="Quando o Hermes responder, as versões do plano aparecerão aqui com a explicação criativa." /> : (
              <ul className="space-y-4">
                {plans.map((p) => (
                  <li key={p.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between"><p className="font-display text-lg">Versão {p.version}</p><span className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</span></div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{p.creative_explanation ?? "—"}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
