import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { colors, typography, spacing, radius, shadow } from '@/theme';

export interface CheckInQRModalProps {
  visible: boolean;
  onClose: () => void;
  qrData: { code: string; payload: string } | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function CheckInQRModal({
  visible,
  onClose,
  qrData,
  t,
}: CheckInQRModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.qrModalContainer}>
        {/* Header */}
        <View style={styles.qrHeader}>
          <TouchableOpacity
            style={styles.qrCloseButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qrHeaderTitle}>{t('bookingDetail.qrTitle')}</Text>
          <View style={styles.backPlaceholder} />
        </View>

        <View style={styles.qrContent}>
          <Text style={styles.qrSubtitle}>{t('bookingDetail.qrSubtitle')}</Text>

          {/* Large QR Code */}
          {qrData?.payload ? (
            <View style={styles.qrBox}>
              <QRCode
                value={qrData.payload}
                size={240}
                color={colors.primary}
                backgroundColor="#FFFFFF"
              />
            </View>
          ) : null}

          {/* 6 character backup code */}
          {qrData?.code ? (
            <View style={styles.backupCodeWrap}>
              <Text style={styles.backupCodeLabel}>{t('bookingDetail.backupCodeLabel')}</Text>
              <View style={styles.backupCodeBadge}>
                <Text style={styles.backupCodeText}>
                  {qrData.code.split('').join(' ')}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.qrDoneButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.qrDoneButtonText}>{t('bookingDetail.close')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  qrModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  qrCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHeaderTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  backPlaceholder: {
    width: 44,
  },
  qrContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  qrSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  qrBox: {
    padding: spacing[5],
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  backupCodeWrap: {
    alignItems: 'center',
    gap: spacing[2],
  },
  backupCodeLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  backupCodeBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backupCodeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.primary,
    letterSpacing: 4,
  },
  qrDoneButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    borderRadius: radius.full,
    marginTop: spacing[2],
  },
  qrDoneButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textInverse,
  },
});
