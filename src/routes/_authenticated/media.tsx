import { createFileRoute, Link } from "@tanstack/react-router";
import { studioHead } from "@/lib/page-head";
import { Library } from "lucide-react";
import { PageHeader, Panel, EmptyState, StatusPill } from "@/components/studio/ui";
import { useAssets, useProjects } from "@/lib/data";
import { formatBytes, formatDate, formatDuration, type Tone } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => studioHead("Biblioteca de mídia — AI Reel Studio", "Vídeos recebidos pelo Telegram."),
  component: Media,
});

const tone = (s: string): Tone => (s === "completed" || s === "downloaded" ? "success" : s === "failed" ? "destructive" : s === "pending" ? "muted" : "warning");

function Media() {
  const { data: assets = [] } = useAssets();
  const { data: projects = [] } = useProjects(true);
  const name = (id: string | null) => projects.find((p) => p.id === id)?.name ?? "—";
  return (
    <>
      <PageHeader eyebrow="Mídia" title="Biblioteca de mídia" description="Os vídeos originais chegam pelo seu bot do Telegram e são baixados pelo worker externo — arquivos grandes nunca passam por aqui." />
      <Panel>
        {assets.length === 0 ? (
          <EmptyState icon={<Library className="h-6 w-6" />} title="Nenhum vídeo recebido" description="Envie vídeos ao bot do Telegram informando o código do projeto. Configure a conexão em Integrações." action={<Link to="/integrations" className="text-sm text-primary">Ver integrações</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">Arquivo</th><th>Projeto</th><th>Duração</th><th>Tamanho</th><th>Resolução</th><th>Download</th><th>Análise</th><th>Recebido</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2">{a.filename ?? a.telegram_file_id ?? "—"}</td>
                    <td>{name(a.project_id)}</td>
                    <td>{formatDuration(Number(a.duration))}</td>
                    <td>{formatBytes(Number(a.file_size))}</td>
                    <td>{a.width && a.height ? `${a.width}×${a.height}` : "—"}</td>
                    <td><StatusPill label={a.download_status} tone={tone(a.download_status)} /></td>
                    <td><StatusPill label={a.analysis_status} tone={tone(a.analysis_status)} /></td>
                    <td>{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
