import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { SignInModal } from '@/components/SignInModal';
import { SignedOutState } from '@/components/SignedOutState';

const SERVICE_CHIPS: { key: string; labelKey: string }[] = [
  { key: 'haircut', labelKey: 'services.haircut' },
  { key: 'skinFade', labelKey: 'services.skinFade' },
  { key: 'beardTrim', labelKey: 'services.beardTrim' },
  { key: 'colouring', labelKey: 'services.colouring' },
  { key: 'kidsCut', labelKey: 'services.kidsCut' },
];

export default function ProfileScreen() {
  const { locale, setLocale, t } = useLanguage();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();

  const [signInVisible, setSignInVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFavs, setEditFavs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function openEdit() {
    setEditName(user?.name ?? '');
    setEditPhone(user?.phone ?? '');
    setEditFavs(user?.preferences?.favoriteServiceTypes ?? []);
    setEditVisible(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        preferences: { favoriteServiceTypes: editFavs },
      });
      setEditVisible(false);
    } catch (e: unknown) {
      Alert.alert(
        t('bookingDetail.errorTitle'),
        e instanceof Error ? e.message : t('inbox.errorMessage'),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert(t('auth.signOutConfirmTitle'), t('auth.signOutConfirmMessage'), [
      { text: t('auth.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: logout,
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(t('profile.deleteAccount'), t('profile.comingSoon'));
  }

  const favouriteLabels = user?.preferences?.favoriteServiceTypes?.length
    ? SERVICE_CHIPS.filter((c) => user.preferences?.favoriteServiceTypes?.includes(c.key))
        .map((c) => t(c.labelKey))
        .join(', ')
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/images/batik1.jpg')}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          </View>

          {/* Guest state */}
          {!isAuthenticated ? (
            <>
              <SignedOutState
                iconName="person-circle-outline"
                title={t('guest.profileTitle')}
                subtitle={t('guest.profileSubtitle')}
                onSignInPress={() => setSignInVisible(true)}
              />
              <SignInModal
                visible={signInVisible}
                onClose={() => setSignInVisible(false)}
                onSuccess={() => setSignInVisible(false)}
              />
            </>
          ) : (
            <>
              {/* Account Details */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>{t('profile.account')}</Text>
                <View style={styles.card}>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>{t('profile.fullName')}</Text>
                      <Text style={styles.infoValue}>{user?.name || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>{t('profile.email')}</Text>
                      <Text style={styles.infoValue}>{user?.email || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>{t('profile.phone')}</Text>
                      <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.infoRow}>
                    <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>{t('profile.preferences')}</Text>
                      <Text style={styles.infoValue}>
                        {favouriteLabels || t('profile.noPreferences')}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.8}>
                  <Ionicons name="pencil-outline" size={16} color={colors.textInverse} />
                  <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Language Section - always visible */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('profile.language')}</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.languageRow, locale === 'en' && styles.languageRowSelected]}
                onPress={() => setLocale('en')}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.flag}>🇬🇧</Text>
                  <Text
                    style={[styles.languageText, locale === 'en' && styles.languageTextSelected]}
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

              <TouchableOpacity
                style={[styles.languageRow, locale === 'ms' && styles.languageRowSelected]}
                onPress={() => setLocale('ms')}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.flag}>🇲🇾</Text>
                  <Text
                    style={[styles.languageText, locale === 'ms' && styles.languageTextSelected]}
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

          {/* Account Actions - only when signed in */}
          {isAuthenticated && (
            <View style={styles.section}>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>
                    {t('auth.signOut')}
                  </Text>
                </TouchableOpacity>

                <View style={styles.cardDivider} />

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                    {t('profile.deleteAccount')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </ImageBackground>

      {/* Edit Profile Modal */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setEditVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('profile.editProfile')}</Text>
            <View style={styles.closePlaceholder} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.fieldLabel}>{t('profile.fullName')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('auth.fullNamePlaceholder')}
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="words"
            />

            {/* Phone */}
            <Text style={styles.fieldLabel}>{t('profile.phone')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder={t('auth.phonePlaceholder')}
              placeholderTextColor={colors.textDisabled}
              keyboardType="phone-pad"
            />

            {/* Favourite services */}
            <Text style={styles.fieldLabel}>{t('profile.preferences')}</Text>
            <View style={styles.chipsRow}>
              {SERVICE_CHIPS.map((chip) => {
                const active = editFavs.includes(chip.key);
                return (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      setEditFavs((prev) =>
                        active ? prev.filter((k) => k !== chip.key) : [...prev, chip.key],
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {t(chip.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.saveBtnText}>{t('profile.save')}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    paddingBottom: spacing[12],
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    marginTop: spacing[3],
  },
  editBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  actionText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
  },
  // Edit Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
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
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  closePlaceholder: {
    width: 40,
  },
  modalBody: {
    padding: spacing[5],
    gap: spacing[3],
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: '#FFF1F2',
  },
  chipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accent,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
