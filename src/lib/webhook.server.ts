import { timingSafeEqual } from "crypto";

export function verifyWorkerSecret(request: Request): boolean {
  const expected = process.env["WORKER_WEBHOOK_SECRET"];
  const actual = request.headers.get("x-worker-secret") ?? "";
  if (!expected) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Records an event; returns false if this external_event_id was already processed. */
export async function recordEvent(source: string, eventType: string, externalEventId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("integration_events")
    .insert({ source, event_type: eventType, external_event_id: externalEventId, processing_status: "processing" });
  if (error) {
    if (error.code === "23505") return { duplicate: true as const, admin: supabaseAdmin };
    throw new Error(error.message);
  }
  return { duplicate: false as const, admin: supabaseAdmin };
}

export async function finishEvent(source: string, externalEventId: string, status: "processed" | "failed", message?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("integration_events")
    .update({ processing_status: status, error_message: message ?? null })
    .eq("source", source)
    .eq("external_event_id", externalEventId);
}
