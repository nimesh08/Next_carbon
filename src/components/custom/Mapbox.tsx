import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapboxProps {
  location: [number, number];
  name: string;
}

function Mapbox(props: MapboxProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
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

    const map = L.map(mapContainerRef.current, {
      center: [props.location[0], props.location[1]],
      zoom: 10,
      minZoom: 4,
      maxZoom: 18,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { subdomains: "abc", maxZoom: 19 }
    ).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `
        <div style="
          background: #000; color: #fff; padding: 6px 12px;
          border-radius: 8px; font-size: 13px; font-weight: 600;
          white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: translate(-50%, -100%); position: relative;
        ">
          ${props.name}
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

    L.marker([props.location[0], props.location[1]], { icon }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [props.location, props.name]);

  return (
    <div
      style={{ height: "100%", borderRadius: "20px" }}
      ref={mapContainerRef}
      className="map-container"
    />
  );
}

export default Mapbox;
