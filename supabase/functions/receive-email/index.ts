// receive-email: Resend inbound webhook -> public.ingest_inbound_email.
// Auth is a shared secret (Vault: inbound_email_secret), passed either as a
// ?secret= query param on the webhook URL or an x-inbound-secret header.
// Rejects when the secret is unset — inbound stays fail-closed until the
// owner wires up Resend inbound routing.
import { createClient } from "npm:@supabase/supabase-js@2";

type InboundAddress = { email?: string; name?: string } | string;

/** Resend sends addresses as strings or {email,name} objects — normalize. */
function addrEmail(a: InboundAddress | undefined): string {
  if (!a) return "";
  if (typeof a === "string") {
    const m = a.match(/<([^>]+)>/);
    return (m ? m[1] : a).trim();
  }
  return (a.email ?? "").trim();
}

function addrName(a: InboundAddress | undefined): string {
  if (!a) return "";
  if (typeof a === "string") {
    const m = a.match(/^\s*"?([^"<]*)"?\s*</);
    return (m ? m[1] : "").trim();
  }
  return (a.name ?? "").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: config, error: configError } = await supabase.rpc("get_email_config");
  if (configError || !config?.inbound_email_secret) {
    console.error("inbound config unavailable", configError?.message);
    return new Response("inbound not configured", { status: 503 });
  }
  const given =
    new URL(req.url).searchParams.get("secret") ?? req.headers.get("x-inbound-secret") ?? "";
  if (given !== config.inbound_email_secret) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // Resend webhook envelope: { type: "email.received", data: {...} }.
  const type = typeof body.type === "string" ? body.type : "";
  if (type && type !== "email.received") {
    return new Response(JSON.stringify({ ignored: type }), { status: 200 });
  }
  const data = (body.data ?? body) as Record<string, unknown>;

  const toList: InboundAddress[] = Array.isArray(data.to)
    ? (data.to as InboundAddress[])
    : data.to
      ? [data.to as InboundAddress]
      : [];
  const headers = (data.headers ?? {}) as Record<string, unknown>;
  const header = (k: string): string => {
    const direct = headers[k] ?? headers[k.toLowerCase()];
    return typeof direct === "string" ? direct : "";
  };

  const payload = {
    from: { email: addrEmail(data.from as InboundAddress), name: addrName(data.from as InboundAddress) },
    to: toList.map(addrEmail).filter(Boolean),
    subject: typeof data.subject === "string" ? data.subject : "",
    text: typeof data.text === "string" ? data.text : "",
    html: typeof data.html === "string" ? data.html : "",
    messageId:
      (typeof data.message_id === "string" && data.message_id) ||
      (typeof data.messageId === "string" && data.messageId) ||
      header("Message-ID") ||
      "",
    inReplyTo:
      (typeof data.in_reply_to === "string" && data.in_reply_to) || header("In-Reply-To") || "",
    references: header("References"),
  };

  const { data: threadId, error } = await supabase.rpc("ingest_inbound_email", { p: payload });
  if (error) {
    console.error("ingest failed", error.message);
    return new Response("ingest failed", { status: 500 });
  }

  return new Response(JSON.stringify({ thread: threadId ?? null }), {
    headers: { "Content-Type": "application/json" },
  });
});
