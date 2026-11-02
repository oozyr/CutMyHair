import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api } from '@/api';
import { formatSen, SERVICE_MARKUP_SEN, type Shop, type Service, type Barber, type Review } from '@cutmyhair/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------- helpers ----------

function isOpenNow(shop: Shop): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const dayHours = shop.openingHours[day];
  if (!dayHours || !dayHours.open) return false;

  const [openH, openM] = dayHours.openTime.split(':').map(Number);
  const [closeH, closeM] = dayHours.closeTime.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  if (nowMins < openMins || nowMins >= closeMins) return false;

  // Check breaks
  for (const brk of dayHours.breaks) {
    const [bStartH, bStartM] = brk.startTime.split(':').map(Number);
    const [bEndH, bEndM] = brk.endTime.split(':').map(Number);
    const bStart = bStartH * 60 + bStartM;
    const bEnd = bEndH * 60 + bEndM;
    if (nowMins >= bStart && nowMins < bEnd) return false;
  }
  return true;
}

function getTodayHoursLabel(shop: Shop): string {
  const day = new Date().getDay();
  const dayHours = shop.openingHours[day];
  if (!dayHours || !dayHours.open) return '';
  return `${dayHours.openTime} - ${dayHours.closeTime}`;
}

// ---------- sub-components ----------

type TabKey = 'services' | 'barbers' | 'reviews';

interface TabBarProps {
  active: TabKey;
  onPress: (tab: TabKey) => void;
  labels: Record<TabKey, string>;
}

function TabBar({ active, onPress, labels }: TabBarProps) {
  const tabs: TabKey[] = ['services', 'barbers', 'reviews'];
  return (
    <View style={tabBarStyles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[tabBarStyles.tab, active === tab && tabBarStyles.tabActive]}
          onPress={() => onPress(tab)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              tabBarStyles.tabText,
              active === tab && tabBarStyles.tabTextActive,
            ]}
          >
            {labels[tab]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontFamily: typography.fontFamily.bold,
    color: colors.accent,
  },
});

// ---------- main screen ----------

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string; initialName?: string }>();
  const router = useRouter();
  const { t, locale } = useLanguage();

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('services');

  const serviceMap = useRef<Map<string, Service>>(new Map());

  const fetchAll = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const [shopData, servicesData, barbersData, reviewsData] =
        await Promise.all([
          api.getShop(id),
          api.getServices(id),
          api.getBarbers(id),
          api.getReviews(id),
        ]);
      setShop(shopData);
      setServices(servicesData);
      setBarbers(barbersData.filter((b) => b.isActive));
      setReviews(reviewsData);
      serviceMap.current = new Map(servicesData.map((s) => [s.id, s]));
    } catch {
      setError(t('shopDetail.errorMessage'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{t('shopDetail.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.accent} />
          </View>
          <Text style={styles.errorTitle}>{t('shopDetail.errorTitle')}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAll} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>{t('shopDetail.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Not found
  if (!shop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="storefront-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>{t('shopDetail.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const open = isOpenNow(shop);
  const hoursLabel = getTodayHoursLabel(shop);

  const tabLabels: Record<TabKey, string> = {
    services: t('shopDetail.services'),
    barbers: t('shopDetail.barbers'),
    reviews: t('shopDetail.reviews'),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/batik1.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {/* Fixed top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo gallery */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScrollView}
          >
            {shop.photos && shop.photos.length > 0 ? (
              shop.photos.map((photo, idx) => (
                <View key={idx} style={styles.gallerySlide}>
                  {photo.startsWith('http') ? (
                    <View style={styles.galleryPlaceholder}>
                      <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                    </View>
                  ) : (
                    <View style={styles.galleryPlaceholder}>
                      <Ionicons name="cut-outline" size={40} color={colors.textSecondary} />
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.gallerySlide}>
                <View style={styles.galleryPlaceholder}>
                  <Ionicons name="cut-outline" size={40} color={colors.textSecondary} />
                  <Text style={styles.noPhotosText}>{t('shopDetail.noPhotos')}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Shop info card */}
          <View style={styles.infoCard}>
            <Text style={styles.shopName}>{shop.name}</Text>

            {/* Rating row */}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCountText}>({shop.totalReviews})</Text>
            </View>

            {/* Address */}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{shop.address}</Text>
            </View>

            {/* Hours */}
            {hoursLabel ? (
              <View style={styles.hoursRow}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>{hoursLabel}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    open ? styles.statusBadgeOpen : styles.statusBadgeClosed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      open ? styles.statusBadgeTextOpen : styles.statusBadgeTextClosed,
                    ]}
                  >
                    {open ? t('shopDetail.openNow') : t('shopDetail.closed')}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Tab bar */}
          <TabBar active={activeTab} onPress={setActiveTab} labels={tabLabels} />

          {/* Tab content */}
          <View style={styles.tabContent}>
            {/* Services tab */}
            {activeTab === 'services' && (
              <View>
                {services.map((svc) => (
                  <View key={svc.id} style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>
                        {locale === 'ms' ? svc.nameMs : svc.name}
                      </Text>
                      <Text style={styles.serviceDuration}>
                        {svc.durationMinutes} {t('shopDetail.min')}
                      </Text>
                    </View>
                    <Text style={styles.servicePrice}>{formatSen(svc.customerPriceSen ?? (svc.price + SERVICE_MARKUP_SEN))}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Barbers tab */}
            {activeTab === 'barbers' && (
              <View>
                {barbers.map((barber) => {
                  const barberServices = barber.serviceIds
                    .map((sid) => serviceMap.current.get(sid))
                    .filter((s): s is Service => !!s);
                  return (
                    <View key={barber.id} style={styles.barberRow}>
                      <View style={styles.barberAvatar}>
                        <Ionicons name="person" size={24} color={colors.textSecondary} />
                      </View>
                      <View style={styles.barberInfo}>
                        <Text style={styles.barberName}>{barber.name}</Text>
                        {barberServices.length > 0 && (
                          <Text style={styles.barberServices} numberOfLines={2}>
                            {barberServices
                              .map((s) => (locale === 'ms' ? s.nameMs : s.name))
                              .join(', ')}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Reviews tab */}
            {activeTab === 'reviews' && (
              <View>
                {reviews.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubble-outline" size={36} color={colors.textSecondary} />
                    <Text style={styles.emptyStateText}>{t('shopDetail.noReviews')}</Text>
                  </View>
                ) : (
                  reviews.map((review) => (
                    <View key={review.id} style={styles.reviewRow}>
                      <View style={styles.reviewRatingRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Spacer so Book button doesn't cover content */}
          <View style={styles.bookButtonSpacer} />
        </ScrollView>

        {/* Fixed Book button */}
        <View style={styles.bookButtonContainer}>
          <TouchableOpacity
            style={styles.bookButton}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/booking/new/[shopId]' as any,
                params: { shopId: shop.id, shopName: shop.name },
              })
            }
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textInverse} />
            <Text style={styles.bookButtonText}>{t('shopDetail.bookNow')}</Text>
          </TouchableOpacity>
        </View>
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
  topBar: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  centerContainer: {
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
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  errorTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: radius.full,
    ...shadow.sm,
  },
  retryButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[4],
  },
  // Gallery
  galleryScrollView: {
    height: 220,
  },
  gallerySlide: {
    width: SCREEN_WIDTH,
    height: 220,
    backgroundColor: colors.surfaceAlt,
  },
  galleryPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  noPhotosText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Info card
  infoCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  shopName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    marginBottom: spacing[2],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing[2],
  },
  ratingText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  reviewCountText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  infoText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusBadgeOpen: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
  },
  statusBadgeTextOpen: {
    color: '#065F46',
  },
  statusBadgeTextClosed: {
    color: '#991B1B',
  },
  // Tab content
  tabContent: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  // Services
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  serviceDuration: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  servicePrice: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.accent,
    marginLeft: spacing[3],
  },
  // Barbers
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.divider,
    gap: spacing[3],
  },
  barberAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  barberServices: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  // Reviews
  emptyState: {
    paddingVertical: spacing[8],
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyStateText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  reviewRow: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing[1],
  },
  reviewComment: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  // Book button
  bookButtonSpacer: {
    height: 80,
  },
  bookButtonContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  bookButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    ...shadow.md,
  },
  bookButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
