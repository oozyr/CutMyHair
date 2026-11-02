import type { Shop } from './types';

/**
 * Evaluates whether a shop is currently open based on Malaysian time (UTC+8).
 */
export function isShopOpenNow(shop: Shop, date: Date = new Date()): boolean {
  if (!shop.openingHours) return false;

  // Convert date to Malaysian time (MYT is UTC+8)
  const mytTime = date.getTime() + 8 * 60 * 60 * 1000;
  const mytDate = new Date(mytTime);
  const day = mytDate.getUTCDay();

  const dayHours = shop.openingHours[day];
  if (!dayHours || !dayHours.open) return false;

  const [openH, openM] = dayHours.openTime.split(':').map(Number);
  const [closeH, closeM] = dayHours.closeTime.split(':').map(Number);
  const currentMinutes = mytDate.getUTCHours() * 60 + mytDate.getUTCMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) return false;

  if (dayHours.breaks && Array.isArray(dayHours.breaks)) {
    for (const b of dayHours.breaks) {
      const [bStartH, bStartM] = b.startTime.split(':').map(Number);
      const [bEndH, bEndM] = b.endTime.split(':').map(Number);
      const startMin = bStartH * 60 + bStartM;
      const endMin = bEndH * 60 + bEndM;
      if (currentMinutes >= startMin && currentMinutes < endMin) {
        return false;
      }
    }
  }

  return true;
}
