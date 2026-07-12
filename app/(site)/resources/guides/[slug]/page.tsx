import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import Window from "@/components/os/Window";
import { getGuide, guides } from "@/lib/guides";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.title,
    description: guide.description,
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const others = guides.filter((g) => g.slug !== guide.slug).slice(0, 2);

  return (
    <Window title={guide.title} path={`~/resources/guides/${guide.slug}`} size="md">
      <div className="p-6 md:p-10">
        <Link
          href="/resources/guides"
          className="inline-flex items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          All guides
        </Link>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink-faint">
          <span className="flex items-center gap-1.5 rounded-full border border-edge px-2.5 py-1">
            <span className="size-1.5 rounded-full bg-accent" />
            {guide.category}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {guide.readTime} read
          </span>
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          {guide.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
          {guide.description}
        </p>

        <div className="mt-10 space-y-10">
          {guide.sections.map((s) => (
            <section key={s.heading}>
              <h3 className="text-lg font-medium">{s.heading}</h3>
              {s.body && (
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-dim">
                  {s.body}
                </p>
              )}
              {s.bullets && (
                <ul className="mt-3 space-y-2.5">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent-dim">
                        <Check className="size-2.5 text-accent" strokeWidth={2.5} />
                      </span>
                      <span className="text-base leading-relaxed text-ink-dim">
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-accent-dim/50 p-6">
          <div>
            <p className="text-lg font-medium">
              Want this handled for you instead?
            </p>
            <p className="mt-1 text-base text-ink-dim">
              Book a free consultation — we&apos;ll tell you what to fix first,
              pitch-free.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Book a consultation
            <ArrowRight className="size-5" />
          </Link>
        </div>

        {others.length > 0 && (
          <>
            <p className="mt-10 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
              Keep reading
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {others.map((g) => (
                <Link
                  key={g.slug}
                  href={`/resources/guides/${g.slug}`}
                  className="group rounded-xl border border-edge bg-surface-2/65 p-5 transition hover:border-edge-strong hover:bg-surface-2/70"
                >
                  <p className="text-[15px] font-medium transition group-hover:text-accent">
                    {g.title}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-faint">
                    <Clock className="size-3.5" />
                    {g.readTime}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Window>
  );
}
