import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands every Supabase auth email link: sign-up confirmations, invites and
 * password resets. Handles both PKCE (?code=) and token-hash style links,
 * then forwards to ?next= (default: the site root).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (!url.searchParams.get("error")) {
    // Admin-sent invite links arrive with session tokens in the URL fragment,
    // which never reaches the server. Browsers re-apply the fragment across
    // redirects, so forward to `next` and let the page claim it client-side.
    return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/login?auth_error=1", url.origin));
}
