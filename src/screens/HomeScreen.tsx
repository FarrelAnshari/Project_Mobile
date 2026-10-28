/**
 * PARKIN — Smart Campus Parking
 * Screen: Home / Beranda — Bento Grid Redesign
 *
 * Redesign futuristik dengan:
 *  - Bento Grid layout (2-kolom variasi ukuran)
 *  - CircularGauge animated radial progress
 *  - GlowCard dengan ambient glow per kartu
 *  - StaggerList untuk entrance animation bertahap
 *  - AnimatedVehicleToggle dengan sliding pill
 *  - AnimatedPressable spring micro-interaction
 *  - PulseRing pada PIN widget
 *  - CountUpText animasi angka naik
 *  - Page transition FadeInDown pada mount
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Components
import NotificationCard from '../components/NotificationCard';
import ParkingCard from '../components/ParkingCard';
import ParkingPinWidget from '../components/ParkingPinWidget';
import PulseIndicator from '../components/PulseIndicator';
import RecommendationCard from '../components/RecommendationCard';
import { DashboardSkeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import CircularGauge from '../components/CircularGauge';
import GlowCard from '../components/GlowCard';
import StaggerList from '../components/StaggerList';
import AnimatedVehicleToggle, { VehicleType } from '../components/AnimatedVehicleToggle';
import AnimatedPressable from '../components/AnimatedPressable';
import CountUpText from '../components/CountUpText';

// Utils / Hooks / Data
import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Spacing,
} from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useFetch } from '../hooks/useFetch';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getCampusStats } from '../data/parkingData';
import { ParkingArea } from '../models/parking';
import {
  getDemoParkingAreas,
  getParkingAreas,
} from '../services/parkingApi';
import {
  getOccupancyPercent,
  needsAlert,
} from '../utils/parkingStatus';
import { getRecommendations } from '../utils/recommendation';
import { useResponsive } from '../utils/responsive';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

/** Mini stat bento item */
function StatBentoItem({
  label,
  value,
  suffix,
  icon,
  color,
  glowColor,
  onPress,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  color: string;
  glowColor: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <GlowCard
      glowColor={glowColor}
      glowIntensity={0.22}
      style={styles.statBentoCard}
      innerStyle={[styles.statBentoInner, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={[styles.statBentoIcon, { backgroundColor: glowColor + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <CountUpText
        value={value}
        suffix={suffix}
        style={[styles.statBentoValue, { color: colors.textPrimary }]}
        duration={1000}
      />
      <Text style={[styles.statBentoLabel, { color: colors.textSecondary }]}>{label}</Text>
    </GlowCard>
  );
}

export default function HomeScreen() {
  const { isWide, cardWidth, horizontalPadding } = useResponsive();
  const { user } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const { isOffline } = useOnlineStatus();

  const [lastRefreshed, setLastRefreshed] = useState('Memuat...');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType>('all');

  const {
    data: fetchedAreas,
    isLoading,
    isRefetching,
    isError,
    errorMessage,
    refetch,
    setData: setAreas,
  } = useFetch<ParkingArea[]>(getParkingAreas, {
    onSuccess: () => setLastRefreshed('Baru saja'),
    onError: () => setLastRefreshed('Gagal update'),
  });

  const areas = fetchedAreas ?? [];
  const firstName = user?.name?.split(' ')[0] ?? 'Mahasiswa';

  const handleLoadDemoData = () => {
    const demoData = getDemoParkingAreas();
    setAreas(demoData);
    setLastRefreshed('Demo API');
  };

  const stats = getCampusStats(areas);
  const recommendations = getRecommendations(areas, 1);
  const alertAreas = areas.filter(
    (a) =>
      needsAlert(
        typeof a.occupancy === 'number'
          ? a.occupancy
          : getOccupancyPercent(a.occupied, a.capacity)
      ) && !dismissedAlerts.includes(a.id)
  );
  const bestAlternative = recommendations[0]?.area;

  const navigateToParking = () => router.push('/(tabs)/parking' as any);
  const navigateToProfile = () => router.push('/(tabs)/profile' as any);
  const navigateToScanner = () => router.push('/scanner' as any);
  const navigateToPrediction = () => router.push('/(tabs)/prediction' as any);

  const handleCardPress = (_area: ParkingArea) => navigateToParking();
  const handleRecommendationPress = () => navigateToParking();
  const handleDismissAlert = (areaId: string) =>
    setDismissedAlerts((prev) => [...prev, areaId]);

  // Glow color berdasarkan occupancy
  const gaugeGlowColor =
    stats.occupancyPercent < 50
      ? '#22C55E'
      : stats.occupancyPercent < 70
      ? '#F59E0B'
      : stats.occupancyPercent < 85
      ? '#F97316'
      : '#EF4444';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── GRADIENT HEADER ── */}
      <Animated.View
        entering={FadeInDown.duration(600).springify()}
        style={[styles.gradientHeader, isDark && { backgroundColor: '#1E1B4B' }]}
      >
        <View style={[styles.gradientOverlay1, isDark && { backgroundColor: '#312E81', opacity: 0.4 }]} />
        <View style={[styles.gradientOverlay2, isDark && { backgroundColor: '#2E1065', opacity: 0.3 }]} />
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorCircle3} />

        <SafeAreaView>
          <View style={[styles.headerInner, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.headerTop}>
              <View style={styles.logoRow}>
                <View style={styles.logoMark}>
                  <Text style={styles.logoMarkText}>P</Text>
                </View>
                <Text style={styles.headerBrandText}>PARKIN</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AnimatedPressable
                  onPress={navigateToScanner}
                  style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                  accessibilityLabel="Pindai QR Tiket Parkir"
                  pressScale={0.88}
                >
                  <Ionicons name="qr-code-outline" size={19} color={Colors.white} />
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={navigateToProfile}
                  style={styles.headerIconBtn}
                  accessibilityLabel="Profil pengguna"
                  pressScale={0.88}
                >
                  <Ionicons name="person-outline" size={19} color={Colors.white} />
                </AnimatedPressable>
              </View>
            </View>

            <View style={styles.greetingRow}>
              <View style={styles.greetingTextContainer}>
                <Text style={styles.greetingLabel}>{getGreeting()},</Text>
                <Text style={styles.greetingText}>{firstName} 👋</Text>
              </View>
              <View style={styles.headerBadge}>
                <PulseIndicator color="#34D399" size={7} />
                <Text style={styles.headerBadgeText}>Real-Time</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch(true);
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. LOADING STATE */}
        {isLoading && areas.length === 0 && <DashboardSkeleton />}

        {/* 2. ERROR STATE */}
        {!isLoading && isError && areas.length === 0 && (
          <ErrorState
            type="network"
            title="Gagal Terhubung ke REST API"
            message={errorMessage || 'Tidak dapat memuat data parkir.'}
            onRetry={() => refetch()}
            isRetrying={isRefetching}
            onSecondaryAction={handleLoadDemoData}
            secondaryActionLabel="Gunakan Data Demo"
          />
        )}

        {/* 3. PARTIAL ERROR BANNER */}
        {isError && areas.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.errorBanner, { borderColor: colors.danger + '40' }]}>
            <View style={styles.errorHeaderRow}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <View style={styles.errorTextContainer}>
                <Text style={[styles.errorTitle, { color: colors.danger }]}>Pembaruan Terakhir Gagal</Text>
                <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>{errorMessage}</Text>
              </View>
            </View>
            <View style={styles.errorBtnRow}>
              <AnimatedPressable
                style={[styles.retryBtn, { backgroundColor: colors.danger }]}
                onPress={() => refetch(true)}
              >
                <Ionicons name="refresh" size={13} color={Colors.white} />
                <Text style={styles.retryBtnText}>Coba Lagi</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.demoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleLoadDemoData}
              >
                <Ionicons name="cloud-download-outline" size={13} color={colors.primary} />
                <Text style={[styles.demoBtnText, { color: colors.primary }]}>Demo Data</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>
        )}

        {/* 4. SUCCESS STATE: Bento Grid Dashboard */}
        {areas.length > 0 && (
          <StaggerList staggerDelay={70} initialDelay={100}>

            {/* ── BENTO ROW 1: Circular Gauge (besar) + 2 Mini Stats ── */}
            <View style={styles.bentoRow}>
              {/* Kartu Utama — Circular Gauge */}
              <GlowCard
                glowColor={gaugeGlowColor}
                glowIntensity={0.28}
                glowRadius={28}
                style={styles.bentoMainCard}
                innerStyle={[styles.bentoMainInner, { backgroundColor: colors.surface }]}
                onPress={navigateToParking}
              >
                {/* Header */}
                <View style={styles.bentoMainHeader}>
                  <Text style={[styles.bentoMainTitle, { color: colors.textPrimary }]}>Status Kampus</Text>
                  <AnimatedPressable
                    onPress={() => refetch(true)}
                    disabled={isOffline}
                    style={[styles.refreshBtn, isOffline && { opacity: 0.55 }]}
                    pressScale={0.85}
                  >
                    <Ionicons
                      name={isOffline ? 'cloud-offline-outline' : 'refresh-outline'}
                      size={14}
                      color={isOffline ? colors.warning : colors.primary}
                    />
                  </AnimatedPressable>
                </View>

                {/* Circular Gauge */}
                <View style={styles.gaugeWrapper}>
                  <CircularGauge
                    percent={stats.occupancyPercent}
                    size={120}
                    strokeWidth={10}
                    label="Terisi"
                    sublabel={lastRefreshed}
                  />
                </View>

                {/* Available slots */}
                <View style={styles.availableRow}>
                  <Text style={[styles.availableNum, { color: colors.textPrimary }]}>
                    {stats.totalAvailable}
                  </Text>
                  <Text style={[styles.availableLabel, { color: colors.textSecondary }]}>
                    {' '}slot tersedia
                  </Text>
                </View>
              </GlowCard>

              {/* Mini stats kolom kanan */}
              <View style={styles.bentoSideCol}>
                <StatBentoItem
                  label="Total Slot"
                  value={stats.totalCapacity}
                  icon="grid-outline"
                  color={colors.primary}
                  glowColor={colors.primary}
                  onPress={navigateToParking}
                />
                <StatBentoItem
                  label="Area Aktif"
                  value={areas.length}
                  suffix=" area"
                  icon="location-outline"
                  color="#22C55E"
                  glowColor="#22C55E"
                  onPress={navigateToParking}
                />
                <StatBentoItem
                  label="Prediksi"
                  value={stats.occupancyPercent > 70 ? stats.occupancyPercent - 10 : stats.occupancyPercent + 5}
                  suffix="%"
                  icon="trending-up-outline"
                  color="#F59E0B"
                  glowColor="#F59E0B"
                  onPress={navigateToPrediction}
                />
              </View>
            </View>

            {/* ── QUICK ACTION: SCAN QR TIKET PARKIR ── */}
            <View style={styles.section}>
              <GlowCard
                glowColor="#6366F1"
                glowIntensity={0.22}
                glowRadius={22}
                onPress={navigateToScanner}
                style={{ width: '100%' }}
                innerStyle={{
                  backgroundColor: colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 20,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: '#6366F11A',
                    borderWidth: 1,
                    borderColor: '#6366F140',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="scan-outline" size={24} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                    Scan QR Tiket Parkir
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                    Check-in & Check-out instan dengan sensor kamera
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: '#6366F1',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Pindai</Text>
                </View>
              </GlowCard>
            </View>

            {/* ── VEHICLE FILTER TOGGLE ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Filter Kendaraan</Text>
              <AnimatedVehicleToggle value={vehicleFilter} onChange={setVehicleFilter} />
            </View>

            {/* ── PIN LOKASI PARKIRKU (dengan PulseRing) ── */}
            <View style={styles.section}>
              <ParkingPinWidget />
            </View>

            {/* ── ALERTS ── */}
            {alertAreas.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⚠️ Peringatan</Text>
                  <View style={styles.alertCountBadge}>
                    <Text style={styles.alertCountText}>{alertAreas.length}</Text>
                  </View>
                </View>
                <StaggerList staggerDelay={60}>
                  {alertAreas.map((area) => (
                    <NotificationCard
                      key={area.id}
                      area={area}
                      alternativeArea={
                        bestAlternative?.id !== area.id ? bestAlternative : undefined
                      }
                      onDismiss={() => handleDismissAlert(area.id)}
                      onViewAlternative={navigateToParking}
                    />
                  ))}
                </StaggerList>
              </View>
            )}

            {/* ── AREA PARKIR — Horizontal Bento style ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Area Parkir</Text>
                <AnimatedPressable onPress={navigateToParking} pressScale={0.92}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>Lihat Semua →</Text>
                </AnimatedPressable>
              </View>

              <View style={isWide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 14 } : { gap: 10 }}>
                {areas.slice(0, isWide ? 6 : 3).map((area) => (
                  <ParkingCard
                    key={area.id}
                    area={area}
                    onPress={handleCardPress}
                    compact={false}
                    vehicleType={vehicleFilter}
                    style={isWide ? { width: cardWidth } : undefined}
                  />
                ))}
              </View>

              {areas.length > 3 && (
                <AnimatedPressable
                  style={[
                    styles.showMoreBtn,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isDark ? colors.border : colors.borderLight,
                    },
                  ]}
                  onPress={navigateToParking}
                  pressScale={0.96}
                >
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    +{areas.length - 3} area lainnya
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </AnimatedPressable>
              )}
            </View>

            {/* ── RECOMMENDATION ── */}
            {recommendations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🎯 Rekomendasi</Text>
                </View>
                <RecommendationCard
                  recommendation={recommendations[0]}
                  onPress={handleRecommendationPress}
                />
              </View>
            )}

          </StaggerList>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Action Button: Scan Tiket Parkir */}
      <AnimatedPressable
        onPress={navigateToScanner}
        style={styles.floatingScanFab}
        pressScale={0.92}
        accessibilityLabel="Pindai QR Tiket Parkir"
      >
        <Ionicons name="scan" size={20} color="#FFFFFF" />
        <Text style={styles.floatingScanFabText}>Pindai Tiket</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ─── Gradient Header ───────────────────────────────────────────
  gradientHeader: {
    backgroundColor: '#4338CA',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  gradientOverlay1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '100%',
    backgroundColor: '#7C3AED',
    opacity: 0.55,
    borderTopLeftRadius: 120,
    borderBottomLeftRadius: 80,
  },
  gradientOverlay2: {
    position: 'absolute',
    top: '30%',
    left: 0,
    width: '50%',
    height: '80%',
    backgroundColor: '#4F46E5',
    opacity: 0.4,
    borderTopRightRadius: 100,
  },
  decorCircle1: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  decorCircle2: {
    position: 'absolute', bottom: -40, left: '10%',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorCircle3: {
    position: 'absolute', top: '20%', left: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerInner: { maxWidth: 960, width: '100%', alignSelf: 'center' },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoMarkText: {
    fontSize: 18, fontWeight: FontWeight.extrabold,
    color: Colors.white, letterSpacing: 0.5,
  },
  headerBrandText: {
    fontSize: FontSize.lg, fontWeight: FontWeight.extrabold,
    color: Colors.white, letterSpacing: 2,
  },
  headerIconBtn: {
    width: 40, height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  greetingTextContainer: { flex: 1 },
  greetingLabel: {
    fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)',
    fontWeight: FontWeight.medium,
  },
  greetingText: {
    fontSize: 26, fontWeight: FontWeight.extrabold,
    color: Colors.white, marginTop: 2, letterSpacing: -0.5,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerBadgeText: {
    fontSize: FontSize.xs, color: Colors.white, fontWeight: FontWeight.semibold,
  },

  // ─── Scroll ────────────────────────────────────────────────────
  scroll: { flex: 1 },
  content: {
    paddingTop: Spacing.lg, paddingBottom: 120,
    maxWidth: 960, width: '100%', alignSelf: 'center',
  },

  // ─── Bento Grid ────────────────────────────────────────────────
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  // Kartu utama (kiri, lebih lebar)
  bentoMainCard: {
    flex: 1.35,
    minHeight: 240,
  },
  bentoMainInner: {
    padding: Spacing.md,
    flex: 1,
    minHeight: 240,
  },
  bentoMainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bentoMainTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  gaugeWrapper: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  availableNum: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
  },
  availableLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  refreshBtn: {
    width: 28, height: 28, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },

  // Kolom kanan (3 mini card vertikal)
  bentoSideCol: {
    flex: 1,
    gap: 10,
  },
  statBentoCard: {
    flex: 1,
  },
  statBentoInner: {
    padding: Spacing.sm,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 70,
  },
  statBentoIcon: {
    width: 30, height: 30, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  statBentoValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
  },
  statBentoLabel: {
    fontSize: 9,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },

  // ─── Sections ─────────────────────────────────────────────────
  section: { marginBottom: Spacing.xl },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
  },
  alertCountBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  alertCountText: {
    fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold,
  },
  viewAllText: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
  },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: 4, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderStyle: 'dashed', marginTop: Spacing.sm,
  },
  showMoreText: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
  },
  bottomSpacer: { height: 32 },

  // ─── Error Banner ──────────────────────────────────────────────
  errorBanner: {
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, marginBottom: Spacing.lg,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  errorHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  errorTextContainer: { flex: 1 },
  errorTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 2,
  },
  errorDesc: { fontSize: FontSize.xs, lineHeight: 18 },
  errorBtnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  retryBtnText: {
    fontSize: FontSize.xs, color: Colors.white, fontWeight: FontWeight.semibold,
  },
  demoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.sm, borderWidth: 1,
  },
  demoBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  floatingScanFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 88,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 90,
  },
  floatingScanFabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
