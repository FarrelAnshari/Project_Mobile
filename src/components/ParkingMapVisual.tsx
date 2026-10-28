/**
 * PARKIN — Smart Campus Parking
 * Component: ParkingMapVisual
 *
 * Peta denah kampus visual yang estetis dengan pin/marker interaktif
 * berwarna berdasarkan tingkat keterisian:
 *   - Hijau  = Available (< 50%)
 *   - Orange = Busy (50–80%)
 *   - Merah  = Full (> 80%)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ParkingArea } from '../models/parking';
import { getOccupancyPercent } from '../utils/parkingStatus';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';

import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

interface MapPin {
  id: string;
  name: string;
  shortName: string;
  x: number; // percentage 0–100
  y: number; // percentage 0–100
}

// Default map pin positions (can be overridden by area.coordinates)
const DEFAULT_PINS: MapPin[] = [
  { id: '1', name: 'Parkir A', shortName: 'A', x: 18, y: 25 },
  { id: '2', name: 'Parkir B', shortName: 'B', x: 50, y: 18 },
  { id: '3', name: 'Parkir C', shortName: 'C', x: 78, y: 30 },
  { id: '4', name: 'Parkir D', shortName: 'D', x: 30, y: 60 },
  { id: '5', name: 'Parkir E', shortName: 'E', x: 65, y: 65 },
  { id: '6', name: 'Parkir F', shortName: 'F', x: 85, y: 75 },
];

function getPinColor(percent: number): string {
  if (percent < 50) return Colors.success;
  if (percent < 80) return Colors.warning;
  return Colors.danger;
}

function getPinBgColor(percent: number): string {
  if (percent < 50) return Colors.successBg;
  if (percent < 80) return Colors.warningBg;
  return Colors.dangerBg;
}

interface MarkerProps {
  pin: MapPin;
  area?: ParkingArea;
  isSelected: boolean;
  onPress: (area?: ParkingArea) => void;
}

function MapMarker({ pin, area, isSelected, onPress }: MarkerProps) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const percent = area
    ? typeof area.occupancy === 'number'
      ? area.occupancy
      : getOccupancyPercent(area.occupied, area.capacity)
    : 0;
  const color = area ? getPinColor(percent) : colors.textTertiary;

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.25, { damping: 8 }, () => {
      scale.value = withSpring(1);
    });
    onPress(area);
  };

  return (
    <TouchableOpacity
      style={[
        styles.markerWrapper,
        { left: `${pin.x}%`, top: `${pin.y}%` },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityLabel={`${pin.name}: ${area ? `${percent}% terisi` : 'tidak ada data'}`}
    >
      <Animated.View style={animStyle}>
        {/* Pin body */}
        <View
          style={[
            styles.pin,
            { backgroundColor: color, borderColor: color + '60' },
            isSelected && styles.pinSelected,
          ]}
        >
          <Text style={styles.pinLabel}>{pin.shortName}</Text>
        </View>
        {/* Pin tail */}
        <View style={[styles.pinTail, { borderTopColor: color }]} />
      </Animated.View>

      {/* Selected tooltip */}
      {isSelected && area && (
        <Animated.View
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : Colors.border,
            },
          ]}
        >
          <Text style={[styles.tooltipName, { color: colors.textPrimary }]} numberOfLines={1}>
            {area.name}
          </Text>
          <Text style={[styles.tooltipPercent, { color }]}>
            {percent}% terisi
          </Text>
          <Text style={[styles.tooltipAvailable, { color: colors.textSecondary }]}>
            {area.available} slot tersedia
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

interface Props {
  areas: ParkingArea[];
  onAreaPress?: (area: ParkingArea) => void;
}

export default function ParkingMapVisual({ areas, onAreaPress }: Props) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const mapHeight = Math.min(220, width * 0.55);

  const handleMarkerPress = (area?: ParkingArea) => {
    if (!area) return;
    setSelectedId(area.id === selectedId ? null : area.id);
    onAreaPress?.(area);
  };

  // Map areas to pins by index
  const pins = DEFAULT_PINS.slice(0, Math.max(areas.length, DEFAULT_PINS.length));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Map Legend */}
      <View style={styles.legend}>
        {[
          { label: 'Tersedia', color: Colors.success },
          { label: 'Ramai', color: Colors.warning },
          { label: 'Penuh', color: Colors.danger },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Map Canvas */}
      <View style={[styles.mapCanvas, { height: mapHeight, backgroundColor: isDark ? '#121626' : '#EEF2FF' }]}>
        {/* Background campus layout */}
        <View style={styles.campusOutline}>
          {/* Building blocks (decorative) */}
          <View style={[styles.building, { left: '10%', top: '10%', width: '25%', height: '30%', backgroundColor: isDark ? '#222C4A' : '#C7D2FE', borderColor: isDark ? '#35446E' : '#A5B4FC' }]} />
          <View style={[styles.building, { left: '40%', top: '5%', width: '20%', height: '25%', backgroundColor: isDark ? '#222C4A' : '#C7D2FE', borderColor: isDark ? '#35446E' : '#A5B4FC' }]} />
          <View style={[styles.building, { left: '68%', top: '15%', width: '22%', height: '28%', backgroundColor: isDark ? '#222C4A' : '#C7D2FE', borderColor: isDark ? '#35446E' : '#A5B4FC' }]} />
          <View style={[styles.building, { left: '20%', top: '55%', width: '20%', height: '25%', backgroundColor: isDark ? '#222C4A' : '#C7D2FE', borderColor: isDark ? '#35446E' : '#A5B4FC' }]} />
          <View style={[styles.building, { left: '55%', top: '55%', width: '18%', height: '25%', backgroundColor: isDark ? '#222C4A' : '#C7D2FE', borderColor: isDark ? '#35446E' : '#A5B4FC' }]} />

          {/* Roads */}
          <View style={[styles.road, { top: '45%', left: 0, right: 0, height: 8, backgroundColor: isDark ? '#192036' : '#E2E8F0' }]} />
          <View style={[styles.road, { left: '45%', top: 0, bottom: 0, width: 8, backgroundColor: isDark ? '#192036' : '#E2E8F0' }]} />

          {/* Map markers */}
          {pins.map((pin, idx) => {
            const area = areas[idx];
            return (
              <MapMarker
                key={pin.id}
                pin={pin}
                area={area}
                isSelected={area?.id === selectedId}
                onPress={handleMarkerPress}
              />
            );
          })}
        </View>

        {/* Campus label */}
        <View style={[styles.campusLabel, { backgroundColor: isDark ? 'rgba(18,18,34,0.85)' : 'rgba(255,255,255,0.8)' }]}>
          <Text style={[styles.campusLabelText, { color: colors.textSecondary }]}>🏫 Kampus</Text>
        </View>
      </View>

      {/* Tap instruction */}
      <Text style={[styles.hint, { color: colors.textTertiary }]}>Ketuk marker untuk melihat detail area</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  mapCanvas: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#EEF2FF',
  },
  campusOutline: {
    position: 'absolute',
    inset: 0,
    margin: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'visible',
  },
  building: {
    position: 'absolute',
    backgroundColor: '#C7D2FE',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#E2E8F0',
  },
  campusLabel: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  campusLabelText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Markers
  markerWrapper: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    transform: [{ translateX: -16 }, { translateY: -40 }],
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinSelected: {
    width: 36,
    height: 36,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
    alignSelf: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: 52,
    minWidth: 120,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  tooltipName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  tooltipPercent: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  tooltipAvailable: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  hint: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
