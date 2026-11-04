import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const JobType = z.enum(["analyze_video", "analyze_music", "ai_direction", "render"]);

async function sendToWorker(job: Record<string, unknown>) {
  const url = process.env["WORKER_URL"];
  const secret = process.env["WORKER_WEBHOOK_SECRET"];
  if (!url || !secret) return { sent: false as const, reason: "worker_not_configured" };
  try {
    const res = await fetch(url.replace(/\/$/, "") + "/jobs", {
      method: "POST",
      headers: { "content-type": "application/json", "x-worker-secret": secret },
      body: JSON.stringify(job),
    });
    if (!res.ok) return { sent: false as const, reason: `worker_http_${res.status}` };
    return { sent: true as const };
  } catch {
    return { sent: false as const, reason: "worker_unreachable" };
  }
}

export const dispatchJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ projectId: z.string().uuid(), jobType: JobType, payload: z.record(z.string(), z.any()).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ownership check: RLS only returns the project if it belongs to the caller.
    const { data: project, error: pErr } = await supabase.from("projects").select("*").eq("id", data.projectId).maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!project) throw new Error("Projeto não encontrado");

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        project_id: project.id,
        job_type: data.jobType,
        status: "queued",
        current_stage: "Aguardando worker",
        idempotency_key: crypto.randomUUID(),
        payload: data.payload ?? {},
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const result = await sendToWorker({ job_id: job.id, job_type: job.job_type, project, payload: job.payload });
    if (result.sent) {
      await supabase.from("jobs").update({ status: "dispatched", current_stage: "Enviado ao worker" }).eq("id", job.id);
    } else {
      await supabase.from("jobs").update({ current_stage: "Worker não configurado — job aguardando" }).eq("id", job.id);
    }
    return { jobId: job.id, sent: result.sent, reason: result.sent ? null : result.reason };
  });

export const retryJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: job } = await supabase.from("jobs").select("*, projects(*)").eq("id", data.jobId).maybeSingle();
    if (!job) throw new Error("Job não encontrado");
    await supabase
      .from("jobs")
      .update({ status: "queued", progress: 0, error_message: null, current_stage: "Reenviado", completed_at: null })
      .eq("id", job.id);
    const result = await sendToWorker({ job_id: job.id, job_type: job.job_type, project: job.projects, payload: job.payload, retry: true });
    if (result.sent) await supabase.from("jobs").update({ status: "dispatched" }).eq("id", job.id);
    return { sent: result.sent };
  });

export const cancelJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("jobs")
      .update({ status: "cancelled", current_stage: "Cancelado pelo usuário", completed_at: new Date().toISOString() })
      .eq("id", data.jobId);
    if (error) throw new Error(error.message);
    const url = process.env["WORKER_URL"];
    const secret = process.env["WORKER_WEBHOOK_SECRET"];
    if (url && secret) {
      fetch(url.replace(/\/$/, "") + "/jobs/" + data.jobId + "/cancel", { method: "POST", headers: { "x-worker-secret": secret } }).catch(() => {});
    }
    return { ok: true };
  });

export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const last = async (source: string) => {
      const { data } = await supabaseAdmin
        .from("integration_events")
        .select("created_at, event_type, processing_status")
        .eq("source", source)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    };
    return {
      webhookSecret: !!process.env["WORKER_WEBHOOK_SECRET"],
      workerUrl: !!process.env["WORKER_URL"],
      telegram: await last("telegram"),
      worker: await last("worker"),
      hermes: await last("hermes"),
    };
  });
