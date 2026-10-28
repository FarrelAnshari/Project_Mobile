/**
 * PARKIN — Smart Campus Parking
 * Component: AnimatedOccupancyBar
 *
 * Progress bar kepadatan yang dianimasikan menggunakan Reanimated.
 * Bar melebar dari 0 ke nilai target saat pertama muncul,
 * menggunakan scaleX transform (kompatibel dengan Reanimated worklet).
 *
 * Upgrade dari OccupancyBar.tsx.
 *
 * Usage:
 *   <AnimatedOccupancyBar percent={72} height={8} />
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getOccupancyBarColor } from '../utils/parkingStatus';
import { FontSize, FontWeight } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  percent: number; // 0–100
  showLabel?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

export default function AnimatedOccupancyBar({
  percent,
  showLabel = true,
  height = 8,
  style,
  duration = 800,
}: Props) {
  const colors = useThemeColors();
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const barColor = getOccupancyBarColor(clampedPercent);

  // scaleX: 0 → 1 (full width), starts from left using transformOrigin trick
  const scaleX = useSharedValue(0);

  useEffect(() => {
    scaleX.value = withTiming(clampedPercent / 100, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedPercent]);

  const fillAnimStyle = useAnimatedStyle(() => ({
    transform: [
      // Shift origin to left edge: translateX by -50% of width then scale
      { translateX: -50 }, // half of 100% virtual width workaround
      { scaleX: scaleX.value },
      { translateX: 50 },
    ],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Tingkat kepadatan ${clampedPercent} persen`}
      accessibilityValue={{ min: 0, max: 100, now: clampedPercent }}
      style={[styles.container, style]}
    >
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colors.borderLight,
            borderRadius: height / 2,
          },
        ]}
      >
        {/* Full-width fill that scales from 0 using scaleX */}
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              height,
              borderRadius: height / 2,
            },
            fillAnimStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: barColor }]}>
          {clampedPercent}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    // Width is always 100% of parent; scaleX controls visible portion
    width: '100%',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    minWidth: 36,
    textAlign: 'right',
  },
});
