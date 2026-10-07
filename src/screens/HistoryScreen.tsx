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
import { Ionicons } from '@expo/vector-icons';
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
    <View style={styles.container}>
      {/* PURPLE HEADER SECTION */}
      <View style={styles.purpleHeader}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <SafeAreaView>
          <View style={[styles.headerInner, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Riwayat Kepadatan</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter tabs (Overlapping) */}
        <View style={styles.overlappingTabs} accessibilityRole="tablist">
          {[
            { id: 'hari' as FilterType, label: 'Per Hari', icon: 'calendar-outline' as const },
            { id: 'minggu' as FilterType, label: 'Per Minggu', icon: 'calendar-number-outline' as const },
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
              <Ionicons 
                name={f.icon} 
                size={16} 
                color={filter === f.id ? Colors.white : Colors.textSecondary} 
              />
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
                icon="bar-chart-outline"
                iconColor={Colors.primary}
                label="Rata-rata"
                value={`${selectedDay.avgOccupancy}%`}
                sub="Kepadatan harian"
              />
              <SummaryCard
                icon="trending-up"
                iconColor={Colors.danger}
                label="Paling Padat"
                value={selectedDay.peakTime}
                sub="Jam tersibuk"
              />
              <SummaryCard
                icon="trending-down"
                iconColor={Colors.success}
                label="Paling Sepi"
                value={selectedDay.quietTime}
                sub="Jam lengang"
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
              <View style={styles.insightHeader}>
                <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                <Text style={styles.insightTitle}>Insight</Text>
              </View>
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
              <View style={styles.insightHeader}>
                <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                <Text style={styles.insightTitle}>Insight Mingguan</Text>
              </View>
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

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
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
      <View style={[styles.summaryIconBox, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summarySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  purpleHeader: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: '15%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  headerInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: 120,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  overlappingTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 0,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: FontSize.sm,
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
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  dayChipText: {
    fontSize: FontSize.xs,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summarySub: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  insightTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  insightText: {
    fontSize: FontSize.sm,
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
