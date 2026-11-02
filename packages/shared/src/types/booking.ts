export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'fpx' | 'card' | 'duitnow' | 'ewallet';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}
