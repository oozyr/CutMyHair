export type ShopPlan = 'base' | 'pro';

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
  plan: ShopPlan;
  isActive: boolean;
  openingHours: WeeklyHours;
  rating: number;
  totalReviews: number;
  createdAt: string; // ISO
}
