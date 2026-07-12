"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Who is signed in and what they are: a workspace member (the agency team),
 * a client (portal user linked to a company), or nobody — in which case the
 * app runs the local demo store. Mounted once in the root layout so the /crm
 * and (site) trees share it.
 */

export type SessionProfile = {
  id: string;
  name: string;
  email: string;
  hue: number;
};

export type SessionMembership = {
  workspaceId: string;
  role: "Owner" | "Admin" | "Member";
};

export type SessionClientAccess = {
  workspaceId: string;
  companyIds: string[];
};

export type Session = {
  /** False until the auth state and memberships have been read. */
  ready: boolean;
  user: User | null;
  profile: SessionProfile | null;
  /** Set when the user belongs to a workspace team. */
  membership: SessionMembership | null;
  /** Set when the user is a client with portal access. */
  clientAccess: SessionClientAccess | null;
  /** Sticky ?noonboard=1 — in-memory demo store, no DB, no persistence. */
  demo: boolean;
  signOut: () => Promise<void>;
  /** Re-read profile + memberships (e.g. after onboarding creates a workspace). */
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

const ROLE_LABEL: Record<string, SessionMembership["role"]> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

function isDemoSession(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("noonboard")
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  // Demo sessions never talk to auth, so they're ready immediately.
  const [ready, setReady] = useState(isDemoSession);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [membership, setMembership] = useState<SessionMembership | null>(null);
  const [clientAccess, setClientAccess] =
    useState<SessionClientAccess | null>(null);
  // Captured once — client-side navigation drops the query string, but the
  // demo session must stay ephemeral for its whole lifetime.
  const [demo] = useState(isDemoSession);

  const loadIdentity = useCallback(
    async (nextUser: User | null) => {
      if (!nextUser) {
        setProfile(null);
        setMembership(null);
        setClientAccess(null);
        return;
      }
      const [profileRes, memberRes, clientRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, hue")
          .eq("id", nextUser.id)
          .maybeSingle(),
        supabase
          .from("workspace_members")
          .select("workspace_id, role")
          .eq("user_id", nextUser.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("company_members")
          .select("workspace_id, company_id")
          .eq("user_id", nextUser.id),
      ]);
      setProfile(
        profileRes.data
          ? {
              id: profileRes.data.id,
              name: profileRes.data.full_name || nextUser.email || "You",
              email: profileRes.data.email,
              hue: profileRes.data.hue,
            }
          : {
              id: nextUser.id,
              name: nextUser.email ?? "You",
              email: nextUser.email ?? "",
              hue: 160,
            },
      );
      setMembership(
        memberRes.data
          ? {
              workspaceId: memberRes.data.workspace_id,
              role: ROLE_LABEL[memberRes.data.role] ?? "Member",
            }
          : null,
      );
      const clientRows = clientRes.data ?? [];
      setClientAccess(
        clientRows.length > 0
          ? {
              workspaceId: clientRows[0].workspace_id,
              companyIds: clientRows.map((r) => r.company_id),
            }
          : null,
      );
    },
    [supabase],
  );

  useEffect(() => {
    if (demo) return;
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      await loadIdentity(data.user ?? null);
      if (!cancelled) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (cancelled) return;
        if (event === "SIGNED_OUT") {
          setUser(null);
          void loadIdentity(null);
        } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          const nextUser = newSession?.user ?? null;
          setUser(nextUser);
          void loadIdentity(nextUser);
        }
      },
    );
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase, demo, loadIdentity]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMembership(null);
    setClientAccess(null);
  }, [supabase]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    await loadIdentity(data.user ?? null);
  }, [supabase, loadIdentity]);

  const value = useMemo(
    () => ({
      ready,
      user,
      profile,
      membership,
      clientAccess,
      demo,
      signOut,
      refresh,
    }),
    [ready, user, profile, membership, clientAccess, demo, signOut, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
