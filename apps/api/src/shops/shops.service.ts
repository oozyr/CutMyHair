import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { distanceKm } from '@cutmyhair/shared';

@Injectable()
export class ShopsService {
  constructor(private readonly store: StoreService) {}

  private getPriceRange(shopId: string): { minPrice: number | null; maxPrice: number | null } {
    const prices = Array.from(this.store.services.values())
      .filter((svc) => svc.shopId === shopId)
      .map((svc) => svc.price);
    if (prices.length === 0) return { minPrice: null, maxPrice: null };
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }

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
        ...this.getPriceRange(shop.id),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  findOne(id: string) {
    const shop = this.store.shops.get(id);
    if (!shop) throw new NotFoundException(`Shop ${id} not found`);
    return shop;
  }
}
