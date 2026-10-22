import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { buildSlots } from '@cutmyhair/shared';

@Injectable()
export class AvailabilityService {
  constructor(private readonly store: StoreService) {}

  getSlots(
    shopId: string,
    barberId: string,
    date: string,
    serviceId?: string,
  ) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date query param required in YYYY-MM-DD format');
    }

    const shop = this.store.shops.get(shopId);
    if (!shop) throw new NotFoundException(`Shop ${shopId} not found`);

    const barber = this.store.barbers.get(barberId);
    if (!barber || barber.shopId !== shopId) {
      throw new NotFoundException(`Barber ${barberId} not found in shop ${shopId}`);
    }

    // Determine service duration
    let durationMinutes = 30; // default slot size
    if (serviceId) {
      const service = this.store.services.get(serviceId);
      if (!service || service.shopId !== shopId) {
        throw new NotFoundException(`Service ${serviceId} not found in shop ${shopId}`);
      }
      durationMinutes = service.durationMinutes;
    }

    const bookings = Array.from(this.store.bookings.values()).filter(
      (b) => b.shopId === shopId && b.startTime.startsWith(date),
    );

    return buildSlots(shop, barberId, date, bookings, durationMinutes);
  }
}
