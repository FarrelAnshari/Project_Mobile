/**
 * PARKIN — Smart Campus Parking
 * Component: OccupancyChart
 *
 * Bar chart modern menggunakan React Native Views + Reanimated.
 * Tidak membutuhkan library eksternal (Recharts, Victory, dll.).
 * Cocok untuk halaman Prediksi dan Riwayat Kepadatan.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';

import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

export interface ChartDataPoint {
  label: string;  // X-axis label (e.g., "08:00", "Sen")
  value: number;  // 0–100 occupancy percent
  highlight?: boolean; // highlight current hour / today
}

interface Props {
  data: ChartDataPoint[];
  height?: number;
  title?: string;
  showYAxis?: boolean;
  compact?: boolean;
}

function getBarColor(value: number, isHighlight: boolean, primaryColor: string): string {
  if (isHighlight) return primaryColor;
  if (value < 50) return Colors.success;
  if (value < 80) return Colors.warning;
  return Colors.danger;
}

function AnimatedBar({
  value,
  maxHeight,
  color,
  delay,
  isHighlight,
}: {
  value: number;
  maxHeight: number;
  color: string;
  delay: number;
  isHighlight: boolean;
}) {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withTiming((value / 100) * maxHeight, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [value]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        barStyle,
        {
          backgroundColor: color,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        },
        isHighlight && styles.barHighlight,
      ]}
    />
  );
}

export default function OccupancyChart({
  data,
  height = 160,
  title,
  showYAxis = true,
  compact = false,
}: Props) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const chartMaxHeight = height - 32; // leave room for labels
  const yLabels = [100, 75, 50, 25, 0];

  return (
    <View style={styles.wrapper}>
      {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}

      <View style={[styles.chartArea, { height }]}>
        {/* Y-axis labels */}
        {showYAxis && !compact && (
          <View style={styles.yAxis}>
            {yLabels.map((val) => (
              <Text key={val} style={[styles.yLabel, { color: colors.textTertiary }]}>
                {val}%
              </Text>
            ))}
          </View>
        )}

        {/* Grid + Bars */}
        <View style={styles.barsContainer}>
          {/* Horizontal grid lines */}
          {!compact && [75, 50, 25].map((pct) => (
            <View
              key={pct}
              style={[
                styles.gridLine,
                {
                  bottom: (pct / 100) * chartMaxHeight + 20,
                  backgroundColor: isDark ? colors.border : Colors.borderLight,
                },
              ]}
            />
          ))}

          {/* Bars */}
          <View style={styles.barsRow}>
            {data.map((point, idx) => {
              const color = getBarColor(point.value, !!point.highlight, colors.primary);
              return (
                <View key={idx} style={styles.barColumn}>
                  {/* Value label on top */}
                  {!compact && point.highlight && (
                    <Text style={[styles.valueLabel, { color }]}>
                      {point.value}%
                    </Text>
                  )}
                  <View
                    style={[
                      styles.barTrack,
                      { height: chartMaxHeight },
                    ]}
                  >
                    <AnimatedBar
                      value={point.value}
                      maxHeight={chartMaxHeight}
                      color={color}
                      delay={idx * 40}
                      isHighlight={!!point.highlight}
                    />
                  </View>
                  {/* X-axis label */}
                  <Text
                    style={[
                      styles.xLabel,
                      { color: colors.textTertiary },
                      point.highlight && [styles.xLabelHighlight, { color: colors.primary }],
                      compact && styles.xLabelCompact,
                    ]}
                    numberOfLines={1}
                  >
                    {point.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Legend */}
      {!compact && (
        <View style={styles.legend}>
          {[
            { label: 'Tersedia', color: Colors.success },
            { label: 'Ramai', color: Colors.warning },
            { label: 'Penuh', color: Colors.danger },
            { label: 'Sekarang', color: colors.primary },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: item.color }]}
              />
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  chartArea: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingTop: 4,
  },
  yLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20, // space for x-labels
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  barTrack: {
    width: '60%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    minHeight: 3,
  },
  barHighlight: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  valueLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
    position: 'absolute',
    top: -16,
  },
  xLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
    position: 'absolute',
    bottom: 0,
    width: '120%',
  },
  xLabelHighlight: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  xLabelCompact: {
    fontSize: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
