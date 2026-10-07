/**
 * PARKIN — Smart Campus Parking
 * Utils: Responsive Layout Helpers
 *
 * Provides comprehensive responsive utilities across:
 * - Mobile (< 600px)
 * - Tablet (600px - 1024px)
 * - Desktop (>= 1024px)
 */

import { useWindowDimensions } from 'react-native';

export type ScreenSize = 'small' | 'mobile' | 'tablet' | 'desktop';

/** Breakpoints in dp */
export const BREAKPOINTS = {
  small: 360,
  mobile: 600,
  tablet: 1024,
  desktop: 1280,
};

export const MAX_CONTENT_WIDTH = 980;

/** Determine screen size category */
export function getScreenSize(width: number): ScreenSize {
  if (width < BREAKPOINTS.small) return 'small';
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Hook: returns responsive values based on current screen width and height.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenSize = getScreenSize(width);

  const isSmall = width < BREAKPOINTS.small;
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.mobile;

  // Clamped content width (never stretches infinitely on large monitors)
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);

  // Responsive padding
  const horizontalPadding = isSmall ? 12 : isMobile ? 16 : isTablet ? 24 : 32;

  // Dynamic grid columns
  const numColumns = isDesktop ? 3 : isTablet || isLandscape ? 2 : 1;

  // Grid card width calculation
  const gap = 16;
  const innerWidth = contentWidth - horizontalPadding * 2;
  const cardWidth =
    numColumns === 3
      ? (innerWidth - gap * 2) / 3
      : numColumns === 2
      ? (innerWidth - gap) / 2
      : innerWidth;

  return {
    width,
    height,
    screenSize,
    isSmall,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isLandscape,
    numColumns,
    cardWidth,
    horizontalPadding,
    contentWidth,
    maxContentWidth: MAX_CONTENT_WIDTH,
    fontScale: isSmall ? 0.9 : isDesktop ? 1.05 : 1,
  };
}

/** Responsive font size */
export function responsiveFontSize(base: number, width: number): number {
  if (width < 360) return Math.round(base * 0.88);
  if (width > 1024) return Math.round(base * 1.05);
  return base;
}
