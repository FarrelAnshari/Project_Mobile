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
import { Ionicons } from '@expo/vector-icons';
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
  const isWarning = !isFull;

  return (
    <View
      style={[styles.card, isWarning ? styles.cardWarning : styles.cardDanger]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={
        isFull
          ? `Peringatan: ${area.name} sudah penuh.`
          : `Peringatan: ${area.name} hampir penuh. Hanya tersisa ${area.available} slot.`
      }
    >
      <View style={styles.header}>
<<<<<<< HEAD
        {/* Alert indicator — shape + color + text (not color-only) */}
        <View style={styles.alertIconBox}>
          <Text style={styles.alertIconText}>!</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>
=======
        <View style={[styles.iconBox, isWarning ? styles.iconBoxWarning : styles.iconBoxDanger]}>
          <Ionicons 
            name={isFull ? "close-circle" : "warning"} 
            size={20} 
            color={isWarning ? Colors.warning : Colors.danger} 
          />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, isWarning ? styles.titleWarning : styles.titleDanger]}>
>>>>>>> 3f814b0 (Update 2)
            {isFull ? `${area.name} Penuh` : `${area.name} Hampir Penuh`}
          </Text>
          <Text style={styles.subtitle}>
            {isFull
              ? 'Tidak ada slot parkir tersedia saat ini.'
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
            <Ionicons name="close" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Alternative recommendation */}
      {alternativeArea && (
        <View style={[styles.altSection, isWarning ? styles.altSectionWarning : styles.altSectionDanger]}>
          <Text style={styles.altLabel}>Coba area parkir alternatif:</Text>
          <TouchableOpacity
            style={styles.altBtn}
            onPress={onViewAlternative}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Lihat alternatif: ${alternativeArea.name} dengan ${alternativeArea.available} slot tersedia`}
            accessibilityHint="Buka detail area parkir alternatif"
          >
<<<<<<< HEAD
            <View>
              <Text style={styles.altBtnName}>{alternativeArea.name}</Text>
              <Text style={styles.altBtnStatus}>{alternativeArea.status}</Text>
            </View>
            <Text style={styles.altBtnSlot}>
              {alternativeArea.available} slot ›
            </Text>
=======
            <View style={styles.altBtnLeft}>
              <Text style={styles.altBtnName}>{alternativeArea.name}</Text>
              <Text style={styles.altBtnSlot}>{alternativeArea.available} Slot Tersedia</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={Colors.success} />
>>>>>>> 3f814b0 (Update 2)
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  cardDanger: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger + '30',
  },
  cardWarning: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warning + '30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
<<<<<<< HEAD
  alertIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  alertIconText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
=======
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDanger: {
    backgroundColor: Colors.danger + '15',
  },
  iconBoxWarning: {
    backgroundColor: Colors.warning + '15',
>>>>>>> 3f814b0 (Update 2)
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  titleDanger: {
    color: Colors.danger,
  },
  titleWarning: {
    color: Colors.warning,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  dismissBtn: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  altSectionDanger: {
    borderTopColor: Colors.danger + '20',
  },
  altSectionWarning: {
    borderTopColor: Colors.warning + '20',
  },
  altLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  altBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  altBtnLeft: {
    flex: 1,
  },
  altBtnName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  altBtnStatus: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  altBtnSlot: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
});
