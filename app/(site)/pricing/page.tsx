import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import Window from "@/components/os/Window";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Website as a Service plans — design, build, hosting and maintenance for one monthly subscription. Custom projects quoted separately.",
};

/*
 * PLACEHOLDER PRICING — edit the numbers and features here.
 * These tiers are realistic scaffolding, not final prices.
 */
const tiers = [
  {
    name: "Launch",
    price: "$149",
    period: "/month",
    blurb: "For new businesses that need a professional site, handled end to end.",
    features: [
      "Custom-designed website (up to 5 pages)",
      "Hosting, domain & SSL included",
      "Maintenance and updates",
      "Basic SEO setup",
      "Email support",
    ],
    cta: "Start with Launch",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$299",
    period: "/month",
    blurb: "For businesses ready to turn their website into a lead machine.",
    features: [
      "Everything in Launch",
      "Unlimited pages & content updates",
      "CRM + lead capture wired in",
      "Analytics dashboard",
      "Monthly SEO improvements",
      "Priority support (same-day)",
    ],
    cta: "Start with Growth",
    highlighted: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    blurb: "For businesses that want the full connected system, tailored.",
    features: [
      "Everything in Growth",
      "AI & workflow automation",
      "Email/SMS marketing setup",
      "Google & Meta ads management",
      "Dedicated strategy calls",
    ],
    cta: "Get a quote",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <Window title="Pricing" path="~/pricing" size="xl">
      <div className="p-6 md:p-10">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Simple monthly plans
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Your website, as a service
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
          No big upfront project fee. One subscription covers design, build,
          hosting, maintenance and improvements — your site keeps getting
          better every month. Cancel anytime.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                t.highlighted
                  ? "border-accent/50 bg-accent-dim/40"
                  : "border-edge bg-surface-2/40"
              }`}
            >
              {t.highlighted && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-black">
                  <Sparkles className="size-3.5" />
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {t.price}
                </span>
                <span className="text-sm text-ink-dim">{t.period}</span>
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-dim">
                {t.blurb}
              </p>
              <ul className="mt-5 space-y-2.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[15px] text-ink-dim"
                  >
                    <Check
                      className="mt-0.5 size-4.5 shrink-0 text-accent"
                      strokeWidth={2}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/contact?type=${t.name === "Scale" ? "custom" : "waas"}`}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition ${
                  t.highlighted
                    ? "bg-accent text-black hover:brightness-110"
                    : "border border-edge bg-surface-2 text-ink hover:border-edge-strong"
                }`}
              >
                {t.cta}
                <ArrowRight className="size-5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-surface-2/40 p-6">
          <div>
            <p className="text-lg font-medium">Need something one-off?</p>
            <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-ink-dim">
              Custom websites, CRM setup, branding, ads or automation as
              standalone projects — tell us what you need and we&apos;ll quote
              it within two business days.
            </p>
          </div>
          <Link
            href="/contact?type=custom"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Describe your project
            <ArrowRight className="size-5" />
          </Link>
        </div>

        <p className="mt-6 text-sm text-ink-faint">
          All plans include a 30-day money-back guarantee. You own your domain
          and content — always.
        </p>
      </div>
    </Window>
  );
}
