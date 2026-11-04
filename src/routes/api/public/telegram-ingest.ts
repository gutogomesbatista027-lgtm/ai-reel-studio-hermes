import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyWorkerSecret, recordEvent, finishEvent } from "@/lib/webhook.server";

const Body = z.object({
  event_id: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  kind: z.enum(["video", "audio", "instruction"]),
  telegram_file_id: z.string().max(500).optional(),
  telegram_file_unique_id: z.string().max(200).optional(),
  filename: z.string().max(500).optional(),
  file_size: z.number().nonnegative().optional(),
  duration: z.number().nonnegative().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  frame_rate: z.number().optional(),
  codec: z.string().max(100).optional(),
  external_storage_reference: z.string().max(2000).optional(),
  text: z.string().max(10000).optional(),
});

export const Route = createFileRoute("/api/public/telegram-ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyWorkerSecret(request)) return new Response("Unauthorized", { status: 401 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid_body", issues: parsed.error.issues }, { status: 400 });
        const b = parsed.data;

        const { duplicate, admin } = await recordEvent("telegram", `ingest_${b.kind}`, b.event_id);
        if (duplicate) return Response.json({ ok: true, duplicate: true });

        try {
          const { data: project } = await admin.from("projects").select("id, user_id, creative_brief").eq("id", b.project_id).maybeSingle();
          if (!project) {
            await finishEvent("telegram", b.event_id, "failed", "project_not_found");
            return Response.json({ error: "project_not_found" }, { status: 404 });
          }

          if (b.kind === "instruction") {
            const brief = [project.creative_brief, b.text].filter(Boolean).join("\n\n");
            await admin.from("projects").update({ creative_brief: brief }).eq("id", project.id);
          } else if (b.kind === "audio") {
            await admin.from("music_tracks").insert({
              user_id: project.user_id,
              project_id: project.id,
              telegram_file_id: b.telegram_file_id,
              filename: b.filename,
              duration: b.duration,
            });
          } else {
            const { error } = await admin.from("assets").upsert(
              {
                user_id: project.user_id,
                project_id: project.id,
                telegram_file_id: b.telegram_file_id,
                telegram_file_unique_id: b.telegram_file_unique_id,
                filename: b.filename,
                file_size: b.file_size,
                media_type: "video",
                duration: b.duration,
                width: b.width,
                height: b.height,
                frame_rate: b.frame_rate,
                codec: b.codec,
                external_storage_reference: b.external_storage_reference,
                download_status: b.external_storage_reference ? "downloaded" : "pending",
              },
              { onConflict: "user_id,telegram_file_unique_id" },
            );
            if (error) throw new Error(error.message);
          }
          await finishEvent("telegram", b.event_id, "processed");
          return Response.json({ ok: true });
        } catch (e) {
          await finishEvent("telegram", b.event_id, "failed", e instanceof Error ? e.message : "error");
          return Response.json({ error: "processing_failed" }, { status: 500 });
        }
      },
    },
  },
});
