/**
 * PARKIN — Smart Campus Parking
 * Component: StatusBadge
 *
 * Accessibility: uses icon + text + color (never color alone)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ParkingStatus } from '../data/parkingData';
import {
  getStatusColor,
  getStatusBgColor,
  getStatusIcon,
} from '../utils/parkingStatus';
import { FontSize, FontWeight, BorderRadius, Spacing } from '../constants/theme';

interface Props {
  status: ParkingStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const color = getStatusColor(status);
  const bgColor = getStatusBgColor(status);
  const icon = getStatusIcon(status);

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor, borderColor: color },
        isSmall && styles.badgeSm,
        isLarge && styles.badgeLg,
      ]}
      // Accessibility: role + label so screen readers understand this is a status indicator
      accessibilityRole="text"
      accessibilityLabel={`Status parkir: ${status}`}
    >
      {/* Icon for non-color users */}
      <Text
        style={[styles.icon, isSmall && styles.iconSm, isLarge && styles.iconLg]}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        {icon}
      </Text>
      <Text
        style={[
          styles.label,
          { color },
          isSmall && styles.labelSm,
          isLarge && styles.labelLg,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  badgeLg: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 6,
  },
  icon: {
    fontSize: FontSize.sm,
  },
  iconSm: {
    fontSize: 10,
  },
  iconLg: {
    fontSize: FontSize.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
  labelSm: {
    fontSize: 11,
  },
  labelLg: {
    fontSize: FontSize.md,
  },
});
