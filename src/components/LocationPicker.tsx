"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  // shown when no location has been picked yet — Raha's office, Madhapur, Hyderabad
  defaultCenter?: { lat: number; lng: number };
  height?: number;
}

const DEFAULT_CENTER = { lat: 17.4483, lng: 78.3915 };

export function LocationPicker({
  lat,
  lng,
  onChange,
  defaultCenter = DEFAULT_CENTER,
  height = 280,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  // keeps the click/drag handlers reading the latest onChange without
  // re-registering them (and without re-creating the map) on every render
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialise the map once, client-side only (Leaflet touches `window`)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");

      // Next.js/webpack breaks Leaflet's default marker icon path resolution —
      // point it at the CDN instead of fighting the bundler config for it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !containerRef.current || mapRef.current) return;

      const initialCenter = lat !== null && lng !== null ? { lat, lng } : defaultCenter;

      const map = L.map(containerRef.current).setView(
        [initialCenter.lat, initialCenter.lng],
        14
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialCenter.lat, initialCenter.lng], {
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        const { lat: clickedLat, lng: clickedLng } = e.latlng;
        marker.setLatLng([clickedLat, clickedLng]);
        onChangeRef.current(clickedLat, clickedLng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // map is created exactly once — lat/lng changes are handled by the
    // effect below instead of recreating the whole map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If lat/lng change from outside (e.g. the numeric inputs below the map,
  // or a lead being edited), move the marker without recreating the map.
  useEffect(() => {
    if (lat === null || lng === null || !markerRef.current || !mapRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.panTo([lat, lng]);
  }, [lat, lng]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full overflow-hidden rounded-xl border border-white/10"
      />
      <p className="mt-2 text-[12px] text-gray-500">
        Map pe click karo ya pin ko drag karo — coordinates neeche apne aap bhar jayenge.
      </p>
    </div>
  );
}