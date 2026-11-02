import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api, type AppNotification } from '@/api';
import { DEMO_CUSTOMER } from '@/config/demoCustomer';
import { useNotifications } from '@/context/NotificationContext';
import { formatSen, type Booking, type Shop, type Barber, type Service } from '@cutmyhair/shared';
import { formatSlotTime } from '@/components/DateTimeSlotPicker';

type InboxTab = 'upcoming' | 'completed' | 'notifications';

interface EnrichedBooking {
  booking: Booking;
  shopName: string;
  serviceName: string;
  barberName: string;
}

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

function formatNotificationTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleDateString('en-MY', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  });
}

function getStatusBadge(status: Booking['status']) {
  switch (status) {
    case 'pending':
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

export default function InboxScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    refreshNotifications,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<InboxTab>('upcoming');

  // Upcoming
  const [upcomingBookings, setUpcomingBookings] = useState<EnrichedBooking[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingRefreshing, setUpcomingRefreshing] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  // Completed
  const [completedBookings, setCompletedBookings] = useState<EnrichedBooking[]>([]);
  const [completedLoading, setCompletedLoading] = useState(true);
  const [completedRefreshing, setCompletedRefreshing] = useState(false);
  const [completedError, setCompletedError] = useState<string | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());

  // Review Sheet State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<EnrichedBooking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Mark notifications as read when opening notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      markAllAsRead();
    }
  }, [activeTab, markAllAsRead]);

  // Fetch upcoming bookings
  const fetchUpcomingBookings = useCallback(async () => {
    setUpcomingError(null);
    try {
      const [bookings, shops] = await Promise.all([
        api.getBookings(DEMO_CUSTOMER.id),
        api.getShops().catch(() => [] as Shop[]),
      ]);

      const shopsMap = new Map<string, Shop>();
      for (const s of shops) shopsMap.set(s.id, s);

      const now = Date.now();
      const filtered = bookings.filter((b) => {
        if (b.status === 'cancelled' || b.status === 'completed') return false;
        const endMs = new Date(b.endTime).getTime();
        return endMs > now;
      });

      filtered.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

      const shopIds = Array.from(new Set(filtered.map((b) => b.shopId)));
      const barbersMap = new Map<string, Barber>();
      const servicesMap = new Map<string, Service>();

      await Promise.all(
        shopIds.map(async (sId) => {
          try {
            const [bList, sList] = await Promise.all([
              api.getBarbers(sId).catch(() => []),
              api.getServices(sId).catch(() => []),
            ]);
            for (const b of bList) barbersMap.set(b.id, b);
            for (const s of sList) servicesMap.set(s.id, s);
          } catch {
            // Ignore
          }
        }),
      );

      const enriched: EnrichedBooking[] = filtered.map((b) => ({
        booking: b,
        shopName: shopsMap.get(b.shopId)?.name || b.shopId,
        serviceName: servicesMap.get(b.serviceId)?.name || t('bookingDetail.service'),
        barberName: barbersMap.get(b.barberId)?.name || t('bookingDetail.barber'),
      }));

      setUpcomingBookings(enriched);
    } catch (err: unknown) {
      setUpcomingError(err instanceof Error ? err.message : t('inbox.errorMessage'));
    } finally {
      setUpcomingLoading(false);
      setUpcomingRefreshing(false);
    }
  }, [t]);

  // Fetch completed bookings & reviews
  const fetchCompletedBookings = useCallback(async () => {
    setCompletedError(null);
    try {
      const [bookings, shops] = await Promise.all([
        api.getBookings(DEMO_CUSTOMER.id),
        api.getShops().catch(() => [] as Shop[]),
      ]);

      const shopsMap = new Map<string, Shop>();
      for (const s of shops) shopsMap.set(s.id, s);

      const filtered = bookings.filter((b) => b.status === 'completed');

      // Sort newest first
      filtered.sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );

      const shopIds = Array.from(new Set(filtered.map((b) => b.shopId)));
      const barbersMap = new Map<string, Barber>();
      const servicesMap = new Map<string, Service>();
      const reviewedIds = new Set<string>();

      await Promise.all(
        shopIds.map(async (sId) => {
          try {
            const [bList, sList, reviews] = await Promise.all([
              api.getBarbers(sId).catch(() => []),
              api.getServices(sId).catch(() => []),
              api.getReviews(sId).catch(() => []),
            ]);
            for (const b of bList) barbersMap.set(b.id, b);
            for (const s of sList) servicesMap.set(s.id, s);
            for (const r of reviews) {
              if (r.customerId === DEMO_CUSTOMER.id) {
                reviewedIds.add(r.bookingId);
              }
            }
          } catch {
            // Ignore
          }
        }),
      );

      setReviewedBookingIds(reviewedIds);

      const enriched: EnrichedBooking[] = filtered.map((b) => ({
        booking: b,
        shopName: shopsMap.get(b.shopId)?.name || b.shopId,
        serviceName: servicesMap.get(b.serviceId)?.name || t('bookingDetail.service'),
        barberName: barbersMap.get(b.barberId)?.name || t('bookingDetail.barber'),
      }));

      setCompletedBookings(enriched);
    } catch (err: unknown) {
      setCompletedError(err instanceof Error ? err.message : t('inbox.errorMessage'));
    } finally {
      setCompletedLoading(false);
      setCompletedRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchUpcomingBookings();
      fetchCompletedBookings();
    }, [fetchUpcomingBookings, fetchCompletedBookings]),
  );

  const onRefreshUpcoming = useCallback(() => {
    setUpcomingRefreshing(true);
    fetchUpcomingBookings();
  }, [fetchUpcomingBookings]);

  const onRefreshCompleted = useCallback(() => {
    setCompletedRefreshing(true);
    fetchCompletedBookings();
  }, [fetchCompletedBookings]);

  const onRefreshNotifications = useCallback(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Handle opening Review sheet
  function handleOpenReview(item: EnrichedBooking) {
    setReviewBooking(item);
    setRating(5);
    setComment('');
    setReviewModalVisible(true);
  }

  // Handle submit review
  async function handleSubmitReview() {
    if (!reviewBooking) return;
    setSubmittingReview(true);
    try {
      await api.createReview({
        shopId: reviewBooking.booking.shopId,
        customerId: DEMO_CUSTOMER.id,
        bookingId: reviewBooking.booking.id,
        rating,
        comment: comment.trim(),
      });

      setReviewedBookingIds((prev) => new Set(prev).add(reviewBooking.booking.id));
      setReviewModalVisible(false);
      Alert.alert(t('inbox.reviewModalTitle'), t('inbox.reviewSuccess'));
    } catch (err: unknown) {
      Alert.alert(
        t('bookingDetail.errorTitle'),
        err instanceof Error ? err.message : t('inbox.reviewError'),
      );
    } finally {
      setSubmittingReview(false);
    }
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
          <Text style={styles.headerTitle}>{t('inbox.title')}</Text>
        </View>

        {/* 3-Section Segmented Switch */}
        <View style={styles.segmentedContainer}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeTab === 'upcoming' && styles.segmentButtonActive,
              ]}
              onPress={() => setActiveTab('upcoming')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  activeTab === 'upcoming' && styles.segmentButtonTextActive,
                ]}
              >
                {t('inbox.upcoming')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeTab === 'completed' && styles.segmentButtonActive,
              ]}
              onPress={() => setActiveTab('completed')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  activeTab === 'completed' && styles.segmentButtonTextActive,
                ]}
              >
                {t('inbox.completed')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeTab === 'notifications' && styles.segmentButtonActive,
              ]}
              onPress={() => setActiveTab('notifications')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  activeTab === 'notifications' && styles.segmentButtonTextActive,
                ]}
              >
                {t('inbox.notifications')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab 1: Upcoming Bookings */}
        {activeTab === 'upcoming' && (
          <View style={styles.tabContent}>
            {upcomingLoading && !upcomingRefreshing ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>{t('inbox.loading')}</Text>
              </View>
            ) : upcomingError ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorTitle}>{t('inbox.errorTitle')}</Text>
                <Text style={styles.errorSubtitle}>{upcomingError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchUpcomingBookings}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>{t('inbox.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={upcomingBookings}
                keyExtractor={(item) => item.booking.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={upcomingRefreshing}
                    onRefresh={onRefreshUpcoming}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                  />
                }
                renderItem={({ item }) => {
                  const b = item.booking;
                  const badge = getStatusBadge(b.status);
                  const dateStr = formatDateShort(b.startTime.slice(0, 10));
                  const timeRange = `${formatSlotTime(b.startTime)} - ${formatSlotTime(b.endTime)}`;

                  return (
                    <TouchableOpacity
                      style={styles.bookingCard}
                      onPress={() =>
                        router.push({
                          pathname: '/booking/detail/[id]' as any,
                          params: { id: b.id },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.shopNameWrap}>
                          <Ionicons name="storefront-outline" size={18} color={colors.accent} />
                          <Text style={styles.cardShopName} numberOfLines={1}>
                            {item.shopName}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                            {t(`status.${b.status}`)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardBody}>
                        <Text style={styles.cardService}>{item.serviceName}</Text>
                        <View style={styles.cardBarberRow}>
                          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.cardBarberName}>{item.barberName}</Text>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooter}>
                        <View style={styles.cardTimeWrap}>
                          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                          <Text style={styles.cardTimeText}>
                            {dateStr} • {timeRange}
                          </Text>
                        </View>
                        <Text style={styles.cardPrice}>{formatSen(b.price)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.centered}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="calendar-outline" size={44} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('inbox.emptyUpcomingTitle')}</Text>
                    <Text style={styles.emptySubtitle}>{t('inbox.emptyUpcomingMessage')}</Text>
                  </View>
                }
              />
            )}
          </View>
        )}

        {/* Tab 2: Completed Bookings */}
        {activeTab === 'completed' && (
          <View style={styles.tabContent}>
            {completedLoading && !completedRefreshing ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>{t('inbox.loading')}</Text>
              </View>
            ) : completedError ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorTitle}>{t('inbox.errorTitle')}</Text>
                <Text style={styles.errorSubtitle}>{completedError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchCompletedBookings}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>{t('inbox.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={completedBookings}
                keyExtractor={(item) => item.booking.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={completedRefreshing}
                    onRefresh={onRefreshCompleted}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                  />
                }
                renderItem={({ item }) => {
                  const b = item.booking;
                  const isReviewed = reviewedBookingIds.has(b.id);
                  const dateStr = formatDateShort(b.startTime.slice(0, 10));
                  const timeRange = `${formatSlotTime(b.startTime)} - ${formatSlotTime(b.endTime)}`;

                  return (
                    <View style={styles.bookingCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.shopNameWrap}>
                          <Ionicons name="storefront-outline" size={18} color={colors.primary} />
                          <Text style={styles.cardShopName} numberOfLines={1}>
                            {item.shopName}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                          <Text style={[styles.statusBadgeText, { color: colors.statusCompleted }]}>
                            {t('status.completed')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardBody}>
                        <Text style={styles.cardService}>{item.serviceName}</Text>
                        <View style={styles.cardBarberRow}>
                          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.cardBarberName}>{item.barberName}</Text>
                        </View>
                      </View>

                      <View style={styles.cardDivider} />

                      <View style={styles.cardFooter}>
                        <View style={styles.cardTimeWrap}>
                          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                          <Text style={styles.cardTimeText}>
                            {dateStr} • {timeRange}
                          </Text>
                        </View>
                        <Text style={styles.cardPrice}>{formatSen(b.price)}</Text>
                      </View>

                      {/* Review Action Row */}
                      <View style={styles.reviewActionRow}>
                        {isReviewed ? (
                          <View style={styles.reviewedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                            <Text style={styles.reviewedText}>{t('inbox.reviewed')}</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.leaveReviewBtn}
                            onPress={() => handleOpenReview(item)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="star-outline" size={16} color={colors.accent} />
                            <Text style={styles.leaveReviewBtnText}>{t('inbox.leaveReview')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.centered}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="checkmark-done-circle-outline" size={44} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('inbox.emptyCompletedTitle')}</Text>
                    <Text style={styles.emptySubtitle}>{t('inbox.emptyCompletedMessage')}</Text>
                  </View>
                }
              />
            )}
          </View>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <View style={styles.tabContent}>
            {notificationsLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>{t('inbox.loading')}</Text>
              </View>
            ) : notificationsError ? (
              <View style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorTitle}>{t('inbox.errorTitle')}</Text>
                <Text style={styles.errorSubtitle}>{notificationsError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRefreshNotifications}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>{t('inbox.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={notificationsLoading}
                    onRefresh={onRefreshNotifications}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                  />
                }
                renderItem={({ item }: { item: AppNotification }) => {
                  let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'notifications-outline';
                  let iconColor: string = colors.primary;
                  let iconBg: string = colors.surfaceAlt;

                  if (item.type === 'booking_made') {
                    iconName = 'calendar-outline';
                    iconColor = colors.accent;
                    iconBg = '#FFF1F2';
                  } else if (item.type === 'booking_cancelled') {
                    iconName = 'close-circle-outline';
                    iconColor = colors.error;
                    iconBg = '#FEF2F2';
                  } else if (item.type === 'booking_rescheduled') {
                    iconName = 'swap-horizontal-outline';
                    iconColor = colors.info;
                    iconBg = '#EFF6FF';
                  }

                  return (
                    <View style={styles.notificationCard}>
                      <View style={[styles.notifIconWrap, { backgroundColor: iconBg }]}>
                        <Ionicons name={iconName} size={22} color={iconColor} />
                      </View>
                      <View style={styles.notifContent}>
                        <Text style={styles.notifMessage}>{item.message}</Text>
                        <Text style={styles.notifTime}>{formatNotificationTime(item.createdAt)}</Text>
                      </View>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.centered}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="notifications-outline" size={44} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('inbox.emptyNotificationsTitle')}</Text>
                    <Text style={styles.emptySubtitle}>{t('inbox.emptyNotificationsMessage')}</Text>
                  </View>
                }
              />
            )}
          </View>
        )}

        {/* Leave a Review Modal / Sheet */}
        <Modal
          visible={reviewModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <SafeAreaView style={styles.reviewModalContainer}>
            <View style={styles.reviewModalHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setReviewModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.reviewModalHeaderTitle}>{t('inbox.reviewModalTitle')}</Text>
              <View style={styles.closePlaceholder} />
            </View>

            <View style={styles.reviewModalBody}>
              {reviewBooking && (
                <Text style={styles.reviewSubtitle}>
                  {t('inbox.reviewModalSubtitle', {
                    barber: reviewBooking.barberName,
                    shop: reviewBooking.shopName,
                  })}
                </Text>
              )}

              {/* Star Rating Selector */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#F59E0B' : colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment Input */}
              <TextInput
                style={styles.commentInput}
                placeholder={t('inbox.reviewCommentPlaceholder')}
                placeholderTextColor={colors.textDisabled}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitReviewBtn,
                  submittingReview && styles.submitReviewBtnDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
                activeOpacity={0.8}
              >
                {submittingReview ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.submitReviewBtnText}>{t('inbox.reviewSubmit')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
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
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[3],
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  shopNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
    marginRight: spacing[2],
  },
  cardShopName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: spacing[2],
  },
  cardService: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  cardBarberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardBarberName: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing[2],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  cardTimeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  cardPrice: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.accent,
  },
  reviewActionRow: {
    marginTop: spacing[3],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'flex-end',
  },
  leaveReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  leaveReviewBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.accent,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  reviewedText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },

  // Notifications
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
    ...shadow.sm,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifMessage: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    lineHeight: 18,
  },
  notifTime: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginRight: 4,
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
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
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

  // Review Modal Styles
  reviewModalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  reviewModalHeaderTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  closePlaceholder: {
    width: 40,
  },
  reviewModalBody: {
    padding: spacing[5],
    gap: spacing[4],
    alignItems: 'center',
  },
  reviewSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  starBtn: {
    padding: 4,
  },
  commentInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  submitReviewBtn: {
    width: '100%',
    backgroundColor: colors.accent,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  submitReviewBtnDisabled: {
    opacity: 0.6,
  },
  submitReviewBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
