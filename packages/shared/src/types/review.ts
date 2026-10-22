export interface Review {
  id: string;
  shopId: string;
  customerId: string;
  bookingId: string;
  rating: number;   // 1-5
  comment: string;
  createdAt: string; // ISO
}
