import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Bot, Server, KeyRound } from "lucide-react";
import { PageHeader, Panel, StatusPill } from "@/components/studio/ui";
import { getIntegrationStatus } from "@/lib/jobs.functions";
import { formatDateTime } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrações — AI Reel Studio" }, { name: "description", content: "Status do Telegram, Hermes e worker." }] }),
  component: Integrations,
});

function Integrations() {
  const fn = useServerFn(getIntegrationStatus);
  const { data, isLoading } = useQuery({ queryKey: ["integration-status"], queryFn: () => fn() });
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const card = (icon: React.ReactNode, title: string, desc: string, ok: boolean, last?: { created_at: string } | null, note?: string) => (
    <Panel>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">{icon}<p className="font-display text-lg">{title}</p></div>
        <StatusPill label={isLoading ? "Verificando…" : ok ? (last ? "Conectado" : "Configurado, sem eventos") : "Não configurado"} tone={ok ? (last ? "success" : "info") : "muted"} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <p className="mt-3 text-xs text-muted-foreground">Último evento: {last ? formatDateTime(last.created_at) : "nenhum"}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </Panel>
  );

  return (
    <>
      <PageHeader eyebrow="Ecossistema" title="Integrações" description="O status reflete credenciais reais e eventos recebidos — nada é marcado como conectado sem evidência." />
      <div className="grid gap-4 md:grid-cols-3">
        {card(<Send className="h-5 w-5 text-primary" />, "Telegram", "Seu bot Python recebe vídeos, músicas e instruções e envia os metadados para o app.", !!data?.webhookSecret, data?.telegram)}
        {card(<Bot className="h-5 w-5 text-primary" />, "Hermes Agent", "Diretor criativo. Recebe o briefing via worker e devolve planos de edição.", !!data?.workerUrl, data?.hermes)}
        {card(<Server className="h-5 w-5 text-primary" />, "Worker de processamento", "Baixa mídia, roda Librosa/FFmpeg e reporta progresso.", !!data?.workerUrl, data?.worker, data?.workerUrl ? undefined : "Defina WORKER_URL para o app enviar jobs.")}
      </div>
      <Panel title="Contrato de integração" className="mt-6">
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" />Toda requisição deve enviar o cabeçalho <code className="rounded bg-muted px-1">x-worker-secret</code> com o valor de WORKER_WEBHOOK_SECRET.</div>
          <Endpoint method="POST" url={`${origin}/api/public/telegram-ingest`} body={`{ "event_id": "tg-123", "project_id": "<uuid>", "kind": "video|audio|instruction", "telegram_file_id": "...", "telegram_file_unique_id": "...", "filename": "clip.mp4", "file_size": 1073741824, "duration": 42.5, "width": 3840, "height": 2160, "text": "..." }`} />
          <Endpoint method="POST" url={`${origin}/api/public/worker-callback`} body={`{ "event_id": "w-456", "job_id": "<uuid>", "source": "worker|hermes", "type": "progress|completed|failed|video_analysis|music_analysis|edit_plan|render", "progress": 50, "stage": "Analisando cenas", "data": { ... } }`} />
          <Endpoint method="POST" url="WORKER_URL/jobs" body={`{ "job_id": "<uuid>", "job_type": "analyze_video|analyze_music|ai_direction|render", "project": { ... }, "payload": { ... } }`} note="O app chama seu worker com o mesmo cabeçalho secreto." />
          <p className="text-xs text-muted-foreground">O campo event_id garante idempotência: reenvios com o mesmo valor são ignorados.</p>
        </div>
      </Panel>
    </>
  );
}

function Endpoint({ method, url, body, note }: { method: string; url: string; body: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="font-mono text-xs"><span className="text-primary">{method}</span> {url}</p>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs text-muted-foreground">{body}</pre>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
