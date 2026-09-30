/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";

import { signalHex, signalLevel } from "@/lib/jannexus-format";

export type MapPoint = {
  id: string;
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  score: number;
  kind?: "cluster" | "project" | "asset";
};

declare global {
  interface Window {
    __jannexusMapsReady?: () => void;
    google?: any;
  }
}

let loaderPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
    if (!key) {
      reject(new Error("Map key unavailable"));
      return;
    }
    window.__jannexusMapsReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__jannexusMapsReady&channel=${channel}`;
    script.async = true;
    script.onerror = () => reject(new Error("Map failed to load"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

const darkStyle = [
  { elementType: "geometry", stylers: [{ color: "#1b2230" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9aa4b5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141a25" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b3446" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8b95a7" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#101724" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#3b465c" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1f2735" }] },
];

export default function DemandMapClient({
  points,
  onSelect,
  className,
}: {
  points: MapPoint[];
  onSelect?: ((id: string) => void) | undefined;
  className?: string | undefined;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = window.google;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: 18.5204, lng: 73.8567 },
          zoom: 9,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          styles: darkStyle,
          backgroundColor: "#141a25",
        });
        infoRef.current = new google.maps.InfoWindow();
        setReady(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = window.google;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => {
      const level = signalLevel(point.score);
      const isCluster = (point.kind ?? "cluster") === "cluster";
      const color = isCluster ? signalHex[level] : point.kind === "project" ? "#5ec8d8" : "#a08ee0";
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: mapRef.current,
        title: point.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isCluster ? 7 + (point.score / 100) * 9 : 5,
          fillColor: color,
          fillOpacity: isCluster ? 0.85 : 0.75,
          strokeColor: "#0e1420",
          strokeWeight: 1.5,
        },
      });
      marker.addListener("click", () => {
        infoRef.current?.setContent(
          `<div style="font-family:'IBM Plex Sans',sans-serif;color:#10161f;max-width:240px">
             <strong style="font-size:13px">${point.title}</strong>
             <div style="font-size:12px;margin-top:4px;color:#3d4757">${point.subtitle ?? ""}</div>
           </div>`,
        );
        infoRef.current?.open({ anchor: marker, map: mapRef.current });
        onSelect?.(point.id);
      });
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (points.length > 1) mapRef.current.fitBounds(bounds, 64);
    else if (points.length === 1) {
      mapRef.current.setCenter({ lat: points[0]!.lat, lng: points[0]!.lng });
      mapRef.current.setZoom(12);
    }
  }, [ready, points, onSelect]);

  if (error) {
    return (
      <div className={className}>
        <div className="grid h-full place-items-center rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          The map could not load right now. Cluster data is still available in the lists below.
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
