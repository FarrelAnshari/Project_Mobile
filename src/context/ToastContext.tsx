/**
 * PARKIN — Smart Campus Parking
 * Context: ToastContext
 *
 * Sistem notifikasi Toast terpusat untuk seluruh aplikasi.
 * Dibangun murni dengan React Native + Reanimated (tanpa library eksternal).
 *
 * Penggunaan:
 *   const toast = useToast();
 *   toast.error('Gagal terhubung ke server');
 *   toast.success('Data berhasil dimuat');
 *   toast.warning('Koneksi lambat');
 *   toast.info('Sesi akan habis dalam 5 menit');
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

// ============================================================
// Types
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  /** Tampilkan toast sukses (hijau) */
  success: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) => void;
  /** Tampilkan toast error (merah) */
  error: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) => void;
  /** Tampilkan toast peringatan (kuning) */
  warning: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) => void;
  /** Tampilkan toast informasi (biru) */
  info: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) => void;
  /** Tampilkan toast generik */
  show: (config: Omit<ToastConfig, 'id'>) => void;
}

// ============================================================
// Context
// ============================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================================
// Toast visual configs per type
// ============================================================

const TOAST_CONFIGS: Record<ToastType, { icon: string; color: string; bg: string; darkBg: string }> = {
  success: {
    icon: 'checkmark-circle',
    color: '#22C55E',
    bg: '#F0FDF4',
    darkBg: 'rgba(34, 197, 94, 0.15)',
  },
  error: {
    icon: 'alert-circle',
    color: '#EF4444',
    bg: '#FEF2F2',
    darkBg: 'rgba(239, 68, 68, 0.18)',
  },
  warning: {
    icon: 'warning',
    color: '#F59E0B',
    bg: '#FFFBEB',
    darkBg: 'rgba(245, 158, 11, 0.15)',
  },
  info: {
    icon: 'information-circle',
    color: '#6366F1',
    bg: '#EEF2FF',
    darkBg: 'rgba(99, 102, 241, 0.15)',
  },
};

// ============================================================
// Single Toast Item Component
// ============================================================

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
}) {
  const { isDark } = useTheme();
  const config = TOAST_CONFIGS[toast.type];
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  const dismiss = useCallback(() => {
    'worklet';
    translateY.value = withTiming(-80, { duration: 250, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)(toast.id);
      }
    });
  }, [toast.id, onDismiss]);

  useEffect(() => {
    // Entry animation
    translateY.value = withSpring(0, { damping: 18, stiffness: 280 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 18, stiffness: 280 });

    // Auto-dismiss
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const backgroundColor = isDark ? config.darkBg : config.bg;
  const borderColor = config.color + (isDark ? '40' : '25');
  const textColor = isDark ? '#F1F1F8' : '#1E293B';
  const subTextColor = isDark ? '#A0A0B8' : '#64748B';

  return (
    <Animated.View
      style={[
        styles.toastItem,
        animStyle,
        {
          backgroundColor,
          borderColor,
          shadowColor: config.color,
        },
      ]}
    >
      {/* Colored left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: config.color }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
        <Ionicons
          name={config.icon as any}
          size={20}
          color={config.color}
        />
      </View>

      {/* Text Content */}
      <View style={styles.textContent}>
        {toast.title && (
          <Text style={[styles.toastTitle, { color: textColor }]} numberOfLines={1}>
            {toast.title}
          </Text>
        )}
        <Text
          style={[styles.toastMessage, { color: toast.title ? subTextColor : textColor }]}
          numberOfLines={3}
        >
          {toast.message}
        </Text>
        {toast.action && (
          <TouchableOpacity onPress={toast.action.onPress} style={styles.actionBtn}>
            <Text style={[styles.actionLabel, { color: config.color }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dismiss Button */}
      <TouchableOpacity
        onPress={dismiss as any}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.dismissBtn}
        accessibilityLabel="Tutup notifikasi"
      >
        <Ionicons name="close" size={16} color={subTextColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================
// Global reference — allows calling toast from outside React
// ============================================================

let _showToast: ((config: Omit<ToastConfig, 'id'>) => void) | null = null;

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const show = useCallback((config: Omit<ToastConfig, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => {
      // Max 3 toasts at a time — remove oldest
      const next = prev.length >= 3 ? prev.slice(1) : prev;
      return [...next, { ...config, id }];
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    _showToast = show;
    return () => {
      _showToast = null;
    };
  }, [show]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}

// ============================================================
// Provider
// ============================================================

export function ToastProvider({ children }: { children: ReactNode }) {
  const show = useCallback((config: Omit<ToastConfig, 'id'>) => {
    _showToast?.(config);
  }, []);

  const value: ToastContextValue = {
    show,
    success: (message, options) => show({ type: 'success', message, ...options }),
    error: (message, options) => show({ type: 'error', message, ...options }),
    warning: (message, options) => show({ type: 'warning', message, ...options }),
    info: (message, options) => show({ type: 'info', message, ...options }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// ============================================================
// Hook — untuk digunakan di dalam komponen React
// ============================================================

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus digunakan di dalam ToastProvider');
  }
  return ctx;
}

// ============================================================
// Standalone — untuk digunakan DI LUAR komponen React
// (contoh: di dalam apiClient.ts interceptor)
// ============================================================

export const toast = {
  success: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message' | 'id'>>) =>
    _showToast?.({ type: 'success', message, ...options }),
  error: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message' | 'id'>>) =>
    _showToast?.({ type: 'error', message, ...options }),
  warning: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message' | 'id'>>) =>
    _showToast?.({ type: 'warning', message, ...options }),
  info: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message' | 'id'>>) =>
    _showToast?.({ type: 'info', message, ...options }),
  show: (config: Omit<ToastConfig, 'id'>) => _showToast?.(config),
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 8,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 52,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginTop: 8,
    marginRight: 2,
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 4,
    gap: 2,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  toastMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  actionBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dismissBtn: {
    padding: 10,
    paddingTop: 12,
    flexShrink: 0,
  },
});
