import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createBareClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-side Supabase client for Server Components, Server Actions and Route
 * Handlers. Runs as the signed-in user (RLS applies).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — the proxy refreshes sessions,
            // so dropping the write is safe.
          }
        },
      },
    },
  );
}

/**
 * Admin client (secret key, bypasses RLS) — auth.admin invites only. Server
 * code only; throws a readable error until SUPABASE_SECRET_KEY is configured.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Copy the secret key from your Supabase dashboard (Settings → API keys) into .env.local to enable invites.",
    );
  }
  return createBareClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
