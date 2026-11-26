import { collectionPoints, type CollectionPoint } from '../data/store.js';

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCollectionPoint(
  lat: number,
  lng: number
): { point: CollectionPoint; distanceKm: number } {
  let best = collectionPoints[0];
  let bestDist = haversineKm(lat, lng, best.lat, best.lng);

  for (const cp of collectionPoints.slice(1)) {
    const dist = haversineKm(lat, lng, cp.lat, cp.lng);
    if (dist < bestDist) {
      best = cp;
      bestDist = dist;
    }
  }

  return { point: best, distanceKm: Math.round(bestDist * 10) / 10 };
}

