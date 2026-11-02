import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api } from '@/api';
import { formatSen, REFUND_CUTOFF_HOURS, type Booking, type Shop, type Barber, type Service, type AvailabilitySlot } from '@cutmyhair/shared';
import { DateTimeSlotPicker, formatSlotTime } from '@/components/DateTimeSlotPicker';
import { CheckInQRModal } from '@/components/CheckInQRModal';

export default function BookingDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <BookingDetailScreen bookingId={params.id || ''} />;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatBookingTimeRange(startIso: string, endIso: string): string {
  const start = formatSlotTime(startIso);
  const end = formatSlotTime(endIso);
  return `${start} - ${end}`;
}

function getStatusBadgeStyle(status: Booking['status']) {
  switch (status) {
    case 'pending':
    case 'pending_payment':
      return { bg: '#FEF3C7', text: colors.statusPending };
    case 'confirmed':
      return { bg: '#DBEAFE', text: colors.statusConfirmed };
    case 'checked_in':
      return { bg: '#EDE9FE', text: colors.statusCheckedIn };
    case 'completed':
      return { bg: '#D1FAE5', text: colors.statusCompleted };
    case 'cancelled':
    default:
      return { bg: '#F3F4F6', text: colors.statusCancelled };
  }
}

function getPaymentStatusBadgeStyle(status: Booking['paymentStatus']) {
  switch (status) {
    case 'paid':
      return { bg: '#D1FAE5', text: colors.success };
    case 'refund_pending':
      return { bg: '#DBEAFE', text: colors.statusConfirmed };
    case 'failed':
      return { bg: '#FEE2E2', text: colors.error };
    case 'pending':
    default:
      return { bg: '#FEF3C7', text: colors.statusPending };
  }
}

function getPaymentStatusLabel(status: Booking['paymentStatus'], t: (k: string) => string): string {
  switch (status) {
    case 'paid':
      return t('bookingDetail.paymentStatusPaid');
    case 'pending':
      return t('bookingDetail.paymentStatusPending');
    case 'refund_pending':
      return t('bookingDetail.paymentStatusRefundPending');
    case 'failed':
      return t('bookingDetail.paymentStatusFailed');
    default:
      return status;
  }
}

function getPaymentMethodLabel(method: Booking['paymentMethod'], t: (k: string) => string): string {
  switch (method) {
    case 'fpx':
      return t('booking.fpx');
    case 'card':
      return t('booking.card');
    case 'duitnow':
      return t('booking.duitnow');
    case 'ewallet':
      return t('booking.ewallet');
    default:
      return method || '';
  }
}

function BookingDetailScreen({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [service, setService] = useState<Service | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check-in QR modal
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState<{ code: string; payload: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Reschedule state
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<AvailabilitySlot | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [errorRescheduleSlots, setErrorRescheduleSlots] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleConflict, setRescheduleConflict] = useState<string | null>(null);

  // Cancel state
  const [cancelling, setCancelling] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const b = await api.getBooking(bookingId);
      setBooking(b);

      const [s, barbers, services] = await Promise.all([
        api.getShop(b.shopId).catch(() => null),
        api.getBarbers(b.shopId).catch(() => []),
        api.getServices(b.shopId).catch(() => []),
      ]);

      setShop(s);
      setBarber(barbers.find((item) => item.id === b.barberId) || null);
      setService(services.find((item) => item.id === b.serviceId) || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('bookingDetail.errorMessage'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Check-in timing
  const now = Date.now();
  const startMs = booking ? new Date(booking.startTime).getTime() : 0;
  const endMs = booking ? new Date(booking.endTime).getTime() : 0;
  const windowStartMs = startMs - 60 * 60 * 1000;
  const canCheckIn =
    booking &&
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    now >= windowStartMs &&
    now <= endMs;
  const isCheckedIn = booking?.status === 'checked_in';
  const isPast = booking ? now > endMs : false;
  const isCancelled = booking?.status === 'cancelled';
  const isCompleted = booking?.status === 'completed';

  // Handle open Check-in QR
  async function handleOpenCheckIn() {
    if (!booking) return;
    setQrLoading(true);
    try {
      const data = await api.getCheckInCode(booking.id);
      setQrData(data);
      setQrModalVisible(true);
    } catch (err: unknown) {
      Alert.alert(
        t('bookingDetail.errorTitle'),
        err instanceof Error ? err.message : t('bookingDetail.errorMessage'),
      );
    } finally {
      setQrLoading(false);
    }
  }

  // Handle Cancel
  function handleCancelPress() {
    if (!booking) return;

    const hoursUntilStart =
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    const refundApplies = booking.paymentStatus === 'paid' && hoursUntilStart > REFUND_CUTOFF_HOURS;
    const policyMsg = refundApplies
      ? t('bookingDetail.cancelWithRefundMessage', { hours: REFUND_CUTOFF_HOURS })
      : t('bookingDetail.cancelNoRefundMessage', { hours: REFUND_CUTOFF_HOURS });

    const message = `${t('bookingDetail.cancelConfirmMessage', {
      barber: barber?.name || '',
      shop: shop?.name || '',
    })}\n\n${policyMsg}`;

    Alert.alert(
      t('bookingDetail.cancelConfirmTitle'),
      message,
      [
        { text: t('bookingDetail.cancelKeep'), style: 'cancel' },
        {
          text: t('bookingDetail.cancelConfirm'),
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.cancelBooking(booking.id);
              router.back();
            } catch (err: unknown) {
              Alert.alert(
                t('bookingDetail.errorTitle'),
                err instanceof Error ? err.message : t('bookingDetail.errorMessage'),
              );
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  // Handle Reschedule
  function handleOpenReschedule() {
    setRescheduleDate(null);
    setRescheduleSlot(null);
    setRescheduleSlots([]);
    setRescheduleConflict(null);
    setRescheduleModalVisible(true);
  }

  async function handlePickRescheduleDate(date: string) {
    if (!booking || !shop) return;
    setRescheduleDate(date);
    setRescheduleSlot(null);
    setRescheduleSlots([]);
    setLoadingRescheduleSlots(true);
    setErrorRescheduleSlots(null);
    setRescheduleConflict(null);

    try {
      const slots = await api.getSlots(shop.id, booking.barberId, date, booking.serviceId);
      // Filter past slots if today
      const today = new Date().toISOString().slice(0, 10);
      const filtered =
        date === today
          ? slots.filter((s) => new Date(s.startTime).getTime() > Date.now())
          : slots;
      setRescheduleSlots(filtered);
    } catch (err: unknown) {
      setErrorRescheduleSlots(
        err instanceof Error ? err.message : t('bookingDetail.errorMessage'),
      );
    } finally {
      setLoadingRescheduleSlots(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!booking || !rescheduleSlot) return;
    setRescheduling(true);
    setRescheduleConflict(null);
    try {
      const updated = await api.rescheduleBooking(booking.id, rescheduleSlot.startTime);
      setBooking(updated);
      setRescheduleModalVisible(false);
      Alert.alert(t('bookingDetail.rescheduleTitle'), t('bookingDetail.rescheduleSuccess'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('already booked')) {
        setRescheduleConflict(t('booking.slotTaken'));
      } else {
        Alert.alert(t('bookingDetail.errorTitle'), msg || t('bookingDetail.errorMessage'));
      }
    } finally {
      setRescheduling(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t('bookingDetail.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>{t('bookingDetail.notFound')}</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDetails}>
            <Text style={styles.retryButtonText}>{t('bookingDetail.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badgeStyle = getStatusBadgeStyle(booking.status);
  const bookingDateStr = booking.startTime.slice(0, 10);
  const displayDate = formatDateLong(bookingDateStr);
  const displayTime = formatBookingTimeRange(booking.startTime, booking.endTime);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('bookingDetail.title')}</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Status Chip */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
              {t(`status.${booking.status}`)}
            </Text>
          </View>
        </View>

        {/* Shop Info Card */}
        <View style={styles.card}>
          <View style={styles.shopHeader}>
            <View style={styles.shopIconCircle}>
              <Ionicons name="storefront" size={24} color={colors.accent} />
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop?.name || t('bookingDetail.shop')}</Text>
              {shop?.address ? (
                <Text style={styles.shopAddress} numberOfLines={2}>
                  {shop.address}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Appointment Details Card */}
        <View style={styles.card}>
          {/* Service */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cut-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{t('bookingDetail.service')}</Text>
              <Text style={styles.detailValue}>{service?.name || t('bookingDetail.service')}</Text>
              {service?.durationMinutes ? (
                <Text style={styles.detailSubtext}>
                  {service.durationMinutes} {t('shopDetail.min')}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Barber */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              {barber?.photo ? (
                <Image source={{ uri: barber.photo }} style={styles.barberAvatar} />
              ) : (
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              )}
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{t('bookingDetail.barber')}</Text>
              <Text style={styles.detailValue}>{barber?.name || t('bookingDetail.barber')}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Date and Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{t('bookingDetail.dateTime')}</Text>
              <Text style={styles.detailValue}>{displayDate}</Text>
              <Text style={styles.detailSubtext}>{displayTime}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Price */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{t('bookingDetail.price')}</Text>
              <Text style={styles.priceValue}>{formatSen(booking.customerTotalSen || booking.price)}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Payment Method */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{t('bookingDetail.paymentMethod')}</Text>
              <Text style={styles.detailValue}>{getPaymentMethodLabel(booking.paymentMethod, t)}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Payment Status */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.detailTextWrap}>
              <Text style={styles.detailLabel}>{t('bookingDetail.paymentStatus')}</Text>
              <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusBadgeStyle(booking.paymentStatus).bg }]}>
                <Text style={[styles.paymentBadgeText, { color: getPaymentStatusBadgeStyle(booking.paymentStatus).text }]}>
                  {getPaymentStatusLabel(booking.paymentStatus, t)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Continue Payment Button if pending_payment */}
        {booking.status === 'pending_payment' && !isCancelled && !isPast && (
          <View style={styles.actionCard}>
            <TouchableOpacity
              style={styles.continuePaymentButton}
              onPress={() => {
                router.push({
                  pathname: '/booking/payment/[bookingId]' as any,
                  params: {
                    bookingId: booking.id,
                    expiresAt: booking.expiresAt || '',
                    totalSen: String(booking.customerTotalSen || booking.price),
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="card" size={20} color={colors.textInverse} />
              <Text style={styles.continuePaymentButtonText}>{t('bookingDetail.continuePayment')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action 1: Check In */}
        {!isCancelled && !isCompleted && !isPast && (
          <View style={styles.actionCard}>
            <TouchableOpacity
              style={[
                styles.checkInButton,
                (!canCheckIn || isCheckedIn) && styles.checkInButtonDisabled,
              ]}
              onPress={handleOpenCheckIn}
              disabled={!canCheckIn || isCheckedIn || qrLoading}
              activeOpacity={0.8}
            >
              {qrLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons
                    name={isCheckedIn ? 'checkmark-circle' : 'qr-code-outline'}
                    size={22}
                    color={colors.textInverse}
                  />
                  <Text style={styles.checkInButtonText}>
                    {isCheckedIn ? t('status.checked_in') : t('bookingDetail.checkIn')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {!canCheckIn && !isCheckedIn && (
              <View style={styles.hintWrap}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.hintText}>{t('bookingDetail.checkInOpensSoon')}</Text>
              </View>
            )}

            {canCheckIn && !isCheckedIn && (
              <View style={styles.hintWrap}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.hintText, { color: colors.success }]}>
                  {t('bookingDetail.checkInAvailableNow')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action 2 & 3: Reschedule and Cancel */}
        {!isCancelled && !isCompleted && !isPast && (
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.rescheduleButton}
              onPress={handleOpenReschedule}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar" size={18} color={colors.primary} />
              <Text style={styles.rescheduleButtonText}>{t('bookingDetail.reschedule')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, cancelling && { opacity: 0.6 }]}
              onPress={handleCancelPress}
              disabled={cancelling}
              activeOpacity={0.8}
            >
              {cancelling ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                  <Text style={styles.cancelButtonText}>{t('bookingDetail.cancelBooking')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Check-In QR Modal (Full screen white page) */}
      <CheckInQRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        qrData={qrData}
        t={t}
      />

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <SafeAreaView style={styles.rescheduleModalContainer}>
          <View style={styles.rescheduleHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setRescheduleModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>{t('bookingDetail.rescheduleTitle')}</Text>
            <View style={styles.backPlaceholder} />
          </View>

          {shop ? (
            <DateTimeSlotPicker
              shop={shop}
              selectedDate={rescheduleDate}
              slots={rescheduleSlots}
              loadingSlots={loadingRescheduleSlots}
              errorSlots={errorRescheduleSlots}
              slotConflictMsg={rescheduleConflict}
              onPickDate={handlePickRescheduleDate}
              onPickSlot={(slot) => setRescheduleSlot(slot)}
              t={t}
            />
          ) : null}

          {rescheduleSlot ? (
            <View style={styles.rescheduleFooter}>
              <View style={styles.rescheduleSelectedInfo}>
                <Text style={styles.rescheduleSelectedLabel}>{t('bookingDetail.dateTime')}</Text>
                <Text style={styles.rescheduleSelectedValue}>
                  {rescheduleDate ? formatDateLong(rescheduleDate) : ''},{' '}
                  {formatSlotTime(rescheduleSlot.startTime)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.confirmRescheduleBtn,
                  rescheduling && styles.confirmRescheduleBtnDisabled,
                ]}
                onPress={handleConfirmReschedule}
                disabled={rescheduling}
                activeOpacity={0.8}
              >
                {rescheduling ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.confirmRescheduleBtnText}>
                    {t('bookingDetail.rescheduleConfirm')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
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
  topBarTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  backPlaceholder: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[3],
  },
  errorTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[4],
    backgroundColor: colors.accent,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radius.md,
  },
  retryButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[4],
  },
  statusRow: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  shopIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
  shopAddress: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  detailIcon: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },
  barberAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginTop: 2,
  },
  detailSubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.accent,
    marginTop: 2,
  },
  paymentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    marginTop: 4,
  },
  paymentBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continuePaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  continuePaymentButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
  payAtShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: 4,
  },
  payAtShopText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing[2],
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
    gap: spacing[2],
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  checkInButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkInButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[1],
  },
  hintText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  rescheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
    ...shadow.sm,
  },
  rescheduleButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: spacing[2],
    ...shadow.sm,
  },
  cancelButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },

  // QR Modal Styles
  qrModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  qrCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHeaderTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  qrContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  qrSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  qrBox: {
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  backupCodeWrap: {
    alignItems: 'center',
    gap: spacing[2],
  },
  backupCodeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  backupCodeBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backupCodeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    letterSpacing: 4,
  },
  qrDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    borderRadius: radius.full,
    marginTop: spacing[2],
  },
  qrDoneButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },

  // Reschedule Modal Styles
  rescheduleModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rescheduleFooter: {
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing[3],
    ...shadow.lg,
  },
  rescheduleSelectedInfo: {
    gap: 2,
  },
  rescheduleSelectedLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  rescheduleSelectedValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  confirmRescheduleBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRescheduleBtnDisabled: {
    opacity: 0.6,
  },
  confirmRescheduleBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
