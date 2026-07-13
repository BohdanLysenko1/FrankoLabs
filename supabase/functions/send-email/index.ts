// send-email: drains pending rows from public.email_outbox and delivers them via Resend.
// Invoked by the app.notify_email_outbox trigger (pg_net POST with x-outbox-secret header).
// Config lives in Supabase Vault, fetched through the service-role-only get_email_config() RPC:
//   resend_api_key        — Resend API key (rows stay pending until this exists)
//   email_from            — From header; onboarding@resend.dev until frankolabs.com is verified
//   email_redirect_all_to — while set, ALL mail goes here with the real recipients in the subject
//   email_webhook_secret  — must match the x-outbox-secret request header
//   app_base_url          — used for links inside the emails
import { createClient } from "npm:@supabase/supabase-js@2";
import { renderEmail } from "./templates.ts";

const MAX_ATTEMPTS = 5;
const BATCH = 20;

type OutboxRow = {
  id: string;
  event: string;
  recipients: string[];
  payload: Record<string, unknown>;
  attempts: number;
};

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: config, error: configError } = await supabase.rpc("get_email_config");
  if (configError || !config?.email_webhook_secret) {
    console.error("config unavailable", configError?.message);
    return new Response("config unavailable", { status: 500 });
  }
  if (req.headers.get("x-outbox-secret") !== config.email_webhook_secret) {
    return new Response("unauthorized", { status: 401 });
  }
  if (!config.resend_api_key) {
    // Leave rows pending (no attempt burned); they deliver once the key is in Vault.
    return new Response(JSON.stringify({ skipped: "resend_api_key not set" }), { status: 503 });
  }

  const { data: rows, error } = await supabase
    .from("email_outbox")
    .select("id, event, recipients, payload, attempts")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) {
    console.error("outbox select failed", error.message);
    return new Response("outbox select failed", { status: 500 });
  }

  const redirectTo: string = config.email_redirect_all_to ?? "";
  const results: Record<string, string> = {};

  for (const row of (rows ?? []) as OutboxRow[]) {
    const attempts = row.attempts + 1;
    try {
      const { subject, html } = renderEmail(row.event, row.payload ?? {}, config.app_base_url ?? "");
      const to = redirectTo ? [redirectTo] : row.recipients;
      const finalSubject = redirectTo ? `[to: ${row.recipients.join(", ")}] ${subject}` : subject;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.resend_api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: config.email_from, to, subject: finalSubject, html }),
      });

      if (res.ok) {
        await supabase
          .from("email_outbox")
          .update({ status: "sent", sent_at: new Date().toISOString(), attempts, error: null })
          .eq("id", row.id);
        results[row.id] = "sent";
      } else {
        const body = await res.text();
        await supabase
          .from("email_outbox")
          .update({
            status: attempts >= MAX_ATTEMPTS ? "skipped" : "pending",
            attempts,
            error: `resend ${res.status}: ${body.slice(0, 500)}`,
          })
          .eq("id", row.id);
        results[row.id] = `error ${res.status}`;
      }
    } catch (e) {
      await supabase
        .from("email_outbox")
        .update({
          status: attempts >= MAX_ATTEMPTS ? "skipped" : "pending",
          attempts,
          error: String(e).slice(0, 500),
        })
        .eq("id", row.id);
      results[row.id] = "exception";
    }
  }

  return new Response(JSON.stringify({ processed: results }), {
    headers: { "Content-Type": "application/json" },
  });
});
