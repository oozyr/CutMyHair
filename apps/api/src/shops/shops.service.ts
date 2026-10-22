import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { distanceKm } from '@cutmyhair/shared';

@Injectable()
export class ShopsService {
  constructor(private readonly store: StoreService) {}

  findAll(centerLat: number, centerLng: number, radiusKm: number) {
    return Array.from(this.store.shops.values())
      .filter((shop) => shop.isActive)
      .filter(
        (shop) =>
          distanceKm(centerLat, centerLng, shop.lat, shop.lng) <= radiusKm,
      )
      .map((shop) => ({
        ...shop,
        distanceKm: Math.round(
          distanceKm(centerLat, centerLng, shop.lat, shop.lng) * 10,
        ) / 10,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  findOne(id: string) {
    const shop = this.store.shops.get(id);
    if (!shop) throw new NotFoundException(`Shop ${id} not found`);
    return shop;
  }
}
