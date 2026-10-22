import type { Review } from '../types';

// Only customers with completed bookings can have reviews
export const seedReviews: Review[] = [
  {
    id: 'rev-001',
    shopId: 'shop-002',
    customerId: 'cust-001',
    bookingId: 'bkg-001',
    rating: 5,
    comment: 'Best fade I have had in KL. Aiman really knows his craft. Will definitely be back.',
    createdAt: '2025-01-20T12:00:00.000Z',
  },
  {
    id: 'rev-002',
    shopId: 'shop-001',
    customerId: 'cust-002',
    bookingId: 'bkg-002',
    rating: 4,
    comment: 'Classic and clean. Good price for the quality. Pak Ali is very friendly.',
    createdAt: '2025-01-21T10:00:00.000Z',
  },
];
