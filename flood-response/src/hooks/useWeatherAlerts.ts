import { useState, useEffect } from "react";
import type { GeoJSON } from "geojson";

export interface NWSAlert {
  id: string;
  event: string;
  severity: string;
  headline: string;
  areaDesc: string;
  geometry: GeoJSON.Geometry | null;
}

export function useWeatherAlerts(area = "WA") {
  const [alerts, setAlerts] = useState<NWSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`https://api.weather.gov/alerts/active?area=${area}`, {
      headers: { Accept: "application/geo+json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`NWS API responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed: NWSAlert[] = (data.features ?? []).map((f: any) => ({
          id: f.properties.id as string,
          event: f.properties.event as string,
          severity: f.properties.severity as string,
          headline: (f.properties.headline ?? f.properties.event) as string,
          areaDesc: f.properties.areaDesc as string,
          geometry: f.geometry as GeoJSON.Geometry | null,
        }));
        setAlerts(parsed);
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
