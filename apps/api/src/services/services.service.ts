import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { SERVICE_MARKUP_SEN } from '@cutmyhair/shared';

@Injectable()
export class ServicesService {
  constructor(private readonly store: StoreService) {}

  findByShop(shopId: string) {
    return Array.from(this.store.services.values())
      .filter((s) => s.shopId === shopId)
      .map((s) => ({ ...s, customerPriceSen: s.price + SERVICE_MARKUP_SEN }));
  }

  findOne(shopId: string, id: string) {
    const service = this.store.services.get(id);
    if (!service || service.shopId !== shopId) {
      throw new NotFoundException(`Service ${id} not found in shop ${shopId}`);
    }
    return { ...service, customerPriceSen: service.price + SERVICE_MARKUP_SEN };
  }
}
