import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, type Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api, type ShopWithDistance } from '@/api';
import { formatSen, distanceKm, SERVICE_MARKUP_SEN } from '@cutmyhair/shared';
import { useLocation } from '@/context/LocationContext';

const SEARCH_RADIUS_METERS = 10000; // 10 km
const PAN_THRESHOLD_KM = 0.8;

export default function MapScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { location, requestDeviceLocation, isUsingDeviceLocation, loading: locationLoading } = useLocation();

  const mapRef = useRef<MapView>(null);
  const [searchCenter, setSearchCenter] = useState({
    lat: location.lat,
    lng: location.lng,
  });

  const [shops, setShops] = useState<ShopWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<ShopWithDistance | null>(null);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  const pendingRegionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fetch shops within 10km from API
  const fetchShops = useCallback(async (centerLat: number, centerLng: number) => {
    setLoading(true);
    try {
      const data = await api.getShops({
        lat: centerLat,
        lng: centerLng,
        radiusKm: 10,
      });
      setShops(data);
    } catch {
      // Keep existing list on transient network error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load or when user location updates
  useEffect(() => {
    setSearchCenter({ lat: location.lat, lng: location.lng });
    fetchShops(location.lat, location.lng);

    mapRef.current?.animateToRegion(
      {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.16,
        longitudeDelta: 0.16,
      },
      600,
    );
  }, [location.lat, location.lng, fetchShops]);

  // Handle region movement
  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      pendingRegionRef.current = {
        lat: region.latitude,
        lng: region.longitude,
      };

      const dist = distanceKm(
        searchCenter.lat,
        searchCenter.lng,
        region.latitude,
        region.longitude,
      );

      if (dist >= PAN_THRESHOLD_KM) {
        setShowSearchThisArea(true);
      }
    },
    [searchCenter.lat, searchCenter.lng],
  );

  // Search this area handler
  const handleSearchThisArea = () => {
    if (!pendingRegionRef.current) return;
    const newCenter = pendingRegionRef.current;
    setSearchCenter(newCenter);
    setShowSearchThisArea(false);
    setSelectedShop(null);
    fetchShops(newCenter.lat, newCenter.lng);
  };

  // Use my location button handler
  const handleUseMyLocation = async () => {
    setSelectedShop(null);
    const granted = await requestDeviceLocation();
    if (granted) {
      setShowSearchThisArea(false);
    }
  };

  const initialRegion: Region = {
    latitude: searchCenter.lat,
    longitude: searchCenter.lng,
    latitudeDelta: 0.16,
    longitudeDelta: 0.16,
  };

  return (
    <View style={styles.container}>
      {/* Map using default provider in Expo Go */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={() => setSelectedShop(null)}
        showsUserLocation={isUsingDeviceLocation}
        showsMyLocationButton={false}
      >
        {/* 10km radius circle around search centre */}
        <Circle
          center={{
            latitude: searchCenter.lat,
            longitude: searchCenter.lng,
          }}
          radius={SEARCH_RADIUS_METERS}
          fillColor="rgba(217, 119, 6, 0.08)"
          strokeColor="rgba(217, 119, 6, 0.45)"
          strokeWidth={1.5}
        />

        {/* Pins for shops and approximate circles for freelance */}
        {shops.map((shop) => {
          if (shop.kind === 'freelance') {
            return (
              <React.Fragment key={shop.id}>
                {/* 500m approximate area circle */}
                <Circle
                  center={{ latitude: shop.lat, longitude: shop.lng }}
                  radius={500}
                  fillColor="rgba(99, 102, 241, 0.22)"
                  strokeColor="rgba(99, 102, 241, 0.75)"
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: shop.lat, longitude: shop.lng }}
                  onPress={() => setSelectedShop(shop)}
                  title={shop.name}
                  tracksViewChanges={false}
                >
                  <View style={styles.freelanceBadge}>
                    <Ionicons name="cut" size={13} color="#FFFFFF" />
                    <Text style={styles.freelanceBadgeText}>Area</Text>
                  </View>
                </Marker>
              </React.Fragment>
            );
          }

          return (
            <Marker
              key={shop.id}
              coordinate={{ latitude: shop.lat, longitude: shop.lng }}
              onPress={() => setSelectedShop(shop)}
              title={shop.name}
              pinColor={colors.accent}
            />
          );
        })}
      </MapView>

      {/* Top Floating Controls */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={styles.radiusPill}>
            <Ionicons name="radio-button-on" size={12} color={colors.accent} />
            <Text style={styles.radiusPillText}>{t('map.within10km')}</Text>
          </View>

          {loading && (
            <View style={styles.loadingPill}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}
        </View>

        {/* Search this area button */}
        {showSearchThisArea && (
          <View style={styles.searchThisAreaContainer}>
            <TouchableOpacity
              style={styles.searchThisAreaBtn}
              onPress={handleSearchThisArea}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color={colors.textInverse} />
              <Text style={styles.searchThisAreaText}>{t('map.searchThisArea')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Floating GPS Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.gpsFab, isUsingDeviceLocation && styles.gpsFabActive]}
          onPress={handleUseMyLocation}
          activeOpacity={0.8}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={isUsingDeviceLocation ? 'locate' : 'locate-outline'}
              size={22}
              color={isUsingDeviceLocation ? colors.accent : colors.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Shop Card Modal */}
      {selectedShop && (
        <SafeAreaView style={styles.bottomCardContainer} pointerEvents="box-none">
          <View style={styles.card}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeCardBtn}
              onPress={() => setSelectedShop(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.cardContent}>
              {/* Cover Photo / Thumbnail */}
              {selectedShop.coverPhoto ? (
                <Image
                  source={{ uri: selectedShop.coverPhoto }}
                  style={styles.cardThumb}
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Ionicons name="cut-outline" size={26} color={colors.textSecondary} />
                </View>
              )}

              {/* Shop Details */}
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.shopName} numberOfLines={1}>
                    {selectedShop.name}
                  </Text>
                </View>

                {/* Rating & Distance */}
                <View style={styles.metaRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {selectedShop.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.reviewsText}>
                      ({selectedShop.totalReviews})
                    </Text>
                  </View>

                  {selectedShop.distanceKm !== undefined && (
                    <Text style={styles.dotSeparator}>•</Text>
                  )}

                  {selectedShop.distanceKm !== undefined && (
                    <Text style={styles.distanceText}>
                      {selectedShop.distanceKm.toFixed(1)} km
                    </Text>
                  )}
                </View>

                {/* Status Badge & Price */}
                <View style={styles.statusAndPriceRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedShop.openNow
                        ? styles.statusBadgeOpen
                        : styles.statusBadgeClosed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        selectedShop.openNow
                          ? styles.statusTextOpen
                          : styles.statusTextClosed,
                      ]}
                    >
                      {selectedShop.openNow ? t('map.open') : t('map.closed')}
                    </Text>
                  </View>

                  {selectedShop.kind === 'freelance' && (
                    <View style={styles.freelancePill}>
                      <Text style={styles.freelancePillText}>{t('map.freelance')}</Text>
                    </View>
                  )}

                  {(selectedShop.minPriceSen != null || selectedShop.minPrice != null) && (
                    <Text style={styles.fromPriceText}>
                      {t('map.fromPrice', {
                        price: formatSen(selectedShop.minPriceSen ?? (selectedShop.minPrice! + SERVICE_MARKUP_SEN)),
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Action Button: Opens existing shop page */}
            <TouchableOpacity
              style={styles.viewShopBtn}
              onPress={() => router.push(`/shop/${selectedShop.id}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewShopBtnText}>{t('map.viewShop')}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  radiusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  radiusPillText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  loadingPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  searchThisAreaContainer: {
    marginTop: spacing[3],
  },
  searchThisAreaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: radius.full,
    ...shadow.md,
  },
  searchThisAreaText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[8] + 20,
  },
  gpsFab: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  gpsFabActive: {
    borderColor: colors.accent,
    backgroundColor: '#FFFBEB',
  },
  freelanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...shadow.sm,
  },
  freelanceBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.lg,
  },
  closeCardBtn: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    zIndex: 10,
    padding: spacing[1],
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  cardThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    paddingRight: spacing[6],
    marginBottom: 3,
  },
  shopName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  reviewsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  dotSeparator: {
    color: colors.textDisabled,
    fontSize: typography.fontSize.xs,
  },
  distanceText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statusAndPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusBadgeOpen: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeClosed: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
  },
  statusTextOpen: {
    color: colors.success,
  },
  statusTextClosed: {
    color: colors.error,
  },
  freelancePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  freelancePillText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: '#4F46E5',
  },
  fromPriceText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
  },
  viewShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  viewShopBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textInverse,
  },
});
