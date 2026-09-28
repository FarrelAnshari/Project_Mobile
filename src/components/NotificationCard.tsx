/**
 * PARKIN — Smart Campus Parking
 * Component: NotificationCard
 *
 * In-app alert for parking areas approaching capacity.
 * Uses icon + text (not color only) for accessibility.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ParkingArea } from '../data/parkingData';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';

interface Props {
  area: ParkingArea;
  alternativeArea?: ParkingArea;
  onDismiss?: () => void;
  onViewAlternative?: () => void;
}

export default function NotificationCard({
  area,
  alternativeArea,
  onDismiss,
  onViewAlternative,
}: Props) {
  const isFull = area.available === 0;

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={
        isFull
          ? `Peringatan: ${area.name} sudah penuh.`
          : `Peringatan: ${area.name} hampir penuh. Hanya tersisa ${area.available} slot.`
      }
    >
      {/* Icon + title */}
      <View style={styles.header}>
        <Text style={styles.alertIcon} accessibilityElementsHidden>
          ⚠️
        </Text>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            {isFull ? `${area.name} Penuh!` : `${area.name} Hampir Penuh`}
          </Text>
          <Text style={styles.subtitle}>
            {isFull
              ? 'Tidak ada slot parkir tersedia.'
              : `Tersisa ${area.available} slot parkir.`}
          </Text>
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissBtn}
            accessibilityRole="button"
            accessibilityLabel="Tutup notifikasi"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alternative recommendation */}
      {alternativeArea && (
        <View style={styles.altSection}>
          <Text style={styles.altLabel}>Disarankan menggunakan:</Text>
          <TouchableOpacity
            style={styles.altBtn}
            onPress={onViewAlternative}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Lihat alternatif: ${alternativeArea.name} dengan ${alternativeArea.available} slot tersedia`}
            accessibilityHint="Buka detail area parkir alternatif"
          >
            <Text style={styles.altBtnName}>{alternativeArea.name}</Text>
            <Text style={styles.altBtnSlot}>
              {alternativeArea.available} slot tersedia →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  alertIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  dismissBtn: {
    padding: 4,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  altSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.danger + '30',
  },
  altLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  altBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.success + '50',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  altBtnName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  altBtnSlot: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
});
