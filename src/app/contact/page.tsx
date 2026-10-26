import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { ContactForm } from "@/features/contact/contact-form";

export const metadata: Metadata = {
  title: "Request access",
  description:
    "Ask about a private Copy Kalam account for your real estate work.",
};

export default function ContactPage() {
  return (
    <main className="entry-layout contact-layout">
      <aside className="entry-art">
        <Brand light />
        <div className="entry-art-content">
          <span>LET’S BEGIN / 01</span>
          <h2>
            Better matches
            <br />
            <em>start with your records.</em>
          </h2>
          <p>
            Tell us a little about your real estate work. Account access is
            arranged directly, with no public sign-up.
          </p>
        </div>
        <div className="entry-art-foot">
          ONE AGENT <span>◌</span> ONE WORKSPACE
        </div>
      </aside>
      <section className="entry-main">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="entry-content">
          <div className="eyebrow">
            <span className="eyebrow-line" /> REQUEST AN ACCOUNT
          </div>
          <h1>
            Let’s talk<span className="heading-period">.</span>
          </h1>
          <p className="entry-intro">
            Share your details and we’ll prepare an email for you to send. We’ll
            follow up about access personally.
          </p>
          <ContactForm
            email={
              process.env.NEXT_PUBLIC_CONTACT_EMAIL || "amittamang421@gmail.com"
            }
          />
          <div className="direct-email">
            Prefer your own message?{" "}
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "amittamang421@gmail.com"}`}
            >
              Email us directly <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <p className="entry-bottom">
          Already have access? <Link href="/login">Agent login</Link>
        </p>
      </section>
    </main>
  );
}
