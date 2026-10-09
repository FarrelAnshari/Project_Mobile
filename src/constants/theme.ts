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
  primary: '#615CED',      // Purple-blue from template
  primaryLight: '#8B87FF',
  primaryDark: '#4A46D6',
  secondary: '#FF8A00',    // Orange accent from template
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1E1E2D',
  textSecondary: '#8F92A1',
  textTertiary: '#BDBDBD',
  border: '#E8E8E8',
  borderLight: '#F3F3F3',

  // Status colors
  success: '#16A34A',
  successBg: '#DCFCE7',
  successLight: '#86EFAC',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  warningLight: '#FCD34D',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerLight: '#FCA5A5',
  info: '#0EA5E9',
  infoBg: '#E0F2FE',

  // Parking status colors
  available: '#16A34A',
  availableBg: '#DCFCE7',
  busy: '#F59E0B',
  busyBg: '#FEF3C7',
  nearFull: '#EA580C',
  nearFullBg: '#FFF7ED',
  full: '#DC2626',
  fullBg: '#FEE2E2',

  // Legacy status colors
  sepi: '#16A34A',    // Sepi — green
  sepiBg: '#DCFCE7',
  sedang: '#0EA5E9',  // Sedang — blue
  sedangBg: '#E0F2FE',
  ramai: '#F59E0B',   // Ramai — amber
  ramaiBg: '#FEF3C7',
  hampirPenuh: '#EA580C', // Hampir Penuh — orange
  hampirPenuhBg: '#FFF7ED',
  penuh: '#DC2626',   // Penuh — red
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
