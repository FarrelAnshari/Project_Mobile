/**
 * PARKIN — Smart Campus Parking
 * Component: ParkingCard
 *
 * Displays one parking area with occupancy info, status badge,
 * a "Rute" button (opens Google Maps), and smooth interactions.
 * Fully accessible.
 */

import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { ParkingArea } from '../data/parkingData';
import { getOccupancyPercent, needsAlert } from '../utils/parkingStatus';
import AnimatedOccupancyBar from './AnimatedOccupancyBar';
import StatusBadge from './StatusBadge';

interface Props {
  area: ParkingArea;
  onPress?: (area: ParkingArea) => void;
  compact?: boolean;
  style?: any;
  vehicleType?: 'all' | 'car' | 'motorcycle' | 'motor' | 'mobil';
}

function getAccentColor(percent: number, colors: any): string {
  if (percent < 50) return colors.success;
  if (percent < 80) return colors.warning;
  return colors.danger;
}

export default function ParkingCard({
  area,
  onPress,
  compact = false,
  style,
  vehicleType = 'all',
}: Props) {
  const colors = useThemeColors();
  const { isDark } = useTheme();

  const percent =
    typeof area.occupancy === 'number'
      ? area.occupancy
      : getOccupancyPercent(area.occupied, area.capacity);
  const hasAlert = needsAlert(percent);
  const accentColor = getAccentColor(percent, colors);

  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleRoute = () => {
    const query = encodeURIComponent(`${area.name} Kampus Parkir`);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}`
    ).catch(() => {});
  };

  // Vehicle capacity estimates (mock split — adjust when API supports it)
  const carSlots = vehicleType !== 'motorcycle' ? Math.round(area.available * 0.6) : null;
  const motoSlots = vehicleType !== 'car' ? Math.round(area.available * 0.4) : null;

  return (
    <Animated.View style={[pressStyle, style]}>
      <TouchableOpacity
        style={[
          styles.card,
          Shadow.sm,
          {
            backgroundColor: colors.surface,
            borderColor: isDark ? colors.border : colors.borderLight,
          },
          compact && styles.cardCompact,
          hasAlert && [styles.cardAlert, { borderColor: colors.danger + '60' }],
        ]}
        onPress={() => onPress?.(area)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${area.name}. ${percent} persen terisi. ${area.available} slot tersedia. Status: ${area.status}.`}
        accessibilityHint="Ketuk untuk melihat detail area parkir ini"
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.cardInner}>
          {/* Header row */}
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {area.name}
              </Text>
              <Text style={[styles.updated, { color: colors.textTertiary }]}>{area.lastUpdated || area.updated_at}</Text>
            </View>
            <StatusBadge status={area.status} size="sm" />
          </View>

          {/* Stats row */}
          <View style={styles.mainInfo}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: accentColor }]}>{percent}%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Terisi</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValueDark, { color: colors.textPrimary }]}>{area.available}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tersedia</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValueDark, { color: colors.textPrimary }]}>{area.capacity}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kapasitas</Text>
              </View>
            </View>
          </View>

          {/* Vehicle slots (when filter active) */}
          {vehicleType !== 'all' && (
            <View style={styles.vehicleRow}>
              {vehicleType === 'car' && carSlots !== null && (
                <View style={[styles.vehicleBadge, { backgroundColor: colors.primary + (isDark ? '25' : '10') }]}>
                  <Ionicons name="car-outline" size={12} color={colors.primary} />
                  <Text style={[styles.vehicleBadgeText, { color: colors.primary }]}>~{carSlots} slot mobil</Text>
                </View>
              )}
              {vehicleType === 'motorcycle' && motoSlots !== null && (
                <View style={[styles.vehicleBadge, { backgroundColor: colors.infoBg }]}>
                  <Ionicons name="bicycle-outline" size={12} color={colors.info} />
                  <Text style={[styles.vehicleBadgeText, { color: colors.info }]}>
                    ~{motoSlots} slot motor
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Occupancy bar */}
          <View style={styles.barSection}>
            <AnimatedOccupancyBar percent={percent} height={compact ? 5 : 7} />
          </View>

          {/* Bottom action row */}
          {!compact && (
            <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                style={[styles.routeBtn, { backgroundColor: colors.primary + (isDark ? '25' : '10') }]}
                onPress={handleRoute}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={`Buka rute ke ${area.name}`}
                accessibilityRole="link"
              >
                <Ionicons name="navigate-outline" size={13} color={colors.primary} />
                <Text style={[styles.routeBtnText, { color: colors.primary }]}>Rute</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailBtn}
                onPress={() => onPress?.(area)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={`Detail area parkir ${area.name}`}
              >
                <Text style={[styles.detailBtnText, { color: colors.textSecondary }]}>Detail</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardCompact: {
    marginBottom: Spacing.sm,
  },
  cardAlert: {
    borderColor: Colors.danger + '50',
    borderWidth: 1.5,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  cardInner: {
    flex: 1,
    padding: Spacing.md + 2,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  updated: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  statValueDark: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  vehicleBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  barSection: {
    // marginTop handled by parent gap
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  routeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '10',
  },
  routeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
});
