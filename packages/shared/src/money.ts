/**
 * Money utilities for CutMyHair.
 * All monetary amounts are stored as integer sen (RM 1 = 100 sen).
 */

/**
 * Format an integer sen amount into Malaysian Ringgit display string.
 * Example: 1500 -> "RM 15.00"
 */
export function formatSen(sen: number): string {
  const safeSen = Math.round(Number.isFinite(sen) ? sen : 0);
  const ringgit = (safeSen / 100).toFixed(2);
  return `RM ${ringgit}`;
}

/**
 * Convert integer sen to Ringgit floating number.
 * Example: 1550 -> 15.5
 */
export function senToRm(sen: number): number {
  return (Number.isFinite(sen) ? sen : 0) / 100;
}

/**
 * Convert Ringgit number or string to integer sen.
 * Example: 15.50 -> 1550
 */
export function rmToSen(rm: number | string): number {
  const numeric = typeof rm === 'string' ? parseFloat(rm.replace(/[^0-9.-]/g, '')) : rm;
  return Math.round((Number.isFinite(numeric) ? numeric : 0) * 100);
}
