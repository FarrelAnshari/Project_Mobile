/**
 * PARKIN — Smart Campus Parking
 * Screen: Parking / Monitoring
 *
 * Full monitoring view with search, filter, map, and parking detail modal.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Linking,
  Share,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParkingArea, ParkingStatus } from '../models/parking';
import { getParkingAreas, getDemoParkingAreas, ParkingApiError } from '../services/parkingApi';
import { predictionDataToday } from '../data/predictionData';
import { getOccupancyPercent, getStatusFromOccupancy } from '../utils/parkingStatus';
import ParkingCard from '../components/ParkingCard';
import ParkingMap from '../components/ParkingMap';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import PredictionChart from '../components/PredictionChart';
import OccupancyBar from '../components/OccupancyBar';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
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
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [selectedArea, setSelectedArea] = useState<ParkingArea | null>(null);

  // API Data & Loading/Error States
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    <View style={styles.container}>
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
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.overlappingSearch}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch('')}
          />
        </View>

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

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          accessible={true}
          accessibilityRole="tablist"
          accessibilityLabel="Filter status parkir"
        >
          {ALL_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status)}
              accessibilityRole="tab"
              accessibilityLabel={`Filter: ${status}`}
              accessibilityState={{ selected: filterStatus === status }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Map */}
        <View style={[styles.section, Shadow.sm]}>
          <ParkingMap areas={filteredAreas} onMarkerPress={handleCardPress} />
        </View>

        {/* Parking list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {error && areas.length === 0 ? 'Area Parkir' : `${filteredAreas.length} Area Parkir`}
          </Text>
          {filteredAreas.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={error ? "cloud-offline-outline" : "search-outline"}
                size={36}
                color={error ? Colors.danger : Colors.textTertiary}
              />
              <Text style={styles.emptyText}>
                {error && areas.length === 0
                  ? 'Data area parkir tidak tersedia karena koneksi API gagal.'
                  : search
                  ? `Tidak ada hasil pencarian "${search}".`
                  : 'Tidak ada data area parkir.'}
              </Text>
              {error && areas.length === 0 && (
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
              {filteredAreas.map((area) => (
                <ParkingCard
                  key={area.id}
                  area={area}
                  onPress={handleCardPress}
                  style={isWide ? { width: cardWidth } : undefined}
                />
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
    <SafeAreaView style={styles.modalSafe}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle} numberOfLines={1}>
          {area.name}
        </Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup detail parkir"
        >
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modalScroll}
        contentContainerStyle={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Actions Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusBadge status={area.status} size="lg" />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              style={[styles.modalActionCircleBtn, isFavorite && { backgroundColor: Colors.warning + '20' }]}
              onPress={() => setIsFavorite(!isFavorite)}
              accessibilityLabel="Favoritkan area parkir"
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={isFavorite ? Colors.warning : Colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalActionCircleBtn}
              onPress={handleShare}
              accessibilityLabel="Bagikan status parkir"
            >
              <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.detailDesc}>{area.description}</Text>

        {/* Action Buttons: Directions */}
        <TouchableOpacity
          style={styles.directionsBtn}
          onPress={handleGetDirections}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={18} color={Colors.white} />
          <Text style={styles.directionsBtnText}>Petunjuk Arah (Google Maps)</Text>
        </TouchableOpacity>

        {/* Stats grid */}
        <View style={[styles.statsGrid, Shadow.sm]}>
          {[
            { label: 'Kapasitas', value: area.capacity.toString() },
            { label: 'Terisi', value: area.occupied.toString() },
            { label: 'Tersedia', value: area.available.toString() },
            { label: 'Persentase', value: `${percent}%` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statGridItem}>
              <Text style={styles.statGridValue}>{value}</Text>
              <Text style={styles.statGridLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Occupancy bar */}
        <View style={styles.detailBarSection}>
          <Text style={styles.detailBarLabel}>Tingkat Kepadatan</Text>
          <OccupancyBar percent={percent} height={12} />
        </View>

        {/* Prediction chart for this area */}
        <View style={[styles.detailChartSection, { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm }}>
            <Ionicons name="bar-chart-outline" size={16} color={Colors.primary} />
            <Text style={styles.detailChartTitle}>
              Prediksi Kepadatan Hari Ini
            </Text>
          </View>
          <PredictionChart data={predictionDataToday} compact={true} />
        </View>

        {/* Last updated */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
          <Text style={styles.detailUpdated}>
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
