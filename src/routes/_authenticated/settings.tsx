import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Panel, DemoBadge } from "@/components/studio/ui";
import { useDemoMode } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — AI Reel Studio" }, { name: "description", content: "Perfil e preferências." }] }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const [demo, setDemo] = useDemoMode();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: p } = await supabase.from("user_profiles").select("*").eq("user_id", u.user!.id).maybeSingle();
      return { email: u.user!.email, userId: u.user!.id, profile: p };
    },
  });
  const [name, setName] = useState("");
  useEffect(() => setName(data?.profile?.display_name ?? ""), [data]);

  async function save() {
    if (!data) return;
    const { error } = await supabase.from("user_profiles").upsert({ user_id: data.userId, display_name: name }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    toast.success("Perfil salvo");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <>
      <PageHeader eyebrow="Conta" title="Configurações" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Perfil">
          <div className="space-y-3">
            <div><Label>E-mail</Label><Input value={data?.email ?? ""} disabled /></div>
            <div><Label>Nome de exibição</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <Button onClick={save}>Salvar</Button>
          </div>
        </Panel>
        <Panel title="Modo de desenvolvimento">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm">Mostrar dados de exemplo <DemoBadge /></p>
              <p className="mt-1 text-xs text-muted-foreground">Exibe projetos fictícios, marcados como Demo, no dashboard quando você ainda não tem projetos reais.</p>
            </div>
            <Switch checked={demo} onCheckedChange={setDemo} />
          </div>
        </Panel>
      </div>
    </>
  );
}
