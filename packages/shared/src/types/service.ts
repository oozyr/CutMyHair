export interface Service {
  id: string;
  shopId: string;
  name: string;
  nameMs: string;        // Bahasa Malaysia name
  price: number;         // Price in integer sen (RM 1 = 100 sen)
  priceSen?: number;     // Optional explicit sen field alias
  customerPriceSen?: number; // Final price including platform markup
  durationMinutes: number;
  description: string;
}
