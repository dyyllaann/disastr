import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { NWSAlert } from "../hooks/useWeatherAlerts";

interface Props {
  alerts: NWSAlert[];
  elevationThreshold: number; // in meters
}

export const FloodSimulatorLayer: React.FC<Props> = ({ alerts, elevationThreshold }) => {
  const map = useMap();
  const layerRef = useRef<L.GridLayer | null>(null);

  useEffect(() => {
    // Normalize GeoJSON into a standard array of polygons -> rings -> [lng, lat]
    const polygons: number[][][][] = [];
    alerts.forEach((alert) => {
      if (!alert.geometry) return;
      if (alert.geometry.type === "Polygon") {
        polygons.push(alert.geometry.coordinates as number[][][]);
      } else if (alert.geometry.type === "MultiPolygon") {
        (alert.geometry.coordinates as number[][][][]).forEach((poly) => polygons.push(poly));
      }
    });

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const FloodGridLayer = L.GridLayer.extend({
      createTile: function (coords: L.Coords, done: (error: any, tile: HTMLElement) => void) {
        const tile = document.createElement("canvas");
        const size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;
        const ctx = tile.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          done(null, tile);
          return tile;
        }

        // Create an offscreen mask canvas to draw the polygons
        const mask = document.createElement("canvas");
        mask.width = size.x;
        mask.height = size.y;
        const mCtx = mask.getContext("2d");

        if (mCtx && polygons.length > 0) {
          const nwPoint = coords.scaleBy(size);
          mCtx.fillStyle = "black";
          mCtx.beginPath();
          polygons.forEach((poly) => {
            poly.forEach((ring) => {
              ring.forEach((coord, i) => {
                // Leaflet map.project takes LatLng, returns Point
                const p = this._map.project(L.latLng(coord[1], coord[0]), coords.z).subtract(nwPoint);
                if (i === 0) mCtx.moveTo(p.x, p.y);
                else mCtx.lineTo(p.x, p.y);
              });
            });
          });
          mCtx.fill("evenodd");
        }

        const maskData = mCtx ? mCtx.getImageData(0, 0, size.x, size.y) : null;

        // Fetch Terrain-RGB tile
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, size.x, size.y);

          // First pass: Build a boolean map of flooded pixels
          const flooded = new Uint8Array(size.x * size.y);
          
          for (let i = 0; i < imgData.data.length; i += 4) {
            const px = i / 4;
            // Check if pixel is inside the polygon mask
            if (!maskData || maskData.data[i + 3] === 0) {
              flooded[px] = 0;
              continue;
            }

            // Calculate exact elevation from RGB values
            const R = imgData.data[i];
            const G = imgData.data[i + 1];
            const B = imgData.data[i + 2];
            const elevation = -10000 + (R * 256 * 256 + G * 256 + B) * 0.1;

            if (elevation < elevationThreshold) {
              flooded[px] = 1;
            }
          }

          // Second pass: Detect edges and draw the orange border
          for (let y = 0; y < size.y; y++) {
            for (let x = 0; x < size.x; x++) {
              const px = y * size.x + x;
              const i = px * 4;
              
              if (flooded[px]) {
                let isEdge = false;
                // Check a 2-pixel radius for thick borders
                for (let dy = -2; dy <= 2; dy++) {
                  for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // Only check neighbors that are strictly INSIDE this tile to prevent drawing square tile edges.
                    if (nx >= 0 && nx < size.x && ny >= 0 && ny < size.y) {
                      if (!flooded[ny * size.x + nx]) {
                        isEdge = true;
                        break;
                      }
                    }
                  }
                  if (isEdge) break;
                }
                  
                if (isEdge) {
                  // Orange border (Tailwind orange-500)
                  imgData.data[i] = 249;      // R
                  imgData.data[i + 1] = 115;  // G 
                  imgData.data[i + 2] = 22;   // B
                  imgData.data[i + 3] = 255;  // Alpha
                } else {
                  // No fill inside the flooded area
                  imgData.data[i + 3] = 0; 
                }
              } else {
                imgData.data[i + 3] = 0; // Not flooded -> transparent
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          done(null, tile);
        };

        img.onerror = () => done(null, tile);

        // Fetch the raw Terrain-RGB tile
        img.src = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${coords.z}/${coords.x}/${coords.y}.pngraw?access_token=${mapboxToken}`;

        return tile;
      },
    });

    const layer = new FloodGridLayer({ opacity: 0.8, zIndex: 10 });
    layerRef.current = layer;
    map.addLayer(layer);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, alerts, elevationThreshold]);

  return null;
};
