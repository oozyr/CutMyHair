import { Injectable } from '@nestjs/common';
import {
  seedShops,
  seedBarbers,
  seedServices,
  seedBookings,
  seedCustomers,
  seedReviews,
} from '@cutmyhair/shared';
import type {
  Shop,
  Barber,
  Service,
  Booking,
  Customer,
  Review,
} from '@cutmyhair/shared';

/**
 * In-memory store seeded from packages/shared seed data.
 * This replaces a real database for the demo MVP.
 */
@Injectable()
export class StoreService {
  readonly shops = new Map<string, Shop>();
  readonly barbers = new Map<string, Barber>();
  readonly services = new Map<string, Service>();
  readonly bookings = new Map<string, Booking>();
  readonly customers = new Map<string, Customer>();
  readonly reviews = new Map<string, Review>();

  constructor() {
    seedShops.forEach((s) => this.shops.set(s.id, s));
    seedBarbers.forEach((b) => this.barbers.set(b.id, b));
    seedServices.forEach((s) => this.services.set(s.id, s));
    seedBookings.forEach((b) => this.bookings.set(b.id, b));
    seedCustomers.forEach((c) => this.customers.set(c.id, c));
    seedReviews.forEach((r) => this.reviews.set(r.id, r));
  }

  /**
   * Lazily expires unpaid bookings whose payment hold window has passed.
   * Expired bookings become cancelled with paymentStatus = failed.
   */
  expireUnpaidBookings(now: number = Date.now()): void {
    for (const [id, b] of this.bookings.entries()) {
      if (b.status === 'pending_payment' && b.paymentStatus !== 'paid') {
        const expiresAtMs = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
        if (expiresAtMs > 0 && expiresAtMs <= now) {
          this.bookings.set(id, {
            ...b,
            status: 'cancelled',
            paymentStatus: 'failed',
            updatedAt: new Date(now).toISOString(),
          });
        }
      }
    }
  }
}
