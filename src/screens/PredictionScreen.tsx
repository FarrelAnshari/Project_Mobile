/**
 * PARKIN — Smart Campus Parking
 * Screen: Prediksi
 *
 * Prediksi kepadatan parkir berdasarkan data historis/simulasi.
 * Prototype — siap dihubungkan ke ML API di sprint berikutnya.
 * Mendukung pemilihan area parkir (PARKIRAN 1–5).
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { predictionDataToday, predictionDataTomorrow, PredictionPoint } from '../data/predictionData';
import { parkingAreas, ParkingArea } from '../data/parkingData';
import { getStatusFromOccupancy, getStatusColor, getOccupancyPercent } from '../utils/parkingStatus';
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
  const [selectedAreaId, setSelectedAreaId] = useState<number>(3); // Default PARKIRAN 3 as example
  const [activeDay, setActiveDay] = useState<DayTab>('today');

  const selectedArea = useMemo(
    () => parkingAreas.find((a) => a.id === selectedAreaId) ?? parkingAreas[0],
    [selectedAreaId]
  );

  const baseData = activeDay === 'today' ? predictionDataToday : predictionDataTomorrow;

  // Scale prediction curve proportionally to selected parking area's baseline occupancy
  const currentOccupancy = getOccupancyPercent(selectedArea.occupied, selectedArea.capacity);

  const predictionData: PredictionPoint[] = useMemo(() => {
    // Generate scaled prediction relative to selected area's baseline
    const baseOccupancyAvg = 55;
    const factor = currentOccupancy / baseOccupancyAvg;

    return baseData.map((point) => {
      // Adjust occupancy curve based on area
      const scaled = Math.min(100, Math.max(10, Math.round(point.occupancy * factor)));
      return {
        time: point.time,
        occupancy: scaled,
        label: getStatusFromOccupancy(scaled),
      };
    });
  }, [baseData, currentOccupancy]);

  // Find peak and quietest hours
  const peakPoint = predictionData.reduce((a, b) =>
    a.occupancy > b.occupancy ? a : b
  );
  const quietPoint = predictionData.reduce((a, b) =>
    a.occupancy < b.occupancy ? a : b
  );

  // Best recommendation for alternative
  const recommendations = getRecommendations(parkingAreas, 2);
  const altRecommendation = recommendations.find((r) => r.area.id !== selectedArea.id) ?? recommendations[0];

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
          <Text style={styles.title}>Prediksi Kepadatan</Text>
          <Text style={styles.subtitle}>
            Perkiraan kondisi parkir berdasarkan pola waktu dan aktivitas kendaraan.
          </Text>
        </View>

        {/* Prototype Disclaimer Banner */}
        <View style={styles.disclaimerBanner}>
          <View style={styles.disclaimerIcon}>
            <Text style={styles.disclaimerIconText}>i</Text>
          </View>
          <View style={styles.disclaimerTextBlock}>
            <Text style={styles.disclaimerTitle}>Data Simulasi / Historis</Text>
            <Text style={styles.disclaimerBody}>
              Prediksi pada tahap prototype menggunakan data historis/simulasi. Model machine learning akan diintegrasikan pada sprint berikutnya.
            </Text>
          </View>
        </View>

        {/* Area Parkir Selector (PARKIRAN 1–5) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Pilih Area Parkir
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.areaChipContainer}
            accessible={true}
            accessibilityRole="tablist"
            accessibilityLabel="Pilihan area parkir untuk prediksi"
          >
            {parkingAreas.map((area) => {
              const isSelected = area.id === selectedArea.id;
              const areaOccupancy = getOccupancyPercent(area.occupied, area.capacity);
              return (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.areaChip,
                    isSelected && styles.areaChipActive,
                  ]}
                  onPress={() => setSelectedAreaId(area.id)}
                  accessibilityRole="tab"
                  accessibilityLabel={`${area.name}, ${areaOccupancy} persen terisi, ${area.available} slot tersedia`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityHint={`Menampilkan data prediksi kepadatan untuk ${area.name}`}
                >
                  <Text
                    style={[
                      styles.areaChipText,
                      isSelected && styles.areaChipTextActive,
                    ]}
                  >
                    {area.name}
                  </Text>
                  <Text
                    style={[
                      styles.areaChipSub,
                      isSelected && styles.areaChipSubActive,
                    ]}
                  >
                    {areaOccupancy}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Area Summary Card */}
        <View
          style={[styles.selectedAreaCard, Shadow.sm]}
          accessible={true}
          accessibilityLabel={`${selectedArea.name}. Okupansi saat ini ${currentOccupancy} persen. Status: ${selectedArea.status}. Periode puncak diperkirakan pada jam sibuk.`}
        >
          <View style={styles.selectedAreaHeader}>
            <View>
              <Text style={styles.selectedAreaName}>{selectedArea.name}</Text>
              <Text style={styles.selectedAreaSub}>
                {selectedArea.available} slot tersedia dari {selectedArea.capacity} kapasitas
              </Text>
            </View>
            <StatusBadge status={selectedArea.status} size="md" />
          </View>

          <View style={styles.statsSummaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Current Occupancy</Text>
              <Text style={styles.summaryValue}>{currentOccupancy}%</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Peak Period</Text>
              <Text style={styles.summaryValue}>11:00–13:00</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Estimated Peak</Text>
              <Text style={styles.summaryValue}>{peakPoint.occupancy}%</Text>
            </View>
          </View>
        </View>

        {/* Day Tabs (Hari Ini / Besok) */}
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
              accessibilityLabel={`Prediksi untuk ${tab.label}`}
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

        {/* Full Prediction Chart */}
        <View style={[Shadow.sm, styles.chartContainer]}>
          <PredictionChart
            data={predictionData}
            title={`Prediksi Kepadatan — ${selectedArea.name}`}
            compact={false}
          />
        </View>

        {/* Insight Cards */}
        <View style={styles.insightRow}>
          {/* Peak Time */}
          <View
            style={[styles.insightCard, styles.insightPeak, Shadow.sm]}
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel={`Perkiraan paling padat pukul ${peakPoint.time} dengan ${peakPoint.occupancy} persen terisi`}
          >
            <View style={styles.insightDotPeak} />
            <Text style={styles.insightLabel}>Periode Paling Padat</Text>
            <Text style={styles.insightTime}>{peakPoint.time}</Text>
            <Text style={styles.insightValue}>{peakPoint.occupancy}%</Text>
            <StatusBadge status={getStatusFromOccupancy(peakPoint.occupancy)} size="sm" />
          </View>

          {/* Quiet Time */}
          <View
            style={[styles.insightCard, styles.insightQuiet, Shadow.sm]}
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel={`Perkiraan paling sepi pukul ${quietPoint.time} dengan ${quietPoint.occupancy} persen terisi`}
          >
            <View style={styles.insightDotQuiet} />
            <Text style={styles.insightLabel}>Periode Paling Sepi</Text>
            <Text style={styles.insightTime}>{quietPoint.time}</Text>
            <Text style={styles.insightValue}>{quietPoint.occupancy}%</Text>
            <StatusBadge status={getStatusFromOccupancy(quietPoint.occupancy)} size="sm" />
          </View>
        </View>

        {/* Per-hour Details Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Rincian Prediksi Per Jam — {selectedArea.name}
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
                  accessibilityLabel={`Pukul ${point.time}: ${point.occupancy} persen terisi — Status: ${status}`}
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

        {/* Recommendation / Alternative Suggestion */}
        {altRecommendation && (
          <View style={[styles.suggestionCard, Shadow.sm]}>
            <Text style={styles.suggestionTitle}>Rekomendasi Alternatif</Text>
            <Text style={styles.suggestionBody}>
              Jika {selectedArea.name} mendekati kapasitas penuh, disarankan memilih{' '}
              <Text style={styles.suggestionHighlight}>
                {altRecommendation.area.name}
              </Text>{' '}
              yang saat ini memiliki {altRecommendation.area.available} slot tersedia.
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
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
    marginBottom: Spacing.md,
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
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.infoBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  disclaimerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  disclaimerIconText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  disclaimerTextBlock: {
    flex: 1,
    gap: 2,
  },
  disclaimerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  disclaimerBody: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  areaChipContainer: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  areaChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  areaChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  areaChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  areaChipTextActive: {
    color: Colors.white,
  },
  areaChipSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  areaChipSubActive: {
    color: Colors.white + 'CC',
  },
  selectedAreaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  selectedAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedAreaName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  selectedAreaSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
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
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  chartContainer: {
    marginBottom: Spacing.lg,
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  insightCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightPeak: {
    borderTopWidth: 3,
    borderTopColor: Colors.danger,
  },
  insightQuiet: {
    borderTopWidth: 3,
    borderTopColor: Colors.success,
  },
  insightDotPeak: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginBottom: 2,
  },
  insightDotQuiet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  insightTime: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  insightValue: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  hourlyTable: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    minHeight: 44,
  },
  hourRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  hourTime: {
    width: 44,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
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
    width: 36,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },
  suggestionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  suggestionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  suggestionBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  suggestionHighlight: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
