export type BookingStatus =
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'fpx' | 'card' | 'duitnow' | 'ewallet';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'refund_pending';

export interface Booking {
  id: string;
  customerId: string;
  shopId: string;
  barberId: string;
  serviceId: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime (startTime + durationMinutes)

  // Financial amounts in integer sen
  servicePriceSen: number;
  markupSen: number;
  customerTotalSen: number;
  platformFeeSen: number;
  shopPayoutSen: number;

  // Snapshot price in sen for display compatibility
  price: number;

  status: BookingStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Online payment lifecycle
  expiresAt?: string; // ISO timestamp when payment hold expires
  billId?: string;    // Billplz or mock payment bill ID
  billUrl?: string;   // Payment checkout URL

  createdAt: string; // ISO
  updatedAt: string; // ISO
}
