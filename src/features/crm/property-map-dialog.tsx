"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Coordinates } from "./property-coordinates";
import { PropertyMap } from "./property-map";

export function PropertyMapDialog({ open, onOpenChange, position, defaultCenter, locationStatus, onSelect }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: Coordinates | null;
  defaultCenter?: Coordinates | null;
  locationStatus?: "searching" | "nearby" | "kathmandu";
  onSelect?: (position: Coordinates) => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="property-map-dialog" overlayClassName="property-map-overlay">
      <div className="border-b border-[var(--app-border)] px-6 py-5 pr-16 max-[580px]:px-4 max-[580px]:pr-14">
        <DialogTitle>{onSelect ? "Choose property location" : "Property location"}</DialogTitle>
        <DialogDescription>{onSelect
          ? `${locationStatus === "searching" ? "Finding your location. " : locationStatus === "nearby" ? "Map centered near your current location. " : locationStatus === "kathmandu" ? "Map starts in Kathmandu. " : ""}Tap or click the map to place the pin, then drag it to adjust. Scroll or pinch to zoom.`
          : "Scroll or pinch to zoom and explore the property location."}</DialogDescription>
      </div>
      <div className="property-map-dialog-map"><PropertyMap position={position} defaultCenter={defaultCenter} onSelect={onSelect} large /></div>
      <div className="flex min-h-16 items-center justify-between gap-4 border-t border-[var(--app-border)] px-6 py-3 max-[580px]:px-4">
        <span className="text-xs text-[var(--app-muted)]">{position ? `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}` : "No location selected yet"}</span>
        <Button type="button" onClick={() => onOpenChange(false)}>{onSelect ? "Done" : "Close map"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
