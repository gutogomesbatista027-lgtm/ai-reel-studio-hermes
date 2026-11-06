<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Heavy media work (Telegram download, Hermes, FFmpeg, Librosa) runs in an external worker; the app only stores metadata and dispatches jobs — keeps large files and compute out of the app.
- External callers use /api/public/telegram-ingest and /api/public/worker-callback, authenticated by the x-worker-secret header and deduplicated by event_id in integration_events — webhooks must be idempotent and verified.
- App reads use the browser client under RLS; actions that reach the worker go through server functions in src/lib/jobs.functions.ts — worker credentials stay server-side.
