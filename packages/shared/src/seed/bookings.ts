import type { Booking } from '../types';
import { calculateBookingAmounts } from '../settings';

function getRelativeTimes(daysOffset: number, hour: number, minute: number, durationMinutes = 45) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  const startTime = d.toISOString();
  const endTime = new Date(d.getTime() + durationMinutes * 60000).toISOString();
  const createdAt = new Date(d.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const updatedAt = createdAt;
  return { startTime, endTime, createdAt, updatedAt };
}

function createSeedBooking(params: {
  id: string;
  customerId: string;
  shopId: string;
  barberId: string;
  serviceId: string;
  servicePriceSen: number;
  durationMinutes: number;
  daysOffset: number;
  hour: number;
  minute: number;
  status: Booking['status'];
  paymentMethod: Booking['paymentMethod'];
  paymentStatus: Booking['paymentStatus'];
}): Booking {
  const times = getRelativeTimes(params.daysOffset, params.hour, params.minute, params.durationMinutes);
  const amounts = calculateBookingAmounts(params.servicePriceSen);

  return {
    id: params.id,
    customerId: params.customerId,
    shopId: params.shopId,
    barberId: params.barberId,
    serviceId: params.serviceId,
    startTime: times.startTime,
    endTime: times.endTime,
    servicePriceSen: amounts.servicePriceSen,
    markupSen: amounts.markupSen,
    customerTotalSen: amounts.customerTotalSen,
    platformFeeSen: amounts.platformFeeSen,
    shopPayoutSen: amounts.shopPayoutSen,
    price: amounts.customerTotalSen,
    status: params.status,
    paymentMethod: params.paymentMethod,
    paymentStatus: params.paymentStatus,
    createdAt: times.createdAt,
    updatedAt: times.updatedAt,
  };
}

// Sample bookings spread across shops and customers with relative dates
export const seedBookings: Booking[] = [
  // Past completed booking for cust-001 (enables review testing)
  createSeedBooking({
    id: 'bkg-001',
    customerId: 'cust-001',
    shopId: 'shop-002',
    barberId: 'barb-002-1',
    serviceId: 'svc-002-1',
    servicePriceSen: 3000,
    durationMinutes: 45,
    daysOffset: -3,
    hour: 10,
    minute: 0,
    status: 'completed',
    paymentMethod: 'fpx',
    paymentStatus: 'paid',
  }),

  // Upcoming confirmed booking for cust-001 tomorrow (enables My QR testing)
  createSeedBooking({
    id: 'bkg-002',
    customerId: 'cust-001',
    shopId: 'shop-001',
    barberId: 'barb-001-1',
    serviceId: 'svc-001-1',
    servicePriceSen: 1500,
    durationMinutes: 30,
    daysOffset: 1,
    hour: 10,
    minute: 30,
    status: 'confirmed',
    paymentMethod: 'fpx',
    paymentStatus: 'paid',
  }),

  // Upcoming pending booking for cust-001 in 3 days
  createSeedBooking({
    id: 'bkg-003',
    customerId: 'cust-001',
    shopId: 'shop-004',
    barberId: 'barb-004-1',
    serviceId: 'svc-004-3',
    servicePriceSen: 6500,
    durationMinutes: 90,
    daysOffset: 3,
    hour: 14,
    minute: 0,
    status: 'pending',
    paymentMethod: 'card',
    paymentStatus: 'paid',
  }),

  // Past completed booking for cust-002
  createSeedBooking({
    id: 'bkg-004',
    customerId: 'cust-002',
    shopId: 'shop-003',
    barberId: 'barb-003-1',
    serviceId: 'svc-003-1',
    servicePriceSen: 2000,
    durationMinutes: 30,
    daysOffset: -2,
    hour: 14,
    minute: 0,
    status: 'completed',
    paymentMethod: 'duitnow',
    paymentStatus: 'paid',
  }),

  // Past cancelled booking for cust-001
  createSeedBooking({
    id: 'bkg-005',
    customerId: 'cust-001',
    shopId: 'shop-006',
    barberId: 'barb-006-1',
    serviceId: 'svc-006-1',
    servicePriceSen: 3200,
    durationMinutes: 45,
    daysOffset: -4,
    hour: 15,
    minute: 0,
    status: 'cancelled',
    paymentMethod: 'ewallet',
    paymentStatus: 'refunded',
  }),

  // Upcoming confirmed booking for cust-005 in 2 days
  createSeedBooking({
    id: 'bkg-006',
    customerId: 'cust-005',
    shopId: 'shop-008',
    barberId: 'barb-008-2',
    serviceId: 'svc-008-2',
    servicePriceSen: 2800,
    durationMinutes: 45,
    daysOffset: 2,
    hour: 11,
    minute: 0,
    status: 'confirmed',
    paymentMethod: 'fpx',
    paymentStatus: 'paid',
  }),
];
