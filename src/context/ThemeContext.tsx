/**
 * PARKIN — Smart Campus Parking
 * Context: ThemeContext
 *
 * Mengelola preferensi tema aplikasi (Light / Dark / System).
 * - Persisten via AsyncStorage
 * - Deteksi otomatis mode sistem
 * - Menyediakan color palette dinamis
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, ColorPalette } from '../constants/theme';
import { getString, setString, STORAGE_KEYS } from '../services/asyncStorageService';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  themeMode: ThemeMode;
  theme: Theme;
  isDark: boolean;
  colors: ColorPalette;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference on start
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await getString(STORAGE_KEYS.THEME_MODE);
        if (isMounted && saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (e) {
        console.warn('[ThemeContext] Gagal memuat tema:', e);
      } finally {
        if (isMounted) setIsReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute resolved active theme ('light' or 'dark')
  const resolvedTheme: Theme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await setString(STORAGE_KEYS.THEME_MODE, mode);
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    setThemeModeState(nextMode);
    await setString(STORAGE_KEYS.THEME_MODE, nextMode);
  }, [isDark]);

  const value = useMemo<ThemeContextValue>(() => ({
    themeMode,
    theme: resolvedTheme,
    isDark,
    colors,
    setThemeMode,
    toggleTheme,
  }), [themeMode, resolvedTheme, isDark, colors, setThemeMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
