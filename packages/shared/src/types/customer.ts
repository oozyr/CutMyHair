export interface CustomerPreferences {
  preferredLanguage?: 'en' | 'ms' | string;
  favoriteServiceTypes?: string[];
  [key: string]: any;
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // Malaysian format: +601X-XXXXXXXX
  email: string;
  emailVerified: boolean;
  preferences?: CustomerPreferences;
  photoUrl?: string;
  signedUpViaShopId?: string; // for commission tracking data model
  createdAt: string; // ISO
}
