/**
 * PARKIN — Smart Campus Parking
 * Hook: useThemeColors
 *
 * Mengembalikan objek ColorPalette aktif (DarkColors atau LightColors)
 * sesuai tema yang sedang aktif.
 */

import { useTheme } from '../context/ThemeContext';
import { ColorPalette } from '../constants/theme';

export function useThemeColors(): ColorPalette {
  const { colors } = useTheme();
  return colors;
}

export { useTheme } from '../context/ThemeContext';
