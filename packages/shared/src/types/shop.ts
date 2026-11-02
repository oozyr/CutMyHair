import type { PlanId } from '../plans';

export type ShopPlan = PlanId;

export type VerificationStatus = 'unverified' | 'pending' | 'verified';

export interface ShopPayoutDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

export interface Break {
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
}

export interface DayHours {
  open: boolean;
  openTime: string;  // "HH:MM" 24h
  closeTime: string; // "HH:MM" 24h
  breaks: Break[];
}

// 0 = Sunday, 1 = Monday, ... 6 = Saturday
export type WeeklyHours = Record<number, DayHours>;

export interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  photos: string[];        // URLs or placeholder keys
  coverPhoto: string;
  description: string;

  planId: PlanId;
  plan?: PlanId;           // Alias for backward compatibility
  isDemo: boolean;

  verificationStatus?: VerificationStatus;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ssmNumber?: string;
  payoutDetails?: ShopPayoutDetails;

  isActive: boolean;
  openingHours: WeeklyHours;
  rating: number;
  totalReviews: number;
  createdAt: string; // ISO
}
