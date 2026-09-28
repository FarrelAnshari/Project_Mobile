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
      accessibilityLabel={`${area.name}. ${percent} persen terisi. ${area.available} slot tersedia. Status: ${area.status}.`}
      accessibilityHint="Ketuk untuk melihat detail area parkir ini"
    >
      {/* Alert strip */}
      {hasAlert && (
        <View style={styles.alertStrip}>
          <Text style={styles.alertText} accessibilityElementsHidden>
            ⚠ {area.status === 'Penuh' ? 'Penuh!' : 'Hampir Penuh!'}
          </Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {area.name}
          </Text>
          <Text style={styles.updated}>{area.lastUpdated}</Text>
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
          highlight={area.available > 0}
        />
        <View style={styles.divider} />
        <StatItem label="Kapasitas" value={`${area.capacity}`} />
      </View>

      {/* Footer */}
      {!compact && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => onPress?.(area)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Lihat detail ${area.name}`}
            accessibilityHint="Membuka halaman detail area parkir"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.detailBtnText}>Lihat Detail →</Text>
          </TouchableOpacity>
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
  },
  cardCompact: {
    padding: Spacing.md,
  },
  cardAlert: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  alertStrip: {
    marginBottom: Spacing.sm,
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
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    minHeight: 44, // minimum touch target
    justifyContent: 'center',
  },
  detailBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});
