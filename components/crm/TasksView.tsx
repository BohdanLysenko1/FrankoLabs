"use client";

import { useMemo, useState } from "react";
import { AlarmClockPlus, CalendarClock, ListChecks, Plus, Timer, Trash2 } from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { DAY, relTime, type Task } from "@/lib/crm/types";
import TimeLogModal from "./TimeLogModal";
import {
  Card,
  EmptyState,
  Field,
  GhostButton,
  Modal,
  PageHeader,
  PrimaryButton,
  inputCls,
} from "./ui";

function TaskRow({
  task,
  now,
  onLogTime,
}: {
  task: Task;
  now: number;
  onLogTime: () => void;
}) {
  const { actions } = useCrm();
  const { dealById, contactById } = useCrmLookups();
  const deal = task.dealId ? dealById.get(task.dealId) : null;
  const contact = task.contactId ? contactById.get(task.contactId) : null;
  const overdue = !task.done && task.dueAt < now;

  return (
    <div className="group flex items-center gap-3.5 p-4">
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => actions.toggleTask(task.id)}
        className="size-4.5 shrink-0 cursor-pointer accent-[#34d399]"
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-snug ${task.done ? "text-ink-faint line-through" : ""}`}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-xs text-ink-faint">
          <span
            className={`flex items-center gap-1 ${overdue ? "font-medium text-danger" : ""}`}
          >
            <CalendarClock className="size-3" />
            {overdue ? `overdue — due ${relTime(task.dueAt)}` : `due ${relTime(task.dueAt)}`}
          </span>
          {deal && <span className="truncate">{deal.name}</span>}
          {!deal && contact && <span>{contact.name}</span>}
        </p>
      </div>
      <button
        onClick={onLogTime}
        aria-label="Log time"
        title="Log time"
        className="shrink-0 rounded-lg p-1.5 text-ink-faint opacity-0 transition hover:bg-surface-2 hover:text-accent group-hover:opacity-100"
      >
        <Timer className="size-4" />
      </button>
      {overdue && (
        <button
          onClick={() => actions.updateTask(task.id, { dueAt: now + DAY })}
          aria-label="Snooze to tomorrow"
          title="Snooze to tomorrow"
          className="shrink-0 rounded-lg p-1.5 text-ink-faint opacity-0 transition hover:bg-surface-2 hover:text-warn group-hover:opacity-100"
        >
          <AlarmClockPlus className="size-4" />
        </button>
      )}
      <button
        onClick={() => actions.deleteTask(task.id)}
        aria-label="Delete task"
        className="shrink-0 rounded-lg p-1.5 text-ink-faint opacity-0 transition hover:bg-surface-2 hover:text-danger group-hover:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function NewTaskModal({ onClose }: { onClose: () => void }) {
  const { state, actions } = useCrm();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("tomorrow");
  const [dealId, setDealId] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    const dueAt =
      due === "today"
        ? Date.now() + 4 * 3_600_000
        : due === "tomorrow"
          ? Date.now() + DAY
          : Date.now() + 7 * DAY;
    const deal = state.deals.find((d) => d.id === dealId);
    actions.addTask(title.trim(), dueAt, {
      dealId: dealId || null,
      contactId: deal?.contactId ?? null,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="New task">
      <div className="space-y-4">
        <Field label="What needs doing?">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Send follow-up email to…"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due">
            <select
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={inputCls}
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">Next week</option>
            </select>
          </Field>
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
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={submit}>Add task</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export default function TasksView() {
  const { state, actions } = useCrm();
  const [localAdding, setLocalAdding] = useState(false);
  const [loggingFor, setLoggingFor] = useState<Task | null>(null);
  const [now] = useState(() => Date.now());

  // Command palette "New task" lands here via the store.
  const req = state.ui.openRequest;
  const adding = localAdding || req?.kind === "new-task";
  const closeAdding = () => {
    setLocalAdding(false);
    if (req) actions.requestOpen(null);
  };

  const groups = useMemo(() => {
    const open = state.tasks
      .filter((t) => !t.done)
      .sort((a, b) => a.dueAt - b.dueAt);
    return {
      overdue: open.filter((t) => t.dueAt < now),
      today: open.filter((t) => t.dueAt >= now && t.dueAt < now + DAY),
      upcoming: open.filter((t) => t.dueAt >= now + DAY),
      done: state.tasks
        .filter((t) => t.done)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10),
    };
  }, [state.tasks, now]);

  const sections: { label: string; items: Task[]; tone?: string }[] = [
    { label: "Overdue", items: groups.overdue, tone: "text-danger" },
    { label: "Due today", items: groups.today, tone: "text-warn" },
    { label: "Upcoming", items: groups.upcoming },
    { label: "Recently completed", items: groups.done },
  ];

  const openCount = groups.overdue.length + groups.today.length + groups.upcoming.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Tasks"
        subtitle={`${openCount} open · ${groups.overdue.length} overdue. Pulse watches these too.`}
      >
        <PrimaryButton onClick={() => setLocalAdding(true)}>
          <Plus className="size-4" />
          New task
        </PrimaryButton>
      </PageHeader>

      {openCount === 0 && groups.done.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-6" strokeWidth={1.5} />}
          title="No tasks yet"
          hint="Follow-ups you create here (or from Pulse signals) show up in deal health."
        >
          <PrimaryButton onClick={() => setLocalAdding(true)}>
            <Plus className="size-4" />
            New task
          </PrimaryButton>
        </EmptyState>
      ) : (
        sections.map(
          (section) =>
            section.items.length > 0 && (
              <div key={section.label}>
                <p
                  className={`text-xs font-medium uppercase tracking-widest ${section.tone ?? "text-ink-faint"}`}
                >
                  {section.label}
                  <span className="ml-2 font-mono">{section.items.length}</span>
                </p>
                <Card className="mt-2 divide-y divide-edge">
                  {section.items.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      now={now}
                      onLogTime={() => setLoggingFor(t)}
                    />
                  ))}
                </Card>
              </div>
            ),
        )
      )}

      {adding && <NewTaskModal onClose={closeAdding} />}
      {loggingFor && (
        <TimeLogModal
          onClose={() => setLoggingFor(null)}
          prefill={{
            taskId: loggingFor.id,
            dealId: loggingFor.dealId,
            note: loggingFor.title,
          }}
        />
      )}
    </div>
  );
}
