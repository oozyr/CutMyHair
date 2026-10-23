import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { StoreService } from '../store/store.service';
import type { Booking, BookingStatus } from '@cutmyhair/shared';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly store: StoreService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getCheckInSecret(): string {
    const secret =
      process.env.CHECKIN_SECRET ||
      (process.env.NODE_ENV !== 'production' ? 'dev-checkin-secret-key' : '');
    if (!secret) {
      throw new BadRequestException(
        'CHECKIN_SECRET environment variable is not configured',
      );
    }
    return secret;
  }

  getCheckInCode(bookingId: string): { code: string; payload: string } {
    this.findOne(bookingId);
    const secret = this.getCheckInSecret();
    const hash = crypto
      .createHmac('sha256', secret)
      .update(bookingId)
      .digest('hex');
    const code = hash.slice(0, 6).toUpperCase();
    const payload = `cmh:checkin:${bookingId}:${code}`;
    return { code, payload };
  }

  checkIn(id: string, code: string): Booking {
    const booking = this.findOne(id);

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new BadRequestException(
        `Booking cannot be checked in with current status: ${booking.status}`,
      );
    }

    const { code: expectedCode } = this.getCheckInCode(id);
    if (!code || code.trim().toUpperCase() !== expectedCode) {
      throw new BadRequestException('Invalid check-in code');
    }

    const now = Date.now();
    const startMs = new Date(booking.startTime).getTime();
    const endMs = new Date(booking.endTime).getTime();
    const windowStartMs = startMs - 60 * 60 * 1000;

    if (now < windowStartMs || now > endMs) {
      throw new BadRequestException(
        'Check-in is only available between 60 minutes before start time and the booking end time',
      );
    }

    return this.updateStatus(id, 'checked_in');
  }

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

    const shop = this.store.shops.get(shopId);
    const shopName = shop?.name ?? shopId;
    const dateStr = start.toLocaleDateString('en-MY', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kuala_Lumpur',
    });
    const timeStr = start.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kuala_Lumpur',
    });
    this.notificationsService.add(
      customerId,
      'booking_made',
      id,
      `Booking confirmed at ${shopName} on ${dateStr} at ${timeStr}.`,
    );

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

    if (status === 'cancelled') {
      const shop = this.store.shops.get(booking.shopId);
      const shopName = shop?.name ?? booking.shopId;
      this.notificationsService.add(
        booking.customerId,
        'booking_cancelled',
        id,
        `Your booking at ${shopName} has been cancelled.`,
      );
    }

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

    const shop = this.store.shops.get(booking.shopId);
    const shopName = shop?.name ?? booking.shopId;
    const dateStr = start.toLocaleDateString('en-MY', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kuala_Lumpur',
    });
    const timeStr = start.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kuala_Lumpur',
    });
    this.notificationsService.add(
      booking.customerId,
      'booking_rescheduled',
      id,
      `Your booking at ${shopName} has been rescheduled to ${dateStr} at ${timeStr}.`,
    );

    return updated;
  }

  cancel(id: string): Booking {
    return this.updateStatus(id, 'cancelled');
  }
}
