import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api } from '@/api';
import { formatSen } from '@cutmyhair/shared';

type PaymentScreenStatus =
  | 'loading'
  | 'redirecting'
  | 'checking'
  | 'paid'
  | 'failed'
  | 'pending'
  | 'expired'
  | 'error';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    paymentUrl?: string;
    expiresAt?: string;
    totalSen?: string;
  }>();
  const router = useRouter();
  const { t } = useLanguage();

  const bookingId = params.bookingId || '';
  const initialPaymentUrl = params.paymentUrl || '';
  const expiresAt = params.expiresAt || '';
  const totalSen = Number(params.totalSen || 0);

  const [status, setStatus] = useState<PaymentScreenStatus>('redirecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentUrl, setPaymentUrl] = useState(initialPaymentUrl);
  const [activeExpiresAt, setActiveExpiresAt] = useState(expiresAt);
  const [activeTotalSen, setActiveTotalSen] = useState(totalSen);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute and update countdown
  function getMs(): number {
    if (!activeExpiresAt) return 0;
    return new Date(activeExpiresAt).getTime() - Date.now();
  }

  useEffect(() => {
    if (!activeExpiresAt) return;
    timerRef.current = setInterval(() => {
      setCountdown(getMs());
    }, 1000);
    setCountdown(getMs());
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExpiresAt]);

  const isExpired = countdown <= 0 && !!activeExpiresAt;

  // Open the payment URL when we mount or paymentUrl changes
  const openPayment = useCallback(async () => {
    if (!bookingId) return;
    setStatus('redirecting');
    let url = paymentUrl;

    try {
      if (!url) {
        // Fetch booking to get expiresAt and price if missing
        const booking = await api.getBooking(bookingId);
        if (booking.expiresAt) setActiveExpiresAt(booking.expiresAt);
        if (booking.customerTotalSen) setActiveTotalSen(booking.customerTotalSen);

        const started = await api.startPayment(bookingId);
        url = started.paymentUrl;
        setPaymentUrl(url);
      }

      const returnUrl = Linking.createURL('booking/payment/' + bookingId, {
        queryParams: { expiresAt: activeExpiresAt, totalSen: String(activeTotalSen) },
      });
      await WebBrowser.openAuthSessionAsync(url, returnUrl);
    } catch {
      // Browser closed or error - fall through to sync
    }
    // Always sync after browser closes
    await syncStatus();
  }, [paymentUrl, bookingId, activeExpiresAt, activeTotalSen]);

  useEffect(() => {
    openPayment();
  }, []);

  const syncStatus = useCallback(async () => {
    setStatus('checking');
    try {
      const result = await api.syncPayment(bookingId);
      if (result.status === 'paid') {
        setStatus('paid');
      } else if (result.status === 'failed') {
        setStatus('failed');
      } else {
        // still pending - check if hold expired
        if (isExpired) {
          setStatus('expired');
        } else {
          setStatus('pending');
        }
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : t('booking.errorMessage'));
      setStatus('error');
    }
  }, [bookingId, isExpired, t]);

  async function handleTryAgain() {
    // Re-start payment with same booking (hold still valid)
    setStatus('redirecting');
    try {
      const started = await api.startPayment(bookingId);
      setPaymentUrl(started.paymentUrl);
      const returnUrl = Linking.createURL('booking/payment/' + bookingId, {
        queryParams: { expiresAt, totalSen: String(totalSen) },
      });
      await WebBrowser.openAuthSessionAsync(started.paymentUrl, returnUrl);
    } catch {
      // ignore
    }
    await syncStatus();
  }

  function handleGoToSuccess() {
    router.replace('/booking/success' as any);
  }

  function handlePickNewTime() {
    // Pop back to the new-booking wizard (step 3)
    router.back();
    router.back();
  }

  if (status === 'paid') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.headingText}>{t('booking.paymentSuccess')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGoToSuccess}>
            <Text style={styles.primaryBtnText}>{t('booking.backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'expired') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="time-outline" size={64} color={colors.warning} />
          <Text style={styles.headingText}>{t('booking.holdExpiredLabel')}</Text>
          <Text style={styles.bodyText}>{t('booking.holdExpired')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handlePickNewTime}>
            <Text style={styles.primaryBtnText}>{t('booking.holdExpiredBtn')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'failed' || status === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        {expiresAt && (
          <View style={styles.countdownBanner}>
            <Ionicons name="time-outline" size={16} color={isExpired ? colors.error : colors.warning} />
            <Text style={[styles.countdownText, isExpired && { color: colors.error }]}>
              {isExpired
                ? t('booking.holdExpiredLabel')
                : t('booking.holdCountdown', { time: formatCountdown(countdown) })}
            </Text>
          </View>
        )}
        <View style={styles.centered}>
          <Ionicons name="close-circle" size={64} color={colors.error} />
          <Text style={styles.headingText}>{t('booking.paymentFailed')}</Text>
          <Text style={styles.bodyText}>
            {errorMsg || t('booking.paymentFailedMessage')}
          </Text>
          {!isExpired && (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleTryAgain}>
              <Text style={styles.primaryBtnText}>{t('booking.tryAgain')}</Text>
            </TouchableOpacity>
          )}
          {isExpired && (
            <TouchableOpacity style={[styles.secondaryBtn, { marginTop: spacing[2] }]} onPress={handlePickNewTime}>
              <Text style={styles.secondaryBtnText}>{t('booking.holdExpiredBtn')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'pending') {
    return (
      <SafeAreaView style={styles.safeArea}>
        {expiresAt && (
          <View style={styles.countdownBanner}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <Text style={styles.countdownText}>
              {t('booking.holdCountdown', { time: formatCountdown(countdown) })}
            </Text>
          </View>
        )}
        <View style={styles.centered}>
          <Ionicons name="hourglass-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.headingText}>{t('booking.paymentPending')}</Text>
          <Text style={styles.bodyText}>{t('booking.paymentPendingMessage')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={syncStatus}>
            <Text style={styles.primaryBtnText}>{t('booking.checkAgain')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // redirecting / checking / loading
  return (
    <SafeAreaView style={styles.safeArea}>
      {expiresAt && (
        <View style={styles.countdownBanner}>
          <Ionicons name="time-outline" size={16} color={colors.warning} />
          <Text style={styles.countdownText}>
            {t('booking.holdCountdown', { time: formatCountdown(countdown) })}
          </Text>
        </View>
      )}
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.bodyText}>
          {status === 'checking' ? t('booking.checkingPayment') : t('booking.startingPayment')}
        </Text>
        {totalSen > 0 && (
          <Text style={styles.amountText}>{formatSen(totalSen)}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  headingText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.primary,
    textAlign: 'center',
  },
  bodyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  amountText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.accent,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    alignItems: 'center',
    minWidth: 200,
    ...shadow.sm,
  },
  primaryBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
  secondaryBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 200,
  },
  secondaryBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#FFFBEB',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  countdownText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
  },
});
