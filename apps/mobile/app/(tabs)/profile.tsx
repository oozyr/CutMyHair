import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';

export default function ProfileScreen() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/batik1.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('profile.language')}</Text>

            <View style={styles.card}>
              {/* English Option */}
              <TouchableOpacity
                style={[
                  styles.languageRow,
                  locale === 'en' && styles.languageRowSelected,
                ]}
                onPress={() => setLocale('en')}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.flag}>🇬🇧</Text>
                  <Text
                    style={[
                      styles.languageText,
                      locale === 'en' && styles.languageTextSelected,
                    ]}
                  >
                    {t('profile.english')}
                  </Text>
                </View>
                {locale === 'en' ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                ) : (
                  <View style={styles.radioUnselected} />
                )}
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Bahasa Malaysia Option */}
              <TouchableOpacity
                style={[
                  styles.languageRow,
                  locale === 'ms' && styles.languageRowSelected,
                ]}
                onPress={() => setLocale('ms')}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.flag}>🇲🇾</Text>
                  <Text
                    style={[
                      styles.languageText,
                      locale === 'ms' && styles.languageTextSelected,
                    ]}
                  >
                    {t('profile.bahasaMalaysia')}
                  </Text>
                </View>
                {locale === 'ms' ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                ) : (
                  <View style={styles.radioUnselected} />
                )}
              </TouchableOpacity>
            </View>
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
    paddingTop: spacing[3],
  },
  header: {
    marginBottom: spacing[6],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3] + 2,
    paddingHorizontal: spacing[4],
  },
  languageRowSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 20,
    marginRight: spacing[3],
  },
  languageText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  languageTextSelected: {
    fontFamily: typography.fontFamily.bold,
    color: colors.accent,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },
});
