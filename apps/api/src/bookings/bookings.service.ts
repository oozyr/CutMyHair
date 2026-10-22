import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../store/store.service';
import type { Booking, BookingStatus } from '@cutmyhair/shared';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly store: StoreService) {}

  create(dto: CreateBookingDto): Booking {
    const { customerId, shopId, barberId, serviceId, startTime } = dto;

    const service = this.store.services.get(serviceId);
    if (!service) throw new NotFoundException(`Service ${serviceId} not found`);
    if (service.shopId !== shopId) {
      throw new BadRequestException('Service does not belong to the given shop');
    }

    const barber = this.store.barbers.get(barberId);
    if (!barber) throw new NotFoundException(`Barber ${barberId} not found`);
    if (barber.shopId !== shopId) {
      throw new BadRequestException('Barber does not belong to the given shop');
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startTime');
    }

    const endTime = new Date(
      start.getTime() + service.durationMinutes * 60000,
    ).toISOString();

    // Conflict check
    const conflict = Array.from(this.store.bookings.values()).find(
      (b) =>
        b.barberId === barberId &&
        b.status !== 'cancelled' &&
        new Date(b.startTime) < new Date(endTime) &&
        new Date(b.endTime) > start,
    );
    if (conflict) {
      throw new BadRequestException('This time slot is already booked');
    }

    const id = `bkg-${Date.now()}`;
    const now = new Date().toISOString();
    const booking: Booking = {
      id,
      customerId,
      shopId,
      barberId,
      serviceId,
      startTime: start.toISOString(),
      endTime,
      price: service.price,
      status: 'pending',
      paymentMethod: 'pay_at_shop',
      createdAt: now,
      updatedAt: now,
    };

    this.store.bookings.set(id, booking);
    return booking;
  }

  findAll(filters: {
    customerId?: string;
    shopId?: string;
    barberId?: string;
  }) {
    return Array.from(this.store.bookings.values()).filter((b) => {
      if (filters.customerId && b.customerId !== filters.customerId) return false;
      if (filters.shopId && b.shopId !== filters.shopId) return false;
      if (filters.barberId && b.barberId !== filters.barberId) return false;
      return true;
    });
  }

  findOne(id: string): Booking {
    const booking = this.store.bookings.get(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    return booking;
  }

  updateStatus(id: string, status: BookingStatus): Booking {
    const booking = this.findOne(id);
    const updated = { ...booking, status, updatedAt: new Date().toISOString() };
    this.store.bookings.set(id, updated);
    return updated;
  }

  reschedule(id: string, startTime: string): Booking {
    const booking = this.findOne(id);
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new BadRequestException('Cannot reschedule a cancelled or completed booking');
    }

    const service = this.store.services.get(booking.serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const start = new Date(startTime);
    if (isNaN(start.getTime())) throw new BadRequestException('Invalid startTime');

    const endTime = new Date(
      start.getTime() + service.durationMinutes * 60000,
    ).toISOString();

    const conflict = Array.from(this.store.bookings.values()).find(
      (b) =>
        b.id !== id &&
        b.barberId === booking.barberId &&
        b.status !== 'cancelled' &&
        new Date(b.startTime) < new Date(endTime) &&
        new Date(b.endTime) > start,
    );
    if (conflict) throw new BadRequestException('This time slot is already booked');

    const updated: Booking = {
      ...booking,
      startTime: start.toISOString(),
      endTime,
      status: 'pending',
      updatedAt: new Date().toISOString(),
    };
    this.store.bookings.set(id, updated);
    return updated;
  }

  cancel(id: string): Booking {
    return this.updateStatus(id, 'cancelled');
  }
}
