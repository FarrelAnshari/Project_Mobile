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

export const LightColors = {
  primary: '#615CED',      // Purple-blue from template
  primaryLight: '#8B87FF',
  primaryDark: '#4A46D6',
  secondary: '#FF8A00',    // Orange accent from template0
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

export const DarkColors = {
  primary: '#7C6FF7',      // Slightly lighter & more vibrant purple-blue for dark mode
  primaryLight: '#9D96FF',
  primaryDark: '#5A56E0',
  secondary: '#FF9A20',
  background: '#0D0D18',   // Deep dark midnight
  surface: '#171727',      // Dark slate card surface
  textPrimary: '#F1F1F8',  // Crisp high-contrast text
  textSecondary: '#9A9EB2',// Muted text
  textTertiary: '#5C6079', // Subtle text
  border: '#28283F',      // Card and row borders
  borderLight: '#1F1F35',

  // Status colors with dark-mode friendly translucent/tinted backgrounds
  success: '#22C55E',
  successBg: 'rgba(34, 197, 94, 0.16)',
  successLight: '#4ADE80',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.16)',
  warningLight: '#FCD34D',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.18)',
  dangerLight: '#FCA5A5',
  info: '#38BDF8',
  infoBg: 'rgba(56, 189, 248, 0.16)',

  // Parking status colors
  available: '#22C55E',
  availableBg: 'rgba(34, 197, 94, 0.16)',
  busy: '#F59E0B',
  busyBg: 'rgba(245, 158, 11, 0.16)',
  nearFull: '#F97316',
  nearFullBg: 'rgba(249, 115, 22, 0.16)',
  full: '#EF4444',
  fullBg: 'rgba(239, 68, 68, 0.18)',

  // Legacy status colors
  sepi: '#22C55E',
  sepiBg: 'rgba(34, 197, 94, 0.16)',
  sedang: '#38BDF8',
  sedangBg: 'rgba(56, 189, 248, 0.16)',
  ramai: '#F59E0B',
  ramaiBg: 'rgba(245, 158, 11, 0.16)',
  hampirPenuh: '#F97316',
  hampirPenuhBg: 'rgba(249, 115, 22, 0.16)',
  penuh: '#EF4444',
  penuhBg: 'rgba(239, 68, 68, 0.18)',

  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

// Default export alias for backward compatibility
export const Colors = LightColors;
export type ColorPalette = typeof LightColors;


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
