import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return <header className="site-header"><div className="header-inner">
    <Brand />
    <nav className="desktop-nav" aria-label="Main navigation"><Link href="/#why-copy-kalam">The problem</Link><Link href="/#how-it-works">How it works</Link><Link href="/#possibilities">Possibilities</Link></nav>
    <div className="header-actions"><Link className="login-link" href="/login">Agent login</Link><Link className="header-cta" href="/contact">Request access <ArrowUpRight size={16} /></Link></div>
    <MobileNav />
  </div></header>;
}
