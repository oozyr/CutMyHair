import type { Shop, Booking, AvailabilitySlot, Break, DayHours } from './types';

const SLOT_MINUTES = 30;

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToIso(dateStr: string, minutes: number): string {
  const baseMs = Date.parse(`${dateStr}T00:00:00+08:00`);
  return new Date(baseMs + minutes * 60000).toISOString();
}

function isBlockedByBreak(
  slotStart: number,
  serviceEnd: number,
  breaks: Break[],
): boolean {
  return breaks.some((b) => {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    // Interval [slotStart, serviceEnd) overlaps [bStart, bEnd)
    return slotStart < bEnd && serviceEnd > bStart;
  });
}

function isBlockedByBooking(
  slotStart: number,
  serviceEnd: number,
  dateStr: string,
  existingBookings: Booking[],
  barberId: string,
): boolean {
  const baseMs = Date.parse(`${dateStr}T00:00:00+08:00`);

  return existingBookings
    .filter((b) => b.barberId === barberId && b.status !== 'cancelled')
    .some((b) => {
      const bStartMs = Date.parse(b.startTime);
      const bEndMs = Date.parse(b.endTime);

      const bStartMin = (bStartMs - baseMs) / 60000;
      const bEndMin = (bEndMs - baseMs) / 60000;

      // Interval [slotStart, serviceEnd) overlaps [bStartMin, bEndMin)
      return slotStart < bEndMin && serviceEnd > bStartMin;
    });
}

/**
 * Build 30-minute availability slots for a specific barber on a given date.
 * Slots step in fixed 30-minute increments.
 * A slot is available only if the service duration fits before the next booking, break, or shop close.
 *
 * @param shop Shop entity with openingHours
 * @param barberId The barber to build slots for
 * @param dateStr "YYYY-MM-DD"
 * @param bookings All existing bookings
 * @param serviceDurationMinutes Duration of the service to be accommodated (default 30)
 */
export function buildSlots(
  shop: Shop,
  barberId: string,
  dateStr: string,
  bookings: Booking[],
  serviceDurationMinutes = 30,
): AvailabilitySlot[] {
  // Determine day of week in UTC representation of YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat

  const dayHours: DayHours | undefined = shop.openingHours[dayOfWeek];
  if (!dayHours || !dayHours.open) {
    return [];
  }

  const openMin = timeToMinutes(dayHours.openTime);
  const closeMin = timeToMinutes(dayHours.closeTime);
  const breaks = dayHours.breaks;

  const slots: AvailabilitySlot[] = [];

  for (
    let slotStart = openMin;
    slotStart + SLOT_MINUTES <= closeMin;
    slotStart += SLOT_MINUTES
  ) {
    const slotEnd = slotStart + SLOT_MINUTES;
    const serviceEnd = slotStart + serviceDurationMinutes;

    // Service cannot extend past closing time
    const exceedsClosing = serviceEnd > closeMin;

    // Must not overlap any break
    const blockedByBreak =
      exceedsClosing || isBlockedByBreak(slotStart, serviceEnd, breaks);

    // Must not overlap any active booking for this barber
    const blockedByBooking =
      !blockedByBreak &&
      isBlockedByBooking(
        slotStart,
        serviceEnd,
        dateStr,
        bookings,
        barberId,
      );

    slots.push({
      barberId,
      startTime: minutesToIso(dateStr, slotStart),
      endTime: minutesToIso(dateStr, slotEnd),
      available: !blockedByBreak && !blockedByBooking,
    });
  }

  return slots;
}
