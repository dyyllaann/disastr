import React from "react";
import { GeoJSON, Tooltip } from "react-leaflet";
import type { NWSAlert } from "../hooks/useWeatherAlerts";

const SEVERITY_COLOR: Record<string, string> = {
  Extreme: "#dc2626",
  Severe: "#ea580c",
  Moderate: "#ca8a04",
  Minor: "#2563eb",
  Unknown: "#6b7280",
};

interface Props {
  alerts: NWSAlert[];
}

export const WeatherAlertLayer: React.FC<Props> = ({ alerts }) => {
  return (
    <>
      {alerts
        .filter((a) => a.geometry !== null)
        .map((alert) => {
          const color = SEVERITY_COLOR[alert.severity] ?? "#6b7280";
          return (
            <GeoJSON
              key={alert.id}
              // Cast to GeoJsonObject — react-leaflet accepts bare Geometry
              data={alert.geometry as GeoJSON.GeoJsonObject}
              style={{
                color,
                fillColor: color,
                fillOpacity: 0.15,
                weight: 2,
                opacity: 0.8,
              }}
            >
              <Tooltip sticky>
                <div className="max-w-xs">
                  <p className="font-semibold text-sm">{alert.event}</p>
                  <p className="text-xs text-gray-500">{alert.areaDesc}</p>
                  {alert.headline && alert.headline !== alert.event && (
                    <p className="text-xs mt-1">{alert.headline}</p>
                  )}
                </div>
              </Tooltip>
            </GeoJSON>
          );
        })}
    </>
  );
};
