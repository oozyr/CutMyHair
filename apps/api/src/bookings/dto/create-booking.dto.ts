import type { BookingStatus, PaymentMethod } from '@cutmyhair/shared';

export class CreateBookingDto {
  customerId!: string;
  shopId!: string;
  barberId!: string;
  serviceId!: string;
  startTime!: string; // ISO datetime
  paymentMethod?: PaymentMethod;
}

export class UpdateBookingStatusDto {
  status!: BookingStatus;
}

export class RescheduleBookingDto {
  startTime!: string; // ISO datetime
}
