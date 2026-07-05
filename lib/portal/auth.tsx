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
import { primaryContactFor } from "./portal";

/**
 * Demo portal auth with a real shape: the session is a signed-in client
 * company, persisted to localStorage. Accounts are the CRM's client
 * companies — inviting a client is what creates their login. A real
 * provider replaces signIn/signOut without touching consumers.
 */

const SESSION_KEY = "franko-portal-session";

type PortalSession = { companyId: string; at: number };

type PortalAuthValue = {
  /** False until the session has been read on the client — render nothing portal-specific before then. */
  ready: boolean;
  /** The signed-in client company, or null. Cleared if the company stops being a client. */
  company: Company | null;
  contact: Contact | null;
  signIn: (companyId: string) => boolean;
  signOut: () => void;
};

const PortalAuthContext = createContext<PortalAuthValue | null>(null);

function readSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<PortalSession>;
    return typeof saved.companyId === "string"
      ? { companyId: saved.companyId, at: saved.at ?? Date.now() }
      : null;
  } catch {
    return null;
  }
}

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state } = useCrm();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [ready, setReady] = useState(false);

  // Restore the saved session; ?portal-as=<companyId> (the CRM's "preview
  // portal" link) signs in as that client and cleans the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewAs = params.get("portal-as");
    if (previewAs) {
      const next = { companyId: previewAs, at: Date.now() };
      setSession(next);
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
      setSession(readSession());
    }
    setReady(true);
  }, [router]);

  const signIn = useCallback(
    (companyId: string) => {
      const company = state.companies.find((c) => c.id === companyId);
      if (!company?.isClient) return false;
      const next = { companyId, at: Date.now() };
      setSession(next);
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable — session lives in memory for this visit.
      }
      return true;
    },
    [state.companies],
  );

  const signOut = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
    router.push("/");
  }, [router]);

  const value = useMemo(() => {
    const company = session
      ? (state.companies.find((c) => c.id === session.companyId && c.isClient) ??
        null)
      : null;
    return {
      ready,
      company,
      contact: company ? primaryContactFor(state, company.id) : null,
      signIn,
      signOut,
    };
  }, [ready, session, state, signIn, signOut]);

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
