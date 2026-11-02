import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { formatSen } from '@cutmyhair/shared';

export default function BookingSuccessScreen() {
  const { shopName, serviceName, barberName, dateTime, price } =
    useLocalSearchParams<{
      bookingId: string;
      shopName: string;
      serviceName: string;
      barberName: string;
      dateTime: string;
      price: string;
    }>();
  const router = useRouter();
  const { t } = useLanguage();

  const dateStr = dateTime
    ? new Date(dateTime).toLocaleDateString('en-MY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Kuala_Lumpur',
      })
    : '';
  const timeStr = dateTime
    ? new Date(dateTime).toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kuala_Lumpur',
      })
    : '';

  const rows: { icon: string; label: string; value: string }[] = [
    { icon: 'storefront-outline', label: t('booking.shopLabel'), value: shopName ?? '' },
    { icon: 'cut-outline', label: t('booking.serviceLabel'), value: serviceName ?? '' },
    { icon: 'person-outline', label: t('booking.barberLabel'), value: barberName ?? '' },
    { icon: 'calendar-outline', label: t('booking.dateLabel'), value: dateStr },
    { icon: 'time-outline', label: t('booking.timeLabel'), value: timeStr },
    { icon: 'cash-outline', label: t('booking.priceLabel'), value: formatSen(Number(price ?? 0)) },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Success icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          </View>
        </View>

        <Text style={styles.title}>{t('booking.successTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('booking.successMessage')
            .replace('{{shop}}', shopName ?? '')
            .replace('{{date}}', dateStr)
            .replace('{{time}}', timeStr)}
        </Text>

        {/* Details card */}
        <View style={styles.card}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={row.icon as React.ComponentProps<typeof Ionicons>['name']} size={16} color={colors.accent} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}

          <View style={styles.payAtShopBadge}>
            <Ionicons name="cash-outline" size={15} color={colors.success} />
            <Text style={styles.payAtShopText}>{t('booking.payAtShop')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)' as Parameters<typeof router.replace>[0])}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={18} color={colors.textInverse} />
          <Text style={styles.homeBtnText}>{t('booking.backToHome')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[5],
    alignItems: 'center',
    paddingBottom: spacing[12],
  },
  iconWrap: {
    marginTop: spacing[6],
    marginBottom: spacing[5],
  },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing[2],
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    width: 90,
  },
  rowValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    flex: 1,
    textAlign: 'right',
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
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
  },
  homeBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
