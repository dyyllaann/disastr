import { useState, useEffect } from "react";
import type { GeoJSON } from "geojson";

export interface ParsedNWSReport {
  summary: string;
  action_items: string[];
  evacuation_routes: string[];
  expected_peak_time: string | null;
}

export interface NWSAlert {
  id: string;
  event: string;
  severity: string;
  urgency: string;
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  geometry: GeoJSON.Geometry | null;
  ai_analysis: ParsedNWSReport | null;
}

export function useWeatherAlerts(area = "WA") {
  const [alerts, setAlerts] = useState<NWSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Fetch from our new FastAPI backend instead of directly from NWS
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

    fetch(`${baseUrl}/api/weather-alerts?area=${area}`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend API responded with ${res.status}`);
        return res.json();
      })
      .then((data: NWSAlert[]) => {
        if (cancelled) return;
        setAlerts(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [area]);

  return { alerts, loading, error };
}
