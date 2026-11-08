import { createFileRoute } from "@tanstack/react-router";
import { studioHead } from "@/lib/page-head";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Film, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, EmptyState } from "@/components/studio/ui";
import { ProjectSelect } from "@/components/studio/ProjectSelect";
import { useProjects, usePlans, useRenders, useLiveJobs } from "@/lib/data";
import { dispatchJob } from "@/lib/jobs.functions";
import { formatDate, formatDuration } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => studioHead("Timeline & Preview — AI Reel Studio", "Veja o plano de edição e os renders."),
  component: Timeline,
});

type Clip = { start: number; end: number; asset?: string; label?: string; transition?: string };

function Timeline() {
  useLiveJobs();
  const qc = useQueryClient();
  const { data: projects = [] } = useProjects();
  const [pid, setPid] = useState<string>();
  useEffect(() => { if (!pid && projects[0]) setPid(projects[0].id); }, [projects, pid]);
  const { data: plans = [] } = usePlans(pid);
  const { data: renders = [] } = useRenders(pid);
  const [renderId, setRenderId] = useState<string>();
  const [fb, setFb] = useState("");
  const dispatch = useServerFn(dispatchJob);
  const plan = plans[0];
  const tl = (plan?.timeline_json ?? {}) as { clips?: Clip[]; beats?: number[]; duration?: number };
  const clips = tl.clips ?? [];
  const total = tl.duration ?? clips.reduce((m, c) => Math.max(m, c.end), 0);
  const render = renders.find((r) => r.id === renderId) ?? renders[0];

  async function requestRender() {
    if (!pid || !plan) return;
    try {
      const r = await dispatch({ data: { projectId: pid, jobType: "render", payload: { edit_plan_id: plan.id } } });
      toast[r.sent ? "success" : "warning"](r.sent ? "Render enviado ao worker" : "Job criado — worker ainda não configurado");
    } catch (e) { toast.error((e as Error).message); }
  }
  async function sendFeedback(type: "approve" | "comment") {
    if (!pid || !render) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("feedback").insert({ user_id: u.user!.id, project_id: pid, render_id: render.id, feedback_type: type, feedback_text: type === "approve" ? "Aprovado" : fb });
    if (error) return toast.error(error.message);
    if (type === "approve") await supabase.from("projects").update({ status: "completed" }).eq("id", pid);
    toast.success(type === "approve" ? "Render aprovado" : "Feedback enviado");
    setFb("");
    qc.invalidateQueries({ queryKey: ["feedback", pid] });
  }

  return (
    <>
      <PageHeader eyebrow="Pós-produção" title="Timeline & Preview" actions={<ProjectSelect projects={projects} value={pid} onChange={setPid} />} />
      <Panel title={plan ? `Plano v${plan.version}` : "Timeline"} action={plan && <Button size="sm" onClick={requestRender}>Renderizar este plano</Button>}>
        {!plan ? <EmptyState title="Sem plano de edição" description="Peça um plano ao Diretor IA para visualizar a timeline." /> : clips.length === 0 ? (
          <p className="text-sm text-muted-foreground">O plano não contém clipes estruturados.</p>
        ) : (
          <div>
            <div className="relative h-16 overflow-hidden rounded bg-muted/40">
              {clips.map((c, i) => (
                <div key={i} title={c.label ?? c.asset} className="absolute top-2 bottom-2 rounded border border-primary/40 bg-primary/25 px-1 text-[10px] text-foreground" style={{ left: `${(c.start / total) * 100}%`, width: `${((c.end - c.start) / total) * 100}%` }}>
                  <span className="truncate">{c.label ?? `#${i + 1}`}</span>
                </div>
              ))}
              {(tl.beats ?? []).map((b, i) => <div key={"b" + i} className="absolute top-0 h-full w-px bg-foreground/20" style={{ left: `${(b / total) * 100}%` }} />)}
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>0s</span><span>{formatDuration(total)}</span></div>
          </div>
        )}
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Preview" className="lg:col-span-2">
          {!render ? <EmptyState icon={<Film className="h-6 w-6" />} title="Nenhum render" /> : render.preview_url ? (
            <video key={render.id} src={render.preview_url} controls className="mx-auto max-h-[70vh] rounded bg-background" />
          ) : <EmptyState title="Preview indisponível" description="O worker não enviou um link de preview para esta versão." />}
          {render && (
            <div className="mt-4 space-y-2">
              <Textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="O que mudar na próxima versão?" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => sendFeedback("comment")} disabled={!fb.trim()}>Enviar feedback</Button>
                <Button onClick={() => sendFeedback("approve")}><Check className="mr-1 h-4 w-4" />Aprovar</Button>
                {render.download_url && <Button variant="ghost" asChild><a href={render.download_url} target="_blank" rel="noreferrer">Baixar</a></Button>}
              </div>
            </div>
          )}
        </Panel>
        <Panel title="Versões">
          {renders.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
            <ul className="space-y-2">{renders.map((r) => (
              <li key={r.id}><button onClick={() => setRenderId(r.id)} className={`w-full rounded border p-2 text-left text-sm ${render?.id === r.id ? "border-primary" : "border-border"}`}>
                Versão {r.version}<span className="block text-xs text-muted-foreground">{r.resolution ?? "—"} · {formatDate(r.created_at)}</span>
              </button></li>
            ))}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
