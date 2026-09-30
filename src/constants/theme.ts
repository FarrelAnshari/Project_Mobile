/**
 * PARKIN — Smart Campus Parking
 * Constants: Colors, Spacing, Typography
 */

// ThemeColor type for legacy component compatibility
export type ThemeColor =
  | 'background'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'text'
  | 'textSecondary'
  | 'border'
  | 'primary';

// Fonts for legacy components
export const Fonts = {
  mono: 'monospace',
  sans: 'System',
};

// Layout constants for legacy components
export const BottomTabInset = 80;
export const MaxContentWidth = 600;

export const Colors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  secondary: '#60A5FA',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  border: '#CBD5E1',
  borderLight: '#F1F5F9',

  // Semantic status colors
  success: '#15803D',
  successBg: '#DCFCE7',
  successLight: '#86EFAC',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  warningLight: '#FCD34D',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  dangerLight: '#FCA5A5',
  info: '#0369A1',
  infoBg: '#E0F2FE',

  // Parking status colors — AVAILABLE / BUSY / NEAR FULL / FULL
  available: '#15803D',       // AVAILABLE — green
  availableBg: '#DCFCE7',
  busy: '#B45309',            // BUSY — amber
  busyBg: '#FEF3C7',
  nearFull: '#B91C1C',        // NEAR FULL — red
  nearFullBg: '#FEE2E2',
  full: '#7F1D1D',            // FULL — deep red
  fullBg: '#FEE2E2',

  // Legacy aliases (kept for OccupancyBar color fallback)
  sepi: '#15803D',
  sepiBg: '#DCFCE7',
  sedang: '#B45309',
  sedangBg: '#FEF3C7',
  ramai: '#B91C1C',
  ramaiBg: '#FEE2E2',
  hampirPenuh: '#7F1D1D',
  hampirPenuhBg: '#FEE2E2',
  penuh: '#7F1D1D',
  penuhBg: '#FEE2E2',

  shadow: 'rgba(15, 23, 42, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.4)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
  // Legacy spacing aliases used by old template components
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 20,
  five: 24,
  six: 32,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};
