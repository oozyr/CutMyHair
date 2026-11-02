/**
 * Barber subscription plans and feature flags for CutMyHair.
 * All monetary amounts are stored as integer sen (RM 1 = 100 sen).
 */

export type PlanId = 'base' | 'pro' | 'max';

export interface PlanFeatureFlags {
  // Available in all plans
  onlinePayments: boolean;
  bookings: boolean;
  reviews: boolean;
  deposits: boolean;
  productShop: boolean;

  // Pro additions
  payroll: boolean;
  lightStaffManagement: boolean;
  customerListMarketing: boolean;

  // Max additions
  multiBranch: boolean;
  priorityPlacement: boolean;
  analytics: boolean;
  advancedStaffManagement: boolean;
  stockManagement: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthlySen: number;
  priceMonthlyFormatted: string;
  includedBarbers: number;
  extraBarberPriceSen: number;
  extraBarberPriceFormatted: string;
  features: PlanFeatureFlags;
}

export const PLANS: Record<PlanId, Plan> = {
  base: {
    id: 'base',
    name: 'Base',
    priceMonthlySen: 3900,
    priceMonthlyFormatted: 'RM 39.00',
    includedBarbers: 2,
    extraBarberPriceSen: 600,
    extraBarberPriceFormatted: 'RM 6.00',
    features: {
      onlinePayments: true,
      bookings: true,
      reviews: true,
      deposits: true,
      productShop: true,
      payroll: false,
      lightStaffManagement: false,
      customerListMarketing: false,
      multiBranch: false,
      priorityPlacement: false,
      analytics: false,
      advancedStaffManagement: false,
      stockManagement: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlySen: 7900,
    priceMonthlyFormatted: 'RM 79.00',
    includedBarbers: 4,
    extraBarberPriceSen: 900,
    extraBarberPriceFormatted: 'RM 9.00',
    features: {
      onlinePayments: true,
      bookings: true,
      reviews: true,
      deposits: true,
      productShop: true,
      payroll: true,
      lightStaffManagement: true,
      customerListMarketing: true,
      multiBranch: false,
      priorityPlacement: false,
      analytics: false,
      advancedStaffManagement: false,
      stockManagement: false,
    },
  },
  max: {
    id: 'max',
    name: 'Max',
    priceMonthlySen: 11900,
    priceMonthlyFormatted: 'RM 119.00',
    includedBarbers: 6,
    extraBarberPriceSen: 1500,
    extraBarberPriceFormatted: 'RM 15.00',
    features: {
      onlinePayments: true,
      bookings: true,
      reviews: true,
      deposits: true,
      productShop: true,
      payroll: true,
      lightStaffManagement: true,
      customerListMarketing: true,
      multiBranch: true,
      priorityPlacement: true,
      analytics: true,
      advancedStaffManagement: true,
      stockManagement: true,
    },
  },
};

export const PLAN_LIST: Plan[] = Object.values(PLANS);
