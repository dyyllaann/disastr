import type { TicketLocation } from "../types";

/**
 * Convert degrees to radians.
 */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lng points in kilometres.
 */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Parse a "minLng,minLat,maxLng,maxLat" bbox string.
 * Returns null if the string is malformed.
 */
export function parseBbox(
  bbox: string
): { minLng: number; minLat: number; maxLng: number; maxLat: number } | null {
  const parts = bbox.split(",").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Returns true if the location falls within the given bbox.
 */
export function isInBbox(
  location: TicketLocation,
  bbox: ReturnType<typeof parseBbox>
): boolean {
  if (!bbox) return true;
  return (
    location.lng >= bbox.minLng &&
    location.lng <= bbox.maxLng &&
    location.lat >= bbox.minLat &&
    location.lat <= bbox.maxLat
  );
}

/**
 * Cluster nearby tickets within a radius (km).
 * Returns an array of { centroid, ticketIds } groups.
 * TODO: replace with a proper spatial index for production.
 */
export function clusterByProximity<T extends { id: string; location: TicketLocation }>(
  tickets: T[],
  radiusKm = 0.15
): Array<{ centroid: { lat: number; lng: number }; ticketIds: string[] }> {
  const assigned = new Set<string>();
  const clusters: Array<{ centroid: { lat: number; lng: number }; ticketIds: string[] }> = [];

  for (const ticket of tickets) {
    if (assigned.has(ticket.id)) continue;
    const group: T[] = [ticket];
    assigned.add(ticket.id);

    for (const other of tickets) {
      if (assigned.has(other.id)) continue;
      if (haversineKm(ticket.location, other.location) <= radiusKm) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    const centroid = {
      lat: group.reduce((s, t) => s + t.location.lat, 0) / group.length,
      lng: group.reduce((s, t) => s + t.location.lng, 0) / group.length,
    };
    clusters.push({ centroid, ticketIds: group.map((t) => t.id) });
  }

  return clusters;
}
