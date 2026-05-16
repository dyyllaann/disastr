import React from "react";
import { WMSTileLayer } from "react-leaflet";

/**
 * Renders FEMA National Flood Hazard Layer (NFHL) flood inundation zones.
 * Zone A / AE = 1% annual chance flood (100-year floodplain).
 * Zone X (shaded) = 0.2% annual chance flood (500-year floodplain).
 *
 * WMS docs: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer
 */
export const FloodZoneLayer: React.FC = () => (
  <WMSTileLayer
    url="https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/WMSServer"
    layers="28"
    format="image/png"
    transparent
    opacity={0.45}
    attribution='Flood zones: <a href="https://www.fema.gov/flood-maps">FEMA NFHL</a>'
  />
);
