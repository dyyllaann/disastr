import React, { useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Ticket, Classification } from "../types";
import { TicketMarker } from "./TicketMarker";
import { StatusFilter } from "./StatusFilter";
import { TicketCard } from "./TicketCard";
import { WeatherAlertLayer } from "./WeatherAlertLayer";
import { FloodZoneLayer } from "./FloodZoneLayer";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";

interface Props {
  tickets: Ticket[];
  loading?: boolean;
}

/** Default map center — Washington State */
const DEFAULT_CENTER: [number, number] = [47.5112, -120.7401];
const DEFAULT_ZOOM = 7;

/** Invisible button to recenter the map — keyboard accessible */
function RecenterButton() {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)}
      aria-label="Recenter map to default view"
      className="absolute bottom-24 right-3 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-sm font-medium shadow-md backdrop-blur hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      ⌖ Recenter
    </button>
  );
}

export const Map: React.FC<Props> = ({ tickets, loading }) => {
  const [activeStatus, setActiveStatus] = useState<Ticket["status"] | "all">("all");
  const [activeClass, setActiveClass] = useState<Classification | "all">("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showFloodZones, setShowFloodZones] = useState(true);
  const { alerts, error: alertsError } = useWeatherAlerts("WA");

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (activeStatus !== "all" && t.status !== activeStatus) return false;
      if (activeClass !== "all" && t.classification !== activeClass) return false;
      return true;
    });
  }, [tickets, activeStatus, activeClass]);

  return (
    <div className="relative flex h-full w-full">
      {/* Map */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="h-full w-full"
        aria-label="Flood response map"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <ZoomControl position="bottomright" />
        <RecenterButton />

        {showFloodZones && <FloodZoneLayer />}
        <WeatherAlertLayer alerts={alerts} />

        {filtered.map((ticket) => (
          <TicketMarker
            key={ticket.id}
            ticket={ticket}
            onSelect={setSelected}
          />
        ))}
      </MapContainer>

      {/* Filter bar — overlaid top-left */}
      <div className="pointer-events-auto absolute left-3 top-3 z-[1000] max-w-[calc(100vw-1.5rem)]">
        <StatusFilter
          activeStatus={activeStatus}
          activeClass={activeClass}
          onStatusChange={setActiveStatus}
          onClassChange={setActiveClass}
        />
        {loading && (
          <p className="mt-2 rounded bg-white/80 px-2 py-1 text-xs text-gray-500 shadow backdrop-blur">
            Loading reports…
          </p>
        )}
        {alertsError && (
          <p className="mt-2 rounded bg-red-50 border border-red-200 px-2 py-1 text-xs text-red-600 shadow backdrop-blur">
            Could not load weather alerts
          </p>
        )}
        <p className="mt-1 rounded bg-white/70 px-2 py-1 text-xs text-gray-500 shadow backdrop-blur">
          {alerts.length} active alert{alerts.length !== 1 ? "s" : ""}
        </p>
        <p className="mt-1 rounded bg-white/70 px-2 py-1 text-xs text-gray-600 shadow backdrop-blur">
          {filtered.length} report{filtered.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowFloodZones((v) => !v)}
          className={`mt-1 rounded px-2 py-1 text-xs font-medium shadow backdrop-blur border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            showFloodZones
              ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
              : "bg-white/80 text-gray-600 border-gray-200 hover:bg-white"
          }`}
          aria-pressed={showFloodZones}
        >
          {showFloodZones ? "⬛ Hide" : "🟦 Show"} Flood Zones
        </button>
      </div>

      {/* Ticket detail panel — slides in from right */}
      {selected && (
        <div
          className="absolute right-0 top-0 z-[1000] h-full w-80 max-w-full border-l bg-white shadow-xl"
          role="complementary"
          aria-label="Selected ticket details"
        >
          <TicketCard ticket={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
};
