import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/supabase";

interface Property {
  name: string;
  id: number;
  type: string;
  price: number;
  status: string;
  available_shares: number;
  propertyName: string;
  location: string;
  yourShares: number;
  latitude?: number;
  longitude?: number;
}

interface MapboxProps {
  properties: Property[];
}

const locationCoords: Record<string, [number, number]> = {
  "Ceará, Brazil": [-5.4984, -39.3206],
  "Ceara, Brazil": [-5.4984, -39.3206],
  "Vichada, Colombia": [4.4234, -69.2878],
  "Accra, Ghana": [5.6037, -0.187],
  "Lempira, Honduras": [14.5833, -88.5833],
  "West Bengal, India": [21.9497, 89.1833],
  "Nakuru, Kenya": [-0.3031, 36.08],
  "Central Kalimantan, Indonesia": [-1.6815, 113.3824],
  "Inverness, Scotland": [57.4778, -4.2247],
  "Amazonas, Brazil": [-3.119, -60.0217],
  "Mahajanga, Madagascar": [-15.7167, 46.3167],
  "Monteverde, Costa Rica": [10.3155, -84.829],
  "Hanoi, Vietnam": [21.0285, 105.8542],
  "Sydney, Australia": [-33.8688, 151.2093],
  "Pune, Maharashtra": [18.5204, 73.8567],
  "Mumbai": [19.076, 72.8777],
  "New York, United States": [40.7128, -74.006],
  "London, United Kingdom": [51.5074, -0.1278],
};

function normalizeStr(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getCoords(
  location: string,
  lat?: number,
  lng?: number
): [number, number] | null {
  if (lat && lng && lat !== 0 && lng !== 0) return [lat, lng];
  const norm = normalizeStr(location);
  for (const [key, coords] of Object.entries(locationCoords)) {
    const normKey = normalizeStr(key);
    if (norm.includes(normKey) || normKey.includes(norm)) {
      return coords;
    }
  }
  return null;
}

function dotHtml(owned: boolean, pulse: boolean): string {
  const color = owned ? "#10b981" : "#64748b";
  const ring = owned ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.15)";
  const size = owned ? 14 : 10;
  const ringSize = size + 10;
  return `
    <div style="position:relative;width:${ringSize}px;height:${ringSize}px;
      display:flex;align-items:center;justify-content:center;
      transform:translate(-50%,-50%);">
      <div style="position:absolute;width:${ringSize}px;height:${ringSize}px;
        border-radius:50%;background:${ring};
        ${pulse ? "animation:pulse 2s ease-in-out infinite;" : ""}"></div>
      <div style="width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);position:relative;z-index:1;"></div>
    </div>`;
}

const PULSE_CSS = `
<style>
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.4; }
}
</style>`;

const Mapbox: React.FC<MapboxProps> = ({ properties }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const container = mapContainerRef.current as any;
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    const styleTag = document.getElementById("mapbox-pulse-css");
    if (!styleTag) {
      const el = document.createElement("div");
      el.id = "mapbox-pulse-css";
      el.innerHTML = PULSE_CSS;
      document.head.appendChild(el.firstElementChild!);
    }

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { subdomains: "abc", maxZoom: 19 }
    ).addTo(map);

    mapRef.current = map;

    const ownedIds = new Set(properties.map((p) => String(p.id)));

    supabase
      .from("property_data")
      .select("id, name, location, type, totalShares, price")
      .then(({ data: allProjects }) => {
        const markers: L.Marker[] = [];

        (allProjects ?? []).forEach((proj: any) => {
          const coords = getCoords(proj.location);
          if (!coords) return;

          const owned = ownedIds.has(String(proj.id));
          const ownedProp = properties.find(
            (p) => String(p.id) === String(proj.id)
          );

          const icon = L.divIcon({
            className: "",
            html: dotHtml(owned, owned),
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker(coords, { icon }).addTo(map);

          const sharesLine =
            owned && ownedProp?.yourShares
              ? `<div style="color:#10b981;font-weight:600;margin-top:2px;">${ownedProp.yourShares} shares owned</div>`
              : "";

          marker.bindTooltip(
            `<div style="font-size:13px;line-height:1.4;">
              <div style="font-weight:700;">${proj.name}</div>
              <div style="color:#64748b;font-size:11px;">${proj.location} · ${proj.type}</div>
              <div style="font-size:11px;margin-top:2px;">$${proj.price}/share · ${(proj.totalShares ?? 0).toLocaleString()} total</div>
              ${sharesLine}
            </div>`,
            {
              direction: "top",
              offset: [0, -14],
              className: "map-tooltip-custom",
              opacity: 1,
            }
          );

          markers.push(marker);
        });

        if (markers.length > 0) {
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.4), { maxZoom: 3 });
        }
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [properties]);

  return (
    <>
      <style>{`
        .map-tooltip-custom {
          background: #fff !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 10px 14px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
          font-family: inherit !important;
        }
        .map-tooltip-custom::before {
          border-top-color: #fff !important;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-xl"
        style={{ background: "#f1f5f9" }}
      />
    </>
  );
};

export default Mapbox;
