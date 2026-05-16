import { useState, useEffect } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(autoFetch = false): GeolocationState & { fetch: () => void } {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: false,
  });

  function fetch() {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported by this browser." }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          error: null,
          loading: false,
        }),
      (err) =>
        setState({ lat: null, lng: null, error: err.message, loading: false })
    );
  }

  useEffect(() => {
    if (autoFetch) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return { ...state, fetch };
}
