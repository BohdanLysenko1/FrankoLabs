"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Check, LoaderCircle } from "lucide-react";
import { submitLeadIntake, type IntakeState } from "@/lib/actions/intake";
import { CONTACT_EMAIL, requestTypes } from "@/lib/site/contact";

const inputClass =
  "w-full rounded-xl border border-edge bg-surface-2/60 px-4 py-3 text-base outline-none transition placeholder:text-ink-faint focus:border-accent/60";

const initialState: IntakeState = { ok: false };

export default function ContactForm() {
  const params = useSearchParams();
  const initialType = params.get("type") ?? "consultation";
  const [type, setType] = useState(
    requestTypes.some((t) => t.value === initialType)
      ? initialType
      : "consultation",
  );
  const [state, formAction, pending] = useActionState(
    submitLeadIntake,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-edge bg-surface-2/65 p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent-dim">
          <Check className="size-7 text-accent" />
        </span>
        <p className="text-lg font-medium">Request received</p>
        <p className="max-w-md text-base leading-relaxed text-ink-dim">
          We review every inquiry personally and will get back to you within
          one business day. Prefer email? Reach us directly at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Honeypot: humans never see this field; bots fill everything. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-dim">
            name *
          </span>
          <input name="name" required placeholder="Jane Doe" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-dim">
            email *
          </span>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@company.com"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-dim">
            company
          </span>
          <input name="company" placeholder="Company Inc." className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink-dim">
            request type
          </span>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            {requestTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink-dim">
          message *
        </span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us about your business and what you need…"
          className={`${inputClass} resize-y`}
        />
      </label>

      {state.error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Submit request"}
        {pending ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : (
          <Send className="size-5" />
        )}
      </button>
    </form>
  );
}
