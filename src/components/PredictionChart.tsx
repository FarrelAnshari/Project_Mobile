/**
 * PARKIN — Smart Campus Parking
 * Component: PredictionChart
 *
 * A custom bar chart for occupancy prediction.
 * No external chart library needed — pure React Native View/Text.
 * Label: "Prediksi pada tahap prototype menggunakan data historis/simulasi"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
        <Text style={styles.disclaimerText}>
          Prediksi pada tahap prototype menggunakan data historis/simulasi.
        </Text>
      </View>

      {/* Y-axis indicator */}
      {!compact && (
        <View style={styles.axisHeader}>
          <Text style={styles.axisLabel}>Okupansi (%)</Text>
        </View>
      )}

      {/* Chart bars */}
      <View
        style={[styles.chartArea, { height: barHeight + 36 }]}
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

      {/* X-axis indicator */}
      {!compact && (
        <Text style={styles.xAxisLabel}>Waktu (Jam Operasional)</Text>
      )}

      {/* Legend for non-compact mode */}
      {!compact && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>AVAILABLE (≤50%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
            <Text style={styles.legendText}>BUSY (51–80%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.legendText}>NEAR FULL (&gt;80%)</Text>
          </View>
        </View>
      )}

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
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.infoBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    flex: 1,
    lineHeight: 16,
  },
  axisHeader: {
    marginBottom: 4,
  },
  axisLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
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
  xAxisLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
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
