export interface AvailabilitySlot {
  barberId: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  available: boolean;
}
