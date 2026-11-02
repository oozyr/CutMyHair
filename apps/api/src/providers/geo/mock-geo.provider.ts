import { Injectable, Logger } from '@nestjs/common';
import { distanceKm } from '@cutmyhair/shared';
import { Coordinates, GeoProvider } from './geo.provider.interface';

@Injectable()
export class MockGeoProvider implements GeoProvider {
  private readonly logger = new Logger(MockGeoProvider.name);

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    this.logger.log(`Mock geocoding address: "${address}"`);

    if (!address || typeof address !== 'string') {
      return null;
    }

    const lower = address.toLowerCase();

    // Cheras area coordinates
    if (lower.includes('cheras') || lower.includes('peel') || lower.includes('segar')) {
      return { lat: 3.1072, lng: 101.7240 };
    }

    // Default central Kuala Lumpur coordinates
    return { lat: 3.1390, lng: 101.6869 };
  }

  distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return distanceKm(lat1, lng1, lat2, lng2);
  }
}
