import type { BookingStatus } from '@cutmyhair/shared';

export class CreateBookingDto {
  customerId!: string;
  shopId!: string;
  barberId!: string;
  serviceId!: string;
  startTime!: string; // ISO datetime
}

export class UpdateBookingStatusDto {
  status!: BookingStatus;
}

export class RescheduleBookingDto {
  startTime!: string; // ISO datetime
}
