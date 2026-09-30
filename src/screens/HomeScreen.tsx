/**
 * PARKIN — Smart Campus Parking
 * Screen: Home / Beranda
 *
 * Dashboard utama dengan status kampus, parking cards,
 * rekomendasi, dan mini prediction chart.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { parkingAreas, getCampusStats, ParkingArea } from '../data/parkingData';
import { predictionDataToday } from '../data/predictionData';
import { getRecommendations } from '../utils/recommendation';
import { getOccupancyPercent, needsAlert } from '../utils/parkingStatus';
import ParkingCard from '../components/ParkingCard';
import RecommendationCard from '../components/RecommendationCard';
import PredictionChart from '../components/PredictionChart';
import NotificationCard from '../components/NotificationCard';
import OccupancyBar from '../components/OccupancyBar';
import StatusBadge from '../components/StatusBadge';
import { getStatusFromOccupancy } from '../utils/parkingStatus';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useResponsive } from '../utils/responsive';

import { useAuth } from '../contexts/AuthContext';

// Simulate small random variance on refresh
function simulateRefresh(areas: ParkingArea[]): ParkingArea[] {
  return areas.map((area) => {
    const delta = Math.round((Math.random() - 0.5) * 4);
    const newOccupied = Math.max(0, Math.min(area.capacity, area.occupied + delta));
    const newAvailable = area.capacity - newOccupied;
    const percent = Math.round((newOccupied / area.capacity) * 100);
    return {
      ...area,
      occupied: newOccupied,
      available: newAvailable,
      status: getStatusFromOccupancy(percent),
      lastUpdated: 'Baru diperbarui',
    };
  });
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { width, isSmall, horizontalPadding } = useResponsive();
  const [areas, setAreas] = useState<ParkingArea[]>(parkingAreas);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('2 menit lalu');

  const stats = getCampusStats(areas);
  const recommendations = getRecommendations(areas, 1);
  const alertAreas = areas.filter((a) => needsAlert(getOccupancyPercent(a.occupied, a.capacity)));
  const bestAlternative = getRecommendations(areas, 1)[0]?.area;
  const campusStatus = getStatusFromOccupancy(stats.occupancyPercent);
  const todayPreview = predictionDataToday.slice(0, 6);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    setAreas(simulateRefresh(areas));
    setLastRefreshed('Baru diperbarui');
    setRefreshing(false);
  }, [areas]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ======== HEADER ======== */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>PARKIN</Text>
            <Text style={styles.greeting}>
              Halo, {user?.name ? user.name.split(' ')[0] : 'Mahasiswa'}
            </Text>
            <Text style={styles.tagline}>
              Pantau parkir kampus dengan mudah.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            accessibilityRole="button"
            accessibilityLabel="Perbarui status parkir"
            accessibilityHint="Memperbarui data kepadatan seluruh area parkir"
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* ======== CAMPUS STATUS CARD ======== */}
        <View
          style={[styles.campusCard, Shadow.md]}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel={`Status parkir kampus. ${stats.occupancyPercent} persen terisi. ${stats.totalOccupied} dari ${stats.totalCapacity} kendaraan. Status: ${campusStatus}.`}
        >
          <View style={styles.campusCardHeader}>
            <Text style={styles.campusCardTitle}>Status Parkir Kampus</Text>
            <StatusBadge status={campusStatus} size="sm" />
          </View>

          <View style={styles.campusOccupancyRow}>
            <Text style={styles.campusPercent}>{stats.occupancyPercent}%</Text>
            <View style={styles.campusPercentInfo}>
              <Text style={styles.campusCapacityText}>
                {stats.totalOccupied} dari {stats.totalCapacity} kendaraan
              </Text>
              <Text style={styles.campusAvailableText}>
                {stats.totalAvailable} slot tersedia
              </Text>
            </View>
          </View>

          <OccupancyBar percent={stats.occupancyPercent} height={10} />

          <Text style={styles.lastUpdated}>Terakhir diperbarui {lastRefreshed}</Text>
        </View>

        {/* ======== ALERT SECTION ======== */}
        {alertAreas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Peringatan Parkir
            </Text>
            {alertAreas.map((area) => (
              <NotificationCard
                key={area.id}
                area={area}
                alternativeArea={bestAlternative?.id !== area.id ? bestAlternative : undefined}
              />
            ))}
          </View>
        )}

        {/* ======== AREA PARKIR SECTION ======== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Area Parkir
          </Text>
          {areas.map((area) => (
            <ParkingCard key={area.id} area={area} compact={false} />
          ))}
        </View>

        {/* ======== RECOMMENDATION SECTION ======== */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Rekomendasi
            </Text>
            <RecommendationCard
              recommendation={recommendations[0]}
            />
          </View>
        )}

        {/* ======== MINI PREDICTION CHART ======== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Prediksi Hari Ini
          </Text>
          <View style={[Shadow.sm, { borderRadius: BorderRadius.lg }]}>
            <PredictionChart
              data={todayPreview}
              compact={true}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  refreshIcon: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  campusCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  campusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  campusCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white + 'CC',
  },
  campusOccupancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  campusPercent: {
    fontSize: 52,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    lineHeight: 60,
  },
  campusPercentInfo: {
    flex: 1,
  },
  campusCapacityText: {
    fontSize: FontSize.md,
    color: Colors.white + 'CC',
    marginBottom: 4,
  },
  campusAvailableText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  lastUpdated: {
    fontSize: FontSize.xs,
    color: Colors.white + '99',
    marginTop: Spacing.sm,
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
  bottomSpacer: {
    height: 16,
  },
});
