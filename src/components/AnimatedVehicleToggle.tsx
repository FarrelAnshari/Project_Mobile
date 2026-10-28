/**
 * PARKIN — Smart Campus Parking
 * Component: AnimatedVehicleToggle
 *
 * Filter toggle kendaraan dengan sliding pill indicator yang dianimasikan
 * menggunakan Reanimated layoutId-style (withSpring translateX).
 *
 * Menggantikan VehicleToggle.tsx dengan versi yang jauh lebih hidup.
 *
 * Usage:
 *   <AnimatedVehicleToggle value={vehicleFilter} onChange={setVehicleFilter} />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

export type VehicleType = 'all' | 'motor' | 'mobil';

interface TabOption {
  value: VehicleType;
  label: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
}

const TABS: TabOption[] = [
  { value: 'all', label: 'Semua', icon: 'apps-outline' },
  { value: 'motor', label: 'Motor', icon: 'bicycle-outline' },
  { value: 'mobil', label: 'Mobil', icon: 'car-outline' },
];

interface Props {
  value: VehicleType;
  onChange: (v: VehicleType) => void;
}

export default function AnimatedVehicleToggle({ value, onChange }: Props) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabOffsets, setTabOffsets] = useState<number[]>([]);

  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  const currentIndex = TABS.findIndex((t) => t.value === value);

  // Setelah layout diketahui, sesuaikan posisi pill
  function handleTabLayout(index: number, event: LayoutChangeEvent) {
    const { x, width } = event.nativeEvent.layout;
    setTabWidths((prev) => {
      const next = [...prev];
      next[index] = width;
      return next;
    });
    setTabOffsets((prev) => {
      const next = [...prev];
      next[index] = x;
      return next;
    });
  }

  // Animasikan pill ke tab yang dipilih
  function handleSelect(index: number, tab: TabOption) {
    if (tabOffsets[index] !== undefined) {
      pillX.value = withSpring(tabOffsets[index], { damping: 18, stiffness: 300 });
      pillWidth.value = withSpring(tabWidths[index] ?? 80, { damping: 18, stiffness: 300 });
    }
    onChange(tab.value);
  }

  // Inisialisasi posisi pill saat layout ready
  React.useEffect(() => {
    if (tabOffsets[currentIndex] !== undefined && tabWidths[currentIndex] !== undefined) {
      pillX.value = withSpring(tabOffsets[currentIndex], { damping: 18, stiffness: 300 });
      pillWidth.value = withSpring(tabWidths[currentIndex], { damping: 18, stiffness: 300 });
    }
  }, [tabOffsets, tabWidths, currentIndex]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
        },
      ]}
    >
      {/* Sliding pill background */}
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: isDark ? colors.primary : colors.primary,
            shadowColor: colors.primary,
          },
          pillStyle,
        ]}
      />

      {TABS.map((tab, index) => {
        const isActive = tab.value === value;
        return (
          <TouchableOpacity
            key={tab.value}
            style={styles.tab}
            onPress={() => handleSelect(index, tab)}
            onLayout={(e) => handleTabLayout(index, e)}
            accessibilityRole="button"
            accessibilityLabel={`Filter ${tab.label}`}
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={isActive ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: isActive ? FontWeight.semibold : FontWeight.medium,
                },
              ]}
            >
              {tab.label}
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
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: BorderRadius.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: 5,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    includeFontPadding: false,
  },
});
