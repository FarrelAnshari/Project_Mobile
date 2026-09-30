/**
 * PARKIN — Smart Campus Parking
 * Component: RecommendationCard
 *
 * Displays a parking recommendation with reason and CTA.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Recommendation } from '../utils/recommendation';
import { getOccupancyPercent } from '../utils/parkingStatus';
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
  recommendation: Recommendation;
  onPress?: (recommendation: Recommendation) => void;
}

export default function RecommendationCard({ recommendation, onPress }: Props) {
  const { area, reason } = recommendation;
  const percent = getOccupancyPercent(area.occupied, area.capacity);

  return (
    <View
      style={[styles.card, Shadow.md]}
      accessible={true}
      accessibilityRole="none"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.recommendBadge}>
          <Text style={styles.recommendBadgeText}>REKOMENDASI</Text>
        </View>
      </View>

      {/* Area name */}
      <Text
        style={styles.name}
        accessibilityRole="header"
        accessibilityLabel={`Rekomendasi: ${area.name}`}
      >
        {area.name}
      </Text>

      {/* Reason */}
      <Text style={styles.reason}>{reason}</Text>

      {/* Mini occupancy bar */}
      <View style={styles.barRow}>
        <OccupancyBar percent={percent} height={6} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, styles.statValueHighlight]}>{area.available}</Text>
          <Text style={styles.statLabel}>Slot Tersedia</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{percent}%</Text>
          <Text style={styles.statLabel}>Terisi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{area.capacity}</Text>
          <Text style={styles.statLabel}>Kapasitas</Text>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={() => onPress?.(recommendation)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Lihat area ${area.name}`}
        accessibilityHint="Membuka detail area parkir yang direkomendasikan"
      >
        <Text style={styles.ctaBtnText}>Lihat Area</Text>
        <Text style={styles.ctaBtnArrow} accessibilityElementsHidden>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  header: {
    marginBottom: Spacing.sm,
  },
  recommendBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  recommendBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.8,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  reason: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  barRow: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statValueHighlight: {
    color: Colors.success,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  ctaBtnArrow: {
    color: Colors.white,
    fontSize: FontSize.lg,
  },
});
