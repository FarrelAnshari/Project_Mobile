/**
 * PARKIN — Smart Campus Parking
 * Component: VehicleToggle
 *
 * Toggle filter antara kendaraan Mobil dan Motor.
 * Menggunakan Reanimated untuk transisi slider yang halus.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

export type VehicleType = 'all' | 'car' | 'motorcycle';

interface VehicleOption {
  key: VehicleType;
  label: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
}

const OPTIONS: VehicleOption[] = [
  { key: 'all', label: 'Semua', icon: 'apps-outline' },
  { key: 'car', label: 'Mobil', icon: 'car-outline' },
  { key: 'motorcycle', label: 'Motor', icon: 'bicycle-outline' },
];

interface Props {
  value: VehicleType;
  onChange: (type: VehicleType) => void;
}

export default function VehicleToggle({ value, onChange }: Props) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const activeIndex = OPTIONS.findIndex((o) => o.key === value);
  const sliderX = useSharedValue(activeIndex * (100 / OPTIONS.length));

  useEffect(() => {
    const idx = OPTIONS.findIndex((o) => o.key === value);
    sliderX.value = withSpring(idx * (100 / OPTIONS.length), {
      damping: 20,
      stiffness: 200,
    });
  }, [value]);

  const sliderStyle = useAnimatedStyle(() => ({
    left: `${sliderX.value}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : Colors.borderLight }]}>
      {/* Animated slider background */}
      <Animated.View style={[styles.slider, sliderStyle, { width: `${100 / OPTIONS.length}%`, backgroundColor: colors.primary }]} />

      {OPTIONS.map((opt) => {
        const isActive = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={styles.option}
            onPress={() => onChange(opt.key)}
            accessibilityRole="button"
            accessibilityLabel={`Filter kendaraan: ${opt.label}`}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={opt.icon}
              size={16}
              color={isActive ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.label, { color: colors.textSecondary }, isActive && [styles.labelActive, { color: colors.white }]]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    padding: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: Spacing.sm,
    zIndex: 1,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.white,
  },
});
