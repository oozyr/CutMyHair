import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { GEO_PROVIDER } from '../providers/geo/geo.tokens';
import type { GeoProvider } from '../providers/geo/geo.provider.interface';
import { isShopOpenNow } from '@cutmyhair/shared';

@Injectable()
export class ShopsService {
  constructor(
    private readonly store: StoreService,
    @Inject(GEO_PROVIDER) private readonly geoProvider: GeoProvider,
  ) {}

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
      .map((shop) => {
        const rawDist = this.geoProvider.distance(centerLat, centerLng, shop.lat, shop.lng);
        const distanceKm = Math.round(rawDist * 10) / 10;
        const priceRange = this.getPriceRange(shop.id);
        return {
          ...shop,
          lat: shop.lat,
          lng: shop.lng,
          distanceKm,
          rawDist,
          openNow: isShopOpenNow(shop),
          kind: shop.kind ?? 'shop',
          minPriceSen: priceRange.minPrice,
          minPrice: priceRange.minPrice,
          maxPrice: priceRange.maxPrice,
        };
      })
      .filter((shop) => shop.rawDist <= radiusKm)
      .map(({ rawDist, ...shop }) => shop)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  findOne(id: string) {
    const shop = this.store.shops.get(id);
    if (!shop) throw new NotFoundException(`Shop ${id} not found`);
    return {
      ...shop,
      openNow: isShopOpenNow(shop),
      kind: shop.kind ?? 'shop',
      ...this.getPriceRange(shop.id),
    };
  }
}
