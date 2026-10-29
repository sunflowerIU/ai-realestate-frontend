"use client";

import { useState } from "react";
import { PropertyMap } from "./property-map";
import type { Coordinates } from "./property-coordinates";

export function PropertyLocationField({ position, onChange }: {
  position: Coordinates | null;
  onChange: (position: Coordinates | null) => void;
}) {
  const [enabled, setEnabled] = useState(() => Boolean(position));

  return <div className="form-field rounded-lg border border-[var(--app-border)] bg-[var(--app-soft)] p-4">
    <label className="!mb-0 !flex cursor-pointer items-center gap-2.5" htmlFor="property-map-enabled">
      <input id="property-map-enabled" className="size-4 accent-[var(--app-accent)]" type="checkbox" checked={enabled} onChange={(event) => {
        setEnabled(event.target.checked);
        if (!event.target.checked) onChange(null);
      }} />
      Add map location (optional)
    </label>
    {!enabled && <p className="field-hint mt-2">Turn this on to choose the property location on a map.</p>}
    {enabled && <div className="mt-3">
      <p className="field-hint mb-3">Click the map to pin the property. The map starts in Kathmandu; that starting point is not saved until you choose a location.</p>
      <PropertyMap position={position} onSelect={onChange} />
      <p className="field-hint mt-2">{position ? `Selected: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}` : "No location selected yet."}</p>
    </div>}
  </div>;
}
