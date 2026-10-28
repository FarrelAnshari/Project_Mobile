/**
 * PARKIN — Smart Campus Parking
 * Component: PredictionChart
 *
 * A custom bar chart for occupancy prediction.
 * No external chart library needed — pure React Native View/Text.
 * Label: "Prediksi berdasarkan data historis/simulasi"
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PredictionPoint } from '../data/predictionData';
import { getOccupancyBarColor } from '../utils/parkingStatus';
import {
  Colors,
  FontSize,
  FontWeight,
  BorderRadius,
  Spacing,
} from '../constants/theme';

import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

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
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const maxOccupancy = Math.max(...data.map((d) => d.occupancy));
  const minOccupancy = Math.min(...data.map((d) => d.occupancy));
  const barHeight = compact ? 80 : 120;

  const mostBusy = useMemo(() => data.find(d => d.occupancy === maxOccupancy), [data, maxOccupancy]);
  const leastBusy = useMemo(() => data.find(d => d.occupancy === minOccupancy), [data, minOccupancy]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Grafik prediksi kepadatan parkir ${title ?? ''}`}
    >
      {title && (
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
      )}

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
              <View style={[styles.barTrack, { height: barHeight, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : Colors.borderLight }]}>
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
              <Text style={[styles.timeLabel, { color: colors.textTertiary }]} numberOfLines={1}>
                {compact
                  ? point.time.replace(':00', '')
                  : point.time}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Highlights (Only when not compact) */}
      {!compact && mostBusy && leastBusy && (
        <View style={styles.highlightsContainer}>
          <View style={[styles.highlightCard, { backgroundColor: isDark ? colors.background : Colors.background }]}>
            <View style={[styles.highlightIcon, { backgroundColor: Colors.danger + '15' }]}>
              <Ionicons name="trending-up" size={16} color={Colors.danger} />
            </View>
            <View>
              <Text style={[styles.highlightLabel, { color: colors.textSecondary }]}>Puncak Kepadatan</Text>
              <Text style={[styles.highlightValue, { color: colors.textPrimary }]}>{mostBusy.time} ({mostBusy.occupancy}%)</Text>
            </View>
          </View>
          <View style={[styles.highlightCard, { backgroundColor: isDark ? colors.background : Colors.background }]}>
            <View style={[styles.highlightIcon, { backgroundColor: Colors.success + '15' }]}>
              <Ionicons name="trending-down" size={16} color={Colors.success} />
            </View>
            <View>
              <Text style={[styles.highlightLabel, { color: colors.textSecondary }]}>Paling Sepi</Text>
              <Text style={[styles.highlightValue, { color: colors.textPrimary }]}>{leastBusy.time} ({leastBusy.occupancy}%)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Simulation disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.info} />
        <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
          Prediksi berdasarkan data historis
        </Text>
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
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
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
