"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KATHMANDU, type Coordinates } from "./property-coordinates";

const pinIcon = L.divIcon({
  className: "property-map-pin",
  html: '<svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M20 46S3 27.8 3 19a17 17 0 1 1 34 0c0 8.8-17 27-17 27Z" fill="#2859e6" stroke="white" stroke-width="3"/><circle cx="20" cy="19" r="6" fill="white"/></svg>',
  iconSize: [40, 48],
  iconAnchor: [20, 46],
});

export default function PropertyMapLeaflet({ position, defaultCenter, onSelect, large = false }: {
  position: Coordinates | null;
  defaultCenter?: Coordinates | null;
  onSelect?: (position: Coordinates) => void;
  large?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const userMovedRef = useRef(false);
  const [initialView] = useState(() => ({ center: position ?? defaultCenter ?? KATHMANDU, zoom: position ? 16 : defaultCenter ? 15 : 13 }));

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: [initialView.center.latitude, initialView.center.longitude],
      zoom: initialView.zoom,
      scrollWheelZoom: large,
    });
    mapRef.current = map;
    map.on("dragstart", () => { userMovedRef.current = true; });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    const container = containerRef.current;
    let touchStart: { id: number; x: number; y: number } | null = null;
    let activeTouches = 0;
    let lastTouchSelection = 0;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      activeTouches += 1;
      touchStart = activeTouches === 1 ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      activeTouches = Math.max(0, activeTouches - 1);
      if (!touchStart || event.pointerId !== touchStart.id) return;
      const moved = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y);
      touchStart = null;
      const bounds = container.getBoundingClientRect();
      if (moved > 12 || activeTouches > 0 || !onSelectRef.current ||
        event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom ||
        (event.target as Element).closest(".property-map-pin, .leaflet-control")) return;
      lastTouchSelection = Date.now();
      const point = map.mouseEventToLatLng(event);
      onSelectRef.current({ latitude: point.lat, longitude: point.lng });
    };
    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      activeTouches = Math.max(0, activeTouches - 1);
      touchStart = null;
    };
    container.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("pointercancel", handlePointerCancel, true);
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (Date.now() - lastTouchSelection < 700) return;
      onSelectRef.current?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });
    const animationFrame = requestAnimationFrame(() => map.invalidateSize());
    return () => {
      cancelAnimationFrame(animationFrame);
      container.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointerup", handlePointerUp, true);
      document.removeEventListener("pointercancel", handlePointerCancel, true);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [initialView, large]);

  useEffect(() => {
    if (!defaultCenter || position || !mapRef.current || userMovedRef.current) return;
    mapRef.current.setView([defaultCenter.latitude, defaultCenter.longitude], 15);
  }, [defaultCenter, position]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!position) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const point: L.LatLngExpression = [position.latitude, position.longitude];
    if (markerRef.current) {
      markerRef.current.setLatLng(point);
      if (onSelect) markerRef.current.dragging?.enable();
      else markerRef.current.dragging?.disable();
    }
    else {
      const marker = L.marker(point, { icon: pinIcon, draggable: Boolean(onSelect), autoPan: true }).addTo(map);
      marker.on("dragend", () => {
        const location = marker.getLatLng();
        onSelectRef.current?.({ latitude: location.lat, longitude: location.lng });
      });
      markerRef.current = marker;
    }
  }, [position, onSelect]);

  return <div ref={containerRef} className={large ? "h-full min-h-[300px] w-full rounded-md" : "h-[290px] w-full rounded-md"} aria-label={onSelect ? "Choose property location on map" : "Property location map"} />;
}
