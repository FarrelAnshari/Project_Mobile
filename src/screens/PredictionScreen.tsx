/**
 * PARKIN — Smart Campus Parking
 * Screen: Prediksi
 *
 * Prediksi kepadatan parkir berdasarkan data historis/simulasi.
 * Prototype — siap dihubungkan ke ML API di sprint berikutnya.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { predictionDataToday, predictionDataTomorrow } from '../data/predictionData';
import { parkingAreas } from '../data/parkingData';
import { getStatusFromOccupancy, getStatusColor } from '../utils/parkingStatus';
import { getRecommendations } from '../utils/recommendation';
import PredictionChart from '../components/PredictionChart';
import StatusBadge from '../components/StatusBadge';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useResponsive } from '../utils/responsive';

type DayTab = 'today' | 'tomorrow';

export default function PredictionScreen() {
  const { horizontalPadding } = useResponsive();
  const [activeDay, setActiveDay] = useState<DayTab>('today');

  const predictionData = activeDay === 'today' ? predictionDataToday : predictionDataTomorrow;

  // Find peak and quietest hours
  const peakPoint = predictionData.reduce((a, b) =>
    a.occupancy > b.occupancy ? a : b,
  );
  const quietPoint = predictionData.reduce((a, b) =>
    a.occupancy < b.occupancy ? a : b,
  );

  // Best recommendation for early arrival
  const recommendation = getRecommendations(parkingAreas, 1)[0];

  // Current hour prediction (approximate)
  const now = new Date();
  const currentHour = now.getHours();
  const currentPrediction = predictionData.find((p) => {
    const hour = parseInt(p.time.split(':')[0]);
    return Math.abs(hour - currentHour) < 1;
  }) ?? predictionData[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📈 Prediksi Kepadatan</Text>
          <Text style={styles.subtitle}>
            Perkiraan kondisi parkir berdasarkan pola waktu dan aktivitas kendaraan.
          </Text>
        </View>

        {/* ML Disclaimer banner */}
        <View style={styles.disclaimerBanner}>
          <Text style={styles.disclaimerIcon} accessibilityElementsHidden>
            🤖
          </Text>
          <View style={styles.disclaimerTextBlock}>
            <Text style={styles.disclaimerTitle}>Prediksi Simulasi</Text>
            <Text style={styles.disclaimerBody}>
              Data ini merupakan estimasi berdasarkan data historis/simulasi.
              Model machine learning akan diintegrasikan pada sprint berikutnya.
            </Text>
          </View>
        </View>

        {/* Day tabs */}
        <View style={styles.tabs} accessibilityRole="tablist">
          {[
            { id: 'today' as DayTab, label: 'Hari Ini' },
            { id: 'tomorrow' as DayTab, label: 'Besok' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeDay === tab.id && styles.tabActive,
              ]}
              onPress={() => setActiveDay(tab.id)}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: activeDay === tab.id }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeDay === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Full prediction chart */}
        <View style={[Shadow.sm, styles.chartContainer]}>
          <PredictionChart
            data={predictionData}
            compact={false}
          />
        </View>

        {/* Insight cards */}
        <View style={styles.insightRow}>
          {/* Peak time */}
          <View
            style={[styles.insightCard, styles.insightPeak, Shadow.sm]}
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel={`Perkiraan paling padat pukul ${peakPoint.time} dengan ${peakPoint.occupancy} persen terisi`}
          >
            <Text style={styles.insightEmoji} accessibilityElementsHidden>
              🔴
            </Text>
            <Text style={styles.insightLabel}>Paling Padat</Text>
            <Text style={styles.insightTime}>{peakPoint.time}</Text>
            <Text style={styles.insightValue}>{peakPoint.occupancy}%</Text>
            <StatusBadge status={getStatusFromOccupancy(peakPoint.occupancy)} size="sm" />
          </View>

          {/* Quiet time */}
          <View
            style={[styles.insightCard, styles.insightQuiet, Shadow.sm]}
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel={`Perkiraan paling sepi pukul ${quietPoint.time} dengan ${quietPoint.occupancy} persen terisi`}
          >
            <Text style={styles.insightEmoji} accessibilityElementsHidden>
              🟢
            </Text>
            <Text style={styles.insightLabel}>Paling Sepi</Text>
            <Text style={styles.insightTime}>{quietPoint.time}</Text>
            <Text style={styles.insightValue}>{quietPoint.occupancy}%</Text>
            <StatusBadge status={getStatusFromOccupancy(quietPoint.occupancy)} size="sm" />
          </View>
        </View>

        {/* Per-hour details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Rincian Per Jam
          </Text>
          <View style={[styles.hourlyTable, Shadow.sm]}>
            {predictionData.map((point, index) => {
              const status = getStatusFromOccupancy(point.occupancy);
              const color = getStatusColor(status);
              return (
                <View
                  key={index}
                  style={[
                    styles.hourRow,
                    index < predictionData.length - 1 && styles.hourRowBorder,
                  ]}
                  accessible={true}
                  accessibilityLabel={`Pukul ${point.time}: ${point.occupancy} persen — ${point.label}`}
                >
                  <Text style={styles.hourTime}>{point.time}</Text>
                  <View style={styles.hourBarTrack}>
                    <View
                      style={[
                        styles.hourBar,
                        {
                          width: `${point.occupancy}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.hourValue, { color }]}>
                    {point.occupancy}%
                  </Text>
                  <StatusBadge status={status} size="sm" />
                </View>
              );
            })}
          </View>
        </View>

        {/* Suggestion */}
        {recommendation && (
          <View style={[styles.suggestionCard, Shadow.sm]}>
            <Text style={styles.suggestionTitle}>💡 Saran</Text>
            <Text style={styles.suggestionBody}>
              Disarankan datang sebelum{' '}
              <Text style={styles.suggestionHighlight}>
                {predictionData.find((p) => p.occupancy > 60)?.time ?? '10:00'}
              </Text>{' '}
              atau memilih{' '}
              <Text style={styles.suggestionHighlight}>
                {recommendation.area.name}
              </Text>
              .
            </Text>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 22,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.infoBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  disclaimerIcon: {
    fontSize: 20,
  },
  disclaimerTextBlock: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.info,
    marginBottom: 2,
  },
  disclaimerBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  chartContainer: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  insightCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  insightPeak: {
    borderTopWidth: 3,
    borderTopColor: Colors.danger,
  },
  insightQuiet: {
    borderTopWidth: 3,
    borderTopColor: Colors.success,
  },
  insightEmoji: {
    fontSize: 20,
  },
  insightLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  insightTime: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  insightValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  hourlyTable: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 44,
  },
  hourRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  hourTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    width: 44,
  },
  hourBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hourBar: {
    height: '100%',
    borderRadius: 4,
  },
  hourValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    width: 36,
    textAlign: 'right',
  },
  suggestionCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginBottom: Spacing.lg,
  },
  suggestionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  suggestionBody: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  suggestionHighlight: {
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
