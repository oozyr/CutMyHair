/**
 * CutMyHair design tokens - colors
 *
 * Direction: Dark navy + bold red accent on clean white/off-white.
 * Modern, trustworthy, masculine. Inspired by premium grooming brands.
 */
export const colors = {
  // Brand
  primary: '#1A1A2E',      // deep navy - main brand color
  accent: '#E94560',       // vivid red - CTAs, badges, active state
  accentLight: '#FF6B88',  // lighter red for hover states

  // Backgrounds
  background: '#F8F9FA',   // near-white page background
  surface: '#FFFFFF',      // cards, modals, sheets
  surfaceAlt: '#F0F2F5',   // secondary surface (input backgrounds)

  // Text
  textPrimary: '#1A1A2E',  // main body text
  textSecondary: '#6B7280', // muted labels
  textInverse: '#FFFFFF',  // text on dark backgrounds
  textDisabled: '#9CA3AF',

  // Border / divider
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Status chip colors (booking)
  statusPending: '#F59E0B',
  statusConfirmed: '#3B82F6',
  statusCheckedIn: '#8B5CF6',
  statusCompleted: '#10B981',
  statusCancelled: '#6B7280',

  // Map
  mapPin: '#E94560',
  mapPinUser: '#1A1A2E',

  // Overlay
  overlay: 'rgba(26, 26, 46, 0.5)',
} as const;

export type ColorToken = keyof typeof colors;
