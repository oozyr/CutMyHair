import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme';
import type { Shop, AvailabilitySlot } from '@cutmyhair/shared';

export interface DateTimeSlotPickerProps {
  shop: Shop;
  selectedDate: string | null;
  slots: AvailabilitySlot[];
  loadingSlots: boolean;
  errorSlots: string | null;
  slotConflictMsg?: string | null;
  onPickDate: (date: string) => void;
  onPickSlot: (slot: AvailabilitySlot) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

/** Returns YYYY-MM-DD for a Date in MYT (UTC+8). */
export function toMYTDate(d: Date): string {
  const myt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return myt.toISOString().slice(0, 10);
}

/** Returns today in MYT as YYYY-MM-DD. */
export function todayMYT(): string {
  return toMYTDate(new Date());
}

/** 0=Sunday...6=Saturday -> 'monday' etc. */
export function dayKey(date: Date): string {
  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const myt = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return keys[myt.getUTCDay()];
}

/** "09:00 AM" from ISO string */
export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

/** Generate the next 14 calendar dates starting from today in MYT. */
export function next14Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    days.push(toMYTDate(d));
  }
  return days;
}

/** Is this YYYY-MM-DD a day the shop is open? */
export function isShopOpen(shop: Shop, dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const key = dayKey(date);
  const hours = (shop.openingHours as Record<string, { open: boolean } | undefined>)[key];
  return !!(hours && hours.open);
}

export function DateTimeSlotPicker({
  shop,
  selectedDate,
  slots,
  loadingSlots,
  errorSlots,
  slotConflictMsg,
  onPickDate,
  onPickSlot,
  t,
}: DateTimeSlotPickerProps) {
  const days = next14Days();

  return (
    <View style={styles.container}>
      {slotConflictMsg ? (
        <View style={styles.conflictBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.conflictText}>{slotConflictMsg}</Text>
        </View>
      ) : null}

      {/* Date strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateStrip}
        contentContainerStyle={styles.dateStripContent}
      >
        {days.map((dateStr) => {
          const open = isShopOpen(shop, dateStr);
          const selected = dateStr === selectedDate;
          const [, m, d] = dateStr.split('-');
          const dateObj = new Date(Date.UTC(Number(dateStr.slice(0, 4)), Number(m) - 1, Number(d)));
          const dayName = dateObj.toLocaleDateString('en-MY', { weekday: 'short', timeZone: 'UTC' });
          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.dateChip,
                selected && styles.dateChipSelected,
                !open && styles.dateChipClosed,
              ]}
              onPress={() => open && onPickDate(dateStr)}
              disabled={!open}
              activeOpacity={open ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.dateDayName,
                  selected && styles.dateDayNameSelected,
                  !open && styles.dateChipClosedText,
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  styles.dateDayNum,
                  selected && styles.dateDayNumSelected,
                  !open && styles.dateChipClosedText,
                ]}
              >
                {Number(d)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Slots */}
      <ScrollView style={styles.slotsScroll} contentContainerStyle={styles.slotsContent}>
        {!selectedDate ? (
          <View style={styles.centered}>
            <Ionicons name="calendar-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>{t('booking.selectDateTime')}</Text>
          </View>
        ) : loadingSlots ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>{t('booking.loadingSlots')}</Text>
          </View>
        ) : errorSlots ? (
          <View style={styles.centered}>
            <Text style={styles.errorMsg}>{errorSlots}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.slotsTitle}>{t('booking.availableSlots')}</Text>
            {slots.filter((s) => s.available).length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="time-outline" size={40} color={colors.border} />
                <Text style={styles.emptyText}>{t('booking.noSlots')}</Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {slots
                  .filter((s) => s.available)
                  .map((slot) => (
                    <TouchableOpacity
                      key={slot.startTime}
                      style={styles.slotChip}
                      onPress={() => onPickSlot(slot)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.slotChipText}>{formatSlotTime(slot.startTime)}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    gap: spacing[3],
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  errorMsg: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    padding: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    borderWidth: 1,
    borderColor: colors.warning,
  },
  conflictText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  dateStrip: {
    flexGrow: 0,
    paddingVertical: spacing[2],
  },
  dateStripContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  dateChip: {
    width: 52,
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dateChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dateChipClosed: {
    opacity: 0.38,
  },
  dateChipClosedText: {
    color: colors.textDisabled,
  },
  dateDayName: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  dateDayNameSelected: {
    color: colors.textInverse,
  },
  dateDayNum: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    marginTop: 2,
  },
  dateDayNumSelected: {
    color: colors.textInverse,
  },
  slotsScroll: {
    flex: 1,
  },
  slotsContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    flexGrow: 1,
  },
  slotsTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginBottom: spacing[3],
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  slotChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  slotChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.accent,
  },
});
