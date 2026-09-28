/**
 * use-theme.ts — Legacy hook stub for PARKIN.
 * Returns a flat colors object compatible with old themed components.
 */

import { Colors, ThemeColor } from '@/constants/theme';

// A flat color map compatible with legacy themed components
const themeColors: Record<string, string> = {
  background: Colors.background,
  backgroundElement: Colors.borderLight,
  backgroundSelected: Colors.primary + '20',
  text: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  border: Colors.border,
  primary: Colors.primary,
};

export function useTheme(): Record<string, string> {
  return {
    ...themeColors,
    // Additional keys old components may request
    backgroundSelected: Colors.primary + '20',
  };
}
