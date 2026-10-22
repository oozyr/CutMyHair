export interface Customer {
  id: string;
  name: string;
  phone: string;       // Malaysian format: +601X-XXXXXXXX
  email: string;
  photoUrl?: string;
  signedUpViaShopId?: string; // for commission tracking data model only
  createdAt: string;   // ISO
}
