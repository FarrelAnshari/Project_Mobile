import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { parkingAreas, getCampusStats, ParkingArea } from '../data/parkingData';
import { predictionDataToday } from '../data/predictionData';
import { getRecommendations } from '../utils/recommendation';
import { getOccupancyPercent, needsAlert } from '../utils/parkingStatus';
import ParkingCard from '../components/ParkingCard';
import RecommendationCard from '../components/RecommendationCard';
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
} from '../constants/theme';
import { useResponsive } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

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

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export default function HomeScreen() {
<<<<<<< HEAD
  const { user } = useAuth();
  const { width, isSmall, horizontalPadding } = useResponsive();
=======
  const { width, isSmall, isWide, cardWidth, horizontalPadding } = useResponsive();
  const { user } = useAuth();
  const router = useRouter();
>>>>>>> 3f814b0 (Update 2)
  const [areas, setAreas] = useState<ParkingArea[]>(parkingAreas);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('2 menit lalu');
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  const firstName = user?.name?.split(' ')[0] ?? 'Mahasiswa';

  const stats = getCampusStats(areas);
  const recommendations = getRecommendations(areas, 1);
  const alertAreas = areas.filter(
    (a) =>
      needsAlert(getOccupancyPercent(a.occupied, a.capacity)) &&
      !dismissedAlerts.includes(a.id)
  );
  const bestAlternative = getRecommendations(areas, 1)[0]?.area;
  const campusStatus = getStatusFromOccupancy(stats.occupancyPercent);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setAreas(simulateRefresh(areas));
    setLastRefreshed('Baru saja');
    setRefreshing(false);
  }, [areas]);

  // Navigate to parking tab
  const navigateToParking = () => {
    router.push('/(tabs)/parking' as any);
  };

  // Navigate to profile tab
  const navigateToProfile = () => {
    router.push('/(tabs)/profile' as any);
  };

  // Navigate to prediction tab
  const navigateToPrediction = () => {
    router.push('/(tabs)/prediction' as any);
  };

  // Handle parking card press
  const handleCardPress = (area: ParkingArea) => {
    navigateToParking();
  };

  // Handle recommendation press
  const handleRecommendationPress = () => {
    navigateToParking();
  };

  // Dismiss notification
  const handleDismissAlert = (areaId: number) => {
    setDismissedAlerts((prev) => [...prev, areaId]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* PURPLE HEADER SECTION */}
      <View style={styles.purpleHeader}>
        {/* Subtle Ambient Decorative Circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <SafeAreaView>
          <View style={[styles.headerInner, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={navigateToParking}
                accessibilityLabel="Lihat semua area parkir"
              >
                <Ionicons name="grid-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Home</Text>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={navigateToProfile}
                accessibilityLabel="Profil pengguna"
              >
                <Ionicons name="person-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.greetingRow}>
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greetingLabel}>{getGreeting()},</Text>
                <Text style={styles.greetingText}>{firstName} 👋</Text>
              </View>
              <View style={styles.headerBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.headerBadgeText}>Real-Time</Text>
              </View>
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
<<<<<<< HEAD
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
=======
        {/* OVERLAPPING CAMPUS STATUS CARD */}
        <View style={styles.overlappingCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Status Kampus</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
              <Text style={styles.refreshText}>{lastRefreshed}</Text>
            </TouchableOpacity>
>>>>>>> 3f814b0 (Update 2)
          </View>
          
          <View style={styles.campusOccupancyRow}>
             <View style={styles.campusOccupancyLeft}>
                <Text style={styles.campusPercent}>{stats.occupancyPercent}%</Text>
                <Text style={styles.campusPercentLabel}>Terisi</Text>
             </View>
             <View style={styles.campusDivider} />
             <View style={styles.campusOccupancyRight}>
                <Text style={styles.campusAvailableText}>{stats.totalAvailable}</Text>
                <Text style={styles.campusCapacityText}>Slot tersedia dari {stats.totalCapacity}</Text>
             </View>
          </View>
          
          <View style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>
             <OccupancyBar percent={stats.occupancyPercent} height={6} />
          </View>
          <View style={{ alignSelf: 'flex-start', marginTop: Spacing.sm }}>
             <StatusBadge status={campusStatus} size="sm" />
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <TouchableOpacity
<<<<<<< HEAD
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
=======
            style={styles.quickActionBtn}
            onPress={navigateToParking}
            accessibilityLabel="Monitoring parkir"
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="car" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Parkir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={navigateToPrediction}
            accessibilityLabel="Prediksi kepadatan"
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + '15' }]}>
              <Ionicons name="stats-chart" size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.quickActionText}>Prediksi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push('/(tabs)/history' as any)}
            accessibilityLabel="Riwayat kepadatan"
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + '15' }]}>
              <Ionicons name="time" size={22} color={Colors.info} />
            </View>
            <Text style={styles.quickActionText}>Riwayat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={navigateToProfile}
            accessibilityLabel="Pengaturan profil"
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '15' }]}>
              <Ionicons name="settings" size={22} color={Colors.success} />
            </View>
            <Text style={styles.quickActionText}>Profil</Text>
          </TouchableOpacity>
        </View>

        {/* ALERTS SECTION */}
        {alertAreas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>⚠️ Peringatan</Text>
              <Text style={styles.alertCount}>{alertAreas.length} area</Text>
            </View>
>>>>>>> 3f814b0 (Update 2)
            {alertAreas.map((area) => (
              <NotificationCard
                key={area.id}
                area={area}
                alternativeArea={bestAlternative?.id !== area.id ? bestAlternative : undefined}
                onDismiss={() => handleDismissAlert(area.id)}
                onViewAlternative={navigateToParking}
              />
            ))}
          </View>
        )}

        {/* AREA PARKIR SECTION */}
        <View style={styles.section}>
<<<<<<< HEAD
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Area Parkir
          </Text>
          {areas.map((area) => (
            <ParkingCard key={area.id} area={area} compact={false} />
          ))}
=======
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Area Parkir</Text>
            <TouchableOpacity onPress={navigateToParking}>
              <Text style={styles.viewAllText}>Lihat Semua →</Text>
            </TouchableOpacity>
          </View>
          <View style={isWide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : undefined}>
            {areas.slice(0, isWide ? 6 : 3).map((area) => (
              <ParkingCard
                key={area.id}
                area={area}
                onPress={handleCardPress}
                compact={false}
                style={isWide ? { width: cardWidth } : undefined}
              />
            ))}
          </View>
          {areas.length > 3 && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={navigateToParking}
            >
              <Text style={styles.showMoreText}>+{areas.length - 3} area lainnya</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
>>>>>>> 3f814b0 (Update 2)
        </View>

        {/* RECOMMENDATION SECTION */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
<<<<<<< HEAD
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Rekomendasi
            </Text>
=======
            <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionTitle}>Rekomendasi</Text>
            </View>
>>>>>>> 3f814b0 (Update 2)
            <RecommendationCard
              recommendation={recommendations[0]}
              onPress={handleRecommendationPress}
            />
          </View>
        )}

<<<<<<< HEAD
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

=======
>>>>>>> 3f814b0 (Update 2)
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeight.medium,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  headerBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  scroll: {
    flex: 1,
  },
  headerInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
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
=======
  overlappingCard: {
    backgroundColor: Colors.surface,
>>>>>>> 3f814b0 (Update 2)
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: 0,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#1E1E2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  campusOccupancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  campusOccupancyLeft: {
    flex: 1,
  },
  campusPercent: {
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  campusPercentLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  campusDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  campusOccupancyRight: {
    flex: 1.5,
  },
  campusAvailableText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  campusCapacityText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  alertCount: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: FontWeight.semibold,
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  showMoreText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  bottomSpacer: {
    height: 32,
  },
});
