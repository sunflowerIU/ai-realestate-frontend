"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KATHMANDU, type Coordinates } from "./property-coordinates";

export default function PropertyMapLeaflet({ position, onSelect }: {
  position: Coordinates | null;
  onSelect?: (position: Coordinates) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const [initialView] = useState(() => ({ center: position ?? KATHMANDU, zoom: position ? 16 : 13 }));

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: [initialView.center.latitude, initialView.center.longitude],
      zoom: initialView.zoom,
      scrollWheelZoom: false,
    });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (event: L.LeafletMouseEvent) => {
      onSelectRef.current?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    });
    const animationFrame = requestAnimationFrame(() => map.invalidateSize());
    return () => {
      cancelAnimationFrame(animationFrame);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [initialView]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!position) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const point: L.LatLngExpression = [position.latitude, position.longitude];
    if (markerRef.current) markerRef.current.setLatLng(point);
    else markerRef.current = L.circleMarker(point, {
      radius: 9,
      color: "#fff",
      weight: 3,
      fillColor: "#2859e6",
      fillOpacity: 1,
    }).addTo(map);
  }, [position]);

  return <div ref={containerRef} className="h-[290px] w-full rounded-md" aria-label={onSelect ? "Choose property location on map" : "Property location map"} />;
}
