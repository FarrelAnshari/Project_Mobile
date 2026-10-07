/**
 * PARKIN — Smart Campus Parking
 * Component: PredictionChart
 *
 * A custom bar chart for occupancy prediction.
 * No external chart library needed — pure React Native View/Text.
 * Label: "Prediksi pada tahap prototype menggunakan data historis/simulasi"
 */

<<<<<<< HEAD
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
=======
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
>>>>>>> 3f814b0 (Update 2)
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
<<<<<<< HEAD
=======
  const { width } = useWindowDimensions();
  const maxOccupancy = Math.max(...data.map((d) => d.occupancy));
  const minOccupancy = Math.min(...data.map((d) => d.occupancy));
>>>>>>> 3f814b0 (Update 2)
  const barHeight = compact ? 80 : 120;

  const mostBusy = useMemo(() => data.find(d => d.occupancy === maxOccupancy), [data, maxOccupancy]);
  const leastBusy = useMemo(() => data.find(d => d.occupancy === minOccupancy), [data, minOccupancy]);

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

<<<<<<< HEAD
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

=======
>>>>>>> 3f814b0 (Update 2)
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

<<<<<<< HEAD
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
=======
      {/* Highlights (Only when not compact) */}
      {!compact && mostBusy && leastBusy && (
        <View style={styles.highlightsContainer}>
          <View style={styles.highlightCard}>
            <View style={[styles.highlightIcon, { backgroundColor: Colors.danger + '15' }]}>
              <Ionicons name="trending-up" size={16} color={Colors.danger} />
            </View>
            <View>
              <Text style={styles.highlightLabel}>Puncak Kepadatan</Text>
              <Text style={styles.highlightValue}>{mostBusy.time} ({mostBusy.occupancy}%)</Text>
            </View>
          </View>
          <View style={styles.highlightCard}>
            <View style={[styles.highlightIcon, { backgroundColor: Colors.success + '15' }]}>
              <Ionicons name="trending-down" size={16} color={Colors.success} />
            </View>
            <View>
              <Text style={styles.highlightLabel}>Paling Sepi</Text>
              <Text style={styles.highlightValue}>{leastBusy.time} ({leastBusy.occupancy}%)</Text>
            </View>
>>>>>>> 3f814b0 (Update 2)
          </View>
        </View>
      )}

<<<<<<< HEAD
=======
      {/* Simulation disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
        <Text style={styles.disclaimerText}>
          Prediksi berdasarkan data historis
        </Text>
      </View>

>>>>>>> 3f814b0 (Update 2)
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
<<<<<<< HEAD
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
=======
>>>>>>> 3f814b0 (Update 2)
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
<<<<<<< HEAD
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
=======
>>>>>>> 3f814b0 (Update 2)
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.md,
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
<<<<<<< HEAD
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
=======
  highlightsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  highlightCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  highlightIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textTertiary,
>>>>>>> 3f814b0 (Update 2)
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
