import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the Supabase auth session fresh on every request (rotating tokens
 * land back in cookies). Logged-out visitors get the local demo experience;
 * the client-side gates (OwnerLock, PortalGate) decide what an authenticated
 * user may see — except /crm, which is also guarded here so client-portal
 * accounts never mount the agency UI at all.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not remove — this call refreshes expired sessions. Without
  // it users get randomly signed out during SSR.
  const { data } = await supabase.auth.getClaims();

  // Client accounts belong in the portal, not the CRM.
  const userId = data?.claims?.sub;
  if (userId && request.nextUrl.pathname.startsWith("/crm")) {
    const [member, client] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
    ]);
    if (!member.data && client.data) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav)$).*)",
  ],
};
