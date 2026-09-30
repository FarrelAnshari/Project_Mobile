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
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { parkingAreas, ParkingArea, ParkingStatus } from '../data/parkingData';
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

const ALL_STATUSES: (ParkingStatus | 'Semua')[] = [
  'Semua',
  'AVAILABLE',
  'BUSY',
  'NEAR FULL',
  'FULL',
];

export default function ParkingScreen() {
  const { horizontalPadding } = useResponsive();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ParkingStatus | 'Semua'>('Semua');
  const [selectedArea, setSelectedArea] = useState<ParkingArea | null>(null);

  const filteredAreas = useMemo(() => {
    return parkingAreas.filter((area) => {
      const matchSearch = area.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus =
        filterStatus === 'Semua' || area.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus]);

  const handleCardPress = (area: ParkingArea) => {
    setSelectedArea(area);
  };

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
          <Text style={styles.title}>Monitoring Parkir</Text>
          <Text style={styles.subtitle}>
            Status real-time seluruh area parkir kampus
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch('')}
          />
        </View>

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
            {filteredAreas.length} Area Parkir
          </Text>
          {filteredAreas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada hasil ditemukan.</Text>
            </View>
          ) : (
            filteredAreas.map((area) => (
              <ParkingCard
                key={area.id}
                area={area}
                onPress={handleCardPress}
              />
            ))
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
    </SafeAreaView>
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
  const percent = getOccupancyPercent(area.occupied, area.capacity);

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
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modalScroll}
        contentContainerStyle={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <StatusBadge status={area.status} size="lg" />

        {/* Description */}
        <Text style={styles.detailDesc}>{area.description}</Text>

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
        <View style={styles.detailChartSection}>
          <Text style={styles.detailChartTitle}>
            Prediksi Kepadatan Hari Ini
          </Text>
          <PredictionChart data={predictionDataToday} compact={false} />
        </View>

        {/* Last updated */}
        <Text style={styles.detailUpdated}>
          Terakhir diperbarui: {area.lastUpdated}
        </Text>
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
  searchRow: {
    marginBottom: Spacing.md,
  },
  filterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingRight: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: FontWeight.bold,
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
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
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
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
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
    borderWidth: 1,
    borderColor: Colors.border,
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
});
