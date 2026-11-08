import { createFileRoute } from "@tanstack/react-router";
import { studioHead } from "@/lib/page-head";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListChecks, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, Panel, EmptyState, StatusPill } from "@/components/studio/ui";
import { useJobs, useProjects, useLiveJobs } from "@/lib/data";
import { retryJob, cancelJob } from "@/lib/jobs.functions";
import { JOB_STATUS, JOB_TYPES, formatDateTime } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/queue")({
  head: () => studioHead("Fila de processamento — AI Reel Studio", "Acompanhe jobs em tempo real."),
  component: Queue,
});

function Queue() {
  useLiveJobs();
  const qc = useQueryClient();
  const { data: jobs = [] } = useJobs();
  const { data: projects = [] } = useProjects(true);
  const retry = useServerFn(retryJob);
  const cancel = useServerFn(cancelJob);
  const refresh = () => qc.invalidateQueries({ queryKey: ["jobs"] });

  return (
    <>
      <PageHeader eyebrow="Processamento" title="Fila de processamento" description="Atualiza em tempo real conforme o worker reporta progresso." />
      <Panel>
        {jobs.length === 0 ? <EmptyState icon={<ListChecks className="h-6 w-6" />} title="Fila vazia" description="Jobs de análise, direção e render aparecerão aqui." /> : (
          <ul className="divide-y divide-border">
            {jobs.map((j) => {
              const s = JOB_STATUS[j.status] ?? { label: j.status, tone: "muted" as const };
              const active = ["queued", "dispatched", "running"].includes(j.status);
              return (
                <li key={j.id} className="grid gap-2 py-4 md:grid-cols-[1fr_200px_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{JOB_TYPES[j.job_type] ?? j.job_type} <span className="text-sm font-normal text-muted-foreground">· {projects.find((p) => p.id === j.project_id)?.name ?? "—"}</span></p>
                    <p className="text-xs text-muted-foreground">{j.current_stage ?? "—"} · {formatDateTime(j.created_at)}{j.worker_id ? ` · ${j.worker_id}` : ""}</p>
                    {j.error_message && <p className="mt-1 text-xs text-destructive">{j.error_message}</p>}
                  </div>
                  <div><Progress value={j.progress} className="h-1.5" /><p className="mt-1 text-xs text-muted-foreground">{j.progress}%</p></div>
                  <div className="flex items-center gap-2">
                    <StatusPill {...s} />
                    {(j.status === "failed" || j.status === "cancelled") && <Button size="icon" variant="ghost" aria-label="Tentar novamente" onClick={async () => { try { await retry({ data: { jobId: j.id } }); toast.success("Job reenviado"); refresh(); } catch (e) { toast.error((e as Error).message); } }}><RotateCcw className="h-4 w-4" /></Button>}
                    {active && <Button size="icon" variant="ghost" aria-label="Cancelar" onClick={async () => { try { await cancel({ data: { jobId: j.id } }); refresh(); } catch (e) { toast.error((e as Error).message); } }}><XCircle className="h-4 w-4" /></Button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
