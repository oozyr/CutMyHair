export interface Barber {
  id: string;
  shopId: string;
  name: string;
  photo: string;         // URL or placeholder key
  bio: string;
  serviceIds: string[];  // which services this barber can perform
  isActive: boolean;
}
