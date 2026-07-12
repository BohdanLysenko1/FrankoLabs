import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ArrowRight, Check } from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import Window from "@/components/os/Window";

export const metadata: Metadata = {
  title: "About",
  description:
    "Franko Labs builds complete business systems. The agency is the testing ground; Franko OS is the product.",
};

const roadmap = [
  { step: "Brand identity & website", status: "installing" },
  { step: "Launch agency services", status: "queued" },
  { step: "Build Franko OS MVP", status: "queued" },
  { step: "Create client portal", status: "queued" },
  { step: "Automate internal workflows", status: "queued" },
  { step: "Integrate AI throughout", status: "queued" },
  { step: "Launch Franko OS as SaaS", status: "queued" },
];

export default function AboutPage() {
  return (
    <Window title="About" path="~/about" size="md">
      <div className="p-6 md:p-10">
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          About Franko Labs
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          We don&apos;t build websites. We build business systems.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-dim">
          Franko Labs is a technology company that builds software while
          delivering premium digital services. Every client project makes our
          software better; every software improvement makes our services
          better. That loop is the whole company.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-edge bg-surface-2/65 p-6">
            <Briefcase className="size-7 text-ink-dim" strokeWidth={1.75} />
            <h3 className="mt-4 text-lg font-medium">The Agency</h3>
            <p className="mt-2 text-base leading-relaxed text-ink-dim">
              Websites, CRM, automation, SEO, ads, branding and marketing —
              premium services delivered as connected modules, and the
              real-world testing ground for everything we build.
            </p>
          </div>
          <div className="rounded-2xl border border-edge bg-surface-2/65 p-6">
            <LogoMark className="h-7 w-auto" />
            <h3 className="mt-4 text-lg font-medium">Franko OS</h3>
            <p className="mt-2 text-base leading-relaxed text-ink-dim">
              The operating system that powers Franko Labs — and eventually
              other businesses. One place for your site, leads, billing,
              analytics and automations.
            </p>
          </div>
        </div>

        <h3 className="mt-12 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Our roadmap
        </h3>
        <div className="mt-3 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/65">
          {roadmap.map((r, i) => (
            <div key={r.step} className="flex items-center gap-4 p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-edge text-xs text-ink-faint">
                {r.status === "installing" ? (
                  <Check className="size-4 text-accent" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-[15px] ${
                  r.status === "installing"
                    ? "font-medium"
                    : "text-ink-dim"
                }`}
              >
                {r.step}
              </span>
              <span
                className={`ml-auto flex items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-xs ${
                  r.status === "installing" ? "text-accent" : "text-ink-faint"
                }`}
              >
                {r.status === "installing" && (
                  <span className="status-dot size-1.5 rounded-full bg-accent" />
                )}
                {r.status === "installing" ? "in progress" : "up next"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-accent-dim/50 p-6">
          <p className="text-lg font-medium">
            Want to be part of the early chapter?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Get in touch
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </Window>
  );
}
