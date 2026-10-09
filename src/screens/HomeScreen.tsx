import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ParkingArea } from '../models/parking';
import { getCampusStats } from '../data/parkingData';
import { getParkingAreas, getDemoParkingAreas, ParkingApiError } from '../services/parkingApi';
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

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export default function HomeScreen() {
  const { width, isSmall, isWide, cardWidth, horizontalPadding } = useResponsive();
  const { user } = useAuth();
  const router = useRouter();

  // API Data & Loading/Error States
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Memuat...');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const firstName = user?.name?.split(' ')[0] ?? 'Mahasiswa';

  // Fetch parking areas from REST API
  const fetchParkingData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getParkingAreas();
      setAreas(data);
      setLastRefreshed('Baru saja');
    } catch (err: unknown) {
      const message =
        err instanceof ParkingApiError
          ? err.message
          : 'Gagal memuat data parkir dari server.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchParkingData();
  }, [fetchParkingData]);

  const onRefresh = useCallback(() => {
    fetchParkingData(true);
  }, [fetchParkingData]);

  // Fallback demo data loader if REST API backend server is offline
  const handleLoadDemoData = () => {
    const demoData = getDemoParkingAreas();
    setAreas(demoData);
    setError(null);
    setLastRefreshed('Demo API');
  };

  const stats = getCampusStats(areas);
  const recommendations = getRecommendations(areas, 1);
  const alertAreas = areas.filter(
    (a) =>
      needsAlert(typeof a.occupancy === 'number' ? a.occupancy : getOccupancyPercent(a.occupied, a.capacity)) &&
      !dismissedAlerts.includes(a.id)
  );
  const bestAlternative = recommendations[0]?.area;
  const campusStatus = getStatusFromOccupancy(stats.occupancyPercent);

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
  const handleDismissAlert = (areaId: string) => {
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
        {/* ERROR STATE BANNER */}
        {error && (
          <View style={styles.errorBanner}>
            <View style={styles.errorHeaderRow}>
              <Ionicons name="alert-circle" size={22} color={Colors.danger} />
              <View style={styles.errorTextContainer}>
                <Text style={styles.errorTitle}>Gagal Terhubung ke REST API</Text>
                <Text style={styles.errorDesc}>{error}</Text>
              </View>
            </View>
            <View style={styles.errorBtnRow}>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => fetchParkingData()}
                accessibilityLabel="Coba lagi mengambil data API"
              >
                <Ionicons name="refresh" size={15} color={Colors.white} />
                <Text style={styles.retryBtnText}>Coba Lagi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={handleLoadDemoData}
                accessibilityLabel="Muat data demo API"
              >
                <Ionicons name="cloud-download-outline" size={15} color={Colors.primary} />
                <Text style={styles.demoBtnText}>Muat Demo API</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LOADING STATE INDICATOR */}
        {loading && areas.length === 0 && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingBoxText}>Mengambil data parkir dari REST API...</Text>
          </View>
        )}

        {/* OVERLAPPING CAMPUS STATUS CARD */}
        <View style={styles.overlappingCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Status Kampus</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
              <Text style={styles.refreshText}>{lastRefreshed}</Text>
            </TouchableOpacity>
          </View>
          
          {error && areas.length === 0 ? (
            <View>
              <View style={styles.campusOccupancyRow}>
                <View style={styles.campusOccupancyLeft}>
                  <Text style={[styles.campusPercent, { color: Colors.danger }]}>--</Text>
                  <Text style={styles.campusPercentLabel}>Tidak Tersedia</Text>
                </View>
                <View style={styles.campusDivider} />
                <View style={styles.campusOccupancyRight}>
                  <Text style={[styles.campusAvailableText, { color: Colors.textSecondary }]}>--</Text>
                  <Text style={styles.campusCapacityText}>Gagal memuat kapasitas parkir</Text>
                </View>
              </View>
              <View style={{ alignSelf: 'flex-start', marginTop: Spacing.md }}>
                <View style={styles.apiErrorBadge}>
                  <Ionicons name="cloud-offline-outline" size={14} color={Colors.danger} />
                  <Text style={styles.apiErrorBadgeText}>Koneksi API Gagal</Text>
                </View>
              </View>
            </View>
          ) : (
            <>
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
            </>
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <TouchableOpacity
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Area Parkir</Text>
            <TouchableOpacity onPress={navigateToParking}>
              <Text style={styles.viewAllText}>Lihat Semua →</Text>
            </TouchableOpacity>
          </View>
          {areas.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={error ? "cloud-offline-outline" : "car-outline"}
                size={36}
                color={error ? Colors.danger : Colors.textTertiary}
              />
              <Text style={styles.emptyText}>
                {error
                  ? 'Data area parkir tidak tersedia karena koneksi API gagal.'
                  : 'Tidak ada data area parkir.'}
              </Text>
              {error && (
                <TouchableOpacity
                  style={[styles.retryBtn, { marginTop: Spacing.sm }]}
                  onPress={() => fetchParkingData()}
                >
                  <Ionicons name="refresh" size={15} color={Colors.white} />
                  <Text style={styles.retryBtnText}>Coba Lagi</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
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
          )}
          {areas.length > 3 && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={navigateToParking}
            >
              <Text style={styles.showMoreText}>+{areas.length - 3} area lainnya</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* RECOMMENDATION SECTION */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionTitle}>Rekomendasi</Text>
            </View>
            <RecommendationCard
              recommendation={recommendations[0]}
              onPress={handleRecommendationPress}
            />
          </View>
        )}

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
  overlappingCard: {
    backgroundColor: Colors.surface,
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
  // Error & Loading States
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    marginBottom: Spacing.lg,
  },
  errorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    marginBottom: 2,
  },
  errorDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  errorBtnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  retryBtnText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingBoxText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  apiErrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  apiErrorBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: FontWeight.semibold,
  },
});

