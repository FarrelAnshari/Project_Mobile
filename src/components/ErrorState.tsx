/**
 * PARKIN — Smart Campus Parking
 * Component: ErrorState
 *
 * Komponen reusable untuk menampilkan state error fetching data dengan UI modern:
 * - Ikon/ilustrasi yang rapi dengan efek badge glow
 * - Judul dan pesan error yang jelas dan ramah pengguna
 * - Tombol "Coba Lagi" (Retry) utama dengan ikon refresh & feedback interaktif
 * - Tombol opsi sekunder (misal: "Gunakan Data Demo" atau "Periksa Pengaturan")
 * - Dukungan penuh Dark Mode dan Light Mode
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from '../constants/theme';

export type ErrorType = 'network' | 'server' | 'auth' | 'not_found' | 'generic';

export interface ErrorStateProps {
  /** Pesan error yang ditampilkan ke pengguna */
  message?: string;
  /** Judul banner error (default: "Gagal Memuat Data") */
  title?: string;
  /** Tipe error untuk pemilihan ikon dan warna badge */
  type?: ErrorType;
  /** Nama ikon kustom Ionicons jika ingin override */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Fungsi callback untuk memicu retry (refetch data) */
  onRetry?: () => void;
  /** Label untuk tombol retry (default: "Coba Lagi") */
  retryLabel?: string;
  /** Menandakan apakah proses retry sedang berjalan */
  isRetrying?: boolean;
  /** Aksi alternatif sekunder (misal: muat demo data / offline fallback) */
  onSecondaryAction?: () => void;
  /** Label aksi alternatif sekunder */
  secondaryActionLabel?: string;
  /** Mode tampilan kompak untuk di dalam card/section kecil */
  compact?: boolean;
  /** Style container kustom */
  style?: StyleProp<ViewStyle>;
}

const ERROR_CONFIGS: Record<
  ErrorType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; defaultTitle: string }
> = {
  network: {
    icon: 'cloud-offline-outline',
    color: '#F59E0B', // Amber
    defaultTitle: 'Tidak Ada Koneksi',
  },
  server: {
    icon: 'server-outline',
    color: '#EF4444', // Red
    defaultTitle: 'Kendala Server',
  },
  auth: {
    icon: 'lock-closed-outline',
    color: '#8B5CF6', // Purple
    defaultTitle: 'Akses Ditolak',
  },
  not_found: {
    icon: 'search-outline',
    color: '#3B82F6', // Blue
    defaultTitle: 'Data Tidak Ditemukan',
  },
  generic: {
    icon: 'alert-circle-outline',
    color: '#EF4444', // Red
    defaultTitle: 'Terjadi Kesalahan',
  },
};

export default function ErrorState({
  message = 'Terjadi kesalahan saat memuat data dari server. Silakan periksa koneksi Anda dan coba lagi.',
  title,
  type = 'generic',
  icon,
  onRetry,
  retryLabel = 'Coba Lagi',
  isRetrying = false,
  onSecondaryAction,
  secondaryActionLabel = 'Gunakan Data Demo',
  compact = false,
  style,
}: ErrorStateProps) {
  const colors = useThemeColors();
  const { isDark } = useTheme();

  const config = ERROR_CONFIGS[type] || ERROR_CONFIGS.generic;
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.defaultTitle;

  const retryScale = useSharedValue(1);
  const animatedRetryStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  const handlePressIn = () => {
    retryScale.value = withSpring(0.95, { damping: 15, stiffness: 350 });
  };
  const handlePressOut = () => {
    retryScale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  return (
    <View
      style={[
        styles.container,
        compact ? styles.containerCompact : styles.containerFull,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
        style,
      ]}
      accessibilityRole="alert"
    >
      {/* ── ILUSTRASI / IKON BADGE ── */}
      <View
        style={[
          styles.iconOuterRing,
          {
            backgroundColor: config.color + (isDark ? '20' : '12'),
            borderColor: config.color + (isDark ? '40' : '25'),
          },
          compact && styles.iconOuterRingCompact,
        ]}
      >
        <View
          style={[
            styles.iconInnerCore,
            { backgroundColor: config.color + (isDark ? '35' : '20') },
            compact && styles.iconInnerCoreCompact,
          ]}
        >
          <Ionicons
            name={displayIcon}
            size={compact ? 24 : 36}
            color={config.color}
          />
        </View>
      </View>

      {/* ── TEKS INFORMASI ── */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.titleText,
            { color: colors.textPrimary },
            compact && styles.titleTextCompact,
          ]}
        >
          {displayTitle}
        </Text>
        <Text
          style={[
            styles.messageText,
            { color: colors.textSecondary },
            compact && styles.messageTextCompact,
          ]}
        >
          {message}
        </Text>
      </View>

      {/* ── TOMBOL AKSI (RETRY & SECONDARY) ── */}
      {(onRetry || onSecondaryAction) && (
        <View style={[styles.actionsRow, compact && styles.actionsRowCompact]}>
          {onRetry && (
            <Animated.View style={[animatedRetryStyle, styles.buttonWrap]}>
              <TouchableOpacity
                style={[
                  styles.primaryRetryBtn,
                  { backgroundColor: colors.primary },
                  isRetrying && { opacity: 0.7 },
                ]}
                onPress={onRetry}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isRetrying}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={retryLabel}
              >
                <Ionicons
                  name="refresh"
                  size={16}
                  color={Colors.white}
                  style={isRetrying ? styles.rotatingIcon : undefined}
                />
                <Text style={styles.primaryRetryText}>
                  {isRetrying ? 'Memuat Ulang...' : retryLabel}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {onSecondaryAction && (
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor: isDark ? colors.border : colors.borderLight,
                  backgroundColor: isDark ? '#1F1B38' : '#F8FAFC',
                },
              ]}
              onPress={onSecondaryAction}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionLabel}
            >
              <Ionicons
                name="cloud-download-outline"
                size={15}
                color={colors.primary}
              />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                {secondaryActionLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    ...Shadow.sm,
  },
  containerFull: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  containerCompact: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  iconOuterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconOuterRingCompact: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: Spacing.sm,
  },
  iconInnerCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerCoreCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  titleText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  titleTextCompact: {
    fontSize: FontSize.md,
    marginBottom: 4,
  },
  messageText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  messageTextCompact: {
    fontSize: FontSize.xs,
    lineHeight: 16,
    maxWidth: 280,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionsRowCompact: {
    gap: Spacing.xs,
  },
  buttonWrap: {
    minWidth: 130,
  },
  primaryRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  primaryRetryText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  rotatingIcon: {
    transform: [{ rotate: '45deg' }],
  },
});
