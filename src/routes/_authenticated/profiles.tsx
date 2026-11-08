import { createFileRoute } from "@tanstack/react-router";
import { studioHead } from "@/lib/page-head";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Trash2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, EmptyState, Chip } from "@/components/studio/ui";
import { useEditingProfiles } from "@/lib/data";
import { STYLES, PACES, COLOR_PROFILES } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/profiles")({
  head: () => studioHead("Perfis de edição — AI Reel Studio", "Seus presets pessoais de edição."),
  component: Profiles,
});

function Profiles() {
  const qc = useQueryClient();
  const { data: profiles = [] } = useEditingProfiles();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [pace, setPace] = useState("balanced");
  const [color, setColor] = useState("natural");
  const refresh = () => qc.invalidateQueries({ queryKey: ["editing_profiles"] });

  async function create() {
    if (!name.trim()) return toast.error("Dê um nome ao perfil");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("editing_profiles").insert({
      user_id: u.user!.id, name: name.trim(), description: desc || null,
      settings_json: { editing_style: styles, editing_pace: pace, color_profile: color }, is_default: profiles.length === 0,
    });
    if (error) return toast.error(error.message);
    setName(""); setDesc(""); setStyles([]);
    toast.success("Perfil criado");
    refresh();
  }
  async function makeDefault(id: string) {
    await supabase.from("editing_profiles").update({ is_default: false }).neq("id", id);
    await supabase.from("editing_profiles").update({ is_default: true }).eq("id", id);
    refresh();
  }
  async function remove(id: string) {
    if (!confirm("Excluir este perfil?")) return;
    await supabase.from("editing_profiles").delete().eq("id", id);
    refresh();
  }

  return (
    <>
      <PageHeader eyebrow="Sua assinatura" title="Perfis de edição" description="Salve combinações de estilo, ritmo e cor e aplique em novos projetos." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Novo perfil">
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Descrição</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div><Label>Estilos</Label><div className="mt-1 flex flex-wrap gap-1.5">{Object.entries(STYLES).map(([k, v]) => <Chip key={k} active={styles.includes(k)} onClick={() => setStyles(styles.includes(k) ? styles.filter((x) => x !== k) : [...styles, k])}>{v}</Chip>)}</div></div>
            <div><Label>Ritmo</Label><Select value={pace} onValueChange={setPace}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PACES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Cor</Label><Select value={color} onValueChange={setColor}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(COLOR_PROFILES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <Button className="w-full" onClick={create}>Salvar perfil</Button>
          </div>
        </Panel>
        <Panel title="Seus perfis" className="lg:col-span-2">
          {profiles.length === 0 ? <EmptyState icon={<UserCog className="h-6 w-6" />} title="Nenhum perfil" description="Crie seu primeiro preset ao lado." /> : (
            <ul className="space-y-3">
              {profiles.map((p) => {
                const s = p.settings_json as { editing_style?: string[]; editing_pace?: string; color_profile?: string };
                return (
                  <li key={p.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium">{p.name} {p.is_default && <span className="ml-1 text-xs text-primary">Padrão</span>}</p>
                      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{(s.editing_style ?? []).map((x) => STYLES[x]).join(", ") || "—"} · {PACES[s.editing_pace ?? ""] ?? "—"} · {COLOR_PROFILES[s.color_profile ?? ""] ?? "—"}</p>
                    </div>
                    <div className="flex gap-1">
                      {!p.is_default && <Button size="icon" variant="ghost" aria-label="Tornar padrão" onClick={() => makeDefault(p.id)}><Star className="h-4 w-4" /></Button>}
                      <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
