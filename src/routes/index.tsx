import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard, Music2, Sparkles, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Reel Studio — Direção criativa por IA para Reels" },
      { name: "description", content: "Envie vídeos e música pelo Telegram e deixe a IA dirigir, sincronizar com a batida e renderizar seus Reels." },
      { property: "og:title", content: "AI Reel Studio — Direção criativa por IA" },
      { property: "og:description", content: "Envie vídeos e música e deixe a IA dirigir e sincronizar seus Reels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const features = [
    { icon: Sparkles, t: "Diretor criativo IA", d: "Hermes entende seu briefing e planeja cada corte." },
    { icon: Music2, t: "Inteligência musical", d: "BPM, batidas e curva de energia guiam a edição." },
    { icon: Film, t: "Render profissional", d: "FFmpeg executa o plano em 9:16, 16:9 ou 1:1." },
  ];
  return (
    <div className="min-h-screen px-6 py-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg">
          <Clapperboard className="h-5 w-5 text-primary" /> AI Reel Studio
        </div>
        <Button asChild variant="outline"><Link to="/auth">Entrar</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl pt-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Estúdio pessoal de produção</p>
        <h1 className="max-w-3xl text-5xl font-light leading-tight md:text-7xl">
          Seus vídeos brutos. <em className="text-primary">Dirigidos por IA.</em>
        </h1>
        <p className="mt-6 max-w-xl text-muted-foreground">
          Centralize projetos, mídia do Telegram, análise musical, planos de edição e renders em um só painel de controle.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg" className="shadow-glow"><Link to="/dashboard">Abrir o estúdio</Link></Button>
        </div>
        <div className="mt-24 grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.t} className="panel p-6">
              <f.icon className="mb-4 h-5 w-5 text-primary" />
              <h3 className="text-xl">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
