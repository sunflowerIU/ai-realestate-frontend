import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your private Copy Kalam workspace.",
};

export default function LoginPage() {
  return (
    <main className="entry-layout">
      <aside className="entry-art">
        <Brand light />
        <div className="entry-art-content">
          <span>PRIVATE ACCESS / 01</span>
          <h2>
            Your work is
            <br />
            <em>waiting here.</em>
          </h2>
          <p>
            A dedicated place for the relationships and details you carry from
            one conversation to the next.
          </p>
        </div>
        <div className="entry-art-foot">
          COPY KALAM <span>◌</span> NEPAL
        </div>
      </aside>
      <section className="entry-main">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="entry-content">
          <div className="eyebrow">
            <span className="eyebrow-line" /> WELCOME BACK
          </div>
          <h1>
            Sign in<span className="heading-period">.</span>
          </h1>
          <p className="entry-intro">
            Use the credentials provided for your account.
          </p>
          <LoginForm />
          <p className="entry-footnote">
            Need an agent account?{" "}
            <Link href="/contact">
              Request access <span aria-hidden="true">↗</span>
            </Link>
          </p>
        </div>
        <p className="entry-bottom">
          Private access for agents and platform administrators.
        </p>
      </section>
    </main>
  );
}
