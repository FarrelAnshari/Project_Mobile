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
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { predictionDataToday, predictionDataTomorrow } from '../data/predictionData';
import { parkingAreas } from '../data/parkingData';
import { getStatusFromOccupancy, getStatusColor } from '../utils/parkingStatus';
import { getRecommendations } from '../utils/recommendation';
import OccupancyChart, { ChartDataPoint } from '../components/OccupancyChart';
import StatusBadge from '../components/StatusBadge';
import AnimatedPageTransition from '../components/AnimatedPageTransition';
import AnimatedPressable from '../components/AnimatedPressable';
import GlowCard from '../components/GlowCard';
import AnimatedOccupancyBar from '../components/AnimatedOccupancyBar';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useResponsive } from '../utils/responsive';

type DayTab = 'today' | 'tomorrow';

export default function PredictionScreen() {
  const router = useRouter();
  const { horizontalPadding, isWide, cardWidth } = useResponsive();
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const [activeDay, setActiveDay] = useState<DayTab>('today');

  const predictionData = activeDay === 'today' ? predictionDataToday : predictionDataTomorrow;

  // Best recommendation for early arrival
  const recommendation = getRecommendations(parkingAreas, 1)[0];

  return (
    <AnimatedPageTransition style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* PURPLE HEADER SECTION */}
        <View style={[styles.purpleHeader, { backgroundColor: isDark ? colors.surface : colors.primary }]}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <SafeAreaView>
            <View style={[styles.headerInner, { paddingHorizontal: horizontalPadding }]}>
              <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Prediksi Kepadatan</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding, paddingBottom: isWide ? 48 : 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ML Disclaimer banner (Overlapping) */}
          <View style={[styles.overlappingBanner, { backgroundColor: colors.surface, borderColor: isDark ? colors.border : colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <View style={[styles.disclaimerIconBox, { backgroundColor: colors.primary + (isDark ? '25' : '15') }]}>
               <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.disclaimerTextBlock}>
              <Text style={[styles.disclaimerTitle, { color: colors.textPrimary }]}>Prediksi Simulasi</Text>
              <Text style={[styles.disclaimerBody, { color: colors.textSecondary }]}>
                Data ini merupakan estimasi berdasarkan data historis/simulasi. Model machine learning akan diintegrasikan pada sprint berikutnya.
              </Text>
            </View>
          </View>

          {/* Day tabs */}
          <View style={[styles.tabs, { backgroundColor: isDark ? colors.surface : '#EDE9FE' }]} accessibilityRole="tablist">
            {[
              { id: 'today' as DayTab, label: 'Hari Ini' },
              { id: 'tomorrow' as DayTab, label: 'Besok' },
            ].map((tab) => (
              <AnimatedPressable
                key={tab.id}
                pressScale={0.95}
                style={[
                  styles.tab,
                  activeDay === tab.id && [styles.tabActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => setActiveDay(tab.id)}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: activeDay === tab.id }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeDay === tab.id ? Colors.white : colors.textSecondary },
                    activeDay === tab.id && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          {/* Full prediction chart — OccupancyChart (animated bars) */}
          <View style={[Shadow.sm, styles.chartContainer, { backgroundColor: colors.surface, borderColor: isDark ? colors.border : colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <OccupancyChart
              data={predictionData.map((p, idx) => ({
                label: p.time,
                value: p.occupancy,
                // Highlight the current-ish hour
                highlight: idx === Math.floor(predictionData.length / 2),
              } as ChartDataPoint))}
              height={180}
              showYAxis
            />
          </View>

          {/* Per-hour details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
              Rincian Per Jam
            </Text>
            <View style={[styles.hourlyTable, Shadow.sm, { backgroundColor: colors.surface, borderColor: isDark ? colors.border : colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
              {predictionData.map((point, index) => {
                const status = getStatusFromOccupancy(point.occupancy);
                const color = getStatusColor(status);
                return (
                  <View
                    key={index}
                    style={[
                      styles.hourRow,
                      index < predictionData.length - 1 && [styles.hourRowBorder, { borderBottomColor: colors.borderLight }],
                    ]}
                    accessible={true}
                    accessibilityLabel={`Pukul ${point.time}: ${point.occupancy} persen — ${point.label}`}
                  >
                    <Text style={[styles.hourTime, { color: colors.textPrimary }]}>{point.time}</Text>
                    <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
                      <AnimatedOccupancyBar percent={point.occupancy} height={8} />
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
            <GlowCard
              glowColor="rgba(99, 102, 241, 0.22)"
              glowRadius={16}
              style={{ marginHorizontal: 0, marginTop: Spacing.sm }}
            >
              <AnimatedPressable
                pressScale={0.98}
                style={[styles.suggestionCard, { backgroundColor: colors.surface, borderColor: isDark ? colors.border : colors.borderLight, borderWidth: isDark ? 1 : 0 }]}
                onPress={() => router.push('/(tabs)/parking' as any)}
                accessibilityRole="button"
                accessibilityLabel={`Saran: pilih area ${recommendation.area.name}`}
              >
                <View style={styles.suggestionHeader}>
                  <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                  <Text style={[styles.suggestionTitle, { color: colors.textPrimary }]}>Saran Kepadatan</Text>
                </View>
                <Text style={[styles.suggestionBody, { color: colors.textSecondary }]}>
                  Disarankan datang sebelum{' '}
                  <Text style={[styles.suggestionHighlight, { color: colors.primary }]}>
                    {predictionData.find((p) => p.occupancy > 60)?.time ?? '10:00'}
                  </Text>{' '}
                  atau memilih area{' '}
                  <Text style={[styles.suggestionHighlight, { color: colors.primary }]}>
                    {recommendation.area.name}
                  </Text>
                  .
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 4 }}>
                  <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.primary }}>
                    Lihat Area Parkir Ini
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </AnimatedPressable>
            </GlowCard>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </AnimatedPageTransition>
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
  overlappingBanner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: 0,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  disclaimerIconBox: {
    marginTop: 2,
  },
  disclaimerTextBlock: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
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
    fontSize: FontSize.sm,
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
    backgroundColor: Colors.surface,
    padding: Spacing.md,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  suggestionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  suggestionBody: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  suggestionHighlight: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
