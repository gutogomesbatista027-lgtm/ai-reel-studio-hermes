# AI Reel Studio — Build Plan

A dark, premium control center (in Brazilian Portuguese) for managing AI video edits. The app manages projects, media, music, AI plans, renders and the job queue. Heavy work (Telegram downloads, Hermes, FFmpeg, Librosa) stays in your external worker. The app gives it secure endpoints to call, and it never pretends a service is connected when it isn't.

## Phase 1 (this build)

**Foundation**
- Turn on Lovable Cloud: login, database, secure server endpoints.
- Email/password login with a display name profile.
- A dark studio look: charcoal and near-black backgrounds, one warm accent color (amber or tungsten), a refined serif for headings and a clean sans-serif for body text.
- A persistent left sidebar with all 11 sections. It collapses on mobile.

**Pages**
1. Dashboard: live counts (projects, done, waiting, rendering, failed, videos, editing time), recent projects and renders, activity, and integration status. Shows an empty state when there's no data.
2. Projects: list, create, edit, duplicate, archive and delete. A detail page has tabs for media, music, AI analyses, edit plans, renders and feedback.
3. Editing Studio: the full project setup form. Covers duration, aspect ratio, resolution, FPS, multiple styles, pace, narrative, hook, beat sync, original audio, subtitles, transitions/effects, color, creative instructions and editing profile.
4. Media Library: videos and audio the worker reports from Telegram, with download and analysis status. No direct upload of large originals.
5. Music Studio: tracks with BPM, beats, energy curve and a selected segment.
6. AI Director: send a creative brief to Hermes, which creates a job. Shows the plan versions Hermes returns, with explanations.
7. Timeline & Preview: a visual timeline from the edit plan (clips, beats, transitions), the render preview player, version history, and approve/feedback.
8. Editing Profiles: saved personal presets, with one set as the default.
9. Processing Queue: jobs with stage, progress and errors, plus retry and cancel. Updates in real time.
10. Integrations: Telegram, Hermes and worker status, based on whether credentials exist and when each last checked in. Lists the endpoints and secrets your worker needs.
11. Settings: profile, defaults, and a demo-data toggle with clearly labeled sample data.

**Secure endpoints for your worker**
- telegram-ingest, worker-callback (progress/results/analysis), plus app-side create-project, dispatch-job, request-ai-direction, request-render, retry-job and cancel-job.
- Every webhook is checked with a shared secret and protected against duplicate delivery.

## Later phases (after Phase 1 works)
- Connect your real Telegram bot and worker, and test end to end.
- Quality-control reports, learning from feedback, and signed expiring links for renders.

## Technical details
- Tables from section 16 of the spec: user_profiles, projects, assets, music_tracks, video_analysis, music_analysis, edit_plans, jobs, renders, feedback, editing_profiles, integration_events. Use JSONB for analysis and timeline data, add indexes on user_id/project_id/status, unique (user_id, telegram_file_unique_id), and foreign keys with cascades.
- RLS on every user table scoped to auth.uid(). Grants per table. integration_events is service-role only.
- Webhooks live at /api/public/* and require the `x-worker-secret` header (WORKER_WEBHOOK_SECRET) plus an idempotency key / external_event_id. Ownership is checked on the server, and the frontend's project_id is never trusted.
- App actions run through server functions with authentication middleware. dispatch-job POSTs to WORKER_URL when it's configured. Otherwise the job stays "queued" and the Integrations page shows "not configured".
- Realtime subscriptions on jobs and renders.
