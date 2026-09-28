/**
 * PARKIN — Smart Campus Parking
 * Utils: Responsive Layout Helpers
 *
 * Provides utilities for adaptive layouts across screen sizes.
 * Uses useWindowDimensions for reactive sizing.
 */

import { useWindowDimensions } from 'react-native';

export type ScreenSize = 'small' | 'normal' | 'large';

/** Breakpoints in dp */
const BREAKPOINTS = {
  small: 360,
  normal: 414,
  large: 600,
};

/** Determine screen size category */
export function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.normal) return 'small';
  if (width < BREAKPOINTS.large) return 'normal';
  return 'large';
}

/**
 * Hook: returns responsive values based on current screen width.
 * Usage: const { isSmall, isLarge, numColumns } = useResponsive();
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenSize = getScreenSize(width);
  const isSmall = screenSize === 'small';
  const isLarge = screenSize === 'large';

  return {
    width,
    height,
    screenSize,
    isSmall,
    isLarge,
    isLandscape,
    /** Number of columns for grid layouts */
    numColumns: isLarge ? 3 : isLandscape ? 2 : 1,
    /** Card width for 2-column layouts */
    cardWidth: isLarge || isLandscape ? (width - 48) / 2 : width - 32,
    /** Horizontal padding */
    horizontalPadding: isSmall ? 12 : 16,
    /** Font scale factor */
    fontScale: isSmall ? 0.9 : isLarge ? 1.1 : 1,
  };
}

/** Responsive font size */
export function responsiveFontSize(base: number, width: number): number {
  const scale = width < 360 ? 0.88 : width > 600 ? 1.1 : 1;
  return Math.round(base * scale);
}
