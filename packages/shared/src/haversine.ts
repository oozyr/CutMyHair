/**
 * Haversine distance formula.
 * Adapted from the legacy Flutter map page.
 * Returns distance in kilometres between two lat/lng points.
 */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const p = 0.017453292519943295; // Math.PI / 180
  const a =
    0.5 -
    Math.cos((lat2 - lat1) * p) / 2 +
    (Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      (1 - Math.cos((lon2 - lon1) * p))) /
      2;
  return 12742 * Math.asin(Math.sqrt(a));
}
