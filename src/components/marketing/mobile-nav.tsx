"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return <div className="mobile-nav">
    <button className="mobile-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
    {open && <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation">
      <Link onClick={() => setOpen(false)} href="/#why-copy-kalam">The problem</Link>
      <Link onClick={() => setOpen(false)} href="/#how-it-works">How it works</Link>
      <Link onClick={() => setOpen(false)} href="/#possibilities">Possibilities</Link>
      <Link onClick={() => setOpen(false)} href="/login">Agent login</Link>
      <Link className="mobile-request" onClick={() => setOpen(false)} href="/contact">Request access <ArrowUpRight size={17} /></Link>
    </nav>}
  </div>;
}
