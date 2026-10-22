/**
 * CutMyHair design tokens - typography
 * Font: Lato (Regular 400, Bold 700)
 */
export const typography = {
  fontFamily: {
    regular: 'Lato-Regular',
    bold: 'Lato-Bold',
    // fallback for web (CSS)
    stack: "'Lato', 'Helvetica Neue', Arial, sans-serif",
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    base: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;
