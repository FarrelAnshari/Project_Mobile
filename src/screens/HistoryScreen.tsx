/**
 * PARKIN — Smart Campus Parking
 * Screen: Riwayat / History
 *
 * Tampilan histori kepadatan parkir dengan filter hari/minggu.
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
import { historyData, weeklyData, DayHistory } from '../data/predictionData';
import { getStatusFromOccupancy, getOccupancyBarColor } from '../utils/parkingStatus';
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

type FilterType = 'hari' | 'minggu';

export default function HistoryScreen() {
  const { horizontalPadding } = useResponsive();
  const [filter, setFilter] = useState<FilterType>('hari');
  const [selectedDay, setSelectedDay] = useState<DayHistory>(historyData[0]);

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
          <Text style={styles.title}>📊 Riwayat Kepadatan</Text>
          <Text style={styles.subtitle}>
            Histori pola kepadatan parkir kampus
          </Text>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterTabs} accessibilityRole="tablist">
          {[
            { id: 'hari' as FilterType, label: '📅 Per Hari' },
            { id: 'minggu' as FilterType, label: '📆 Per Minggu' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterTab,
                filter === f.id && styles.filterTabActive,
              ]}
              onPress={() => setFilter(f.id)}
              accessibilityRole="tab"
              accessibilityLabel={f.label}
              accessibilityState={{ selected: filter === f.id }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f.id && styles.filterTabTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filter === 'hari' ? (
          <>
            {/* Day selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelectorRow}
              accessibilityRole="tablist"
            >
              {historyData.map((day) => (
                <TouchableOpacity
                  key={day.date}
                  style={[
                    styles.dayChip,
                    selectedDay.date === day.date && styles.dayChipActive,
                  ]}
                  onPress={() => setSelectedDay(day)}
                  accessibilityRole="tab"
                  accessibilityLabel={day.label}
                  accessibilityState={{ selected: selectedDay.date === day.date }}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDay.date === day.date && styles.dayChipTextActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <SummaryCard
                icon="📈"
                label="Rata-rata"
                value={`${selectedDay.avgOccupancy}%`}
                sub="Kepadatan harian"
              />
              <SummaryCard
                icon="🔴"
                label="Paling Padat"
                value={selectedDay.peakTime}
                sub="Jam tersibuk"
              />
              <SummaryCard
                icon="🟢"
                label="Paling Sepi"
                value={selectedDay.quietTime}
                sub="Jam paling lengang"
              />
            </View>

            {/* Hourly history chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Rincian Per Jam — {selectedDay.label}
              </Text>
              <View style={[styles.historyTable, Shadow.sm]}>
                {selectedDay.points.map((point, index) => {
                  const status = getStatusFromOccupancy(point.occupancy);
                  const color = getOccupancyBarColor(point.occupancy);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.historyRow,
                        index < selectedDay.points.length - 1 && styles.historyRowBorder,
                      ]}
                      accessible={true}
                      accessibilityLabel={`${point.time}: ${point.occupancy} persen kepadatan`}
                    >
                      <Text style={styles.historyTime}>{point.time}</Text>
                      <View style={styles.historyBarTrack}>
                        <View
                          style={[
                            styles.historyBar,
                            {
                              width: `${point.occupancy}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.historyValue, { color }]}>
                        {point.occupancy}%
                      </Text>
                      <StatusBadge status={status} size="sm" />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Insight */}
            <View style={[styles.insightBox, Shadow.sm]}>
              <Text style={styles.insightTitle}>💡 Insight</Text>
              <Text style={styles.insightText}>
                Rata-rata kepadatan tertinggi terjadi pukul{' '}
                <Text style={styles.insightBold}>{selectedDay.peakTime}</Text>
                {' '}dengan rata-rata kepadatan{' '}
                <Text style={styles.insightBold}>{selectedDay.avgOccupancy}%</Text>.
              </Text>
              <Text style={styles.insightText}>
                Waktu paling sepi: pukul{' '}
                <Text style={styles.insightBold}>{selectedDay.quietTime}</Text>.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Weekly chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Rata-Rata Kepadatan Per Hari
              </Text>
              <View style={[styles.weeklyChart, Shadow.sm]}>
                {weeklyData.map((day, index) => {
                  const color = getOccupancyBarColor(day.avgOccupancy);
                  const barHeight = (day.avgOccupancy / 100) * 100;
                  return (
                    <View
                      key={index}
                      style={styles.weeklyBarWrapper}
                      accessible={true}
                      accessibilityLabel={`${day.day}: rata-rata ${day.avgOccupancy} persen`}
                    >
                      <Text style={[styles.weeklyValue, { color }]}>
                        {day.avgOccupancy}%
                      </Text>
                      <View style={styles.weeklyBarTrack}>
                        <View
                          style={[
                            styles.weeklyBar,
                            {
                              height: barHeight,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.weeklyDay}>{day.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Weekly insight */}
            <View style={[styles.insightBox, Shadow.sm]}>
              <Text style={styles.insightTitle}>💡 Insight Mingguan</Text>
              <Text style={styles.insightText}>
                Hari dengan kepadatan tertinggi:{' '}
                <Text style={styles.insightBold}>
                  {weeklyData.reduce((a, b) =>
                    a.avgOccupancy > b.avgOccupancy ? a : b,
                  ).day}
                </Text>
              </Text>
              <Text style={styles.insightText}>
                Hari paling lengang:{' '}
                <Text style={styles.insightBold}>
                  {weeklyData.reduce((a, b) =>
                    a.avgOccupancy < b.avgOccupancy ? a : b,
                  ).day}
                </Text>
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <View
      style={[styles.summaryCard, Shadow.sm]}
      accessible={true}
      accessibilityLabel={`${label}: ${value}. ${sub}`}
    >
      <Text style={styles.summaryIcon} accessibilityElementsHidden>
        {icon}
      </Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summarySub}>{sub}</Text>
    </View>
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
  },
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  daySelectorRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  dayChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  dayChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  dayChipTextActive: {
    color: Colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  summaryIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  summarySub: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
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
  historyTable: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    minHeight: 44,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    width: 44,
  },
  historyBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  historyBar: {
    height: '100%',
    borderRadius: 4,
  },
  historyValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    width: 36,
    textAlign: 'right',
  },
  insightBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: Spacing.sm,
  },
  insightTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  insightText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  insightBold: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  // Weekly chart
  weeklyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    height: 180,
    gap: Spacing.xs,
  },
  weeklyBarWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weeklyValue: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  weeklyBarTrack: {
    width: '80%',
    height: 100,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyBar: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  weeklyDay: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
