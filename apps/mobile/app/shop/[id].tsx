import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { api } from '@/api';
import type { Shop } from '@cutmyhair/shared';

export default function ShopDetailPlaceholder() {
  const { id, initialName } = useLocalSearchParams<{
    id: string;
    initialName?: string;
  }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(!initialName);

  useEffect(() => {
    let mounted = true;
    if (id) {
      api
        .getShop(id)
        .then((data) => {
          if (mounted) setShop(data);
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  const shopName = shop?.name || initialName || t('shopDetail.title');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/batik1.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.container}>
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Centered Content */}
          <View style={styles.centerContent}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} />
            ) : (
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Ionicons name="cut" size={32} color={colors.accent} />
                </View>
                <Text style={styles.shopName}>{shopName}</Text>
                {shop?.address ? (
                  <Text style={styles.shopAddress}>{shop.address}</Text>
                ) : null}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {t('shopDetail.placeholderNotice')}
                  </Text>
                </View>
              </View>
            )}
          </View>
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
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  topBar: {
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing[12],
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  shopName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  shopAddress: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    marginTop: spacing[2],
  },
  badgeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
