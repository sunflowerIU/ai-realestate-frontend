export function ParcelVisual() {
  return <div className="parcel-visual" aria-label="Illustration of a property parcel connected to an agent's working notes" role="img">
    <div className="visual-grid" />
    <div className="visual-topline"><span>FIELD NOTE / 01</span><span>KATHMANDU VALLEY</span></div>
    <svg className="parcel-svg" viewBox="0 0 640 530" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <path className="survey-dash" d="M20 130 L620 130 M96 25 L96 505 M528 25 L528 505 M20 408 L620 408" />
      <path className="survey-road" d="M8 405 C154 358 265 387 349 310 C430 236 550 240 634 190" />
      <path className="parcel-outline" d="M156 119 L453 75 L554 222 L423 409 L173 371 Z" />
      <path className="parcel-inner" d="M156 119 L330 230 L173 371 M330 230 L453 75 M330 230 L423 409 M330 230 L554 222" />
      <circle cx="330" cy="230" r="5" fill="currentColor" />
      <circle cx="156" cy="119" r="4" fill="currentColor" />
      <circle cx="423" cy="409" r="4" fill="currentColor" />
      <path className="north-mark" d="M565 48 L565 86 M557 60 L565 48 L573 60" />
      <text x="558" y="104" className="north-text">N</text>
      <text x="196" y="201" className="plot-label">01</text><text x="375" y="151" className="plot-label">02</text><text x="425" y="320" className="plot-label">03</text>
    </svg>
    <div className="map-badge badge-one"><span className="badge-dot" /> PROPERTY FILE <strong>01 / 03</strong></div>
    <div className="map-note"><span>FROM NOTEBOOK TO NEXT STEP</span><strong>Every detail,<br />in its place.</strong><i>⌁</i></div>
    <div className="visual-bottomline"><span>35° / SURVEY LINES</span><span>PRIVATE AGENT RECORD</span></div>
  </div>;
}
