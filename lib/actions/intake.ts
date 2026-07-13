"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { requestTypeLabel } from "@/lib/site/contact";

/**
 * Public contact-form intake: visitors have no session, so this runs on the
 * admin client with the workspace pinned server-side (INTAKE_WORKSPACE_ID,
 * falling back to the oldest workspace). Deals are leads — a submission
 * becomes company + contact + deal in the first open stage, and two
 * email_outbox rows the DB pipeline delivers.
 */

export type IntakeState = { ok: boolean; error?: string };

const RATE_LIMIT_PER_HOUR = 3;

const FREE_MAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
  "yahoo.com", "icloud.com", "me.com", "aol.com", "proton.me",
  "protonmail.com", "mail.com", "gmx.com", "ukr.net", "i.ua",
]);

const emailHue = (email: string): number => {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) % 360;
  return h;
};

export async function submitLeadIntake(
  _prev: IntakeState,
  formData: FormData,
): Promise<IntakeState> {
  try {
    // Honeypot: bots fill every field. Pretend it worked, write nothing.
    if (String(formData.get("website") ?? "").trim() !== "") {
      return { ok: true };
    }

    const name = String(formData.get("name") ?? "").trim().slice(0, 120);
    const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
    const companyName = String(formData.get("company") ?? "").trim().slice(0, 160);
    const type = String(formData.get("type") ?? "consultation").trim();
    const message = String(formData.get("message") ?? "").trim().slice(0, 4000);

    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Please fill in your name, a valid email and a message." };
    }

    const admin = createAdminClient();

    const workspaceId = await resolveWorkspace(admin);
    if (!workspaceId) {
      return { ok: false, error: "We couldn't take your request right now. Please email us directly." };
    }

    const h = await headers();
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [byEmail, byIp] = await Promise.all([
      admin
        .from("intake_requests")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .gte("created_at", hourAgo),
      ip
        ? admin
            .from("intake_requests")
            .select("id", { count: "exact", head: true })
            .eq("ip", ip)
            .gte("created_at", hourAgo)
        : Promise.resolve({ count: 0 }),
    ]);
    if ((byEmail.count ?? 0) >= RATE_LIMIT_PER_HOUR || (byIp.count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return { ok: false, error: "Too many requests in the last hour — give it a moment and try again, or email us directly." };
    }

    const label = requestTypeLabel(type);

    // Find-or-create contact first: a returning contact keeps their company.
    let contactId: string | null = null;
    let companyId: string | null = null;
    const { data: existingContact } = await admin
      .from("contacts")
      .select("id, company_id")
      .eq("workspace_id", workspaceId)
      .eq("email", email)
      .maybeSingle();
    if (existingContact) {
      contactId = existingContact.id;
      companyId = existingContact.company_id;
    }

    if (!companyId) {
      companyId = await findOrCreateCompany(admin, workspaceId, { email, companyName, contactName: name });
    }
    if (!contactId) {
      contactId = crypto.randomUUID();
      const { error } = await admin.from("contacts").insert({
        id: contactId,
        workspace_id: workspaceId,
        company_id: companyId,
        name,
        email,
        role: "Inbound lead",
        hue: emailHue(email),
        tags: ["website"],
      });
      if (error) throw new Error(error.message);
    }

    const { data: stage } = await admin
      .from("stages")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("kind", "open")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!stage) {
      return { ok: false, error: "We couldn't take your request right now. Please email us directly." };
    }

    const dealId = crypto.randomUUID();
    const { error: dealError } = await admin.from("deals").insert({
      id: dealId,
      workspace_id: workspaceId,
      name: `${label} — ${name}`,
      company_id: companyId,
      contact_id: contactId,
      stage_id: stage.id,
      value: 0,
      source: `Website — ${label}`,
    });
    if (dealError) throw new Error(dealError.message);

    await admin.from("activities").insert({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      type: "system",
      summary: `Website inquiry (${label}): ${message.slice(0, 400)}`,
      deal_id: dealId,
      contact_id: contactId,
      company_id: companyId,
      client_visible: false,
    });

    await admin.from("intake_requests").insert({
      workspace_id: workspaceId,
      email,
      name,
      company: companyName || null,
      request_type: type,
      message,
      ip,
      company_id: companyId,
      contact_id: contactId,
      deal_id: dealId,
    });

    // Delivery handled by the email_outbox trigger → send-email edge function.
    const { data: adminRows } = await admin
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .in("role", ["owner", "admin"]);
    const adminIds = (adminRows ?? []).map((r) => r.user_id);
    const { data: profileRows } = adminIds.length
      ? await admin.from("profiles").select("email").in("id", adminIds)
      : { data: [] };
    const adminEmails = (profileRows ?? []).map((p) => p.email).filter(Boolean);
    await admin.from("email_outbox").insert([
      {
        workspace_id: workspaceId,
        event: "lead-intake-owner",
        recipients: adminEmails.length > 0 ? adminEmails : ["lysenkob337@gmail.com"],
        payload: { name, email, company: companyName, requestType: label, message: message.slice(0, 600) },
      },
      {
        workspace_id: workspaceId,
        event: "lead-intake-confirm",
        recipients: [email],
        payload: { name, requestType: label },
      },
    ]);

    return { ok: true };
  } catch (err) {
    console.error("lead intake failed", err);
    return { ok: false, error: "Something went wrong on our side. Please email us directly." };
  }
}

type Admin = ReturnType<typeof createAdminClient>;

async function resolveWorkspace(admin: Admin): Promise<string | null> {
  const pinned = process.env.INTAKE_WORKSPACE_ID;
  if (pinned) return pinned;
  const { data } = await admin
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function findOrCreateCompany(
  admin: Admin,
  workspaceId: string,
  input: { email: string; companyName: string; contactName: string },
): Promise<string> {
  const domain = input.email.split("@")[1] ?? "";
  const corporate = domain !== "" && !FREE_MAIL_DOMAINS.has(domain);

  if (corporate) {
    const { data } = await admin
      .from("companies")
      .select("id")
      .eq("workspace_id", workspaceId)
      .ilike("domain", domain)
      .limit(1)
      .maybeSingle();
    if (data) return data.id;
  }
  if (input.companyName) {
    const { data } = await admin
      .from("companies")
      .select("id")
      .eq("workspace_id", workspaceId)
      .ilike("name", input.companyName)
      .limit(1)
      .maybeSingle();
    if (data) return data.id;
  }

  const id = crypto.randomUUID();
  const { error } = await admin.from("companies").insert({
    id,
    workspace_id: workspaceId,
    name: input.companyName || `${input.contactName} (inbound)`,
    domain: corporate ? domain : "",
    notes: "Created from a website inquiry.",
  });
  if (error) throw new Error(error.message);
  return id;
}
