import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api, type ShopWithDistance } from '@/api';
import { formatSen } from '@cutmyhair/shared';

const CHERAS_LAT = 3.139;
const CHERAS_LNG = 101.6869;
const DEFAULT_RADIUS_KM = 10;

function getTimeGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'greetings.morning';
  if (hour < 17) return 'greetings.afternoon';
  return 'greetings.evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [shops, setShops] = useState<ShopWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getShops({
        lat: CHERAS_LAT,
        lng: CHERAS_LNG,
        radius: DEFAULT_RADIUS_KM,
      });
      setShops(data);
    } catch (err: any) {
      setError(err?.message || 'Error fetching shops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShops();
  }, [fetchShops]);

  const handleShopPress = (shop: ShopWithDistance) => {
    router.push({
      pathname: '/shop/[id]' as any,
      params: { id: shop.id, initialName: shop.name },
    });
  };

  const greeting = t(getTimeGreetingKey());

  // Top rated shops for featured row (sorted by rating descending, top 5)
  const featuredShops = [...shops]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  // Nearby shops sorted by distance ascending
  const nearbyShops = [...shops].sort(
    (a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/batik1.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>{t('home.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.accent} />
            </View>
            <Text style={styles.errorTitle}>{t('home.errorTitle')}</Text>
            <Text style={styles.errorMessage}>{t('home.errorMessage')}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                fetchShops();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>{t('home.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          >
            {/* Header Greeting */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.subtitleText}>{t('home.subtitle')}</Text>
              </View>
              <View style={styles.appIconBadge}>
                <Image
                  source={require('../../assets/images/app_icon.png')}
                  style={styles.appIconImage}
                />
              </View>
            </View>

            {/* Featured Section */}
            {featuredShops.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    {t('home.featuredShops')}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                >
                  {featuredShops.map((shop) => (
                    <TouchableOpacity
                      key={shop.id}
                      style={styles.featuredCard}
                      onPress={() => handleShopPress(shop)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.featuredCardContent}>
                        <View style={styles.featuredTopRow}>
                          <View style={styles.featuredIconPlaceholder}>
                            <Ionicons name="cut" size={20} color={colors.accent} />
                          </View>
                          <View style={styles.ratingPill}>
                            <Ionicons name="star" size={13} color="#F59E0B" />
                            <Text style={styles.ratingPillText}>
                              {shop.rating.toFixed(1)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.featuredName} numberOfLines={1}>
                          {shop.name}
                        </Text>
                        <Text style={styles.featuredAddress} numberOfLines={1}>
                          {shop.address}
                        </Text>
                        {shop.minPrice != null && shop.maxPrice != null && (
                          <Text style={styles.priceRangeText}>
                            {`${formatSen(shop.minPrice)} - ${formatSen(shop.maxPrice)}`}
                          </Text>
                        )}
                        {shop.distanceKm !== undefined && (
                          <View style={styles.distanceRow}>
                            <Ionicons
                              name="location-outline"
                              size={13}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.distanceText}>
                              {shop.distanceKm.toFixed(1)} {t('home.km')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Nearby Shops Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('home.nearbyShops')}</Text>
                <Text style={styles.sectionSubtitleBadge}>
                  {t('home.within10km')}
                </Text>
              </View>

              {nearbyShops.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={36} color={colors.textSecondary} />
                  <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
                  <Text style={styles.emptyMessage}>{t('home.emptyMessage')}</Text>
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {nearbyShops.map((shop) => (
                    <TouchableOpacity
                      key={shop.id}
                      style={styles.gridCard}
                      onPress={() => handleShopPress(shop)}
                      activeOpacity={0.8}
                    >
                      {/* Photo or clean placeholder */}
                      <View style={styles.cardImageContainer}>
                        {shop.coverPhoto && shop.coverPhoto.startsWith('http') ? (
                          <Image
                            source={{ uri: shop.coverPhoto }}
                            style={styles.cardImage}
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Ionicons
                              name="cut-outline"
                              size={28}
                              color={colors.textSecondary}
                            />
                          </View>
                        )}
                        <View style={styles.gridRatingBadge}>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text style={styles.gridRatingText}>
                            {shop.rating.toFixed(1)}
                          </Text>
                        </View>
                      </View>

                      {/* Card Info */}
                      <View style={styles.cardInfo}>
                        <Text style={styles.gridShopName} numberOfLines={2}>
                          {shop.name}
                        </Text>
                        {shop.minPrice != null && shop.maxPrice != null && (
                          <Text style={styles.gridPriceRangeText}>
                            {`${formatSen(shop.minPrice)} - ${formatSen(shop.maxPrice)}`}
                          </Text>
                        )}
                        {shop.distanceKm !== undefined && (
                          <View style={styles.distanceRow}>
                            <Ionicons
                              name="navigate-outline"
                              size={12}
                              color={colors.accent}
                            />
                            <Text style={styles.gridDistanceText}>
                              {shop.distanceKm.toFixed(1)} {t('home.km')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const windowWidth = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_WIDTH = (windowWidth - spacing[4] * 2 - CARD_GAP) / 2;

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
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
    paddingTop: spacing[1],
  },
  greetingText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.sm,
  },
  appIconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  sectionSubtitleBadge: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  featuredList: {
    paddingRight: spacing[4],
    gap: spacing[3],
  },
  featuredCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    ...shadow.sm,
  },
  featuredCardContent: {
    flex: 1,
  },
  featuredTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  featuredIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 3,
  },
  ratingPillText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: '#92400E',
  },
  featuredName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featuredAddress: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distanceText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardImageContainer: {
    width: '100%',
    height: 104,
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  gridRatingBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 2,
    ...shadow.sm,
  },
  gridRatingText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  cardInfo: {
    padding: spacing[3],
  },
  gridShopName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    minHeight: 36,
    marginBottom: spacing[1],
  },
  gridDistanceText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
  },
  priceRangeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    marginBottom: spacing[1],
  },
  gridPriceRangeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    marginBottom: 2,
  },
  emptyContainer: {
    paddingVertical: spacing[8],
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginTop: spacing[2],
  },
  emptyMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing[1],
  },
});
