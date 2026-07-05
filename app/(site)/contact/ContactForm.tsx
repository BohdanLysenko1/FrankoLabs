"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Check } from "lucide-react";

const CONTACT_EMAIL = "lysenkob337@gmail.com"; // TODO: switch to hello@frankolabs.com when the domain is live

const requestTypes = [
  { value: "consultation", label: "Book a consultation" },
  { value: "audit", label: "Request a website audit" },
  { value: "waas", label: "Website as a Service" },
  { value: "custom", label: "Custom project" },
  { value: "waitlist", label: "Franko OS waitlist" },
];

const inputClass =
  "w-full rounded-xl border border-edge bg-surface-2/60 px-4 py-3 text-base outline-none transition placeholder:text-ink-faint focus:border-accent/60";

export default function ContactForm() {
  const params = useSearchParams();
  const initialType = params.get("type") ?? "consultation";
  const [type, setType] = useState(
    requestTypes.some((t) => t.value === initialType)
      ? initialType
      : "consultation",
  );
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const label =
      requestTypes.find((t) => t.value === type)?.label ?? "Inquiry";
    const subject = `[Franko Labs] ${label} — ${data.get("name")}`;
    const body = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Company: ${data.get("company") || "—"}`,
      `Request: ${label}`,
      "",
      `${data.get("message")}`,
    ].join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-edge bg-surface-2/40 p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent-dim">
          <Check className="size-7 text-accent" />
        </span>
        <p className="text-lg font-medium">Request handed to your mail app</p>
        <p className="max-w-md text-[15px] leading-relaxed text-ink-dim">
          Hit send there and we&apos;ll get back to you within one business
          day. If nothing opened, email us directly at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
      >
        Submit request
        <Send className="size-5" />
      </button>
    </form>
  );
}
