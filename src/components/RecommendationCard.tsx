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
<<<<<<< HEAD
        <View style={styles.recommendBadge}>
          <Text style={styles.recommendBadgeText}>REKOMENDASI</Text>
        </View>
=======
        <View style={styles.starBadge} accessibilityElementsHidden>
          <Ionicons name="star" size={14} color={Colors.warning} />
        </View>
        <Text style={styles.badge} accessibilityElementsHidden>
          Rekomendasi Terbaik
        </Text>
>>>>>>> 3f814b0 (Update 2)
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
          <Text style={[styles.statValue, styles.statValueHighlight]}>{area.available}</Text>
          <Text style={styles.statLabel}>Slot Tersedia</Text>
        </View>
<<<<<<< HEAD
        <View style={styles.statDivider} />
=======
        <View style={styles.divider} />
>>>>>>> 3f814b0 (Update 2)
        <View style={styles.stat}>
          <Text style={styles.statValue}>{percent}%</Text>
          <Text style={styles.statLabel}>Terisi</Text>
        </View>
<<<<<<< HEAD
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{area.capacity}</Text>
          <Text style={styles.statLabel}>Kapasitas</Text>
        </View>
=======
      </View>

      <View style={styles.barRow}>
        <OccupancyBar percent={percent} height={6} />
>>>>>>> 3f814b0 (Update 2)
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
<<<<<<< HEAD
        <Text style={styles.ctaBtnArrow} accessibilityElementsHidden>›</Text>
=======
        <Ionicons name="map-outline" size={18} color={Colors.white} />
>>>>>>> 3f814b0 (Update 2)
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
    marginBottom: Spacing.sm,
  },
<<<<<<< HEAD
  recommendBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
=======
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
>>>>>>> 3f814b0 (Update 2)
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
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
<<<<<<< HEAD
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
=======
    alignItems: 'center',
    marginBottom: Spacing.md,
>>>>>>> 3f814b0 (Update 2)
  },
  stat: {
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
<<<<<<< HEAD
    minHeight: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
=======
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 44, // minimum touch target
>>>>>>> 3f814b0 (Update 2)
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
