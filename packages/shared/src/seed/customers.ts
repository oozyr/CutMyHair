import type { Customer } from '../types';

export const seedCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Ahmad Faris',
    phone: '+60123456789',
    email: 'ahmad.faris@email.com',
    emailVerified: true,
    preferences: {
      preferredLanguage: 'ms',
      favoriteServiceTypes: ['Classic Haircut', 'Skin Fade'],
    },
    createdAt: '2025-01-10T08:00:00.000Z',
  },
  {
    id: 'cust-002',
    name: 'Lim Wei Jian',
    phone: '+60197654321',
    email: 'wei.jian@email.com',
    emailVerified: true,
    preferences: {
      preferredLanguage: 'en',
      favoriteServiceTypes: ['Taper Fade', 'Beard Trim'],
    },
    createdAt: '2025-01-12T09:30:00.000Z',
  },
  {
    id: 'cust-003',
    name: 'Rajan Krishnan',
    phone: '+60112233445',
    email: 'rajan.k@email.com',
    emailVerified: true,
    preferences: {
      preferredLanguage: 'en',
      favoriteServiceTypes: ['Premium Haircut', 'Hot Towel Shave'],
    },
    createdAt: '2025-01-14T11:00:00.000Z',
  },
  {
    id: 'cust-004',
    name: 'Hafiz Razali',
    phone: '+60165544332',
    email: 'hafiz.r@email.com',
    emailVerified: true,
    signedUpViaShopId: 'shop-003',
    preferences: {
      preferredLanguage: 'ms',
      favoriteServiceTypes: ['Modern Cut'],
    },
    createdAt: '2025-01-15T14:00:00.000Z',
  },
  {
    id: 'cust-005',
    name: 'Daniel Tan',
    phone: '+60178899001',
    email: 'daniel.tan@email.com',
    emailVerified: true,
    preferences: {
      preferredLanguage: 'en',
      favoriteServiceTypes: ['Classic Cut'],
    },
    createdAt: '2025-01-16T10:00:00.000Z',
  },
];
