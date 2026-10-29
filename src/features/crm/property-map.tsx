"use client";

import dynamic from "next/dynamic";
import type { Coordinates } from "./property-coordinates";

const LeafletMap = dynamic(() => import("./property-map-leaflet"), {
  ssr: false,
  loading: () => <div className="flex h-[290px] items-center justify-center rounded-md bg-[var(--app-soft)] text-xs text-[var(--app-muted)]">Loading map…</div>,
});

export function PropertyMap({ position, onSelect }: {
  position: Coordinates | null;
  onSelect?: (position: Coordinates) => void;
}) {
  return <LeafletMap position={position} onSelect={onSelect} />;
}
