import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, FileSpreadsheet, MessageSquareText, Search, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

const steps = [
  { number: "01", title: "Bring your records", text: "Start with the buyer and property information you already keep in Excel, or enter a new lead as it comes in.", icon: FileSpreadsheet },
  { number: "02", title: "Ask in your own words", text: "Describe what a client wants, like a house in Sitapaila within their budget. Search without memorizing filters.", icon: MessageSquareText },
  { number: "03", title: "Spot the right match", text: "See relevant properties and possible deals from the records you already have, then follow up with confidence.", icon: Sparkles },
];

function MatchPreview() {
  return (
    <div className="ck-preview" aria-label="Example of a buyer request matched with a property record">
      <div className="ck-preview-top">
        <span className="ck-preview-brand"><span className="ck-preview-mark">c<span>k</span></span> copy kalam <span className="ck-preview-divider">/</span> workspace</span>
        <span className="ck-preview-live"><i /> MATCH DESK</span>
      </div>
      <div className="ck-preview-body">
        <div className="ck-preview-kicker">YOUR RECORDS, CONNECTED</div>
        <h2>One request.<br /><span>A real possibility.</span></h2>
        <div className="ck-search-row"><Search size={18} strokeWidth={1.8} /><span>Find a house in Sitapaila under NPR 2 crore</span><span className="ck-search-enter">↵</span></div>
        <div className="ck-result-label"><span>RELEVANT RECORD</span><span>01 / 03</span></div>
        <div className="ck-result-card">
          <div className="ck-result-top"><span className="ck-result-tag"><i /> POSSIBLE MATCH</span><span>PROPERTY / 024</span></div>
          <div className="ck-result-content">
            <div><span className="ck-result-type">HOUSE FOR SALE</span><strong>Sitapaila, Kathmandu</strong><small>3 bedrooms <b>·</b> Road access <b>·</b> Owner listed</small></div>
            <div className="ck-result-price"><span>ASKING PRICE</span><strong>NPR 1.85 cr</strong></div>
          </div>
          <div className="ck-result-foot"><span><Check size={14} /> Area and budget align</span><ArrowUpRight size={18} /></div>
        </div>
        <p className="ck-preview-note">Product concept · AI search and matching in development</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="ck-site">
      <SiteHeader />
      <main>
        <section className="ck-hero" aria-labelledby="hero-title">
          <div className="ck-container ck-hero-grid">
            <div className="ck-hero-copy">
              <div className="ck-overline"><span className="ck-overline-rule" /> THE AGENT’S NEW ADVANTAGE <span className="ck-overline-index">01 / 04</span></div>
              <h1 id="hero-title">The right property is <span>already in your records.</span></h1>
              <p>Copy Kalam is being built to turn scattered buyer requests and property listings into matches worth calling about.</p>
              <div className="ck-hero-actions"><Link href="/contact" className="ck-button ck-button-blue">Request early access <ArrowUpRight size={18} /></Link><Link href="#how-it-works" className="ck-text-link">See how it works <ArrowRight size={17} /></Link></div>
              <div className="ck-hero-bottom"><span className="ck-blue-dot" /> BUILT FOR REAL ESTATE AGENTS IN NEPAL</div>
            </div>
            <MatchPreview />
          </div>
          <div className="ck-hero-edge" aria-hidden="true">COPY / KALAM &nbsp;—&nbsp; YOUR DATA, WORKING HARDER</div>
        </section>

        <section className="ck-ticker" aria-label="What Copy Kalam connects"><div className="ck-container ck-ticker-inner"><span>BUYERS</span><span className="ck-ticker-plus">+</span><span>SELLERS</span><span className="ck-ticker-plus">+</span><span>YOUR EXISTING DATA</span><ArrowDownRight size={23} /></div></section>

        <section className="ck-problem ck-container" id="why-copy-kalam">
          <div className="ck-section-label"><span>01</span> THE PROBLEM</div>
          <div className="ck-problem-main">
            <h2>Good deals get lost<br />between <span>rows and recollection.</span></h2>
            <div className="ck-problem-layout">
              <p>A buyer calls about a house in Sitapaila. Somewhere in your spreadsheet, an owner has one to sell. When the records don’t connect, the opportunity disappears.</p>
              <div className="ck-notes" aria-label="Example buyer and seller records">
                <div className="ck-note"><span>BUYER NOTE / 14:32</span><strong>“Looking for a house in Sitapaila. Around 2 crore.”</strong><small>Saved in one place</small></div>
                <div className="ck-note-connector"><span /><i /><span /></div>
                <div className="ck-note"><span>OWNER NOTE / LAST TUESDAY</span><strong>“Selling my house near Sitapaila chowk.”</strong><small>Saved somewhere else</small></div>
              </div>
            </div>
          </div>
        </section>

        <section className="ck-solution" id="how-it-works"><div className="ck-container">
          <div className="ck-section-label ck-section-label-light"><span>02</span> THE WORKFLOW WE’RE BUILDING</div>
          <div className="ck-solution-heading"><h2>Your entire business,<br /><span>finally in conversation.</span></h2><p>The goal is to bring scattered records together so you spend less time digging and more time making the right introduction.</p></div>
          <div className="ck-steps">{steps.map(({ number, title, text, icon: Icon }) => <article className="ck-step" key={number}><div className="ck-step-top"><span>{number} / 03</span><Icon size={25} strokeWidth={1.5} /></div><h3>{title}</h3><p>{text}</p><ArrowUpRight size={19} className="ck-step-arrow" /></article>)}</div>
        </div></section>

        <section className="ck-search-story ck-container" id="possibilities">
          <div className="ck-section-label"><span>03</span> THE POSSIBILITIES</div>
          <div className="ck-story-grid">
            <div><h2>Ask naturally.<br /><span>Act intelligently.</span></h2><p>Planned AI search will let you ask your database questions in plain language, see relevant properties, and notice possible deals before they go cold.</p><Link href="/contact" className="ck-text-link">Get in touch <ArrowUpRight size={18} /></Link></div>
            <div className="ck-query-board" aria-label="Example natural language property searches"><div className="ck-query-heading"><span>TRY A QUESTION</span><Search size={18} /></div><div className="ck-query-line"><span>01</span> Show me buyers looking in Kathmandu</div><div className="ck-query-line"><span>02</span> Which properties fit a 2 crore budget?</div><div className="ck-query-line"><span>03</span> Any possible matches in Sitapaila?</div><div className="ck-query-foot">YOUR RECORDS HAVE ANSWERS. COPY KALAM HELPS YOU FIND THEM.</div></div>
          </div>
        </section>

        <section className="ck-cta"><div className="ck-container ck-cta-grid"><div className="ck-section-label ck-section-label-light"><span>04</span> WHAT’S NEXT</div><div><h2>More matches.<br />Fewer missed chances.</h2><p>Bring your buyers, listings, and local knowledge into one smarter workspace. Let’s talk about early access.</p><div className="ck-cta-actions"><Link href="/contact" className="ck-button ck-button-white">Request early access <ArrowUpRight size={18} /></Link><Link href="/login" className="ck-cta-login">Already have an account? Log in <ArrowRight size={17} /></Link></div></div></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}

