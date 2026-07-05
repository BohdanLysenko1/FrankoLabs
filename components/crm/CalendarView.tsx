"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Plus,
  Trash2,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { fmtTime, type CalEvent, type EventKind } from "@/lib/crm/types";
import {
  Field,
  GhostButton,
  Modal,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "./ui";

/* ---------- date helpers (local time) ---------- */

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(t: number, days: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

function addMonths(t: number, months: number): number {
  const d = new Date(t);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

/** 42 days covering the month of `cursor`, starting on Sunday. */
function monthGrid(cursor: number): number[] {
  const first = new Date(cursor);
  first.setDate(1);
  first.setHours(0, 0, 0, 0);
  const start = addDays(first.getTime(), -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** The Sunday-to-Saturday week containing `cursor`. */
function weekDays(cursor: number): number[] {
  const day = new Date(cursor);
  day.setHours(0, 0, 0, 0);
  const start = addDays(day.getTime(), -day.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const HOUR_START = 8;
const HOUR_END = 20;
const HOURS = HOUR_END - HOUR_START;

const kindStyle: Record<EventKind, { chip: string; dot: string; label: string }> = {
  call: { chip: "border-accent/40 bg-accent-dim text-accent", dot: "bg-accent", label: "Call" },
  meeting: { chip: "border-sky-400/40 bg-sky-400/10 text-sky-300", dot: "bg-sky-400", label: "Meeting" },
  deadline: { chip: "border-warn/40 bg-warn/10 text-warn", dot: "bg-warn", label: "Deadline" },
  other: { chip: "border-edge bg-surface-3 text-ink-dim", dot: "bg-ink-faint", label: "Other" },
};

/* ---------- event create/edit modal ---------- */

function toDateInput(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeInput(t: number): string {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function EventModal({
  event,
  defaultStart,
  onClose,
}: {
  /** Existing event to edit, or null to create. */
  event: CalEvent | null;
  defaultStart: number;
  onClose: () => void;
}) {
  const { state, actions } = useCrm();
  const [title, setTitle] = useState(event?.title ?? "");
  const [kind, setKind] = useState<EventKind>(event?.kind ?? "call");
  const [date, setDate] = useState(toDateInput(event?.startAt ?? defaultStart));
  const [time, setTime] = useState(toTimeInput(event?.startAt ?? defaultStart));
  const [duration, setDuration] = useState(String(event?.durationMin ?? 30));
  const [dealId, setDealId] = useState(event?.dealId ?? "");
  const [contactId, setContactId] = useState(event?.contactId ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = () => {
    if (!title.trim()) return;
    const startAt = new Date(`${date}T${time || "09:00"}`).getTime();
    if (Number.isNaN(startAt)) return;
    const payload = {
      title: title.trim(),
      kind,
      startAt,
      durationMin: Number(duration),
      dealId: dealId || null,
      contactId: contactId || null,
      notes: event?.notes ?? "",
    };
    if (event) {
      actions.updateEvent(event.id, payload);
    } else {
      actions.addEvent(payload);
    }
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={event ? "Edit event" : "New event"}>
      <div className="space-y-4">
        <Field label="Title">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Proposal review call"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as EventKind)}
              className={inputCls}
            >
              {(Object.keys(kindStyle) as EventKind[]).map((k) => (
                <option key={k} value={k}>
                  {kindStyle[k].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputCls}
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Linked deal">
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className={inputCls}
            >
              <option value="">None</option>
              {state.deals
                .filter((d) => !d.closedAt)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Contact">
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className={inputCls}
            >
              <option value="">None</option>
              {state.contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            {event && (
              <button
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  actions.deleteEvent(event.id);
                  onClose();
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                  confirmDelete
                    ? "border-danger/50 bg-danger/10 text-danger"
                    : "border-edge text-ink-dim hover:text-danger"
                }`}
              >
                <Trash2 className="size-4" />
                {confirmDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
            {event &&
              !event.done &&
              (event.kind === "call" || event.kind === "meeting") && (
                <GhostButton
                  onClick={() => {
                    actions.completeEvent(event.id);
                    onClose();
                  }}
                >
                  <Check className="size-4 text-accent" />
                  Done — log touch
                </GhostButton>
              )}
          </div>
          <div className="flex gap-2">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <PrimaryButton onClick={submit}>
              {event ? "Save" : "Create event"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- calendar ---------- */

type ModalState =
  | { mode: "create"; startAt: number }
  | { mode: "edit"; event: CalEvent }
  | null;

export default function CalendarView() {
  const { state, actions } = useCrm();
  const { contactById } = useCrmLookups();
  const [today] = useState(() => startOfDay(Date.now()));
  const [cursor, setCursor] = useState(today);
  const [view, setView] = useState<"month" | "week">("month");
  const [localModal, setLocalModal] = useState<ModalState>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  // Command palette "New event" lands here via the store's open request.
  const requestedCreate = state.ui.openRequest?.kind === "new-event";
  const modal: ModalState =
    localModal ??
    (requestedCreate
      ? { mode: "create", startAt: today + 10 * 3_600_000 }
      : null);
  const closeModal = () => {
    setLocalModal(null);
    if (requestedCreate) actions.requestOpen(null);
  };

  const days = view === "month" ? monthGrid(cursor) : weekDays(cursor);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalEvent[]>();
    for (const e of state.events) {
      const key = startOfDay(e.startAt);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    for (const list of map.values()) list.sort((a, b) => a.startAt - b.startAt);
    return map;
  }, [state.events]);

  const tasksByDay = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of state.tasks) {
      if (t.done) continue;
      const key = startOfDay(t.dueAt);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [state.tasks]);

  const upcoming = useMemo(
    () =>
      [...state.events]
        .filter((e) => e.startAt >= today && !e.done)
        .sort((a, b) => a.startAt - b.startAt)
        .slice(0, 5),
    [state.events, today],
  );

  const monthLabel = new Date(cursor).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const navigate = (dir: -1 | 1) =>
    setCursor(view === "month" ? addMonths(cursor, dir) : addDays(cursor, dir * 7));

  const onDropDay = (e: React.DragEvent, day: number, hour?: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const id = e.dataTransfer.getData("text/event-id");
    const event = state.events.find((ev) => ev.id === id);
    if (!event) return;
    const old = new Date(event.startAt);
    const next = new Date(day);
    next.setHours(hour ?? old.getHours(), hour !== undefined ? 0 : old.getMinutes(), 0, 0);
    actions.updateEvent(id, { startAt: next.getTime() });
  };

  const dragProps = (day: number, hour?: number) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverDay(`${day}-${hour ?? "all"}`);
    },
    onDragLeave: () => setDragOverDay(null),
    onDrop: (e: React.DragEvent) => onDropDay(e, day, hour),
  });

  const chip = (event: CalEvent) => {
    const s = kindStyle[event.kind];
    return (
      <button
        key={event.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData("text/event-id", event.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          setLocalModal({ mode: "edit", event });
        }}
        className={`flex w-full cursor-grab items-center gap-1.5 truncate rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition hover:brightness-110 active:cursor-grabbing ${s.chip} ${event.done ? "opacity-45 line-through" : ""}`}
      >
        <span className="shrink-0 font-mono text-[10px] tabular-nums opacity-80">
          {fmtTime(event.startAt).replace(" ", "")}
        </span>
        <span className="truncate">{event.title}</span>
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Calendar"
        subtitle="Calls, meetings and deadlines — linked to your deals. Drag an event to reschedule it."
      >
        <div className="flex items-center gap-1 rounded-xl border border-edge bg-surface-2/40 p-1">
          {(["month", "week"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${
                view === v
                  ? "bg-surface-3 font-medium text-ink"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <PrimaryButton
          onClick={() =>
            setLocalModal({ mode: "create", startAt: today + 10 * 3_600_000 })
          }
        >
          <Plus className="size-4" />
          New event
        </PrimaryButton>
      </PageHeader>

      {/* Nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="Previous"
          className="rounded-lg border border-edge p-2 text-ink-dim transition hover:text-ink"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => navigate(1)}
          aria-label="Next"
          className="rounded-lg border border-edge p-2 text-ink-dim transition hover:text-ink"
        >
          <ChevronRight className="size-4" />
        </button>
        <GhostButton onClick={() => setCursor(today)}>Today</GhostButton>
        <h2 className="ml-2 text-lg font-semibold tracking-tight">
          {monthLabel}
        </h2>
        <div className="ml-auto hidden items-center gap-3 text-xs text-ink-faint sm:flex">
          {(Object.keys(kindStyle) as EventKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${kindStyle[k].dot}`} />
              {kindStyle[k].label}
            </span>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div className="overflow-hidden rounded-2xl border border-edge">
          <div className="grid grid-cols-7 border-b border-edge bg-surface-2/60">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-ink-faint"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const inMonth =
                new Date(day).getMonth() === new Date(cursor).getMonth();
              const isToday = isSameDay(day, today);
              const events = eventsByDay.get(day) ?? [];
              const taskCount = tasksByDay.get(day) ?? 0;
              return (
                <div
                  key={day}
                  {...dragProps(day)}
                  onClick={() =>
                    setLocalModal({
                      mode: "create",
                      startAt: day + 10 * 3_600_000,
                    })
                  }
                  className={`min-h-27 cursor-pointer space-y-1 border-b border-r border-edge p-1.5 transition last:border-r-0 ${
                    dragOverDay === `${day}-all`
                      ? "bg-accent-dim/50"
                      : inMonth
                        ? "bg-surface/40 hover:bg-surface-2/50"
                        : "bg-desktop/60"
                  }`}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-accent font-semibold text-black"
                        : inMonth
                          ? "text-ink-dim"
                          : "text-ink-faint/60"
                    }`}
                  >
                    {new Date(day).getDate()}
                  </span>
                  {events.slice(0, 3).map(chip)}
                  {events.length > 3 && (
                    <p className="px-1 text-[10px] text-ink-faint">
                      +{events.length - 3} more
                    </p>
                  )}
                  {taskCount > 0 && (
                    <p className="flex items-center gap-1 px-1 text-[10px] text-ink-faint">
                      <ListChecks className="size-3" />
                      {taskCount} task{taskCount > 1 ? "s" : ""} due
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="os-scroll overflow-x-auto rounded-2xl border border-edge">
          <div className="grid min-w-175 grid-cols-[3.5rem_repeat(7,1fr)]">
            {/* Header row */}
            <div className="border-b border-edge bg-surface-2/60" />
            {days.map((day) => (
              <div
                key={`h-${day}`}
                className={`border-b border-l border-edge bg-surface-2/60 px-2 py-2 text-center text-xs ${
                  isSameDay(day, today) ? "text-accent" : "text-ink-dim"
                }`}
              >
                <span className="font-medium">
                  {new Date(day).toLocaleDateString("en-US", { weekday: "short" })}
                </span>{" "}
                <span className="font-mono tabular-nums">
                  {new Date(day).getDate()}
                </span>
              </div>
            ))}
            {/* Hour rows */}
            {Array.from({ length: HOURS }, (_, i) => HOUR_START + i).map(
              (hour) => (
                <div key={`row-${hour}`} className="contents">
                  <div className="h-12 border-b border-edge pr-2 pt-0.5 text-right font-mono text-[10px] tabular-nums text-ink-faint">
                    {hour}:00
                  </div>
                  {days.map((day) => {
                    const slotEvents = (eventsByDay.get(day) ?? []).filter(
                      (e) => new Date(e.startAt).getHours() === hour,
                    );
                    return (
                      <div
                        key={`${day}-${hour}`}
                        {...dragProps(day, hour)}
                        onClick={() => {
                          const t = new Date(day);
                          t.setHours(hour, 0, 0, 0);
                          setLocalModal({ mode: "create", startAt: t.getTime() });
                        }}
                        className={`h-12 cursor-pointer space-y-0.5 border-b border-l border-edge p-0.5 transition ${
                          dragOverDay === `${day}-${hour}`
                            ? "bg-accent-dim/50"
                            : isSameDay(day, today)
                              ? "bg-surface-2/30 hover:bg-surface-2/60"
                              : "hover:bg-surface-2/40"
                        }`}
                      >
                        {slotEvents.map(chip)}
                      </div>
                    );
                  })}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Upcoming agenda */}
      <div>
        <SectionLabel>Coming up</SectionLabel>
        <div className="mt-2 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/40">
          {upcoming.map((e) => {
            const contact = e.contactId ? contactById.get(e.contactId) : null;
            const s = kindStyle[e.kind];
            return (
              <button
                key={e.id}
                onClick={() => setLocalModal({ mode: "edit", event: e })}
                className="flex w-full items-center gap-3.5 p-4 text-left transition hover:bg-surface-2/50"
              >
                <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {e.title}
                  </span>
                  <span className="block text-xs text-ink-faint">
                    {new Date(e.startAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {fmtTime(e.startAt)}
                    {contact ? ` · ${contact.name}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {e.durationMin} min
                </span>
              </button>
            );
          })}
          {upcoming.length === 0 && (
            <p className="flex items-center gap-2 p-5 text-sm text-ink-faint">
              <CalendarDays className="size-4" />
              Nothing scheduled — click any day to add an event.
            </p>
          )}
        </div>
      </div>

      {modal && (
        <EventModal
          event={modal.mode === "edit" ? modal.event : null}
          defaultStart={modal.mode === "create" ? modal.startAt : 0}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
