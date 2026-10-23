import { Injectable } from '@nestjs/common';

export type NotificationType =
  | 'booking_made'
  | 'booking_cancelled'
  | 'booking_rescheduled';

export interface AppNotification {
  id: string;
  customerId: string;
  type: NotificationType;
  bookingId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  private readonly store = new Map<string, AppNotification[]>();

  add(
    customerId: string,
    type: NotificationType,
    bookingId: string,
    message: string,
  ): void {
    const notification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      customerId,
      type,
      bookingId,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const existing = this.store.get(customerId) ?? [];
    this.store.set(customerId, [notification, ...existing]);
  }

  getForCustomer(customerId: string): AppNotification[] {
    return this.store.get(customerId) ?? [];
  }

  markRead(customerId: string, notificationId: string): void {
    const items = this.store.get(customerId) ?? [];
    const updated = items.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    this.store.set(customerId, updated);
  }
}
