import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { WeatherAlertLayer } from "./WeatherAlertLayer";
import { FloodZoneLayer } from "./FloodZoneLayer";
import { FloodSimulatorLayer } from "./FloodSimulatorLayer";
import { useWeatherAlerts } from "../hooks/useWeatherAlerts";

interface Props {
  // Keeping the tickets prop signature so MapPage.tsx doesn't break,
  // but we are no longer rendering them on the map.
  tickets?: any;
  loading?: boolean;
}

const DEFAULT_CENTER: [number, number] = [47.5112, -120.7401];
const DEFAULT_ZOOM = 7;

function RecenterButton() {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)}
      aria-label="Recenter map to default view"
      className="absolute bottom-6 right-3 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-black shadow-md backdrop-blur hover:bg-white focus:outline-none"
    >
      ⌖ Recenter
    </button>
  );
}

export const Map: React.FC<Props> = () => {
  const [elevationThreshold, setElevationThreshold] = useState<number>(340);
  const { alerts, loading, error: alertsError } = useWeatherAlerts("WA");

  return (
    <div className="flex h-full w-full">
      {/* Sidebar - 20% width, dark grey, 0 margins/padding */}
      <div className="h-full w-1/3 bg-[#111] overflow-y-auto text-white m-0 p-0 flex flex-col">
        <div className="p-4 bg-[#1a1a1a]">
          <h2 className="text-xl font-bold text-white mb-4">Flood Warnings</h2>

          <div className="mb-2">
            <label className="text-sm font-semibold text-gray-300 flex justify-between">
              <span>Water Level Sim</span>
              <span>{elevationThreshold}m</span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="5"
              value={elevationThreshold}
              onChange={(e) => setElevationThreshold(Number(e.target.value))}
              className="mt-1 w-full accent-blue-500 cursor-pointer"
              title="Drag to simulate rising water levels"
            />
          </div>

          {loading && (
            <div className="mt-4 p-4 border border-blue-500/30 bg-blue-900/20 rounded-lg mx-2">
              <p className="text-sm text-blue-300 font-semibold animate-pulse">
                Fetching live NWS data...
              </p>
            </div>
          )}
          {alertsError && <p className="text-sm text-red-400 mt-2">Error loading alerts</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {alerts.length === 0 && !loading && (
            <p className="p-2 text-gray-400">No active alerts ✅</p>
          )}
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-[#222] p-3 mb-3 rounded-lg">
              <h4 className="font-semibold text-lg text-red-400 mb-1 leading-tight">{alert.event}</h4>
              <p className="text-sm text-gray-300 mt-1"><b>Severity:</b> {alert.severity}</p>
              <p className="text-sm text-gray-300"><b>Urgency:</b> {alert.urgency}</p>
              <p className="text-sm text-gray-100 mt-2 font-medium">{alert.areaDesc}</p>

              {alert.ai_analysis ? (
                <div className="mt-3 bg-[#111] p-3 rounded border border-gray-700">
                  <p className="text-sm text-blue-300 font-bold mb-1">🤖 AI Summary</p>
                  <p className="text-xs text-gray-300 mb-2">{alert.ai_analysis.summary}</p>

                  {alert.ai_analysis.action_items && alert.ai_analysis.action_items.length > 0 && (
                    <>
                      <p className="text-xs text-gray-400 font-semibold mt-2">Action Items:</p>
                      <ul className="list-disc pl-4 text-xs text-gray-300">
                        {alert.ai_analysis.action_items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {alert.ai_analysis.evacuation_routes && alert.ai_analysis.evacuation_routes.length > 0 && (
                    <>
                      <p className="text-xs text-gray-400 font-semibold mt-2">Evacuation Routes:</p>
                      <ul className="list-disc pl-4 text-xs text-gray-300">
                        {alert.ai_analysis.evacuation_routes.map((route, i) => (
                          <li key={i}>{route}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : alert.description ? (
                <p className="text-xs text-gray-400 mt-2 line-clamp-4">
                  {alert.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Map - 80% width */}
      <div className="h-full w-4/5 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          className="h-full w-full"
          aria-label="Flood response map"
        >
          <TileLayer
            className="dark-topo-tiles"
            url={`https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ZoomControl position="bottomright" />
          <RecenterButton />

          <FloodZoneLayer />
          <WeatherAlertLayer alerts={alerts} />
          <FloodSimulatorLayer alerts={alerts} elevationThreshold={elevationThreshold} />
        </MapContainer>
      </div>
    </div>
  );
};
