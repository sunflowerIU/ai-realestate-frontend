"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyMapDialog } from "./property-map-dialog";
import type { Coordinates } from "./property-coordinates";

export function PropertyLocationField({ position, onChange }: {
  position: Coordinates | null;
  onChange: (position: Coordinates | null) => void;
}) {
  const [enabled, setEnabled] = useState(() => Boolean(position));
  const [mapOpen, setMapOpen] = useState(false);

  return <div className="form-field rounded-lg border border-[var(--app-border)] bg-[var(--app-soft)] p-4">
    <label className="!mb-0 !flex cursor-pointer items-center gap-2.5" htmlFor="property-map-enabled">
      <input id="property-map-enabled" className="size-4 accent-[var(--app-accent)]" type="checkbox" checked={enabled} onChange={(event) => {
        setEnabled(event.target.checked);
        if (event.target.checked) setMapOpen(true);
        else onChange(null);
      }} />
      Add map location (optional)
    </label>
    {!enabled && <p className="field-hint mt-2">Turn this on to choose the property location on a map.</p>}
    {enabled && <div className="mt-3">
      <Button type="button" variant="outline" onClick={() => setMapOpen(true)}><MapPin size={16} /> {position ? "Change map location" : "Choose map location"}</Button>
      <p className="field-hint mt-2">{position ? `Selected: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}` : "No location selected yet."}</p>
    </div>}
    <PropertyMapDialog open={mapOpen} onOpenChange={setMapOpen} position={position} onSelect={onChange} />
  </div>;
}
