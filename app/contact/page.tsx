import type { Metadata } from "next";
import { Suspense } from "react";
import Window from "@/components/os/Window";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a consultation, request a website audit or join the Franko OS waitlist.",
};

export default function ContactPage() {
  return (
    <Window title="Contact" path="~/contact/new-request" size="md">
      <div className="p-6 md:p-10">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Get in touch
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Let&apos;s connect your system
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
          Tell us what you&apos;re working with — we reply within one business
          day. Consultations are free and pitch-free.
        </p>

        <div className="mt-8">
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </div>
      </div>
    </Window>
  );
}
