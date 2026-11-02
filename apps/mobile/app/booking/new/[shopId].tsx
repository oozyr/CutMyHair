import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api } from '@/api';
import { DEMO_CUSTOMER } from '@/config/demoCustomer';
import {
  formatSen,
  SERVICE_MARKUP_SEN,
  REFUND_CUTOFF_HOURS,
  type Shop,
  type Barber,
  type Service,
  type AvailabilitySlot,
  type PaymentMethod,
} from '@cutmyhair/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 1 | 2 | 3 | 4;

interface BookingState {
  step: Step;
  shop: Shop | null;
  services: Service[];
  barbers: Barber[];
  selectedService: Service | null;
  selectedBarber: Barber | null; // null = "any barber" chosen
  isAnyBarber: boolean;
  resolvedBarberId: string | null; // barber id resolved for "any barber"
  selectedDate: string | null; // YYYY-MM-DD
  selectedSlot: AvailabilitySlot | null;
  slots: AvailabilitySlot[];
  selectedPaymentMethod: PaymentMethod | null;
}

const INITIAL_STATE: Omit<BookingState, 'step' | 'shop' | 'services' | 'barbers'> = {
  selectedService: null,
  selectedBarber: null,
  isAnyBarber: false,
  resolvedBarberId: null,
  selectedDate: null,
  selectedSlot: null,
  slots: [],
  selectedPaymentMethod: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Returns YYYY-MM-DD for a Date in MYT (UTC+8). */
function toMYTDate(d: Date): string {
  const myt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return myt.toISOString().slice(0, 10);
}

/** Returns today in MYT as YYYY-MM-DD. */
function todayMYT(): string {
  return toMYTDate(new Date());
}

/** 0=Sunday…6=Saturday -> 'monday' etc. */
function dayKey(date: Date): number {
  // date is a local JS date; we need day-of-week in MYT
  const myt = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return myt.getUTCDay();
}

/** Short display: "Mon 3 Nov" */
function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** "3 Nov 2026" */
function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "09:00 AM" from ISO string */
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

/** Generate the next 14 calendar dates starting from today in MYT. */
function next14Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    days.push(toMYTDate(d));
  }
  return days;
}

/** Is this YYYY-MM-DD a day the shop is open? */
function isShopOpen(shop: Shop, dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const key = dayKey(date);
  const hours = (shop.openingHours as Record<string, { open: boolean } | undefined>)[key];
  return !!(hours && hours.open);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progressBar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            i < step ? styles.progressSegmentActive : styles.progressSegmentInactive,
            i < total - 1 ? { marginRight: spacing[1] } : undefined,
          ]}
        />
      ))}
    </View>
  );
}

function StepHeader({
  step,
  total,
  title,
  onBack,
  t,
}: {
  step: number;
  total: number;
  title: string;
  onBack: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <View style={styles.stepHeader}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.stepHeaderCenter}>
        <Text style={styles.stepLabel}>
          {t('booking.step')} {step} {t('booking.of')} {total}
        </Text>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <View style={styles.backBtnPlaceholder} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function BookingScreen() {
  const params = useLocalSearchParams<{ id?: string; shopId?: string }>();
  const shopId = params.shopId || params.id;
  const router = useRouter();
  const { t } = useLanguage();

  const [state, setState] = useState<BookingState>({
    step: 1,
    shop: null,
    services: [],
    barbers: [],
    ...INITIAL_STATE,
  });

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorInitial, setErrorInitial] = useState<string | null>(null);
  const [errorSlots, setErrorSlots] = useState<string | null>(null);
  const [slotConflictMsg, setSlotConflictMsg] = useState<string | null>(null);

  // -- Load shop + services + barbers on mount
  const loadInitialData = useCallback(async () => {
    if (!shopId) return;
    setLoadingInitial(true);
    setErrorInitial(null);
    try {
      const [shop, services, barbers] = await Promise.all([
        api.getShop(shopId),
        api.getServices(shopId),
        api.getBarbers(shopId),
      ]);
      setState((prev) => ({ ...prev, shop, services, barbers }));
    } catch (e: unknown) {
      setErrorInitial(e instanceof Error ? e.message : t('booking.errorMessage'));
    } finally {
      setLoadingInitial(false);
    }
  }, [shopId, t]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // -- Load slots whenever date or barber/service changes in step 3
  const loadSlots = useCallback(async (
    shop: Shop,
    barbers: Barber[],
    service: Service,
    selectedBarber: Barber | null,
    isAnyBarber: boolean,
    date: string,
  ) => {
    setLoadingSlots(true);
    setErrorSlots(null);
    setSlotConflictMsg(null);
    try {
      if (isAnyBarber) {
        // Try each barber who can do this service; pick first with available slots
        const capable = barbers.filter((b) => b.serviceIds.includes(service.id));
        let found: { barberId: string; slots: AvailabilitySlot[] } | null = null;

        for (const barber of capable) {
          const slots = await api.getSlots(shop.id, barber.id, date, service.id);
          const available = filterPastSlots(slots, date);
          if (available.some((s) => s.available)) {
            found = { barberId: barber.id, slots: available };
            break;
          }
        }

        if (found) {
          setState((prev) => ({
            ...prev,
            resolvedBarberId: found!.barberId,
            slots: found!.slots,
          }));
        } else {
          // No barber available - still show empty state slots
          setState((prev) => ({ ...prev, resolvedBarberId: null, slots: [] }));
        }
      } else if (selectedBarber) {
        const slots = await api.getSlots(shop.id, selectedBarber.id, date, service.id);
        const filtered = filterPastSlots(slots, date);
        setState((prev) => ({ ...prev, slots: filtered }));
      }
    } catch (e: unknown) {
      setErrorSlots(e instanceof Error ? e.message : t('booking.errorMessage'));
    } finally {
      setLoadingSlots(false);
    }
  }, [t]);

  /** Remove slots whose startTime is already in the past (for today only). */
  function filterPastSlots(slots: AvailabilitySlot[], date: string): AvailabilitySlot[] {
    if (date !== todayMYT()) return slots;
    const now = Date.now();
    return slots.filter((s) => new Date(s.startTime).getTime() > now);
  }

  // -- Navigation
  function goBack() {
    if (state.step === 1) {
      router.back();
    } else {
      setState((prev) => ({ ...prev, step: (prev.step - 1) as Step }));
    }
  }

  // -- Step 1: pick service
  function pickService(service: Service) {
    setState((prev) => ({
      ...prev,
      selectedService: service,
      // reset downstream choices
      selectedBarber: null,
      isAnyBarber: false,
      resolvedBarberId: null,
      selectedDate: null,
      selectedSlot: null,
      slots: [],
      step: 2,
    }));
  }

  // -- Step 2: pick barber
  function pickBarber(barber: Barber | null, isAny: boolean) {
    setState((prev) => ({
      ...prev,
      selectedBarber: barber,
      isAnyBarber: isAny,
      resolvedBarberId: isAny ? null : barber?.id ?? null,
      selectedDate: null,
      selectedSlot: null,
      slots: [],
      step: 3,
    }));
  }

  // -- Step 3: pick date
  function pickDate(date: string) {
    const { shop, barbers, selectedService, selectedBarber, isAnyBarber } = state;
    if (!shop || !selectedService) return;
    setState((prev) => ({ ...prev, selectedDate: date, selectedSlot: null, slots: [] }));
    loadSlots(shop, barbers, selectedService, selectedBarber, isAnyBarber, date);
  }

  // -- Step 3: pick slot
  function pickSlot(slot: AvailabilitySlot) {
    setState((prev) => ({ ...prev, selectedSlot: slot, step: 4 }));
  }

  // -- Step 4: confirm booking
  async function confirmBooking() {
    const { shop, selectedService, selectedBarber, isAnyBarber, resolvedBarberId, selectedSlot, selectedPaymentMethod } = state;
    if (!shop || !selectedService || !selectedSlot || !selectedPaymentMethod) return;

    const barberId = isAnyBarber ? resolvedBarberId : selectedBarber?.id;
    if (!barberId) return;

    setSubmitting(true);
    setSlotConflictMsg(null);
    try {
      const booking = await api.createBooking({
        customerId: DEMO_CUSTOMER.id,
        shopId: shop.id,
        barberId,
        serviceId: selectedService.id,
        startTime: selectedSlot.startTime,
        paymentMethod: selectedPaymentMethod,
      });

      // Start payment
      const { paymentUrl } = await api.startPayment(booking.id);

      // Navigate to payment screen
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace({
        pathname: '/booking/payment/[bookingId]' as any,
        params: {
          bookingId: booking.id,
          paymentUrl,
          expiresAt: booking.expiresAt || '',
          totalSen: String(booking.customerTotalSen),
        },
      } as any);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.toLowerCase().includes('already booked') || msg.toLowerCase().includes('slot')) {
        setSlotConflictMsg(t('booking.slotTaken'));
        // Go back to step 3 and reload
        setState((prev) => ({ ...prev, step: 3, selectedSlot: null, slots: [] }));
        if (state.shop && state.selectedService && state.selectedDate) {
          loadSlots(
            state.shop,
            state.barbers,
            state.selectedService,
            state.selectedBarber,
            state.isAnyBarber,
            state.selectedDate,
          );
        }
      } else {
        setSlotConflictMsg(t('booking.errorCreating'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  if (loadingInitial) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t('booking.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorInitial) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>{t('booking.errorTitle')}</Text>
          <Text style={styles.errorMsg}>{errorInitial}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadInitialData}>
            <Text style={styles.retryBtnText}>{t('booking.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!state.shop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>{t('booking.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProgressBar step={state.step} total={4} />

      {state.step === 1 && (
        <Step1Services
          services={state.services}
          onBack={goBack}
          onSelect={pickService}
          t={t}
        />
      )}
      {state.step === 2 && state.selectedService && (
        <Step2Barbers
          barbers={state.barbers.filter((b) => b.serviceIds.includes(state.selectedService!.id))}
          onBack={goBack}
          onSelect={pickBarber}
          t={t}
        />
      )}
      {state.step === 3 && state.shop && state.selectedService && (
        <Step3DateTime
          shop={state.shop}
          selectedDate={state.selectedDate}
          slots={state.slots}
          loadingSlots={loadingSlots}
          errorSlots={errorSlots}
          slotConflictMsg={slotConflictMsg}
          onBack={goBack}
          onPickDate={pickDate}
          onPickSlot={pickSlot}
          t={t}
        />
      )}
      {state.step === 4 && state.shop && state.selectedService && state.selectedSlot && (
        <Step4Summary
          shop={state.shop}
          service={state.selectedService}
          barberName={
            state.isAnyBarber
              ? (state.barbers.find((b) => b.id === state.resolvedBarberId)?.name ?? t('booking.anyBarber'))
              : (state.selectedBarber?.name ?? t('booking.anyBarber'))
          }
          slot={state.selectedSlot}
          submitting={submitting}
          slotConflictMsg={slotConflictMsg}
          selectedPaymentMethod={state.selectedPaymentMethod}
          onSelectPaymentMethod={(m) => setState((prev) => ({ ...prev, selectedPaymentMethod: m }))}
          onBack={goBack}
          onConfirm={confirmBooking}
          t={t}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Step 1 - Services
// ---------------------------------------------------------------------------
function Step1Services({
  services,
  onBack,
  onSelect,
  t,
}: {
  services: Service[];
  onBack: () => void;
  onSelect: (s: Service) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <View style={styles.stepContainer}>
      <StepHeader step={1} total={4} title={t('booking.selectService')} onBack={onBack} t={t} />
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.serviceCard} onPress={() => onSelect(item)} activeOpacity={0.7}>
            <View style={styles.serviceCardLeft}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.serviceMeta}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />{' '}
                {item.durationMinutes} {t('booking.duration').replace('{{min}}', '')}
              </Text>
            </View>
            <View style={styles.serviceCardRight}>
              <Text style={styles.servicePrice}>{formatSen(item.customerPriceSen ?? item.price)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{t('booking.noSlots')}</Text>
          </View>
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 2 - Barbers
// ---------------------------------------------------------------------------
function Step2Barbers({
  barbers,
  onBack,
  onSelect,
  t,
}: {
  barbers: Barber[];
  onBack: () => void;
  onSelect: (b: Barber | null, isAny: boolean) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  return (
    <View style={styles.stepContainer}>
      <StepHeader step={2} total={4} title={t('booking.selectBarber')} onBack={onBack} t={t} />
      <FlatList
        data={barbers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.barberCard, styles.anyBarberCard]}
            onPress={() => onSelect(null, true)}
            activeOpacity={0.7}
          >
            <View style={styles.barberAvatar}>
              <Ionicons name="shuffle-outline" size={26} color={colors.accent} />
            </View>
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>{t('booking.anyBarber')}</Text>
              <Text style={styles.barberDesc}>{t('booking.anyBarberDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.barberCard}
            onPress={() => onSelect(item, false)}
            activeOpacity={0.7}
          >
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={styles.barberAvatar} />
            ) : (
              <View style={styles.barberAvatar}>
                <Ionicons name="person" size={26} color={colors.textDisabled} />
              </View>
            )}
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>{item.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3 - Date + Time
// ---------------------------------------------------------------------------
function Step3DateTime({
  shop,
  selectedDate,
  slots,
  loadingSlots,
  errorSlots,
  slotConflictMsg,
  onBack,
  onPickDate,
  onPickSlot,
  t,
}: {
  shop: Shop;
  selectedDate: string | null;
  slots: AvailabilitySlot[];
  loadingSlots: boolean;
  errorSlots: string | null;
  slotConflictMsg: string | null;
  onBack: () => void;
  onPickDate: (d: string) => void;
  onPickSlot: (s: AvailabilitySlot) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const days = next14Days();

  return (
    <View style={styles.stepContainer}>
      <StepHeader step={3} total={4} title={t('booking.selectDateTime')} onBack={onBack} t={t} />

      {slotConflictMsg ? (
        <View style={styles.conflictBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.warning} />
          <Text style={styles.conflictText}>{slotConflictMsg}</Text>
        </View>
      ) : null}

      {/* Date strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip} contentContainerStyle={styles.dateStripContent}>
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
              <Text style={[styles.dateDayName, selected && styles.dateDayNameSelected, !open && styles.dateChipClosedText]}>
                {dayName}
              </Text>
              <Text style={[styles.dateDayNum, selected && styles.dateDayNumSelected, !open && styles.dateChipClosedText]}>
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
                {slots.filter((s) => s.available).map((slot) => (
                  <TouchableOpacity
                    key={slot.startTime}
                    style={styles.slotChip}
                    onPress={() => onPickSlot(slot)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.slotChipText}>{formatTime(slot.startTime)}</Text>
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

// ---------------------------------------------------------------------------
// Step 4 - Summary + Payment Method
// ---------------------------------------------------------------------------
type PaymentMethodOption = {
  id: 'fpx' | 'card' | 'duitnow' | 'ewallet';
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'fpx', icon: 'business-outline' },
  { id: 'card', icon: 'card-outline' },
  { id: 'duitnow', icon: 'qr-code-outline' },
  { id: 'ewallet', icon: 'wallet-outline' },
];

function Step4Summary({
  shop,
  service,
  barberName,
  slot,
  submitting,
  slotConflictMsg,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onBack,
  onConfirm,
  t,
}: {
  shop: Shop;
  service: Service;
  barberName: string;
  slot: AvailabilitySlot;
  submitting: boolean;
  slotConflictMsg: string | null;
  selectedPaymentMethod: 'fpx' | 'card' | 'duitnow' | 'ewallet' | null;
  onSelectPaymentMethod: (m: 'fpx' | 'card' | 'duitnow' | 'ewallet') => void;
  onBack: () => void;
  onConfirm: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  // Use customerPriceSen; fall back to price if not yet in response
  const customerPriceSen = service.customerPriceSen ?? (service.price + SERVICE_MARKUP_SEN);
  const markupRm = (SERVICE_MARKUP_SEN / 100).toFixed(2);

  const slotDate = slot.startTime.slice(0, 10);
  const displayDate = formatDateLong(slotDate);
  const displayTime = formatTime(slot.startTime);

  const rows: { label: string; value: string; accent?: boolean }[] = [
    { label: t('booking.shopLabel'), value: shop.name },
    { label: t('booking.serviceLabel'), value: service.name },
    { label: t('booking.barberLabel'), value: barberName },
    { label: t('booking.dateLabel'), value: displayDate },
    { label: t('booking.timeLabel'), value: displayTime },
    { label: t('booking.priceLabel'), value: formatSen(customerPriceSen), accent: true },
  ];

  const canConfirm = !!selectedPaymentMethod && !submitting;

  return (
    <View style={styles.stepContainer}>
      <StepHeader step={4} total={4} title={t('booking.summary')} onBack={onBack} t={t} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent}>
        {/* Booking details */}
        <View style={styles.summaryCard}>
          {rows.map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={[styles.summaryValue, row.accent && styles.summaryValueAccent]}>
                {row.value}
              </Text>
            </View>
          ))}
          <Text style={styles.feeNote}>
            {t('booking.bookingFeeNote', { amount: markupRm })}
          </Text>
          <Text style={styles.cancellationNote}>
            {t('booking.cancellationPolicy', { hours: REFUND_CUTOFF_HOURS })}
          </Text>
        </View>

        {/* Payment method picker */}
        <Text style={styles.paymentSectionTitle}>{t('booking.paymentMethod')}</Text>
        {PAYMENT_METHODS.map((method) => {
          const selected = selectedPaymentMethod === method.id;
          return (
            <TouchableOpacity
              key={method.id}
              style={[styles.paymentRow, selected && styles.paymentRowSelected]}
              onPress={() => onSelectPaymentMethod(method.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIcon, selected && styles.paymentIconSelected]}>
                <Ionicons name={method.icon} size={20} color={selected ? colors.textInverse : colors.textSecondary} />
              </View>
              <Text style={[styles.paymentLabel, selected && styles.paymentLabelSelected]}>
                {t(`booking.${method.id}`)}
              </Text>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {slotConflictMsg ? (
          <View style={styles.conflictBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <Text style={styles.conflictText}>{slotConflictMsg}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.confirmFooter}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={!canConfirm}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {selectedPaymentMethod
                ? t('booking.payBtn', { amount: formatSen(customerPriceSen) })
                : t('booking.choosPaymentMethod')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  errorTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    textAlign: 'center',
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
  retryBtn: {
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.accent,
    borderRadius: radius.md,
  },
  retryBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },

  // Progress bar
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[1],
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
  progressSegmentActive: {
    backgroundColor: colors.accent,
  },
  progressSegmentInactive: {
    backgroundColor: colors.divider,
  },

  // Step header
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  backBtnPlaceholder: {
    width: 40,
  },
  stepHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    marginTop: 2,
  },

  stepContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },

  // Service cards
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  serviceCardLeft: {
    flex: 1,
  },
  serviceCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  serviceName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginBottom: 4,
  },
  serviceMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  servicePrice: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.accent,
  },

  // Barber cards
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
    gap: spacing[3],
  },
  anyBarberCard: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  barberAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
  barberDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Date strip
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

  // Slots
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

  // Summary
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
    gap: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    flex: 1,
    textAlign: 'right',
  },
  summaryValueAccent: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
  },
  payAtShopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#ECFDF5',
    padding: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[2],
  },
  payAtShopText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },

  // Conflict banner
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    padding: spacing[3],
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

  // Confirm footer
  confirmFooter: {
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.lg,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },

  // Payment method picker
  paymentSectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginTop: spacing[5],
    marginBottom: spacing[3],
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing[3],
    ...shadow.sm,
  },
  paymentRowSelected: {
    borderColor: colors.accent,
    backgroundColor: '#F0F9FF',
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconSelected: {
    backgroundColor: colors.accent,
  },
  paymentLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  paymentLabelSelected: {
    color: colors.accent,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  feeNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
  cancellationNote: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
});
