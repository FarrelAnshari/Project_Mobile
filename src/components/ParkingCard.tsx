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
  useWindowDimensions,
} from 'react-native';
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
}

export default function ParkingCard({ area, onPress, compact = false }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 600;
  const percent = getOccupancyPercent(area.occupied, area.capacity);
  const hasAlert = needsAlert(percent);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        Shadow.md,
        compact && styles.cardCompact,
        hasAlert && styles.cardAlert,
      ]}
      onPress={() => onPress?.(area)}
      activeOpacity={0.75}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${area.name}, ${percent} persen terisi, ${area.available} slot tersedia, Status: ${area.status}`}
      accessibilityHint="Ketuk untuk melihat detail area parkir ini"
    >
      {/* Alert strip — visible text, not color-only */}
      {hasAlert && (
        <View style={styles.alertStrip}>
          <View style={styles.alertDot} />
          <Text style={styles.alertText} accessibilityElementsHidden>
            {area.status === 'FULL' ? 'Penuh' : 'Hampir Penuh'}
          </Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {area.name}
          </Text>
          <Text style={styles.updated}>Diperbarui {area.lastUpdated}</Text>
        </View>
        <StatusBadge status={area.status} size={compact ? 'sm' : 'md'} />
      </View>

      {/* Occupancy bar */}
      <View style={styles.barSection}>
        <OccupancyBar percent={percent} height={compact ? 6 : 8} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatItem
          label="Terisi"
          value={`${area.occupied}`}
          sub={`/ ${area.capacity}`}
        />
        <View style={styles.divider} />
        <StatItem
          label="Tersedia"
          value={`${area.available}`}
          highlight={area.available > 0 && area.status !== 'FULL'}
        />
        <View style={styles.divider} />
        <StatItem label="Kapasitas" value={`${area.capacity}`} />
      </View>

      {/* Footer */}
      {!compact && (
        <View style={styles.footer}>
          <View
            style={styles.detailBtn}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Text style={styles.detailBtnText}>Lihat Detail</Text>
            <Text style={styles.detailBtnArrow} accessibilityElementsHidden>›</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatItem({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statValueRow}>
        <Text
          style={[styles.statValue, highlight && styles.statValueHighlight]}
        >
          {value}
        </Text>
        {sub && <Text style={styles.statSub}>{sub}</Text>}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompact: {
    padding: Spacing.md,
  },
  cardAlert: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  alertText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: FontWeight.semibold,
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
  barSection: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statValueHighlight: {
    color: Colors.success,
  },
  statSub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.regular,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  footer: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  detailBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  detailBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  detailBtnArrow: {
    fontSize: FontSize.lg,
    color: Colors.primary,
    lineHeight: FontSize.lg + 2,
  },
});
