export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'pay_at_shop';

export interface Booking {
  id: string;
  customerId: string;
  shopId: string;
  barberId: string;
  serviceId: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime (startTime + durationMinutes)
  price: number;     // MYR, snapshot at booking time
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
