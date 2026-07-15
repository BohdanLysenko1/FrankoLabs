"use server";

import { headers } from "next/headers";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/**
 * Invite flows need the auth admin API (creating users and sending invite
 * emails), so they run server-side with the secret key. Every entry point
 * re-checks that the caller is an owner/admin of the workspace — the admin
 * client bypasses RLS.
 */

export type InviteResult = { ok: boolean; error?: string };

async function siteOrigin(): Promise<string> {
  const h = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    h.get("origin") ??
    "http://localhost:3000"
  );
}

/** The caller's user id, if they are owner/admin of the workspace. */
async function requireAdmin(workspaceId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  return data && (data.role === "owner" || data.role === "admin")
    ? userData.user.id
    : null;
}

/**
 * Invite a user by email, or find them if they already have an account.
 * Returns the auth user id.
 */
async function inviteOrFindUser(
  email: string,
  name: string | undefined,
  redirectTo: string,
): Promise<{ userId?: string; error?: string }> {
  const admin = createAdminClient();
  const invited = await admin.auth.admin.inviteUserByEmail(email, {
    data: name ? { full_name: name } : undefined,
    redirectTo,
  });
  if (invited.data.user) return { userId: invited.data.user.id };

  // Already registered — look the account up instead of failing the invite.
  const code = (invited.error as { code?: string } | null)?.code;
  if (code === "email_exists" || invited.error?.message.includes("already")) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) return { error: error.message };
    const existing = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (existing) return { userId: existing.id };
    return { error: "That email already has an account, but it couldn't be linked." };
  }
  return { error: invited.error?.message ?? "Invite failed." };
}

export async function inviteTeamMemberUser(input: {
  workspaceId: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
}): Promise<InviteResult> {
  try {
    const callerId = await requireAdmin(input.workspaceId);
    if (!callerId) return { ok: false, error: "Only workspace admins can invite." };

    const origin = await siteOrigin();
    const { userId, error } = await inviteOrFindUser(
      input.email,
      input.name,
      `${origin}/auth/callback?next=/auth/set-password`,
    );
    if (!userId) return { ok: false, error };

    const admin = createAdminClient();
    const { error: memberError } = await admin.from("workspace_members").upsert(
      {
        workspace_id: input.workspaceId,
        user_id: userId,
        role: input.role.toLowerCase(),
      },
      { onConflict: "workspace_id,user_id" },
    );
    if (memberError) return { ok: false, error: memberError.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invite failed." };
  }
}

/**
 * Which portal users haven't accepted their invite yet (never signed in).
 * Only auth.users knows this, so it runs through the admin API.
 */
export async function pendingClientInvites(
  workspaceId: string,
): Promise<{ ok: boolean; pending?: string[]; error?: string }> {
  try {
    const callerId = await requireAdmin(workspaceId);
    if (!callerId) {
      return { ok: false, error: "Only workspace admins can view invite status." };
    }
    const admin = createAdminClient();
    const { data: members, error } = await admin
      .from("company_members")
      .select("user_id")
      .eq("workspace_id", workspaceId);
    if (error) return { ok: false, error: error.message };

    const ids = [...new Set((members ?? []).map((m) => m.user_id))];
    const pending: string[] = [];
    for (const id of ids) {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data.user && !data.user.last_sign_in_at) pending.push(id);
    }
    return { ok: true, pending };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Status lookup failed.",
    };
  }
}

export async function inviteClientUser(input: {
  workspaceId: string;
  companyId: string;
  email: string;
  name?: string;
}): Promise<InviteResult> {
  try {
    const callerId = await requireAdmin(input.workspaceId);
    if (!callerId) return { ok: false, error: "Only workspace admins can invite." };

    const admin = createAdminClient();
    // The company must belong to the caller's workspace and be a client.
    const { data: company } = await admin
      .from("companies")
      .select("id, workspace_id, is_client")
      .eq("id", input.companyId)
      .maybeSingle();
    if (!company || company.workspace_id !== input.workspaceId) {
      return { ok: false, error: "Company not found in this workspace." };
    }
    if (!company.is_client) {
      return { ok: false, error: "Mark the company as a client first." };
    }

    const origin = await siteOrigin();
    const { userId, error } = await inviteOrFindUser(
      input.email,
      input.name,
      `${origin}/auth/callback?next=/auth/set-password`,
    );
    if (!userId) return { ok: false, error };

    const { error: memberError } = await admin.from("company_members").upsert(
      {
        company_id: input.companyId,
        user_id: userId,
        workspace_id: input.workspaceId,
      },
      { onConflict: "company_id,user_id" },
    );
    if (memberError) return { ok: false, error: memberError.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invite failed." };
  }
}
