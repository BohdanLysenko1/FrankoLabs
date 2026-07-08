import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Window from "@/components/os/Window";
import ProductPreview from "@/components/products/ProductPreview";
import {
  getProductModule,
  productModules,
  statusStyle,
} from "@/lib/products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return productModules.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mod = getProductModule(slug);
  if (!mod) return { title: "Module not found" };
  return {
    title: mod.name,
    description: mod.tagline,
  };
}

export default async function ProductModulePage({ params }: Props) {
  const { slug } = await params;
  const mod = getProductModule(slug);
  if (!mod) notFound();

  const s = statusStyle[mod.status];
  const related = mod.worksWith
    .map((w) => getProductModule(w))
    .filter((m) => m !== undefined);

  return (
    <Window title={mod.name} path={`~/products/${mod.slug}`} size="lg">
      <div className="p-6 md:p-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          All modules
        </Link>

        {/* Module header */}
        <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl border border-edge bg-surface-2/50 p-6">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-edge bg-surface-3">
            <mod.icon className="size-10 text-accent" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                {mod.name}
              </h2>
              <span className="flex items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-xs text-ink-dim">
                <span className={`size-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </span>
            </div>
            <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-ink-dim">
              {mod.tagline}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <ProductPreview slug={mod.slug} name={mod.name} />
            {mod.liveUrl ? (
              <a
                href={mod.liveUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
              >
                Launch {mod.name}
                <ArrowUpRight className="size-5" />
              </a>
            ) : (
              <Link
                href="/contact?type=waitlist"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
              >
                Join the waitlist
                <ArrowRight className="size-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Overview */}
        <p className="mt-10 text-xs font-medium uppercase tracking-widest text-ink-faint">
          Overview
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
          {mod.overview}
        </p>

        {/* Features */}
        <p className="mt-10 text-xs font-medium uppercase tracking-widest text-ink-faint">
          What it does
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {mod.features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-edge bg-surface-2/40 p-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-dim">
                  <Check className="size-3 text-accent" strokeWidth={2.5} />
                </span>
                <h3 className="text-[15px] font-medium">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* Works with */}
        {related.length > 0 && (
          <>
            <p className="mt-10 text-xs font-medium uppercase tracking-widest text-ink-faint">
              Works with
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/products/${r.slug}`}
                  className="group flex items-center gap-2 rounded-xl border border-edge bg-surface-2/40 px-3.5 py-2.5 transition hover:border-edge-strong hover:bg-surface-2/70"
                >
                  <r.icon
                    className="size-4 text-ink-dim transition group-hover:text-accent"
                    strokeWidth={1.75}
                  />
                  <span className="text-sm font-medium">{r.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-accent-dim/50 p-6">
          <div>
            <p className="text-lg font-medium">
              Want {mod.name} running your business?
            </p>
            <p className="mt-1 text-[15px] text-ink-dim">
              {mod.liveUrl
                ? `${mod.name} is live in early access — open the app and try it with sample data, no signup needed.`
                : "Franko OS is in early access — join the waitlist and we'll reach out as modules go live."}
            </p>
          </div>
          {mod.liveUrl ? (
            <a
              href={mod.liveUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
            >
              Launch {mod.name}
              <ArrowUpRight className="size-5" />
            </a>
          ) : (
            <Link
              href="/contact?type=waitlist"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
            >
              Join the waitlist
              <ArrowRight className="size-5" />
            </Link>
          )}
        </div>
      </div>
    </Window>
  );
}
