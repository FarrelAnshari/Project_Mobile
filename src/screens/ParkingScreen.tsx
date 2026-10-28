/**
 * PARKIN — Smart Campus Parking
 * Screen: Parking / Monitoring
 *
 * Full monitoring view with search, filter, map, and parking detail modal.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Modal,
  StyleSheet,
  SafeAreaView,
  Linking,
  Share,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ParkingArea } from '../models/parking';
import { getParkingAreas, getDemoParkingAreas } from '../services/parkingApi';
import { predictionDataToday } from '../data/predictionData';
import { getOccupancyPercent } from '../utils/parkingStatus';
import ParkingCard from '../components/ParkingCard';
import ParkingMap from '../components/ParkingMap';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import PredictionChart from '../components/PredictionChart';
import AnimatedOccupancyBar from '../components/AnimatedOccupancyBar';
import AnimatedPageTransition from '../components/AnimatedPageTransition';
import AnimatedPressable from '../components/AnimatedPressable';
import PulseRing from '../components/PulseRing';
import CountUpText from '../components/CountUpText';
import { SkeletonParkingCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import { useFetch } from '../hooks/useFetch';
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

const ALL_STATUSES = [
  'Semua',
  'AVAILABLE',
  'BUSY',
  'NEAR FULL',
  'FULL',
] as const;

export default function ParkingScreen() {
  const { horizontalPadding, isWide, cardWidth } = useResponsive();
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [selectedArea, setSelectedArea] = useState<ParkingArea | null>(null);

  // Unified UI State Management using custom useFetch hook
  const {
    data: fetchedAreas,
    isLoading,
    isRefetching,
    isError,
    errorMessage,
    refetch,
    setData: setAreas,
  } = useFetch<ParkingArea[]>(getParkingAreas);

  const areas = useMemo(() => fetchedAreas ?? [], [fetchedAreas]);

  // Fallback demo data loader if REST API backend server is offline
  const handleLoadDemoData = () => {
    const demoData = getDemoParkingAreas();
    setAreas(demoData);
  };

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const matchSearch = area.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus =
        filterStatus === 'Semua' ||
        area.status === filterStatus ||
        (filterStatus === 'AVAILABLE' && area.status === 'Sepi') ||
        (filterStatus === 'BUSY' && (area.status === 'Sedang' || area.status === 'Ramai')) ||
        (filterStatus === 'NEAR FULL' && area.status === 'Hampir Penuh') ||
        (filterStatus === 'FULL' && area.status === 'Penuh');
      return matchSearch && matchStatus;
    });
  }, [areas, search, filterStatus]);

  const handleCardPress = (area: ParkingArea) => {
    setSelectedArea(area);
  };

  return (
    <AnimatedPageTransition style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* PURPLE HEADER SECTION */}
        <View style={styles.purpleHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <SafeAreaView>
            <View style={[styles.headerInner, { paddingHorizontal: horizontalPadding }]}>
              <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Monitoring Parkir</Text>
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
          {/* Search */}
          <View style={[styles.overlappingSearch, { backgroundColor: colors.surface }]}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              onClear={() => setSearch('')}
            />
          </View>

          {/* 1. FULL ERROR STATE (When no data is loaded yet) */}
          {!isLoading && isError && areas.length === 0 && (
            <ErrorState
              type="network"
              title="Gagal Terhubung ke REST API"
              message={errorMessage || 'Tidak dapat memuat daftar area parkir. Pastikan koneksi internet Anda stabil atau gunakan server mock.'}
              onRetry={() => refetch()}
              isRetrying={isRefetching}
              onSecondaryAction={handleLoadDemoData}
              secondaryActionLabel="Muat Demo API"
            />
          )}

          {/* 2. PARTIAL ERROR BANNER (When background refresh fails but data is preserved) */}
          {isError && areas.length > 0 && (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5',
                },
              ]}
            >
              <View style={styles.errorHeaderRow}>
                <Ionicons name="alert-circle" size={22} color={colors.danger} />
                <View style={styles.errorTextContainer}>
                  <Text style={[styles.errorTitle, { color: colors.danger }]}>Gagal Memperbarui Data</Text>
                  <Text style={[styles.errorDesc, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>{errorMessage}</Text>
                </View>
              </View>
              <View style={styles.errorBtnRow}>
                <AnimatedPressable
                  pressScale={0.94}
                  style={styles.retryBtn}
                  onPress={() => refetch(true)}
                  accessibilityLabel="Coba lagi mengambil data API"
                >
                  <Ionicons name="refresh" size={15} color={colors.white} />
                  <Text style={styles.retryBtnText}>Coba Lagi</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  pressScale={0.94}
                  style={[
                    styles.demoBtn,
                    {
                      backgroundColor: isDark ? colors.surface : Colors.white,
                      borderColor: isDark ? colors.border : Colors.border,
                    },
                  ]}
                  onPress={handleLoadDemoData}
                  accessibilityLabel="Muat data demo API"
                >
                  <Ionicons name="cloud-download-outline" size={15} color={colors.primary} />
                  <Text style={[styles.demoBtnText, { color: colors.primary }]}>Muat Demo API</Text>
                </AnimatedPressable>
              </View>
            </View>
          )}

          {/* 3. LOADING SKELETON SCREENS */}
          {isLoading && areas.length === 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <SkeletonParkingCard />
              <SkeletonParkingCard />
              <SkeletonParkingCard />
            </View>
          )}

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            accessible={true}
            accessibilityRole="tablist"
            accessibilityLabel="Filter status parkir"
          >
            {ALL_STATUSES.map((status) => {
              const isActive = filterStatus === status;
              return (
                <AnimatedPressable
                  key={status}
                  pressScale={0.92}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isDark ? colors.surface : Colors.surface,
                      borderColor: isDark ? colors.border : Colors.border,
                    },
                    isActive && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setFilterStatus(status)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter: ${status}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? Colors.white : colors.textSecondary },
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          {/* Map */}
          <View style={[styles.section, Shadow.sm]}>
            <ParkingMap areas={filteredAreas} onMarkerPress={handleCardPress} />
          </View>

          {/* Parking list */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} accessibilityRole="header">
              {isError && areas.length === 0 ? 'Area Parkir' : `${filteredAreas.length} Area Parkir`}
            </Text>
            {filteredAreas.length === 0 && !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={isError ? "cloud-offline-outline" : "search-outline"}
                  size={36}
                  color={isError ? colors.danger : colors.textTertiary}
                />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {isError && areas.length === 0
                    ? 'Data area parkir tidak tersedia karena koneksi API gagal.'
                    : search
                    ? `Tidak ada hasil pencarian "${search}".`
                    : 'Tidak ada data area parkir.'}
                </Text>
                {isError && areas.length === 0 && (
                  <AnimatedPressable
                    pressScale={0.92}
                    style={[styles.retryBtn, { marginTop: Spacing.sm }]}
                    onPress={() => refetch()}
                  >
                    <Ionicons name="refresh" size={15} color={colors.white} />
                    <Text style={styles.retryBtnText}>Coba Lagi</Text>
                  </AnimatedPressable>
                )}
              </View>
            ) : (
              <View style={isWide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : undefined}>
                {filteredAreas.map((area, index) => (
                  <Animated.View
                    key={area.id}
                    entering={FadeInDown.delay(index * 60).springify().damping(16)}
                    style={isWide ? { width: cardWidth } : undefined}
                  >
                    <ParkingCard
                      area={area}
                      onPress={handleCardPress}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Detail Modal */}
        <Modal
          visible={!!selectedArea}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedArea(null)}
          accessibilityViewIsModal
        >
          {selectedArea && (
            <ParkingDetailModal
              area={selectedArea}
              onClose={() => setSelectedArea(null)}
            />
          )}
        </Modal>
      </View>
    </AnimatedPageTransition>
  );
}

// ======== DETAIL MODAL ========
function ParkingDetailModal({
  area,
  onClose,
}: {
  area: ParkingArea;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const percent = typeof area.occupancy === 'number' ? area.occupancy : getOccupancyPercent(area.occupied, area.capacity);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleGetDirections = () => {
    const query = encodeURIComponent(`${area.name} Kampus`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Info Parkir PARKIN: ${area.name} saat ini ${area.status}. Tersedia ${area.available} slot dari ${area.capacity}. Kepadatan: ${percent}%.`,
        title: `Info Parkir ${area.name}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.modalHeader,
          {
            backgroundColor: colors.surface,
            borderBottomColor: isDark ? colors.border : colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.modalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {area.name}
        </Text>
        <AnimatedPressable
          pressScale={0.9}
          style={[styles.closeBtn, { backgroundColor: isDark ? colors.borderLight : Colors.borderLight }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup detail parkir"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </AnimatedPressable>
      </View>

      <ScrollView
        style={styles.modalScroll}
        contentContainerStyle={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Actions Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <PulseRing
              color={area.status === 'Sepi' || area.status === 'AVAILABLE' ? Colors.success : Colors.warning}
              size={36}
            >
              <StatusBadge status={area.status} size="lg" />
            </PulseRing>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <AnimatedPressable
              pressScale={0.9}
              style={[
                styles.modalActionCircleBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
                isFavorite && { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : Colors.warning + '20' },
              ]}
              onPress={() => setIsFavorite(!isFavorite)}
              accessibilityLabel="Favoritkan area parkir"
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={isFavorite ? colors.warning : colors.textSecondary}
              />
            </AnimatedPressable>
            <AnimatedPressable
              pressScale={0.9}
              style={[
                styles.modalActionCircleBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? colors.border : colors.borderLight,
                },
              ]}
              onPress={handleShare}
              accessibilityLabel="Bagikan status parkir"
            >
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            </AnimatedPressable>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.detailDesc, { color: colors.textSecondary }]}>{area.description}</Text>

        {/* Action Buttons: Directions */}
        <AnimatedPressable
          pressScale={0.97}
          style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
          onPress={handleGetDirections}
        >
          <Ionicons name="navigate" size={18} color={colors.white} />
          <Text style={styles.directionsBtnText}>Petunjuk Arah (Google Maps)</Text>
        </AnimatedPressable>

        {/* Stats grid */}
        <View style={[styles.statsGrid, Shadow.sm, { backgroundColor: colors.surface }]}>
          {[
            { label: 'Kapasitas', value: area.capacity, isNumber: true },
            { label: 'Terisi', value: area.occupied, isNumber: true },
            { label: 'Tersedia', value: area.available, isNumber: true },
            { label: 'Persentase', value: `${percent}%`, isNumber: false },
          ].map(({ label, value, isNumber }) => (
            <View
              key={label}
              style={[
                styles.statGridItem,
                { borderColor: isDark ? colors.border : colors.borderLight },
              ]}
            >
              {isNumber ? (
                <CountUpText
                  value={typeof value === 'number' ? value : 0}
                  duration={700}
                  style={[styles.statGridValue, { color: colors.primary }]}
                />
              ) : (
                <Text style={[styles.statGridValue, { color: colors.primary }]}>{value}</Text>
              )}
              <Text style={[styles.statGridLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Occupancy bar */}
        <View style={styles.detailBarSection}>
          <Text style={[styles.detailBarLabel, { color: colors.textPrimary }]}>Tingkat Kepadatan</Text>
          <AnimatedOccupancyBar percent={percent} height={12} />
        </View>

        {/* Prediction chart for this area */}
        <View
          style={[
            styles.detailChartSection,
            {
              backgroundColor: colors.surface,
              borderRadius: BorderRadius.lg,
              padding: Spacing.md,
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm }}>
            <Ionicons name="bar-chart-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailChartTitle, { color: colors.textPrimary }]}>
              Prediksi Kepadatan Hari Ini
            </Text>
          </View>
          <PredictionChart data={predictionDataToday} compact={true} />
        </View>

        {/* Last updated */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.detailUpdated, { color: colors.textTertiary }]}>
            Terakhir diperbarui: {area.lastUpdated || area.updated_at}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  overlappingSearch: {
    marginTop: 0,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  filterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingRight: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Error & Loading styles
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
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
    color: '#991B1B',
    lineHeight: 16,
  },
  errorBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  demoBtnText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Modal styles
  modalSafe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  detailDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statGridItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.borderLight,
  },
  statGridValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statGridLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  detailBarSection: {
    gap: Spacing.sm,
  },
  detailBarLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  detailChartSection: {
    gap: Spacing.sm,
  },
  detailChartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  detailUpdated: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalActionCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs,
  },
  directionsBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
});
