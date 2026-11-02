export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoProvider {
  /**
   * Geocode a physical address to latitude and longitude.
   */
  geocodeAddress(address: string): Promise<Coordinates | null>;

  /**
   * Calculate distance between two coordinate pairs in kilometers.
   */
  distance(lat1: number, lng1: number, lat2: number, lng2: number): number;
}
