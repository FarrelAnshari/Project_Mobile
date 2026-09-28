/**
 * PARKIN — Smart Campus Parking
 * Component: PredictionChart
 *
 * A custom bar chart for occupancy prediction.
 * No external chart library needed — pure React Native View/Text.
 * Label: "Prediksi berdasarkan data historis/simulasi"
 */

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PredictionPoint } from '../data/predictionData';
import { getOccupancyBarColor } from '../utils/parkingStatus';
import {
  Colors,
  FontSize,
  FontWeight,
  BorderRadius,
  Spacing,
} from '../constants/theme';

interface Props {
  data: PredictionPoint[];
  title?: string;
  compact?: boolean;
}

export default function PredictionChart({
  data,
  title,
  compact = false,
}: Props) {
  const { width } = useWindowDimensions();
  const maxOccupancy = Math.max(...data.map((d) => d.occupancy));
  const barHeight = compact ? 80 : 120;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Grafik prediksi kepadatan parkir ${title ?? ''}`}
    >
      {title && (
        <Text style={styles.chartTitle}>{title}</Text>
      )}

      {/* Simulation disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText} accessibilityElementsHidden>
          📊
        </Text>
        <Text style={styles.disclaimerText}>
          Prediksi berdasarkan data historis/simulasi
        </Text>
      </View>

      {/* Chart bars */}
      <View
        style={[styles.chartArea, { height: barHeight + 32 }]}
        accessibilityElementsHidden={true}
      >
        {data.map((point, index) => {
          const barHeightValue = (point.occupancy / 100) * barHeight;
          const color = getOccupancyBarColor(point.occupancy);
          return (
            <View key={index} style={styles.barWrapper}>
              <Text style={[styles.valueLabel, { color }]}>
                {compact ? '' : `${point.occupancy}%`}
              </Text>
              <View style={[styles.barTrack, { height: barHeight }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeightValue,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeLabel} numberOfLines={1}>
                {compact
                  ? point.time.replace(':00', '')
                  : point.time}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Accessibility: list of values for screen readers */}
      <View style={styles.srOnly} accessibilityRole="list">
        {data.map((point, index) => (
          <View
            key={index}
            accessibilityRole="none"
            accessibilityLabel={`Pukul ${point.time}: ${point.occupancy} persen — ${point.label}`}
          >
            <Text style={styles.hidden}>{`${point.time}: ${point.occupancy}%`}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.infoBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  disclaimerText: {
    fontSize: FontSize.xs,
    color: Colors.info,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  barTrack: {
    width: '70%',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
    minHeight: 3,
  },
  timeLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  // Hidden but accessible to screen readers
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  hidden: {
    fontSize: 1,
    color: 'transparent',
  },
});
