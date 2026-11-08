import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { studioHead } from "@/lib/page-head";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, Chip } from "@/components/studio/ui";
import { useProject, useEditingProfiles } from "@/lib/data";
import {
  DURATIONS, ASPECTS, RESOLUTIONS, FPS, STYLES, PACES, NARRATIVES, HOOKS, BEAT_SYNC, ORIGINAL_AUDIO, COLOR_PROFILES, TRANSITIONS,
} from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/studio")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => studioHead("Estúdio de edição — AI Reel Studio", "Configure cada detalhe da sua edição."),
  component: Studio,
});

type Form = {
  name: string; description: string; creative_brief: string; target_duration: number; aspect_ratio: string; resolution: string; frame_rate: number;
  editing_style: string[]; editing_pace: string; narrative_objective: string; hook: string; hook_seconds: number; beat_sync_mode: string;
  original_audio_mode: string; subtitles_enabled: boolean; subtitle_style: string; transitions: string[]; effects_intensity: number;
  color_profile: string; editing_profile_id: string;
};

const initial: Form = {
  name: "", description: "", creative_brief: "", target_duration: 30, aspect_ratio: "9:16", resolution: "1080p", frame_rate: 30,
  editing_style: [], editing_pace: "balanced", narrative_objective: "ai_decides", hook: "strongest_moment", hook_seconds: 2, beat_sync_mode: "downbeats",
  original_audio_mode: "duck", subtitles_enabled: false, subtitle_style: "minimal", transitions: ["cut"], effects_intensity: 30,
  color_profile: "natural", editing_profile_id: "none",
};

function Opt({ map, value, onChange }: { map: Record<string, string>; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{Object.entries(map).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function Studio() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: existing } = useProject(id);
  const { data: profiles = [] } = useEditingProfiles();
  const [f, setF] = useState<Form>(initial);
  const [custom, setCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k: "editing_style" | "transitions", v: string) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);

  useEffect(() => {
    if (!existing) return;
    const h = (existing.hook_strategy ?? {}) as Record<string, unknown>;
    const sub = (existing.subtitle_settings ?? {}) as Record<string, unknown>;
    const tr = (existing.transition_settings ?? {}) as Record<string, unknown>;
    const fx = (existing.effects_settings ?? {}) as Record<string, unknown>;
    setF({
      name: existing.name, description: existing.description ?? "", creative_brief: existing.creative_brief ?? "",
      target_duration: existing.target_duration, aspect_ratio: existing.aspect_ratio, resolution: existing.resolution, frame_rate: existing.frame_rate,
      editing_style: existing.editing_style ?? [], editing_pace: existing.editing_pace ?? "balanced", narrative_objective: existing.narrative_objective ?? "ai_decides",
      hook: (h.type as string) ?? "strongest_moment", hook_seconds: Number(h.seconds ?? 2), beat_sync_mode: existing.beat_sync_mode ?? "downbeats",
      original_audio_mode: existing.original_audio_mode ?? "duck", subtitles_enabled: !!sub.enabled, subtitle_style: (sub.style as string) ?? "minimal",
      transitions: (tr.types as string[]) ?? ["cut"], effects_intensity: Number(fx.intensity ?? 30), color_profile: existing.color_profile ?? "natural",
      editing_profile_id: existing.editing_profile_id ?? "none",
    });
    setCustom(!DURATIONS.includes(existing.target_duration));
  }, [existing]);

  function applyProfile(pid: string) {
    set("editing_profile_id", pid);
    const p = profiles.find((x) => x.id === pid);
    if (p) setF((x) => ({ ...x, ...(p.settings_json as Partial<Form>), editing_profile_id: pid }));
  }

  async function save() {
    if (!f.name.trim()) return toast.error("Dê um nome ao projeto");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const row = {
      name: f.name.trim(), description: f.description || null, creative_brief: f.creative_brief || null,
      target_duration: f.target_duration, aspect_ratio: f.aspect_ratio, resolution: f.resolution, frame_rate: f.frame_rate,
      editing_style: f.editing_style, editing_pace: f.editing_pace, narrative_objective: f.narrative_objective,
      hook_strategy: { type: f.hook, seconds: f.hook_seconds }, beat_sync_mode: f.beat_sync_mode, original_audio_mode: f.original_audio_mode,
      subtitle_settings: { enabled: f.subtitles_enabled, style: f.subtitle_style }, transition_settings: { types: f.transitions },
      effects_settings: { intensity: f.effects_intensity }, color_profile: f.color_profile,
      editing_profile_id: f.editing_profile_id === "none" ? null : f.editing_profile_id,
    };
    const res = id
      ? await supabase.from("projects").update(row).eq("id", id).select().single()
      : await supabase.from("projects").insert({ ...row, user_id: u.user!.id, status: "awaiting_media" }).select().single();
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(id ? "Projeto atualizado" : "Projeto criado");
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project", res.data.id] });
    navigate({ to: "/projects/$id", params: { id: res.data.id } });
  }

  return (
    <>
      <PageHeader eyebrow="Estúdio de edição" title={id ? "Editar projeto" : "Novo projeto"} description="Defina o formato, o estilo e as instruções que o Diretor IA vai seguir."
        actions={<Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar projeto"}</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Projeto">
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Viagem a Lisboa" /></div>
            <div><Label>Descrição</Label><Input value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
            <div><Label>Perfil de edição</Label>
              <Select value={f.editing_profile_id} onValueChange={applyProfile}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">Nenhum</SelectItem>{profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Panel>
        <Panel title="Formato">
          <Label>Duração</Label>
          <div className="mb-3 mt-1 flex flex-wrap gap-2">
            {DURATIONS.map((d) => <Chip key={d} active={!custom && f.target_duration === d} onClick={() => { setCustom(false); set("target_duration", d); }}>{d}s</Chip>)}
            <Chip active={custom} onClick={() => setCustom(true)}>Personalizada</Chip>
            {custom && <Input type="number" min={3} max={600} className="w-24" value={f.target_duration} onChange={(e) => set("target_duration", Number(e.target.value))} />}
          </div>
          <Label>Proporção</Label>
          <div className="mb-3 mt-1 flex flex-wrap gap-2">{ASPECTS.map((a) => <Chip key={a} active={f.aspect_ratio === a} onClick={() => set("aspect_ratio", a)}>{a}</Chip>)}</div>
          <Label>Resolução</Label>
          <div className="mb-3 mt-1 flex flex-wrap gap-2">{RESOLUTIONS.map((r) => <Chip key={r} active={f.resolution === r} onClick={() => set("resolution", r)}>{r}</Chip>)}</div>
          <Label>Frame rate</Label>
          <div className="mt-1 flex flex-wrap gap-2">{FPS.map((r) => <Chip key={r} active={f.frame_rate === r} onClick={() => set("frame_rate", r)}>{r} fps</Chip>)}</div>
        </Panel>
        <Panel title="Estilos de edição" className="lg:col-span-2">
          <p className="mb-3 text-sm text-muted-foreground">Escolha um ou mais — a IA combina os estilos.</p>
          <div className="flex flex-wrap gap-2">{Object.entries(STYLES).map(([k, v]) => <Chip key={k} active={f.editing_style.includes(k)} onClick={() => toggle("editing_style", k)}>{v}</Chip>)}</div>
        </Panel>
        <Panel title="Narrativa e ritmo">
          <div className="space-y-3">
            <div><Label>Ritmo</Label><Opt map={PACES} value={f.editing_pace} onChange={(v) => set("editing_pace", v)} /></div>
            <div><Label>Objetivo narrativo</Label><Opt map={NARRATIVES} value={f.narrative_objective} onChange={(v) => set("narrative_objective", v)} /></div>
            <div><Label>Gancho inicial</Label><Opt map={HOOKS} value={f.hook} onChange={(v) => set("hook", v)} /></div>
            <div><Label>Duração do gancho (s)</Label><Input type="number" min={0.5} max={10} step={0.5} value={f.hook_seconds} onChange={(e) => set("hook_seconds", Number(e.target.value))} /></div>
          </div>
        </Panel>
        <Panel title="Música e áudio">
          <div className="space-y-3">
            <div><Label>Sincronização com a música</Label><Opt map={BEAT_SYNC} value={f.beat_sync_mode} onChange={(v) => set("beat_sync_mode", v)} /></div>
            <div><Label>Áudio original</Label><Opt map={ORIGINAL_AUDIO} value={f.original_audio_mode} onChange={(v) => set("original_audio_mode", v)} /></div>
            <div className="flex items-center justify-between"><Label>Legendas</Label><Switch checked={f.subtitles_enabled} onCheckedChange={(v) => set("subtitles_enabled", v)} /></div>
            {f.subtitles_enabled && <div><Label>Estilo da legenda</Label><Opt map={{ minimal: "Minimalista", bold: "Destaque", karaoke: "Palavra por palavra" }} value={f.subtitle_style} onChange={(v) => set("subtitle_style", v)} /></div>}
          </div>
        </Panel>
        <Panel title="Transições, efeitos e cor">
          <Label>Transições</Label>
          <div className="mb-3 mt-1 flex flex-wrap gap-2">{Object.entries(TRANSITIONS).map(([k, v]) => <Chip key={k} active={f.transitions.includes(k)} onClick={() => toggle("transitions", k)}>{v}</Chip>)}</div>
          <Label>Intensidade de efeitos: {f.effects_intensity}%</Label>
          <input type="range" min={0} max={100} value={f.effects_intensity} onChange={(e) => set("effects_intensity", Number(e.target.value))} className="mb-3 w-full accent-primary" />
          <Label>Color grading</Label><Opt map={COLOR_PROFILES} value={f.color_profile} onChange={(v) => set("color_profile", v)} />
        </Panel>
        <Panel title="Instruções criativas">
          <Textarea rows={9} value={f.creative_brief} onChange={(e) => set("creative_brief", e.target.value)} placeholder="Descreva a história, o clima, momentos obrigatórios, o que evitar…" />
        </Panel>
      </div>
    </>
  );
}
