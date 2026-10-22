import type { Shop, Booking, AvailabilitySlot, Break, DayHours } from './types';

const SLOT_MINUTES = 30;

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToIso(dateStr: string, minutes: number): string {
  const d = new Date(dateStr + 'T00:00:00+08:00');
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function isBlockedByBreak(
  slotStart: number,
  slotEnd: number,
  breaks: Break[],
): boolean {
  return breaks.some((b) => {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    // Slot overlaps break
    return slotStart < bEnd && slotEnd > bStart;
  });
}

function isBlockedByBooking(
  slotStart: number,
  slotEnd: number,
  dateStr: string,
  existingBookings: Booking[],
  barberId: string,
): boolean {
  return existingBookings
    .filter((b) => b.barberId === barberId && b.status !== 'cancelled')
    .some((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      const baseDate = new Date(dateStr + 'T00:00:00+08:00');
      const bStartMin =
        (bStart.getTime() - baseDate.getTime()) / 60000;
      const bEndMin =
        (bEnd.getTime() - baseDate.getTime()) / 60000;
      return slotStart < bEndMin && slotEnd > bStartMin;
    });
}

/**
 * Build 30-minute availability slots for a specific barber on a given date.
 * Filters out breaks and existing bookings.
 * Only returns slots where the service duration fits before the next block.
 *
 * @param shop       The shop entity with openingHours
 * @param barberId   The barber to build slots for
 * @param dateStr    "YYYY-MM-DD" in MYT (UTC+8)
 * @param bookings   All bookings (filtered internally by barberId and date)
 * @param serviceDurationMinutes  Duration of the service being booked
 */
export function buildSlots(
  shop: Shop,
  barberId: string,
  dateStr: string,
  bookings: Booking[],
  serviceDurationMinutes: number,
): AvailabilitySlot[] {
  const date = new Date(dateStr + 'T00:00:00+08:00');
  const dayOfWeek = date.getDay(); // 0=Sun
  const dayHours: DayHours | undefined = shop.openingHours[dayOfWeek];

  if (!dayHours || !dayHours.open) return [];

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
    // Check if service fits before next block
    const serviceEnd = slotStart + serviceDurationMinutes;

    const blockedByBreak =
      isBlockedByBreak(slotStart, serviceEnd, breaks) ||
      isBlockedByBreak(slotStart, slotEnd, breaks);

    const blockedByBooking = isBlockedByBooking(
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
