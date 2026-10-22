import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../store/store.service';

@Injectable()
export class BarbersService {
  constructor(private readonly store: StoreService) {}

  findByShop(shopId: string) {
    return Array.from(this.store.barbers.values()).filter(
      (b) => b.shopId === shopId && b.isActive,
    );
  }

  findOne(shopId: string, id: string) {
    const barber = this.store.barbers.get(id);
    if (!barber || barber.shopId !== shopId) {
      throw new NotFoundException(`Barber ${id} not found in shop ${shopId}`);
    }
    return barber;
  }
}
