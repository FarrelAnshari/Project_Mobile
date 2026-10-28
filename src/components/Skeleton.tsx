/**
 * PARKIN — Smart Campus Parking
 * Component: Skeleton UI Components
 *
 * Komponen Skeleton Screen dengan animasi pulse/shimmer halus berbasis Reanimated.
 * Mencerminkan struktur asli komponen dashboard & kartu parkir agar tidak muncul spinner kosong.
 * Mendukung Dark Mode dan Light Mode secara otomatis.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { BorderRadius, Spacing, Shadow } from '../constants/theme';

// ============================================================
// Base Skeleton Box with Pulse Animation
// ============================================================

export interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = BorderRadius.md,
  style,
}: SkeletonBoxProps) {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 850, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const backgroundColor = isDark ? '#26243E' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ============================================================
// Skeleton Text Line Helper
// ============================================================

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonText({
  lines = 2,
  lineHeight = 14,
  gap = 8,
  lastLineWidth = '65%',
  style,
}: SkeletonTextProps) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
          borderRadius={BorderRadius.sm}
        />
      ))}
    </View>
  );
}

// ============================================================
// Skeleton for Campus Status Card (Dashboard)
// ============================================================

export function SkeletonCampusCard() {
  const colors = useThemeColors();
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <SkeletonBox width={120} height={20} borderRadius={BorderRadius.sm} />
        <SkeletonBox width={70} height={16} borderRadius={BorderRadius.full} />
      </View>

      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statLeft}>
          <SkeletonBox width={80} height={36} borderRadius={BorderRadius.md} />
          <SkeletonBox width={45} height={14} style={{ marginTop: 6 }} />
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: isDark ? colors.border : colors.borderLight },
          ]}
        />
        <View style={styles.statRight}>
          <SkeletonBox width={60} height={28} borderRadius={BorderRadius.sm} />
          <SkeletonBox width={140} height={14} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
        <SkeletonBox height={8} borderRadius={BorderRadius.full} />
      </View>

      {/* Status Badge Pill */}
      <View style={{ marginTop: Spacing.xs, alignSelf: 'flex-start' }}>
        <SkeletonBox width={95} height={24} borderRadius={BorderRadius.full} />
      </View>
    </View>
  );
}

// ============================================================
// Skeleton for ParkingCard
// ============================================================

export function SkeletonParkingCard({ compact = false }: { compact?: boolean }) {
  const colors = useThemeColors();
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        compact && styles.cardCompact,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
      ]}
    >
      {/* Top Row: Title + Status Badge */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox width="60%" height={18} borderRadius={BorderRadius.sm} />
          <SkeletonBox width="40%" height={12} borderRadius={BorderRadius.sm} />
        </View>
        <SkeletonBox width={70} height={24} borderRadius={BorderRadius.full} />
      </View>

      {/* Middle: Progress Bar & Slots Info */}
      <View style={{ marginTop: Spacing.md, gap: 8 }}>
        <SkeletonBox height={7} borderRadius={BorderRadius.full} />
        <View style={styles.spaceBetween}>
          <SkeletonBox width={100} height={14} />
          <SkeletonBox width={60} height={14} />
        </View>
      </View>

      {/* Bottom Action Buttons */}
      <View style={[styles.cardFooter, { borderTopColor: isDark ? colors.border : colors.borderLight }]}>
        <SkeletonBox width="48%" height={36} borderRadius={BorderRadius.md} />
        <SkeletonBox width="48%" height={36} borderRadius={BorderRadius.md} />
      </View>
    </View>
  );
}

// ============================================================
// Full Dashboard Skeleton
// ============================================================

export function DashboardSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={styles.dashboardSkeleton}>
      {/* 1. Status Kampus Card Skeleton */}
      <SkeletonCampusCard />

      {/* 2. Vehicle Filter Toggle Skeleton */}
      <View style={styles.sectionHeader}>
        <SkeletonBox width={110} height={18} borderRadius={BorderRadius.sm} />
      </View>
      <View style={styles.filterPillsRow}>
        <SkeletonBox width="31%" height={38} borderRadius={BorderRadius.lg} />
        <SkeletonBox width="31%" height={38} borderRadius={BorderRadius.lg} />
        <SkeletonBox width="31%" height={38} borderRadius={BorderRadius.lg} />
      </View>

      {/* 3. Denah Parkir Visual Skeleton */}
      <View style={styles.sectionHeader}>
        <SkeletonBox width={130} height={18} borderRadius={BorderRadius.sm} />
        <SkeletonBox width={50} height={14} borderRadius={BorderRadius.sm} />
      </View>
      <SkeletonBox height={150} borderRadius={BorderRadius.xl} style={{ marginBottom: Spacing.md }} />

      {/* 4. Area Parkir List Skeletons */}
      <View style={styles.sectionHeader}>
        <SkeletonBox width={100} height={18} borderRadius={BorderRadius.sm} />
        <SkeletonBox width={65} height={14} borderRadius={BorderRadius.sm} />
      </View>
      <SkeletonParkingCard />
      <SkeletonParkingCard />
      <SkeletonParkingCard />
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  cardContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardCompact: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  statLeft: {
    marginRight: Spacing.lg,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginRight: Spacing.lg,
  },
  statRight: {
    flex: 1,
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  dashboardSkeleton: {
    width: '100%',
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  filterPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
});
