import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { GEO_PROVIDER } from '../providers/geo/geo.tokens';
import type { GeoProvider } from '../providers/geo/geo.provider.interface';
import { isShopOpenNow, SERVICE_MARKUP_SEN } from '@cutmyhair/shared';

@Injectable()
export class ShopsService {
  constructor(
    private readonly store: StoreService,
    @Inject(GEO_PROVIDER) private readonly geoProvider: GeoProvider,
  ) {}

  private getPriceRange(shopId: string): { minPriceSen: number | null; maxPriceSen: number | null; minPrice: number | null; maxPrice: number | null } {
    const services = Array.from(this.store.services.values()).filter(
      (svc) => svc.shopId === shopId,
    );
    if (services.length === 0) {
      return { minPriceSen: null, maxPriceSen: null, minPrice: null, maxPrice: null };
    }
    const rawPrices = services.map((svc) => svc.price);
    const customerPrices = services.map((svc) => svc.price + SERVICE_MARKUP_SEN);
    return {
      minPriceSen: Math.min(...customerPrices),
      maxPriceSen: Math.max(...customerPrices),
      minPrice: Math.min(...rawPrices),
      maxPrice: Math.max(...rawPrices),
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
          minPriceSen: priceRange.minPriceSen,
          maxPriceSen: priceRange.maxPriceSen,
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
    const priceRange = this.getPriceRange(id);
    return {
      ...shop,
      openNow: isShopOpenNow(shop),
      kind: shop.kind ?? 'shop',
      minPriceSen: priceRange.minPriceSen,
      maxPriceSen: priceRange.maxPriceSen,
      minPrice: priceRange.minPrice,
      maxPrice: priceRange.maxPrice,
    };
  }
}
