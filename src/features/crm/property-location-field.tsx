"use client";

import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyMapDialog } from "./property-map-dialog";
import { propertyCoordinates, type Coordinates } from "./property-coordinates";

export function PropertyLocationField({ position, onChange, useCurrentLocation = false }: {
  position: Coordinates | null;
  onChange: (position: Coordinates | null) => void;
  useCurrentLocation?: boolean;
}) {
  const [enabled, setEnabled] = useState(() => Boolean(position));
  const [mapOpen, setMapOpen] = useState(false);
  const [defaultCenter, setDefaultCenter] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<"searching" | "nearby" | "kathmandu">("kathmandu");
  const locationRequested = useRef(false);

  function openMap() {
    setMapOpen(true);
    if (!useCurrentLocation || position || locationRequested.current) return;
    locationRequested.current = true;
    if (!navigator.geolocation) return;
    setLocationStatus("searching");
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const center = propertyCoordinates(coords.latitude, coords.longitude);
          if (center) {
            setDefaultCenter(center);
            setLocationStatus("nearby");
          } else setLocationStatus("kathmandu");
        },
        () => setLocationStatus("kathmandu"),
        { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
      );
    } catch {
      setLocationStatus("kathmandu");
    }
  }

  return <div className="form-field rounded-lg border border-[var(--app-border)] bg-[var(--app-soft)] p-4">
    <label className="!mb-0 !flex cursor-pointer items-center gap-2.5" htmlFor="property-map-enabled">
      <input id="property-map-enabled" className="size-4 accent-[var(--app-accent)]" type="checkbox" checked={enabled} onChange={(event) => {
        setEnabled(event.target.checked);
        if (event.target.checked) openMap();
        else onChange(null);
      }} />
      Add map location (optional)
    </label>
    {!enabled && <p className="field-hint mt-2">Turn this on to choose the property location on a map.</p>}
    {enabled && <div className="mt-3">
      <Button type="button" variant="outline" onClick={openMap}><MapPin size={16} /> {position ? "Change map location" : "Choose map location"}</Button>
      <p className="field-hint mt-2">{position ? `Selected: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}` : "No location selected yet."}</p>
    </div>}
    <PropertyMapDialog open={mapOpen} onOpenChange={setMapOpen} position={position} defaultCenter={defaultCenter} locationStatus={useCurrentLocation && !position ? locationStatus : undefined} onSelect={onChange} />
  </div>;
}
