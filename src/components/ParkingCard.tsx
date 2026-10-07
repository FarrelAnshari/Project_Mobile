/**
 * PARKIN — Smart Campus Parking
 * Component: ParkingCard
 *
 * Displays one parking area with occupancy info, status badge,
 * and a Detail button. Fully accessible.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingArea } from '../data/parkingData';
import { getOccupancyPercent, needsAlert } from '../utils/parkingStatus';
import StatusBadge from './StatusBadge';
import OccupancyBar from './OccupancyBar';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

interface Props {
  area: ParkingArea;
  onPress?: (area: ParkingArea) => void;
  compact?: boolean;
  style?: any;
}

export default function ParkingCard({ area, onPress, compact = false, style }: Props) {
  const percent = getOccupancyPercent(area.occupied, area.capacity);
  const hasAlert = needsAlert(percent);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        Shadow.sm,
        compact && styles.cardCompact,
        style,
      ]}
      onPress={() => onPress?.(area)}
      activeOpacity={0.75}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${area.name}. ${percent} persen terisi. ${area.available} slot tersedia. Status: ${area.status}.`}
      accessibilityHint="Ketuk untuk melihat detail area parkir ini"
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {area.name}
          </Text>
          <Text style={styles.updated}>{area.lastUpdated}</Text>
        </View>
        <StatusBadge status={area.status} size="sm" />
      </View>

      <View style={styles.mainInfo}>
        <View style={styles.statsContainer}>
          <Text style={styles.percentText}>{percent}% <Text style={styles.percentSub}>Terisi</Text></Text>
          <Text style={styles.availableText}>{area.available} <Text style={styles.availableSub}>Slot Tersedia</Text></Text>
        </View>
        
        {!compact && (
          <View style={styles.detailBtnIcon}>
             <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </View>
        )}
      </View>

      <View style={styles.barSection}>
        <OccupancyBar percent={percent} height={6} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompact: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.lg,
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
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.lg,
  },
  percentText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  percentSub: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  availableText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  availableSub: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  detailBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barSection: {
    marginTop: Spacing.xs,
  },
});
