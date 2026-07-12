"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import {
  DOC_CATEGORIES,
  daysAgo,
  type DocArticle,
  type DocCategory,
  type DocSection,
} from "@/lib/crm/types";
import {
  Card,
  Drawer,
  Field,
  GhostButton,
  PageHeader,
  PrimaryButton,
  inputCls,
} from "./ui";

const CATEGORIES = ["All", ...DOC_CATEGORIES];

type EditorState = {
  id?: string;
  title: string;
  slug: string;
  category: DocCategory;
  summary: string;
  minutes: number;
  clientVisible: boolean;
  sections: DocSection[];
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function emptyEditor(): EditorState {
  return {
    title: "",
    slug: "",
    category: "Playbooks",
    summary: "",
    minutes: 3,
    clientVisible: false,
    sections: [{ text: "" }],
  };
}

function DocEditor({
  initial,
  onClose,
}: {
  initial: EditorState;
  onClose: () => void;
}) {
  const { actions } = useCrm();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const patchSection = (i: number, patch: Partial<DocSection>) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));

  const save = () => {
    if (!draft.title.trim()) {
      setError("Give the article a title.");
      return;
    }
    const sections = draft.sections
      .map((s) => ({
        ...(s.heading?.trim() ? { heading: s.heading.trim() } : {}),
        text: s.text.trim(),
      }))
      .filter((s) => s.text.length > 0);
    if (sections.length === 0) {
      setError("Write at least one section.");
      return;
    }
    actions.saveDoc({
      id: draft.id,
      title: draft.title.trim(),
      slug: draft.slug.trim() || slugify(draft.title),
      category: draft.category,
      summary: draft.summary.trim(),
      minutes: Math.max(1, draft.minutes),
      clientVisible: draft.clientVisible,
      sections,
    });
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={draft.id ? "Edit article" : "New article"}
    >
      <div className="space-y-4">
        <Field label="Title">
          <input
            value={draft.title}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                title: e.target.value,
                slug: d.id ? d.slug : slugify(e.target.value),
              }))
            }
            placeholder="How we hand off a finished website"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  category: e.target.value as DocCategory,
                }))
              }
              className={inputCls}
            >
              {DOC_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Read time (minutes)">
            <input
              type="number"
              min={1}
              value={draft.minutes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, minutes: Number(e.target.value) || 1 }))
              }
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Summary">
          <textarea
            value={draft.summary}
            onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
            rows={2}
            placeholder="One or two sentences shown in the list."
            className={`${inputCls} resize-y`}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={draft.clientVisible}
            onChange={(e) =>
              setDraft((d) => ({ ...d, clientVisible: e.target.checked }))
            }
            className="size-4 accent-[var(--accent,theme(colors.emerald.400))]"
          />
          Publish to client portals (Guides tool)
        </label>

        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
            Sections
          </p>
          {draft.sections.map((s, i) => (
            <div
              key={i}
              className="space-y-2 rounded-xl border border-edge bg-surface-2/50 p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  value={s.heading ?? ""}
                  onChange={(e) => patchSection(i, { heading: e.target.value })}
                  placeholder="Heading (optional)"
                  className={inputCls}
                />
                <button
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      sections: d.sections.filter((_, idx) => idx !== i),
                    }))
                  }
                  disabled={draft.sections.length <= 1}
                  aria-label="Remove section"
                  className="shrink-0 rounded-lg p-2 text-ink-faint transition hover:text-danger disabled:opacity-30"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <textarea
                value={s.text}
                onChange={(e) => patchSection(i, { text: e.target.value })}
                rows={4}
                placeholder="Write the section…"
                className={`${inputCls} resize-y`}
              />
            </div>
          ))}
          <GhostButton
            onClick={() =>
              setDraft((d) => ({ ...d, sections: [...d.sections, { text: "" }] }))
            }
          >
            <Plus className="size-4" />
            Add section
          </GhostButton>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <PrimaryButton onClick={save}>Save article</PrimaryButton>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </Drawer>
  );
}

export default function DocsView() {
  const { state, actions } = useCrm();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [localActive, setLocalActive] = useState<DocArticle | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  // Command palette requests land here via the store.
  const req = state.ui.openRequest;
  const active =
    localActive ??
    (req?.kind === "doc"
      ? (state.docs.find((a) => a.slug === req.id) ?? null)
      : null);
  const setActive = (article: DocArticle | null) => {
    setLocalActive(article);
    if (!article && req) actions.requestOpen(null);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.docs.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!q ||
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.sections.some((s) => s.text.toLowerCase().includes(q))),
    );
  }, [state.docs, query, category]);

  const edit = (article: DocArticle) =>
    setEditor({
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      summary: article.summary,
      minutes: article.minutes,
      clientVisible: article.clientVisible,
      sections:
        article.sections.length > 0 ? article.sections : [{ text: "" }],
    });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-16 md:p-8">
      <PageHeader
        title="Documentation"
        subtitle="The operating manual the business writes as it runs. Client-visible articles publish straight into every portal's Guides tool."
      >
        <PrimaryButton onClick={() => setEditor(emptyEditor())}>
          <Plus className="size-4" />
          New article
        </PrimaryButton>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs…"
            className="w-full rounded-xl border border-edge bg-surface-2/60 py-2 pl-9 pr-3.5 text-sm outline-none transition focus:border-accent/50"
          />
        </div>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              category === c
                ? "border-accent/50 bg-accent-dim text-accent"
                : "border-edge bg-surface-2/60 text-ink-dim hover:border-edge-strong hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-edge">
        {results.map((a) => (
          <div
            key={a.id}
            className="flex w-full items-start gap-3.5 p-4 transition hover:bg-surface-2/60"
          >
            <button
              onClick={() => setActive(a)}
              className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
            >
              <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{a.title}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-faint">
                  {a.summary}
                </span>
                <span className="mt-1 block text-[11px] text-ink-faint">
                  {a.category} · {a.minutes} min · updated{" "}
                  {daysAgo(a.updatedAt)}d ago
                </span>
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              {a.clientVisible && (
                <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-dim px-2.5 py-1 text-[11px] font-medium text-accent">
                  <Users className="size-3" />
                  in client portals
                </span>
              )}
              <button
                onClick={() => edit(a)}
                aria-label={`Edit ${a.title}`}
                className="rounded-lg p-1.5 text-ink-faint transition hover:text-ink"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${a.title}"?`)) {
                    actions.deleteDoc(a.id);
                  }
                }}
                aria-label={`Delete ${a.title}`}
                className="rounded-lg p-1.5 text-ink-faint transition hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <p className="p-5 text-sm text-ink-faint">
            Nothing matches — try another search, or write the first article.
          </p>
        )}
      </Card>

      {active && !editor && (
        <Drawer open onClose={() => setActive(null)} title={active.title}>
          <div className="space-y-5">
            <p className="text-xs text-ink-faint">
              {active.category} · {active.minutes} min read
              {active.clientVisible
                ? " · published to client portals"
                : " · internal only"}
            </p>
            {active.sections.map((s, i) => (
              <div key={i}>
                {s.heading && (
                  <h3 className="mb-2 text-[15px] font-medium">{s.heading}</h3>
                )}
                <p className="text-base leading-relaxed text-ink-dim">{s.text}</p>
              </div>
            ))}
            <GhostButton
              onClick={() => {
                edit(active);
                setActive(null);
              }}
            >
              <Pencil className="size-4" />
              Edit article
            </GhostButton>
          </div>
        </Drawer>
      )}

      {editor && <DocEditor initial={editor} onClose={() => setEditor(null)} />}
    </div>
  );
}
