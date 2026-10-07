/**
 * PARKIN — Smart Campus Parking
 * Screen: Riwayat / History
 *
 * Tampilan histori kepadatan parkir dengan filter periode dan area parkir (PARKIRAN 1–5).
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
import { Ionicons } from '@expo/vector-icons';
import { historyData, weeklyData, DayHistory } from '../data/predictionData';
import { parkingAreas, ParkingArea } from '../data/parkingData';
import { getStatusFromOccupancy, getOccupancyBarColor, getOccupancyPercent } from '../utils/parkingStatus';
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

type PeriodFilter = 'hari' | 'minggu' | 'bulan';

const monthlyData = [
  { week: 'Mgg 1', avgOccupancy: 68 },
  { week: 'Mgg 2', avgOccupancy: 74 },
  { week: 'Mgg 3', avgOccupancy: 81 },
  { week: 'Mgg 4', avgOccupancy: 76 },
];

export default function HistoryScreen() {
  const { horizontalPadding } = useResponsive();
  const [selectedAreaId, setSelectedAreaId] = useState<number>(3); // Default PARKIRAN 3 as example
  const [period, setPeriod] = useState<PeriodFilter>('hari');
  const [selectedDay, setSelectedDay] = useState<DayHistory>(historyData[0]);

  const selectedArea = useMemo(
    () => parkingAreas.find((a) => a.id === selectedAreaId) ?? parkingAreas[0],
    [selectedAreaId]
  );

  const areaBaseOccupancy = getOccupancyPercent(selectedArea.occupied, selectedArea.capacity);

  // Scaled hourly history points based on selected area
  const scaledPoints = useMemo(() => {
    const factor = areaBaseOccupancy / 55;
    return selectedDay.points.map((p) => {
      const scaled = Math.min(100, Math.max(10, Math.round(p.occupancy * factor)));
      return {
        time: p.time,
        occupancy: scaled,
      };
    });
  }, [selectedDay, areaBaseOccupancy]);

  const avgOccupancy = useMemo(() => {
    if (period === 'hari') {
      const sum = scaledPoints.reduce((acc, cur) => acc + cur.occupancy, 0);
      return Math.round(sum / scaledPoints.length);
    } else if (period === 'minggu') {
      const factor = areaBaseOccupancy / 55;
      const sum = weeklyData.reduce((acc, cur) => acc + Math.round(cur.avgOccupancy * factor), 0);
      return Math.min(100, Math.round(sum / weeklyData.length));
    } else {
      const factor = areaBaseOccupancy / 55;
      const sum = monthlyData.reduce((acc, cur) => acc + Math.round(cur.avgOccupancy * factor), 0);
      return Math.min(100, Math.round(sum / monthlyData.length));
    }
  }, [period, scaledPoints, areaBaseOccupancy]);

  const peakPeriodText = '11:00–13:00';
  const quietPeriodText = '17:00–18:00';

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
<<<<<<< HEAD
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Riwayat Kepadatan</Text>
          <Text style={styles.subtitle}>
            Histori dan pola okupansi parkir kampus
          </Text>
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
            accessibilityLabel="Pilihan area parkir untuk riwayat kepadatan"
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
                  accessibilityLabel={`${area.name}, ${areaOccupancy} persen terisi`}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityHint={`Menampilkan data riwayat kepadatan untuk ${area.name}`}
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
=======
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
>>>>>>> 3f814b0 (Update 2)
        </View>

        {/* Selected Area Card Banner */}
        <View
          style={[styles.areaBannerCard, Shadow.sm]}
          accessible={true}
          accessibilityLabel={`${selectedArea.name}. Rata-rata okupansi ${avgOccupancy} persen. Periode paling padat: ${peakPeriodText}.`}
        >
          <View style={styles.areaBannerHeader}>
            <View>
              <Text style={styles.areaBannerName}>{selectedArea.name}</Text>
              <Text style={styles.areaBannerSub}>
                Kapasitas {selectedArea.capacity} slot kendaraan
              </Text>
            </View>
            <StatusBadge status={getStatusFromOccupancy(avgOccupancy)} size="sm" />
          </View>
        </View>

        {/* Period Filter (Hari Ini | Minggu | Bulan) */}
        <View style={styles.filterSection}>
          <Text style={styles.periodFilterLabel}>Periode:</Text>
          <View style={styles.filterTabs} accessibilityRole="tablist">
            {[
              { id: 'hari' as PeriodFilter, label: 'Hari Ini' },
              { id: 'minggu' as PeriodFilter, label: 'Minggu' },
              { id: 'bulan' as PeriodFilter, label: 'Bulan' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterTab,
                  period === f.id && styles.filterTabActive,
                ]}
                onPress={() => setPeriod(f.id)}
                accessibilityRole="tab"
                accessibilityLabel={`Periode ${f.label}`}
                accessibilityState={{ selected: period === f.id }}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    period === f.id && styles.filterTabTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <SummaryCard
            label="Rata-rata Okupansi"
            value={`${avgOccupancy}%`}
            sub="Rerata periode"
            accentColor={Colors.primary}
          />
          <SummaryCard
            label="Periode Paling Padat"
            value={peakPeriodText}
            sub="Jam sibuk utama"
            accentColor={Colors.danger}
          />
          <SummaryCard
            label="Periode Paling Sepi"
            value={quietPeriodText}
            sub="Jam paling lengang"
            accentColor={Colors.success}
          />
        </View>

        {/* Content based on selected period */}
        {period === 'hari' && (
          <>
            {/* Day Selector sub-tab */}
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

<<<<<<< HEAD
            {/* Hourly history list */}
=======
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
>>>>>>> 3f814b0 (Update 2)
            <View style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Rincian Per Jam — {selectedArea.name} ({selectedDay.label})
              </Text>
              <View style={[styles.historyTable, Shadow.sm]}>
                {scaledPoints.map((point, index) => {
                  const status = getStatusFromOccupancy(point.occupancy);
                  const color = getOccupancyBarColor(point.occupancy);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.historyRow,
                        index < scaledPoints.length - 1 && styles.historyRowBorder,
                      ]}
                      accessible={true}
                      accessibilityLabel={`${point.time}: ${point.occupancy} persen — Status: ${status}`}
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
<<<<<<< HEAD
=======

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
>>>>>>> 3f814b0 (Update 2)
          </>
        )}

        {period === 'minggu' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Rata-rata Harian Mingguan — {selectedArea.name}
            </Text>
            <View style={[styles.weeklyCard, Shadow.sm]}>
              <View style={styles.weeklyBars}>
                {weeklyData.map((item, index) => {
                  const factor = areaBaseOccupancy / 55;
                  const occ = Math.min(100, Math.round(item.avgOccupancy * factor));
                  const color = getOccupancyBarColor(occ);
                  return (
                    <View key={index} style={styles.weeklyBarCol}>
                      <Text style={[styles.weeklyValueText, { color }]}>{occ}%</Text>
                      <View style={styles.weeklyBarTrack}>
                        <View
                          style={[
                            styles.weeklyBarFill,
                            {
                              height: `${occ}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.weeklyDayLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
<<<<<<< HEAD
              <Text style={styles.chartFootnote}>
                Data dihitung dari rerata pola lalu lintas mingguan.
=======
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
>>>>>>> 3f814b0 (Update 2)
              </Text>
            </View>
          </View>
        )}

<<<<<<< HEAD
        {period === 'bulan' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Tren Mingguan Bulanan — {selectedArea.name}
            </Text>
            <View style={[styles.weeklyCard, Shadow.sm]}>
              <View style={styles.weeklyBars}>
                {monthlyData.map((item, index) => {
                  const factor = areaBaseOccupancy / 55;
                  const occ = Math.min(100, Math.round(item.avgOccupancy * factor));
                  const color = getOccupancyBarColor(occ);
                  return (
                    <View key={index} style={styles.weeklyBarCol}>
                      <Text style={[styles.weeklyValueText, { color }]}>{occ}%</Text>
                      <View style={styles.weeklyBarTrack}>
                        <View
                          style={[
                            styles.weeklyBarFill,
                            {
                              height: `${occ}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.weeklyDayLabel}>{item.week}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.chartFootnote}>
                Rata-rata okupansi per minggu sepanjang bulan ini.
              </Text>
            </View>
          </View>
        )}

        {/* Insight Box */}
        <View style={[styles.insightBox, Shadow.sm]}>
          <Text style={styles.insightTitle}>Insight Riwayat — {selectedArea.name}</Text>
          <Text style={styles.insightText}>
            Rata-rata okupansi {selectedArea.name} berada di angka{' '}
            <Text style={styles.insightBold}>{avgOccupancy}%</Text>.
          </Text>
          <Text style={styles.insightText}>
            Periode paling padat terjadi pada rentang{' '}
            <Text style={styles.insightBold}>{peakPeriodText}</Text>, di mana slot parkir sering kali mencapai titik batas optimal.
          </Text>
          <Text style={styles.insightText}>
            Untuk menghindari antrean, pengguna disarankan tiba sebelum pukul 09:30 atau pada periode lengang{' '}
            <Text style={styles.insightBold}>{quietPeriodText}</Text>.
          </Text>
        </View>

        <View style={{ height: 24 }} />
=======
        <View style={{ height: 32 }} />
>>>>>>> 3f814b0 (Update 2)
      </ScrollView>
    </View>
  );
}

function SummaryCard({
<<<<<<< HEAD
=======
  icon,
  iconColor,
>>>>>>> 3f814b0 (Update 2)
  label,
  value,
  sub,
  accentColor = Colors.primary,
}: {
<<<<<<< HEAD
=======
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
>>>>>>> 3f814b0 (Update 2)
  label: string;
  value: string;
  sub: string;
  accentColor?: string;
}) {
  return (
    <View
      style={[styles.summaryCard, { borderTopColor: accentColor }, Shadow.sm]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`${label}: ${value}, ${sub}`}
    >
<<<<<<< HEAD
      <Text style={styles.summaryCardLabel}>{label}</Text>
      <Text style={styles.summaryCardValue}>{value}</Text>
      <Text style={styles.summaryCardSub}>{sub}</Text>
=======
      <View style={[styles.summaryIconBox, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summarySub}>{sub}</Text>
>>>>>>> 3f814b0 (Update 2)
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
<<<<<<< HEAD
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
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
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
=======
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
>>>>>>> 3f814b0 (Update 2)
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
<<<<<<< HEAD
    gap: 6,
=======
    gap: Spacing.xs,
>>>>>>> 3f814b0 (Update 2)
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
  areaBannerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  areaBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaBannerName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  areaBannerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  periodFilterLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  filterTabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  daySelectorRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: 2,
  },
  dayChip: {
    paddingHorizontal: Spacing.md,
<<<<<<< HEAD
    paddingVertical: 8,
=======
    paddingVertical: Spacing.xs,
>>>>>>> 3f814b0 (Update 2)
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
<<<<<<< HEAD
    minHeight: 44,
=======
    minHeight: 32,
>>>>>>> 3f814b0 (Update 2)
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  dayChipText: {
    fontSize: FontSize.xs,
<<<<<<< HEAD
=======
    color: Colors.textSecondary,
>>>>>>> 3f814b0 (Update 2)
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
<<<<<<< HEAD
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 88,
    justifyContent: 'center',
  },
  summaryCardLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
=======
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
>>>>>>> 3f814b0 (Update 2)
  },
  summaryCardValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  summaryCardSub: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  historyTable: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    minHeight: 44,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyTime: {
    width: 44,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
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
    width: 36,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },
  weeklyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weeklyBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingBottom: Spacing.sm,
  },
  weeklyBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    height: '100%',
    justifyContent: 'flex-end',
  },
  weeklyValueText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  weeklyBarTrack: {
    width: 20,
    height: 100,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weeklyBarFill: {
    width: '100%',
    borderRadius: BorderRadius.sm,
  },
  weeklyDayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  chartFootnote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  insightBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
<<<<<<< HEAD
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
=======
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
>>>>>>> 3f814b0 (Update 2)
  },
  insightTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
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
});
