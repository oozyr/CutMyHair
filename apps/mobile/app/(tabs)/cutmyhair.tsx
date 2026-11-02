import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api, type ShopWithDistance } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { CheckInQRModal } from '@/components/CheckInQRModal';
import { SignInModal } from '@/components/SignInModal';
import { SignedOutState } from '@/components/SignedOutState';
import { formatSlotTime } from '@/components/DateTimeSlotPicker';
import type { Booking, Shop, Service, Barber } from '@cutmyhair/shared';

type CutTab = 'my_qr' | 'feeling_lucky';

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export default function CutMyHairScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<CutTab>('my_qr');
  const [signInVisible, setSignInVisible] = useState(false);

  // My QR state
  const [nearestBooking, setNearestBooking] = useState<Booking | null>(null);
  const [bookingShop, setBookingShop] = useState<Shop | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [bookingBarber, setBookingBarber] = useState<Barber | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrData, setQrData] = useState<{ code: string; payload: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [refreshingBooking, setRefreshingBooking] = useState(false);
  const [errorBooking, setErrorBooking] = useState<string | null>(null);

  // Feeling Lucky state
  const [nearbyShops, setNearbyShops] = useState<ShopWithDistance[]>([]);
  const [pickedShop, setPickedShop] = useState<ShopWithDistance | null>(null);
  const [loadingShops, setLoadingShops] = useState(false);
  const [errorShops, setErrorShops] = useState<string | null>(null);

  // Fetch nearest upcoming booking for customer
  const fetchNearestBooking = useCallback(async () => {
    if (!isAuthenticated) {
      setLoadingBooking(false);
      setRefreshingBooking(false);
      setNearestBooking(null);
      return;
    }
    setErrorBooking(null);
    try {
      const bookings = await api.getBookings();
      const now = Date.now();

      const eligible = bookings.filter((b) => {
        if (b.status === 'cancelled' || b.status === 'completed') return false;
        const endMs = new Date(b.endTime).getTime();
        return endMs > now;
      });

      eligible.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

      const nearest = eligible[0] || null;
      setNearestBooking(nearest);

      if (nearest) {
        const [shop, services, barbers] = await Promise.all([
          api.getShop(nearest.shopId).catch(() => null),
          api.getServices(nearest.shopId).catch(() => []),
          api.getBarbers(nearest.shopId).catch(() => []),
        ]);
        setBookingShop(shop);
        setBookingService(services.find((s) => s.id === nearest.serviceId) || null);
        setBookingBarber(barbers.find((b) => b.id === nearest.barberId) || null);
      } else {
        setBookingShop(null);
        setBookingService(null);
        setBookingBarber(null);
      }
    } catch (err: unknown) {
      setErrorBooking(err instanceof Error ? err.message : t('bookingDetail.errorMessage'));
    } finally {
      setLoadingBooking(false);
      setRefreshingBooking(false);
    }
  }, [isAuthenticated, t]);

  // Fetch shops for feeling lucky
  const fetchNearbyShops = useCallback(async () => {
    setErrorShops(null);
    setLoadingShops(true);
    try {
      const shops = await api.getShops({ lat: 3.139, lng: 101.6869, radius: 10 });
      setNearbyShops(shops);
    } catch (err: unknown) {
      setErrorShops(err instanceof Error ? err.message : t('cutmyhair.errorRandom'));
    } finally {
      setLoadingShops(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchNearestBooking();
      fetchNearbyShops();
    }, [fetchNearestBooking, fetchNearbyShops]),
  );

  const onRefresh = useCallback(() => {
    setRefreshingBooking(true);
    fetchNearestBooking();
  }, [fetchNearestBooking]);

  // Timing check for check-in button
  const now = Date.now();
  const startMs = nearestBooking ? new Date(nearestBooking.startTime).getTime() : 0;
  const endMs = nearestBooking ? new Date(nearestBooking.endTime).getTime() : 0;
  const windowStartMs = startMs - 60 * 60 * 1000;
  const canShowQR =
    nearestBooking &&
    (nearestBooking.status === 'pending' ||
      nearestBooking.status === 'confirmed' ||
      nearestBooking.status === 'checked_in') &&
    now >= windowStartMs &&
    now <= endMs;

  async function handleShowQR() {
    if (!nearestBooking) return;
    setQrLoading(true);
    try {
      const data = await api.getCheckInCode(nearestBooking.id);
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

  // Pick random shop
  function handlePickRandom() {
    if (nearbyShops.length === 0) return;
    const candidates = pickedShop
      ? nearbyShops.filter((s) => s.id !== pickedShop.id)
      : nearbyShops;
    const list = candidates.length > 0 ? candidates : nearbyShops;
    const chosen = list[Math.floor(Math.random() * list.length)];
    setPickedShop(chosen);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/batik1.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tabs.cutmyhair')}</Text>
        </View>

        {/* 2-Part Switch */}
        <View style={styles.segmentedContainer}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeTab === 'my_qr' && styles.segmentButtonActive,
              ]}
              onPress={() => setActiveTab('my_qr')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  activeTab === 'my_qr' && styles.segmentButtonTextActive,
                ]}
              >
                {t('cutmyhair.myQr')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeTab === 'feeling_lucky' && styles.segmentButtonActive,
              ]}
              onPress={() => setActiveTab('feeling_lucky')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  activeTab === 'feeling_lucky' && styles.segmentButtonTextActive,
                ]}
              >
                {t('cutmyhair.feelingLucky')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab 1: My QR */}
        {activeTab === 'my_qr' && (
          !isAuthenticated ? (
            <SignedOutState
              iconName="qr-code-outline"
              title={t('guest.cutmyhairTitle')}
              subtitle={t('guest.cutmyhairSubtitle')}
              onSignInPress={() => setSignInVisible(true)}
            />
          ) : (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshingBooking}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          >
            {loadingBooking && !refreshingBooking ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>{t('inbox.loading')}</Text>
              </View>
            ) : errorBooking ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorTitle}>{t('inbox.errorTitle')}</Text>
                <Text style={styles.errorSubtitle}>{errorBooking}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchNearestBooking}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>{t('inbox.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : nearestBooking && bookingShop ? (
              <View style={styles.qrCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardCategoryLabel}>
                    {t('cutmyhair.upcomingAppointment')}
                  </Text>
                  <View style={styles.badgeWrap}>
                    <Text style={styles.badgeText}>
                      {t(`status.${nearestBooking.status}`)}
                    </Text>
                  </View>
                </View>

                {/* Shop info */}
                <View style={styles.shopRow}>
                  <View style={styles.shopIconCircle}>
                    <Ionicons name="storefront" size={26} color={colors.accent} />
                  </View>
                  <View style={styles.shopTextWrap}>
                    <Text style={styles.shopTitle}>{bookingShop.name}</Text>
                    {bookingBarber && (
                      <Text style={styles.barberSubtitle}>
                        {t('bookingDetail.barber')}: {bookingBarber.name}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Service info */}
                <View style={styles.serviceRow}>
                  <Ionicons name="cut-outline" size={18} color={colors.textSecondary} />
                  <Text style={styles.serviceText}>
                    {bookingService?.name || t('bookingDetail.service')}
                  </Text>
                </View>

                {/* Date & Time */}
                <View style={styles.timeRow}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.timeText}>
                    {formatDateLong(nearestBooking.startTime.slice(0, 10))} •{' '}
                    {formatSlotTime(nearestBooking.startTime)} -{' '}
                    {formatSlotTime(nearestBooking.endTime)}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                {/* Big Show QR Button */}
                <TouchableOpacity
                  style={[
                    styles.bigShowQRBtn,
                    !canShowQR && styles.bigShowQRBtnDisabled,
                  ]}
                  onPress={handleShowQR}
                  disabled={!canShowQR || qrLoading}
                  activeOpacity={0.8}
                >
                  {qrLoading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <>
                      <Ionicons name="qr-code-outline" size={24} color={colors.textInverse} />
                      <Text style={styles.bigShowQRBtnText}>{t('cutmyhair.showQr')}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {!canShowQR && (
                  <View style={styles.hintWrap}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.hintText}>{t('cutmyhair.checkInOpensSoon')}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="calendar-outline" size={48} color={colors.accent} />
                </View>
                <Text style={styles.emptyTitle}>{t('cutmyhair.noUpcomingTitle')}</Text>
                <Text style={styles.emptySubtitle}>{t('cutmyhair.noUpcomingMessage')}</Text>
                <TouchableOpacity
                  style={styles.findBarberBtn}
                  onPress={() => router.push('/(tabs)' as any)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="search-outline" size={18} color={colors.textInverse} />
                  <Text style={styles.findBarberBtnText}>{t('cutmyhair.findBarber')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          )
        )}

        {/* Tab 2: Feeling Lucky */}
        {activeTab === 'feeling_lucky' && (
          <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
            {loadingShops ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>{t('cutmyhair.loadingRandom')}</Text>
              </View>
            ) : errorShops ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorTitle}>{t('inbox.errorTitle')}</Text>
                <Text style={styles.errorSubtitle}>{errorShops}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchNearbyShops}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>{t('inbox.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : pickedShop ? (
              <View style={styles.luckyResultCard}>
                <View style={styles.luckyResultHeader}>
                  <View style={styles.sparkleIconWrap}>
                    <Ionicons name="sparkles" size={24} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickedShopName}>{pickedShop.name}</Text>
                    <View style={styles.ratingDistanceRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{pickedShop.rating.toFixed(1)}</Text>
                      {pickedShop.distanceKm !== undefined && (
                        <Text style={styles.distanceText}>
                          • {pickedShop.distanceKm.toFixed(1)} km
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {pickedShop.photos && pickedShop.photos.length > 0 ? (
                  <Image
                    source={{ uri: pickedShop.photos[0] }}
                    style={styles.shopPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.shopPhotoPlaceholder}>
                    <Ionicons name="storefront-outline" size={48} color={colors.border} />
                  </View>
                )}

                {pickedShop.address ? (
                  <Text style={styles.shopAddressText} numberOfLines={2}>
                    {pickedShop.address}
                  </Text>
                ) : null}

                <View style={styles.luckyActionsRow}>
                  <TouchableOpacity
                    style={styles.tryAnotherBtn}
                    onPress={handlePickRandom}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="refresh" size={18} color={colors.primary} />
                    <Text style={styles.tryAnotherBtnText}>{t('cutmyhair.tryAnother')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewShopBtn}
                    onPress={() => router.push(`/shop/${pickedShop.id}` as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewShopBtnText}>{t('cutmyhair.viewShop')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textInverse} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.luckyIntroContainer}>
                <View style={styles.diceIconCircle}>
                  <Ionicons name="dice-outline" size={56} color={colors.accent} />
                </View>
                <Text style={styles.luckyTitle}>{t('cutmyhair.feelingLuckyTitle')}</Text>
                <Text style={styles.luckySubtitle}>{t('cutmyhair.feelingLuckySubtitle')}</Text>
                <TouchableOpacity
                  style={styles.surpriseMeBtn}
                  onPress={handlePickRandom}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={20} color={colors.textInverse} />
                  <Text style={styles.surpriseMeBtnText}>{t('cutmyhair.surpriseMe')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* Reused Check-In QR Modal */}
        <CheckInQRModal
          visible={qrModalVisible}
          onClose={() => setQrModalVisible(false)}
          qrData={qrData}
          t={t}
        />

        {/* Sign In Modal */}
        <SignInModal
          visible={signInVisible}
          onClose={() => setSignInVisible(false)}
          onSuccess={() => fetchNearestBooking()}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.03,
    resizeMode: 'cover',
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
  },
  segmentedContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  segmentButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[12],
  },

  // QR card
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
    ...shadow.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategoryLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgeWrap: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.statusConfirmed,
    textTransform: 'uppercase',
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[1],
  },
  shopIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopTextWrap: {
    flex: 1,
  },
  shopTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  barberSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  serviceText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  timeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing[1],
  },
  bigShowQRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    ...shadow.md,
  },
  bigShowQRBtnDisabled: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bigShowQRBtnText: {
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

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
    maxWidth: 280,
  },
  findBarberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radius.full,
  },
  findBarberBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },

  // Feeling Lucky
  luckyIntroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
  diceIconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  luckyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  luckySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
    maxWidth: 280,
  },
  surpriseMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.full,
    ...shadow.md,
  },
  surpriseMeBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },

  // Lucky Result Card
  luckyResultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
    ...shadow.md,
  },
  luckyResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  sparkleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedShopName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  ratingDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  distanceText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  shopPhoto: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
  },
  shopPhotoPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopAddressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  luckyActionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  tryAnotherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tryAnotherBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  viewShopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  viewShopBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    minHeight: 300,
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
});
