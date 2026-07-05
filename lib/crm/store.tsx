"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { makeSeedState, AGENCY_STAGES, SIMPLE_STAGES } from "./seed";
import {
  uid,
  DAY,
  type Activity,
  type ActivityType,
  type AutomationRule,
  type CalEvent,
  type Company,
  type Contact,
  type CrmState,
  type Deal,
  type OpenRequest,
  type PlanId,
  type Stage,
  type Task,
  type TeamRole,
} from "./types";

/**
 * Client-side store persisted to localStorage. State lives in the /crm
 * layout, so it survives navigation and reloads; "Reset demo data" restores
 * the sample set. The action surface mirrors what a real API would expose,
 * so a backend can replace the reducer without touching the views.
 */

const STORAGE_KEY = "franko-crm-state-v2";

/** ?noonboard=1 boots a fresh sample workspace and never writes to storage —
 * used by tests/screenshots so they can't clobber real data. */
function isEphemeralSession(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("noonboard")
  );
}

type Action =
  | { type: "complete-onboarding"; workspaceName: string; template: "agency" | "simple"; withSampleData: boolean }
  | { type: "reset-demo" }
  | { type: "set-workspace-name"; name: string }
  | { type: "set-plan"; plan: PlanId }
  | { type: "add-contact"; contact: Contact }
  | { type: "update-contact"; id: string; patch: Partial<Contact> }
  | { type: "delete-contact"; id: string }
  | { type: "add-company"; company: Company }
  | { type: "update-company"; id: string; patch: Partial<Company> }
  | { type: "delete-company"; id: string }
  | { type: "add-deal"; deal: Deal }
  | { type: "update-deal"; id: string; patch: Partial<Deal> }
  | { type: "move-deal"; id: string; stageId: string; at: number }
  | { type: "delete-deal"; id: string }
  | { type: "add-task"; task: Task }
  | { type: "toggle-task"; id: string }
  | { type: "delete-task"; id: string }
  | { type: "add-event"; event: CalEvent }
  | { type: "update-event"; id: string; patch: Partial<CalEvent> }
  | { type: "delete-event"; id: string }
  | { type: "log-activity"; activity: Activity }
  | { type: "rename-stage"; id: string; name: string }
  | { type: "add-stage"; stage: Stage; beforeClosed: true }
  | { type: "remove-stage"; id: string }
  | { type: "move-stage"; id: string; dir: -1 | 1 }
  | { type: "add-rule"; rule: AutomationRule }
  | { type: "toggle-rule"; id: string }
  | { type: "delete-rule"; id: string }
  | { type: "mark-notifs-read"; ids: string[] }
  | { type: "set-open-request"; request: OpenRequest | null }
  | { type: "add-team-member"; member: CrmState["team"][number] }
  | { type: "remove-team-member"; id: string };

function emptyState(base: CrmState): CrmState {
  return {
    ...base,
    companies: [],
    contacts: [],
    deals: [],
    tasks: [],
    activities: [],
    events: [],
  };
}

function reducer(state: CrmState, action: Action): CrmState {
  switch (action.type) {
    case "complete-onboarding": {
      const seeded = makeSeedState();
      const stages =
        action.template === "simple" ? SIMPLE_STAGES : AGENCY_STAGES;
      const next = action.withSampleData ? seeded : emptyState(seeded);
      return {
        ...next,
        stages,
        workspace: { ...next.workspace, name: action.workspaceName || "My workspace" },
        onboarded: true,
      };
    }
    case "reset-demo": {
      return { ...makeSeedState(), onboarded: true };
    }
    case "set-workspace-name":
      return { ...state, workspace: { ...state.workspace, name: action.name } };
    case "set-plan":
      return { ...state, workspace: { ...state.workspace, plan: action.plan } };
    case "add-contact":
      return { ...state, contacts: [action.contact, ...state.contacts] };
    case "update-contact":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "delete-contact":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.id),
        deals: state.deals.map((d) =>
          d.contactId === action.id ? { ...d, contactId: null } : d,
        ),
        tasks: state.tasks.map((t) =>
          t.contactId === action.id ? { ...t, contactId: null } : t,
        ),
        events: state.events.map((e) =>
          e.contactId === action.id ? { ...e, contactId: null } : e,
        ),
      };
    case "add-company":
      return { ...state, companies: [action.company, ...state.companies] };
    case "update-company":
      return {
        ...state,
        companies: state.companies.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "delete-company":
      return {
        ...state,
        companies: state.companies.filter((c) => c.id !== action.id),
        contacts: state.contacts.map((c) =>
          c.companyId === action.id ? { ...c, companyId: null } : c,
        ),
        deals: state.deals.map((d) =>
          d.companyId === action.id ? { ...d, companyId: null } : d,
        ),
      };
    case "add-deal":
      return { ...state, deals: [action.deal, ...state.deals] };
    case "update-deal":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d,
        ),
      };
    case "move-deal": {
      const stage = state.stages.find((s) => s.id === action.stageId);
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.id
            ? {
                ...d,
                stageId: action.stageId,
                stageChangedAt: action.at,
                closedAt: stage && stage.kind !== "open" ? action.at : null,
              }
            : d,
        ),
      };
    }
    case "delete-deal":
      return {
        ...state,
        deals: state.deals.filter((d) => d.id !== action.id),
        tasks: state.tasks.map((t) =>
          t.dealId === action.id ? { ...t, dealId: null } : t,
        ),
        events: state.events.map((e) =>
          e.dealId === action.id ? { ...e, dealId: null } : e,
        ),
      };
    case "add-task":
      return { ...state, tasks: [action.task, ...state.tasks] };
    case "toggle-task":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      };
    case "delete-task":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "add-event":
      return { ...state, events: [action.event, ...state.events] };
    case "update-event":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };
    case "delete-event":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.id),
      };
    case "log-activity":
      return { ...state, activities: [action.activity, ...state.activities] };
    case "rename-stage":
      return {
        ...state,
        stages: state.stages.map((s) =>
          s.id === action.id ? { ...s, name: action.name } : s,
        ),
      };
    case "add-stage": {
      // New stages slot in before the won/lost columns.
      const open = state.stages.filter((s) => s.kind === "open");
      const closed = state.stages.filter((s) => s.kind !== "open");
      return { ...state, stages: [...open, action.stage, ...closed] };
    }
    case "remove-stage": {
      const open = state.stages.filter((s) => s.kind === "open");
      if (open.length <= 1) return state;
      const fallback = open.find((s) => s.id !== action.id);
      if (!fallback) return state;
      return {
        ...state,
        stages: state.stages.filter((s) => s.id !== action.id),
        deals: state.deals.map((d) =>
          d.stageId === action.id ? { ...d, stageId: fallback.id } : d,
        ),
      };
    }
    case "move-stage": {
      const open = state.stages.filter((s) => s.kind === "open");
      const closed = state.stages.filter((s) => s.kind !== "open");
      const idx = open.findIndex((s) => s.id === action.id);
      const to = idx + action.dir;
      if (idx === -1 || to < 0 || to >= open.length) return state;
      const next = [...open];
      [next[idx], next[to]] = [next[to], next[idx]];
      return { ...state, stages: [...next, ...closed] };
    }
    case "add-rule":
      return { ...state, rules: [...state.rules, action.rule] };
    case "toggle-rule":
      return {
        ...state,
        rules: state.rules.map((r) =>
          r.id === action.id ? { ...r, enabled: !r.enabled } : r,
        ),
      };
    case "delete-rule":
      return { ...state, rules: state.rules.filter((r) => r.id !== action.id) };
    case "mark-notifs-read": {
      const merged = new Set([...state.readNotifIds, ...action.ids]);
      return { ...state, readNotifIds: [...merged].slice(-400) };
    }
    case "set-open-request":
      return { ...state, ui: { openRequest: action.request } };
    case "add-team-member":
      return { ...state, team: [...state.team, action.member] };
    case "remove-team-member":
      return { ...state, team: state.team.filter((m) => m.id !== action.id) };
    default:
      return state;
  }
}

function initState(): CrmState {
  const seeded = makeSeedState();
  if (typeof window === "undefined") return seeded;
  if (isEphemeralSession()) return { ...seeded, onboarded: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<CrmState>;
      if (saved && Array.isArray(saved.stages) && Array.isArray(saved.deals)) {
        // Spread over the seed so fields added in newer versions get defaults.
        return { ...seeded, ...saved, ui: { openRequest: null } };
      }
    }
  } catch {
    // Corrupt save — fall through to a fresh workspace.
  }
  return seeded;
}

export type LogActivityInput = {
  type: ActivityType;
  summary: string;
  dealId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  clientVisible?: boolean;
};

function buildActions(dispatch: React.Dispatch<Action>, state: CrmState) {
  const logActivity = (input: LogActivityInput) =>
    dispatch({
      type: "log-activity",
      activity: {
        id: uid(),
        type: input.type,
        summary: input.summary,
        at: Date.now(),
        dealId: input.dealId ?? null,
        contactId: input.contactId ?? null,
        companyId: input.companyId ?? null,
        clientVisible: input.clientVisible ?? false,
      },
    });

  /** Fire enabled automation rules matching a deal trigger. */
  const runAutomations = (
    kinds: ("deal-created" | "stage-enter" | "deal-won")[],
    deal: Deal,
    stageId: string,
  ) => {
    for (const rule of state.rules) {
      if (!rule.enabled) continue;
      const t = rule.trigger;
      const hit =
        (t.type === "deal-created" && kinds.includes("deal-created")) ||
        (t.type === "deal-won" && kinds.includes("deal-won")) ||
        (t.type === "stage-enter" &&
          kinds.includes("stage-enter") &&
          t.stageId === stageId);
      if (!hit) continue;

      const fill = (s: string) => s.replaceAll("{deal}", deal.name);
      if (rule.action.type === "create-task") {
        dispatch({
          type: "add-task",
          task: {
            id: uid(),
            title: fill(rule.action.title),
            dueAt: Date.now() + rule.action.offsetDays * DAY,
            done: false,
            dealId: deal.id,
            contactId: deal.contactId,
            createdAt: Date.now(),
          },
        });
      } else if (rule.action.type === "portal-update") {
        logActivity({
          type: "note",
          summary: fill(rule.action.text),
          dealId: deal.id,
          contactId: deal.contactId,
          companyId: deal.companyId,
          clientVisible: true,
        });
      } else if (rule.action.type === "create-event") {
        dispatch({
          type: "add-event",
          event: {
            id: uid(),
            title: fill(rule.action.title),
            kind: rule.action.kind,
            startAt: Date.now() + rule.action.offsetDays * DAY,
            durationMin: 30,
            dealId: deal.id,
            contactId: deal.contactId,
            notes: "",
            done: false,
          },
        });
      }
      logActivity({
        type: "system",
        summary: `Automation ran: ${rule.name}.`,
        dealId: deal.id,
        companyId: deal.companyId,
      });
    }
  };

  return {
    completeOnboarding: (
      workspaceName: string,
      template: "agency" | "simple",
      withSampleData: boolean,
    ) =>
      dispatch({
        type: "complete-onboarding",
        workspaceName,
        template,
        withSampleData,
      }),
    resetDemo: () => dispatch({ type: "reset-demo" }),
    setWorkspaceName: (name: string) =>
      dispatch({ type: "set-workspace-name", name }),
    setPlan: (plan: PlanId) => dispatch({ type: "set-plan", plan }),

    addContact: (input: Omit<Contact, "id" | "createdAt" | "hue">) => {
      const contact: Contact = {
        ...input,
        id: uid(),
        createdAt: Date.now(),
        hue: Math.floor(Math.random() * 360),
      };
      dispatch({ type: "add-contact", contact });
      return contact;
    },
    updateContact: (id: string, patch: Partial<Contact>) =>
      dispatch({ type: "update-contact", id, patch }),
    deleteContact: (id: string) => dispatch({ type: "delete-contact", id }),

    addCompany: (input: Omit<Company, "id">) => {
      const company: Company = { ...input, id: uid() };
      dispatch({ type: "add-company", company });
      return company;
    },
    updateCompany: (id: string, patch: Partial<Company>) =>
      dispatch({ type: "update-company", id, patch }),
    deleteCompany: (id: string) => dispatch({ type: "delete-company", id }),

    addDeal: (
      input: Omit<Deal, "id" | "createdAt" | "stageChangedAt" | "closedAt">,
    ) => {
      const now = Date.now();
      const deal: Deal = {
        ...input,
        id: uid(),
        createdAt: now,
        stageChangedAt: now,
        closedAt: null,
      };
      dispatch({ type: "add-deal", deal });
      runAutomations(["deal-created"], deal, deal.stageId);
      return deal;
    },
    updateDeal: (id: string, patch: Partial<Deal>) =>
      dispatch({ type: "update-deal", id, patch }),
    moveDeal: (id: string, stageId: string) => {
      const deal = state.deals.find((d) => d.id === id);
      const stage = state.stages.find((s) => s.id === stageId);
      if (!deal || !stage || deal.stageId === stageId) return;
      dispatch({ type: "move-deal", id, stageId, at: Date.now() });
      logActivity({
        type: "stage",
        summary: `Moved to ${stage.name}.`,
        dealId: id,
        contactId: deal.contactId,
        companyId: deal.companyId,
      });
      runAutomations(
        stage.kind === "won" ? ["stage-enter", "deal-won"] : ["stage-enter"],
        deal,
        stageId,
      );
    },
    deleteDeal: (id: string) => dispatch({ type: "delete-deal", id }),

    addTask: (
      title: string,
      dueAt: number,
      link: { dealId?: string | null; contactId?: string | null } = {},
    ) =>
      dispatch({
        type: "add-task",
        task: {
          id: uid(),
          title,
          dueAt,
          done: false,
          dealId: link.dealId ?? null,
          contactId: link.contactId ?? null,
          createdAt: Date.now(),
        },
      }),
    toggleTask: (id: string) => dispatch({ type: "toggle-task", id }),
    deleteTask: (id: string) => dispatch({ type: "delete-task", id }),

    addEvent: (input: Omit<CalEvent, "id" | "done">) => {
      const event: CalEvent = { ...input, id: uid(), done: false };
      dispatch({ type: "add-event", event });
      return event;
    },
    updateEvent: (id: string, patch: Partial<CalEvent>) =>
      dispatch({ type: "update-event", id, patch }),
    deleteEvent: (id: string) => dispatch({ type: "delete-event", id }),
    /** Mark a call/meeting done and log it as a Pulse touch. */
    completeEvent: (id: string) => {
      const event = state.events.find((e) => e.id === id);
      if (!event || event.done) return;
      dispatch({ type: "update-event", id, patch: { done: true } });
      if (event.kind === "call" || event.kind === "meeting") {
        const deal = event.dealId
          ? state.deals.find((d) => d.id === event.dealId)
          : null;
        logActivity({
          type: event.kind === "call" ? "call" : "meeting",
          summary: `${event.title} — completed.`,
          dealId: event.dealId,
          contactId: event.contactId,
          companyId: deal?.companyId ?? null,
        });
      }
    },

    logActivity,

    renameStage: (id: string, name: string) =>
      dispatch({ type: "rename-stage", id, name }),
    addStage: (name: string) =>
      dispatch({
        type: "add-stage",
        stage: { id: uid(), name, kind: "open" },
        beforeClosed: true,
      }),
    removeStage: (id: string) => dispatch({ type: "remove-stage", id }),
    moveStage: (id: string, dir: -1 | 1) =>
      dispatch({ type: "move-stage", id, dir }),

    addRule: (rule: Omit<AutomationRule, "id">) =>
      dispatch({ type: "add-rule", rule: { ...rule, id: uid() } }),
    toggleRule: (id: string) => dispatch({ type: "toggle-rule", id }),
    deleteRule: (id: string) => dispatch({ type: "delete-rule", id }),

    markNotifsRead: (ids: string[]) =>
      dispatch({ type: "mark-notifs-read", ids }),
    requestOpen: (request: OpenRequest | null) =>
      dispatch({ type: "set-open-request", request }),

    addTeamMember: (name: string, email: string, role: TeamRole) =>
      dispatch({
        type: "add-team-member",
        member: {
          id: uid(),
          name,
          email,
          role,
          hue: Math.floor(Math.random() * 360),
        },
      }),
    removeTeamMember: (id: string) =>
      dispatch({ type: "remove-team-member", id }),
  };
}

type CrmContextValue = {
  state: CrmState;
  actions: ReturnType<typeof buildActions>;
};

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const actions = useMemo(() => buildActions(dispatch, state), [state]);
  const value = useMemo(() => ({ state, actions }), [state, actions]);

  // Persist everything except transient UI state. Ephemeral (?noonboard)
  // sessions never write, so tests can't clobber real data.
  useEffect(() => {
    if (isEphemeralSession()) return;
    try {
      // JSON.stringify drops undefined keys, so `ui` never gets persisted.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, ui: undefined }),
      );
    } catch {
      // Storage full or unavailable — the app keeps working in-memory.
    }
  }, [state]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside <CrmProvider>");
  return ctx;
}

/** Convenience lookups shared by most CRM views. */
export function useCrmLookups() {
  const { state } = useCrm();
  return useMemo(() => {
    const companyById = new Map(state.companies.map((c) => [c.id, c]));
    const contactById = new Map(state.contacts.map((c) => [c.id, c]));
    const dealById = new Map(state.deals.map((d) => [d.id, d]));
    const stageById = new Map(state.stages.map((s) => [s.id, s]));
    return { companyById, contactById, dealById, stageById };
  }, [state.companies, state.contacts, state.deals, state.stages]);
}
