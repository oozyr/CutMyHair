import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import type { Customer } from '@cutmyhair/shared';

interface SignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (customer: Customer) => void;
  titlePrompt?: string;
}

const PREFERENCE_OPTIONS = [
  { key: 'haircut', label: 'Haircut' },
  { key: 'skinFade', label: 'Skin Fade' },
  { key: 'beardTrim', label: 'Beard Trim' },
  { key: 'colouring', label: 'Colouring' },
  { key: 'kidsCut', label: 'Kids Cut' },
];

export function SignInModal({ visible, onClose, onSuccess, titlePrompt }: SignInModalProps) {
  const { t, locale } = useLanguage();
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (visible) {
      setStep(1);
      setEmail('');
      setCode('');
      setName('');
      setPhone('');
      setSelectedServices([]);
      setConsentAccepted(false);
      setIsNewUser(false);
      setLoading(false);
      setError(null);
      setResendTimer(0);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible]);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendTimer]);

  // Step 1: Send OTP
  async function handleSendOtp() {
    setError(null);
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtp(trimmed);
      setIsNewUser(res.isNewUser);
      setStep(2);
      setResendTimer(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('booking.errorMessage'));
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (resendTimer > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      await requestOtp(email.trim());
      setResendTimer(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('booking.errorMessage'));
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify Code (or proceed to Step 3 if new user)
  async function handleVerifyCode() {
    setError(null);
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      setError(t('auth.invalidCode'));
      return;
    }

    if (isNewUser) {
      setStep(3);
      return;
    }

    // Existing user: complete sign in directly
    setLoading(true);
    try {
      const customer = await verifyOtp({
        email: email.trim(),
        code: trimmedCode,
      });
      onSuccess?.(customer);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('booking.errorMessage'));
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Complete Registration for new customer
  async function handleCompleteRegistration() {
    setError(null);
    if (!name.trim()) {
      setError(t('auth.nameRequired'));
      return;
    }

    const cleanedPhone = phone.replace(/[\s\-]/g, '');
    const phoneMatch = cleanedPhone.match(/^(\+?60|0)(\d{9,10})$/);
    if (!phoneMatch) {
      setError(t('auth.phoneRequired'));
      return;
    }

    if (!consentAccepted) {
      setError(t('auth.consentRequired'));
      return;
    }

    setLoading(true);
    try {
      const customer = await verifyOtp({
        email: email.trim(),
        code: code.trim(),
        name: name.trim(),
        phone: phone.trim(),
        preferences: {
          preferredLanguage: locale,
          favoriteServiceTypes: selectedServices,
        },
      });
      onSuccess?.(customer);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('booking.errorMessage'));
    } finally {
      setLoading(false);
    }
  }

  function toggleServiceChip(chipKey: string) {
    setSelectedServices((prev) =>
      prev.includes(chipKey) ? prev.filter((k) => k !== chipKey) : [...prev, chipKey],
    );
  }

  function showTerms() {
    Alert.alert(t('auth.termsTitle'), t('auth.termsText'));
  }

  function showPrivacy() {
    Alert.alert(t('auth.privacyTitle'), t('auth.privacyText'));
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {titlePrompt || t('auth.signIn')}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step 1: Email */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-outline" size={32} color={colors.accent} />
                </View>
                <Text style={styles.stepTitle}>{t('auth.step1Title')}</Text>
                <Text style={styles.stepSubtitle}>{t('auth.step1Subtitle')}</Text>

                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{t('profile.email')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (error) setError(null);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t('auth.sendOtp')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: 6-Digit OTP */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="key-outline" size={32} color={colors.accent} />
                </View>
                <Text style={styles.stepTitle}>{t('auth.step2Title')}</Text>
                <Text style={styles.stepSubtitle}>
                  {t('auth.step2Subtitle', { email })}
                </Text>

                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder={t('auth.otpPlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                    value={code}
                    onChangeText={(val) => {
                      setCode(val);
                      if (error) setError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                </View>

                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimerText}>
                      {t('auth.resendIn', { seconds: resendTimer })}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp} disabled={loading} activeOpacity={0.7}>
                      <Text style={styles.resendBtnText}>{t('auth.resendCode')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {isNewUser ? t('booking.next') : t('auth.verify')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Registration Profile (New user only) */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-add-outline" size={32} color={colors.accent} />
                </View>
                <Text style={styles.stepTitle}>{t('auth.step3Title')}</Text>
                <Text style={styles.stepSubtitle}>{t('auth.step3Subtitle')}</Text>

                {/* Name */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{t('auth.fullName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.fullNamePlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (error) setError(null);
                    }}
                  />
                </View>

                {/* Phone */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{t('auth.phone')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.phonePlaceholder')}
                    placeholderTextColor={colors.textDisabled}
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (error) setError(null);
                    }}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Favorite Services Chips */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{t('auth.preferences')}</Text>
                  <View style={styles.chipsContainer}>
                    {PREFERENCE_OPTIONS.map((item) => {
                      const isSelected = selectedServices.includes(item.key);
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() => toggleServiceChip(item.key)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {t(`services.${item.key}`) || item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Consent Checkbox */}
                <View style={styles.consentRow}>
                  <TouchableOpacity
                    style={styles.checkboxTouch}
                    onPress={() => {
                      setConsentAccepted((prev) => !prev);
                      if (error) setError(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={consentAccepted ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={consentAccepted ? colors.accent : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <View style={styles.consentTextWrap}>
                    <Text style={styles.consentText}>
                      {t('auth.consent')}{' '}
                      <Text style={styles.consentLink} onPress={showTerms}>
                        ({t('auth.terms')})
                      </Text>{' '}
                      <Text style={styles.consentLink} onPress={showPrivacy}>
                        ({t('auth.privacy')})
                      </Text>
                    </Text>
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleCompleteRegistration}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t('auth.createAccount')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    padding: spacing[1],
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollContent: {
    padding: spacing[5],
    paddingBottom: spacing[12],
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  stepTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  stepSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 20,
    maxWidth: 300,
  },
  inputWrap: {
    width: '100%',
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  otpInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    letterSpacing: 10,
  },
  resendRow: {
    marginVertical: spacing[2],
  },
  resendTimerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  resendBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.accent,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textInverse,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginVertical: spacing[3],
    gap: spacing[2],
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  consentTextWrap: {
    flex: 1,
  },
  consentText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  consentLink: {
    color: colors.accent,
    fontFamily: typography.fontFamily.bold,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing[3] + 2,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    ...shadow.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
