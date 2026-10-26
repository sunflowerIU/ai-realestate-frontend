import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return <Link className={`brand ${light ? "brand-light" : ""}`} href="/" aria-label="Copy Kalam home">
    <span className="brand-mark" aria-hidden="true"><span>c</span><span>k</span></span>
    <span>copy<span className="brand-italic">kalam</span><small>THE AGENT’S MATCH DESK</small></span>
  </Link>;
}
