import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/shared/brand";

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-inner"><div><Brand light /><p>Turn the records you have into the opportunities you can see.</p></div><div className="footer-links"><Link href="/contact">Request access <ArrowUpRight size={15}/></Link><Link href="/login">Agent login <ArrowUpRight size={15}/></Link><a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || "amittamang421@gmail.com"}`}>Contact <ArrowUpRight size={15}/></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Copy Kalam</span><span>Made for real estate agents in Nepal.</span></div></footer>;
}
