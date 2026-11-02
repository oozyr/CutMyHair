import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@/theme';
import { useLanguage } from '@/i18n';

interface SignedOutStateProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onSignInPress: () => void;
}

export function SignedOutState({
  iconName,
  title,
  subtitle,
  onSignInPress,
}: SignedOutStateProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={48} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity
        style={styles.signInBtn}
        onPress={onSignInPress}
        activeOpacity={0.8}
      >
        <Ionicons name="log-in-outline" size={20} color={colors.textInverse} />
        <Text style={styles.signInBtnText}>{t('auth.signIn')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[12],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[8],
    maxWidth: 290,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.full,
    ...shadow.md,
  },
  signInBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
