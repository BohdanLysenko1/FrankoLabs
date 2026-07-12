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
import { useRouter } from "next/navigation";
import { useCrm } from "@/lib/crm/store";
import type { Company, Contact } from "@/lib/crm/types";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/session";
import { primaryContactFor } from "./portal";

/**
 * Portal auth. Three ways to be "in" a portal:
 *
 *  - a real client session — a Supabase user linked to a company via
 *    company_members (invited from the CRM's Portal view);
 *  - an agency member previewing a client portal (?portal-as=<companyId>,
 *    the CRM's "Preview portal" link) — kept in localStorage;
 *  - demo mode — the same preview mechanism over the seeded demo store,
 *    driven by the one-click tiles on /login.
 */

const SESSION_KEY = "franko-portal-session";

type PreviewSession = { companyId: string; at: number };

type PortalAuthValue = {
  /** False until the session has been read on the client. */
  ready: boolean;
  /** The signed-in (or previewed) client company, or null. */
  company: Company | null;
  contact: Contact | null;
  /** True when this is a real client account (not a preview/demo). */
  isClientUser: boolean;
  /** Real client sign-in. Resolves to an error message, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Ask for a password-reset email. Error message or null. */
  requestReset: (email: string) => Promise<string | null>;
  /** Demo/preview: open a client desktop without credentials. */
  previewAs: (companyId: string) => void;
  signOut: () => void;
};

const PortalAuthContext = createContext<PortalAuthValue | null>(null);

function readPreview(): PreviewSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<PreviewSession>;
    return typeof saved.companyId === "string"
      ? { companyId: saved.companyId, at: saved.at ?? Date.now() }
      : null;
  } catch {
    return null;
  }
}

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useSession();
  const { state, loading } = useCrm();
  const [preview, setPreview] = useState<PreviewSession | null>(null);
  const [previewRead, setPreviewRead] = useState(false);

  // Restore the saved preview; ?portal-as=<companyId> (the CRM's "preview
  // portal" link) opens that client's desktop and cleans the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewAs = params.get("portal-as");
    let next: PreviewSession | null;
    if (previewAs) {
      next = { companyId: previewAs, at: Date.now() };
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable — session lives in memory for this visit.
      }
      params.delete("portal-as");
      const query = params.toString();
      // Strip the param without a navigation — replace() can race the
      // initial App Router mount and leave the URL untouched.
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
    } else {
      next = readPreview();
    }
    const restoreTimer = window.setTimeout(() => {
      setPreview(next);
      setPreviewRead(true);
    }, 0);
    return () => clearTimeout(restoreTimer);
  }, []);

  const openPreview = useCallback((companyId: string) => {
    const next = { companyId, at: Date.now() };
    setPreview(next);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable — session lives in memory for this visit.
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return "That email and password don't match.";
      await session.refresh();
      return null;
    },
    [session],
  );

  const requestReset = useCallback(
    async (email: string): Promise<string | null> => {
      if (!email.includes("@")) return "Enter the email you signed up with.";
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password`,
      });
      return error ? error.message : null;
    },
    [],
  );

  const isRealClient = Boolean(session.user && session.clientAccess);

  const signOut = useCallback(() => {
    clearPreview();
    if (isRealClient) void session.signOut();
    router.push("/");
  }, [clearPreview, isRealClient, session, router]);

  const value = useMemo<PortalAuthValue>(() => {
    const ready = session.ready && previewRead && !loading;

    let company: Company | null = null;
    if (isRealClient && session.clientAccess) {
      company =
        state.companies.find(
          (c) => session.clientAccess!.companyIds.includes(c.id) && c.isClient,
        ) ?? null;
    } else if (preview) {
      // Members preview any client; the demo store previews its own clients.
      const allowed = session.demo || !session.user || Boolean(session.membership);
      if (allowed) {
        company =
          state.companies.find((c) => c.id === preview.companyId && c.isClient) ??
          null;
      }
    }

    return {
      ready,
      company,
      contact: company ? primaryContactFor(state, company.id) : null,
      isClientUser: isRealClient,
      signIn,
      requestReset,
      previewAs: openPreview,
      signOut,
    };
  }, [
    session,
    previewRead,
    loading,
    preview,
    state,
    isRealClient,
    signIn,
    requestReset,
    openPreview,
    signOut,
  ]);

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth(): PortalAuthValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) {
    throw new Error("usePortalAuth must be used inside <PortalAuthProvider>");
  }
  return ctx;
}
