export const DURATIONS = [10, 15, 20, 30, 45, 60];
export const ASPECTS = ["9:16", "16:9", "1:1"];
export const RESOLUTIONS = ["720p", "1080p", "1440p", "4K"];
export const FPS = [24, 25, 30, 50, 60];

export const STYLES: Record<string, string> = {
  cinematic: "Cinematográfico",
  viral: "Reel viral dinâmico",
  travel: "Vlog de viagem",
  documentary: "Documentário",
  lifestyle: "Lifestyle",
  music_video: "Videoclipe",
  emotional: "Storytelling emocional",
  comedy: "Comédia",
  adventure: "Aventura",
  montage: "Montagem acelerada",
  minimalist: "Minimalista",
  experimental: "Experimental criativo",
};

export const PACES: Record<string, string> = {
  slow: "Lento e cinematográfico",
  gradual: "Construção gradual",
  balanced: "Equilibrado",
  fast: "Rápido",
  very_fast: "Muito rápido",
  dynamic: "Variação dinâmica",
};

export const NARRATIVES: Record<string, string> = {
  journey: "Jornada",
  highlights: "Melhores momentos",
  emotional_arc: "Arco emocional",
  before_after: "Antes e depois",
  day_in_life: "Um dia na vida",
  reveal: "Revelação final",
  ai_decides: "Deixar a IA decidir",
};

export const HOOKS: Record<string, string> = {
  strongest_moment: "Momento mais forte primeiro",
  question: "Pergunta / curiosidade",
  action: "Ação imediata",
  text: "Texto de impacto",
  ai_decides: "A IA decide",
};

export const BEAT_SYNC: Record<string, string> = {
  every_beat: "Cortar em cada batida",
  downbeats: "Cortar nos tempos fortes",
  bars: "Cortar por compasso",
  energy: "Seguir a energia da música",
  free: "Livre",
};

export const ORIGINAL_AUDIO: Record<string, string> = {
  mute: "Remover áudio original",
  duck: "Abaixar sob a música",
  keep_key: "Manter momentos-chave",
  mix: "Mixar com a música",
};

export const COLOR_PROFILES: Record<string, string> = {
  natural: "Natural",
  warm: "Quente",
  cool: "Frio",
  film: "Filme analógico",
  teal_orange: "Teal & orange",
  bw: "Preto e branco",
  vibrant: "Vibrante",
  moody: "Escuro / moody",
};

export const TRANSITIONS: Record<string, string> = {
  cut: "Corte seco",
  crossfade: "Fusão",
  whip: "Whip pan",
  zoom: "Zoom",
  flash: "Flash",
  match: "Match cut",
};

export const PROJECT_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Rascunho", tone: "muted" },
  awaiting_media: { label: "Aguardando mídia", tone: "info" },
  queued: { label: "Na fila", tone: "info" },
  analyzing: { label: "Analisando", tone: "warning" },
  planning: { label: "Planejando", tone: "warning" },
  rendering: { label: "Renderizando", tone: "warning" },
  review: { label: "Em revisão", tone: "primary" },
  completed: { label: "Concluído", tone: "success" },
  failed: { label: "Falhou", tone: "destructive" },
};

export const JOB_STATUS: Record<string, { label: string; tone: Tone }> = {
  queued: { label: "Na fila", tone: "info" },
  dispatched: { label: "Enviado", tone: "info" },
  running: { label: "Em execução", tone: "warning" },
  completed: { label: "Concluído", tone: "success" },
  failed: { label: "Falhou", tone: "destructive" },
  cancelled: { label: "Cancelado", tone: "muted" },
};

export const JOB_TYPES: Record<string, string> = {
  analyze_video: "Análise de vídeo",
  analyze_music: "Análise musical",
  ai_direction: "Direção de IA (Hermes)",
  render: "Renderização",
};

export type Tone = "muted" | "info" | "warning" | "primary" | "success" | "destructive";

export function formatDuration(sec?: number | null) {
  if (!sec && sec !== 0) return "—";
  const s = Math.round(Number(sec));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}h ${m % 60}min`;
  if (m) return `${m}min ${s % 60}s`;
  return `${s}s`;
}

export function formatBytes(b?: number | null) {
  if (!b) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = Number(b);
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
