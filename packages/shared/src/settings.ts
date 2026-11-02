/**
 * Global settings and financial calculation helpers for CutMyHair.
 * All monetary amounts are stored as integer sen (RM 1 = 100 sen).
 */

/**
 * Flat markup added to every service price shown to customers.
 * This fee is retained by CutMyHair.
 */
export const SERVICE_MARKUP_SEN = 500;

/**
 * CutMyHair processing and platform fee percentage on every booking.
 * Calculated on the base service price, not including the markup.
 */
export const PLATFORM_FEE_PERCENT = 3;

/**
 * Split percentage if a customer fails to attend their appointment.
 * 70% goes to the shop, 30% goes to CutMyHair.
 */
export const NOSHOW_DEPOSIT_SPLIT = {
  shop: 70,
  cutmyhair: 30,
} as const;

export interface BookingAmounts {
  /** Base service price set by shop in sen */
  servicePriceSen: number;
  /** CutMyHair flat markup in sen */
  markupSen: number;
  /** Total price charged to customer in sen (servicePriceSen + markupSen) */
  customerTotalSen: number;
  /** Platform processing fee retained by CutMyHair in sen */
  platformFeeSen: number;
  /** Final amount paid out to shop in sen (servicePriceSen - platformFeeSen) */
  shopPayoutSen: number;
}

/**
 * Pure calculation function for booking pricing and fee breakdown.
 *
 * @param servicePriceSen Base service price in integer sen
 * @returns Breakdown of customer total, platform fee, markup, and shop payout
 */
export function calculateBookingAmounts(servicePriceSen: number): BookingAmounts {
  const safeBasePrice = Math.max(0, Math.round(Number.isFinite(servicePriceSen) ? servicePriceSen : 0));
  const markupSen = SERVICE_MARKUP_SEN;
  const customerTotalSen = safeBasePrice + markupSen;
  const platformFeeSen = Math.round((safeBasePrice * PLATFORM_FEE_PERCENT) / 100);
  const shopPayoutSen = safeBasePrice - platformFeeSen;

  return {
    servicePriceSen: safeBasePrice,
    markupSen,
    customerTotalSen,
    platformFeeSen,
    shopPayoutSen,
  };
}
