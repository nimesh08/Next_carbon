import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  "Vichada, Colombia": [4.4234, -69.2878],
  "Accra, Ghana": [5.6037, -0.187],
  "Lempira, Honduras": [14.5833, -88.5833],
  "West Bengal, India": [21.9497, 89.1833],
  "Sydney, Australia": [-33.8688, 151.2093],
  "Pune, Maharashtra": [18.5204, 73.8567],
  "Mumbai": [19.076, 72.8777],
  "New York, United States": [40.7128, -74.006],
  "London, United Kingdom": [51.5074, -0.1278],
};

function getCoords(location: string, lat?: number, lng?: number): [number, number] | null {
  if (lat && lng && lat !== 0 && lng !== 0) return [lat, lng];
  for (const [key, coords] of Object.entries(locationCoords)) {
    if (location.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(location.toLowerCase())) {
      return coords;
    }
  }
  return null;
}

const Mapbox: React.FC<MapboxProps> = ({ properties }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Guard against container already having a Leaflet instance
    const container = mapContainerRef.current as any;
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);

    mapRef.current = map;

    const markers: L.Marker[] = [];

    properties.forEach((property) => {
      const coords = getCoords(property.location, property.latitude, property.longitude);
      if (!coords) return;

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            background: #000; color: #fff; padding: 6px 10px;
            border-radius: 8px; font-size: 12px; font-weight: 600;
            white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transform: translate(-50%, -100%); position: relative;
          ">
            ${property.propertyName}
            ${property.yourShares ? `<br/><span style="font-weight:400;opacity:0.8">${property.yourShares} shares</span>` : ""}
            <div style="
              position: absolute; bottom: -6px; left: 50%;
              transform: translateX(-50%);
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid #000;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker(coords, { icon }).addTo(map);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 5 });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [properties]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-xl" style={{ background: "#f8f8f8" }} />;
};

export default Mapbox;
