/**
 * PARKIN — Smart Campus Parking
 * Component: OccupancyBar
 *
 * Visual progress bar for parking occupancy.
 * Uses color + percentage text (never color alone).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getOccupancyBarColor } from '../utils/parkingStatus';
import { Colors, FontSize, FontWeight, BorderRadius } from '../constants/theme';

interface Props {
  percent: number; // 0–100
  showLabel?: boolean;
  height?: number;
}

export default function OccupancyBar({
  percent,
  showLabel = true,
  height = 8,
}: Props) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const barColor = getOccupancyBarColor(clampedPercent);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Tingkat kepadatan ${clampedPercent} persen`}
      accessibilityValue={{ min: 0, max: 100, now: clampedPercent }}
      style={styles.container}
    >
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedPercent}%`,
              backgroundColor: barColor,
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: barColor }]}>
          {clampedPercent}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    // width set inline
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    minWidth: 36,
    textAlign: 'right',
  },
});
