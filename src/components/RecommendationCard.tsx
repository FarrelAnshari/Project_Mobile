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
import { Ionicons } from '@expo/vector-icons';
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
      style={[styles.card, Shadow.sm]}
      accessible={true}
      accessibilityRole="none"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.starBadge} accessibilityElementsHidden>
          <Ionicons name="star" size={14} color={Colors.warning} />
        </View>
        <Text style={styles.badge} accessibilityElementsHidden>
          Rekomendasi Terbaik
        </Text>
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

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{area.available}</Text>
          <Text style={styles.statLabel}>Slot Tersedia</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{percent}%</Text>
          <Text style={styles.statLabel}>Terisi</Text>
        </View>
      </View>

      <View style={styles.barRow}>
        <OccupancyBar percent={percent} height={6} />
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
        <Ionicons name="map-outline" size={18} color={Colors.white} />
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
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  starBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    backgroundColor: Colors.infoBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
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
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 44, // minimum touch target
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
