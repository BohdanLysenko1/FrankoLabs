import type { Metadata } from "next";
import Link from "next/link";
import { Hexagon, ArrowRight, ChevronRight } from "lucide-react";
import Window from "@/components/os/Window";
import { productModules, statusStyle } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Franko OS — the operating system that powers Franko Labs and, eventually, your business. CRM, client portal, billing, hosting and more in one platform.",
};

export default function ProductsPage() {
  return (
    <Window title="Products" path="~/products" size="lg">
      <div className="p-6 md:p-10">
        {/* Installed application header */}
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-edge bg-surface-2/50 p-6">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-edge bg-surface-3">
            <Hexagon className="size-10 text-accent" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Franko OS
              </h2>
              <span className="rounded-full border border-edge px-2.5 py-1 text-xs text-ink-dim">
                early access
              </span>
            </div>
            <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-ink-dim">
              The operating system for running a business. Currently powering
              Franko Labs itself — launching as a standalone platform.
            </p>
          </div>
          <Link
            href="/contact?type=waitlist"
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Join the waitlist
            <ArrowRight className="size-5" />
          </Link>
        </div>

        <p className="mt-10 text-xs font-medium uppercase tracking-widest text-ink-faint">
          Inside Franko OS
        </p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-dim">
          Every module below is being battle-tested on real agency work before
          it ships. The agency is the testing ground; the product is the
          result. Open a module to see what it does.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {productModules.map((m) => {
            const s = statusStyle[m.status];
            return (
              <Link
                key={m.slug}
                href={`/products/${m.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-edge bg-surface-2/40 p-4 transition hover:border-edge-strong hover:bg-surface-2/70"
              >
                <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
                <span className="truncate text-[15px] font-medium">
                  {m.name}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-ink-faint">
                  {s.label}
                  <ChevronRight className="size-3.5 opacity-0 transition group-hover:opacity-100 group-hover:text-accent" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-edge bg-surface-2/40 p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
            Why it exists
          </p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
            Most businesses run on a patchwork of disconnected tools — a
            website here, a CRM there, invoices somewhere else. Franko OS
            connects all of it: your site, your leads, your billing, your
            analytics and your automations live in one place and talk to each
            other. Everything your business needs, one connected system.
          </p>
        </div>
      </div>
    </Window>
  );
}
