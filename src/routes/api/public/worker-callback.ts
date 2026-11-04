import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyWorkerSecret, recordEvent, finishEvent } from "@/lib/webhook.server";

const Body = z.object({
  event_id: z.string().min(1).max(200),
  job_id: z.string().uuid(),
  source: z.enum(["worker", "hermes"]).default("worker"),
  type: z.enum(["progress", "completed", "failed", "video_analysis", "music_analysis", "edit_plan", "render"]),
  worker_id: z.string().max(200).optional(),
  progress: z.number().min(0).max(100).optional(),
  stage: z.string().max(300).optional(),
  error: z.string().max(5000).optional(),
  data: z.record(z.string(), z.any()).optional(),
});

export const Route = createFileRoute("/api/public/worker-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyWorkerSecret(request)) return new Response("Unauthorized", { status: 401 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
        const b = parsed.data;

        const { duplicate, admin } = await recordEvent(b.source, b.type, b.event_id);
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        try {
          const { data: job } = await admin.from("jobs").select("*").eq("id", b.job_id).maybeSingle();
          if (!job || !job.project_id) {
            await finishEvent(b.source, b.event_id, "failed", "job_not_found");
            return Response.json({ error: "job_not_found" }, { status: 404 });
          }
          if (job.status === "cancelled") {
            await finishEvent(b.source, b.event_id, "processed", "job_cancelled");
            return Response.json({ ok: true, cancelled: true });
          }
          const pid = job.project_id;
          const d = b.data ?? {};

          switch (b.type) {
            case "progress":
              await admin.from("jobs").update({
                status: "running",
                progress: b.progress ?? job.progress,
                current_stage: b.stage ?? job.current_stage,
                worker_id: b.worker_id ?? job.worker_id,
                started_at: job.started_at ?? new Date().toISOString(),
              }).eq("id", job.id);
              break;
            case "completed":
              await admin.from("jobs").update({ status: "completed", progress: 100, current_stage: b.stage ?? "Concluído", completed_at: new Date().toISOString() }).eq("id", job.id);
              break;
            case "failed":
              await admin.from("jobs").update({ status: "failed", error_message: b.error ?? "Erro desconhecido", completed_at: new Date().toISOString() }).eq("id", job.id);
              await admin.from("projects").update({ status: "failed" }).eq("id", pid);
              break;
            case "video_analysis":
              if (d.asset_id) await admin.from("assets").update({ analysis_status: "completed" }).eq("id", d.asset_id).eq("project_id", pid);
              await admin.from("video_analysis").insert({ project_id: pid, asset_id: d.asset_id ?? null, analysis_data: d.analysis ?? d, status: "completed" });
              break;
            case "music_analysis": {
              const trackId = d.music_track_id ?? null;
              await admin.from("music_analysis").insert({
                project_id: pid, music_track_id: trackId, bpm: d.bpm, beat_positions: d.beat_positions, downbeats: d.downbeats,
                musical_bars: d.musical_bars, energy_curve: d.energy_curve, suggested_segments: d.suggested_segments, status: "completed",
              });
              if (trackId) await admin.from("music_tracks").update({ bpm: d.bpm, beat_data: d.beat_positions, energy_data: d.energy_curve, analysis_status: "completed" }).eq("id", trackId).eq("project_id", pid);
              break;
            }
            case "edit_plan": {
              const { count } = await admin.from("edit_plans").select("id", { count: "exact", head: true }).eq("project_id", pid);
              await admin.from("edit_plans").insert({ project_id: pid, version: (count ?? 0) + 1, timeline_json: d.timeline ?? {}, creative_explanation: d.explanation ?? null, status: "proposed" });
              await admin.from("projects").update({ status: "review" }).eq("id", pid);
              break;
            }
            case "render": {
              const { count } = await admin.from("renders").select("id", { count: "exact", head: true }).eq("project_id", pid);
              await admin.from("renders").insert({
                user_id: job.user_id, project_id: pid, edit_plan_id: d.edit_plan_id ?? null, version: (count ?? 0) + 1,
                output_reference: d.output_reference, preview_url: d.preview_url, download_url: d.download_url,
                duration: d.duration, resolution: d.resolution, file_size: d.file_size, quality_report: d.quality_report ?? null, status: "completed",
              });
              await admin.from("projects").update({ status: "completed" }).eq("id", pid);
              break;
            }
          }
          await finishEvent(b.source, b.event_id, "processed");
          return Response.json({ ok: true });
        } catch (e) {
          await finishEvent(b.source, b.event_id, "failed", e instanceof Error ? e.message : "error");
          return Response.json({ error: "processing_failed" }, { status: 500 });
        }
      },
    },
  },
});
