import { createFileRoute } from "@tanstack/react-router";
import { studioHead } from "@/lib/page-head";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Music2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, EmptyState, StatusPill } from "@/components/studio/ui";
import { useMusic, useProjects, type MusicTrack } from "@/lib/data";
import { dispatchJob } from "@/lib/jobs.functions";
import { formatDuration } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/music")({
  head: () => studioHead("Estúdio musical — AI Reel Studio", "BPM, batidas e energia das suas músicas."),
  component: Music,
});

function Music() {
  const { data: tracks = [] } = useMusic();
  const { data: projects = [] } = useProjects(true);
  return (
    <>
      <PageHeader eyebrow="Inteligência musical" title="Estúdio musical" description="O worker analisa cada faixa (BPM, batidas, compassos e energia) para guiar os cortes." />
      {tracks.length === 0 ? (
        <Panel><EmptyState icon={<Music2 className="h-6 w-6" />} title="Nenhuma música recebida" description="Envie um arquivo de áudio ao bot do Telegram junto com o código do projeto." /></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tracks.map((t) => <TrackCard key={t.id} t={t} projectName={projects.find((p) => p.id === t.project_id)?.name} />)}
        </div>
      )}
    </>
  );
}

function TrackCard({ t, projectName }: { t: MusicTrack; projectName?: string }) {
  const qc = useQueryClient();
  const dispatch = useServerFn(dispatchJob);
  const energy = Array.isArray(t.energy_data) ? (t.energy_data as number[]) : [];
  const beats = Array.isArray(t.beat_data) ? (t.beat_data as number[]) : [];
  const dur = Number(t.duration ?? 0);

  async function saveSegment(start: number, end: number) {
    const { error } = await supabase.from("music_tracks").update({ selected_start: start, selected_end: end }).eq("id", t.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["music"] });
  }
  async function analyze() {
    if (!t.project_id) return;
    try {
      const r = await dispatch({ data: { projectId: t.project_id, jobType: "analyze_music", payload: { music_track_id: t.id } } });
      toast[r.sent ? "success" : "warning"](r.sent ? "Análise enviada ao worker" : "Job criado — worker ainda não configurado");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <Panel title={t.filename ?? "Faixa"} action={<StatusPill label={t.analysis_status} tone={t.analysis_status === "completed" ? "success" : "muted"} />}>
      <p className="text-xs text-muted-foreground">{projectName ?? "—"} · {formatDuration(dur)} · {t.bpm ? `${t.bpm} BPM` : "BPM pendente"} {t.time_signature ? `· ${t.time_signature}` : ""}</p>
      <div className="relative mt-4 flex h-20 items-end gap-px overflow-hidden rounded bg-muted/40 p-1">
        {energy.length ? energy.slice(0, 160).map((v, i) => <div key={i} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${Math.max(4, Math.min(1, v) * 100)}%` }} />)
          : <p className="m-auto text-xs text-muted-foreground">Curva de energia disponível após a análise</p>}
        {dur > 0 && beats.slice(0, 400).map((b, i) => <div key={"b" + i} className="absolute top-0 h-2 w-px bg-foreground/50" style={{ left: `${(b / dur) * 100}%` }} />)}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted-foreground">Início (s)<Input type="number" className="w-24" defaultValue={Number(t.selected_start ?? 0)} id={`s-${t.id}`} /></label>
        <label className="text-xs text-muted-foreground">Fim (s)<Input type="number" className="w-24" defaultValue={Number(t.selected_end ?? dur)} id={`e-${t.id}`} /></label>
        <Button size="sm" variant="outline" onClick={() => saveSegment(Number((document.getElementById(`s-${t.id}`) as HTMLInputElement).value), Number((document.getElementById(`e-${t.id}`) as HTMLInputElement).value))}>Salvar trecho</Button>
        <Button size="sm" onClick={analyze}>Analisar música</Button>
      </div>
    </Panel>
  );
}
