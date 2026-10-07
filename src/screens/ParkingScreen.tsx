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
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { horizontalPadding, isWide, cardWidth } = useResponsive();
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
        showsVerticalScrollIndicator={false}
      >
<<<<<<< HEAD
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Monitoring Parkir</Text>
          <Text style={styles.subtitle}>
            Status real-time seluruh area parkir kampus
          </Text>
        </View>

=======
>>>>>>> 3f814b0 (Update 2)
        {/* Search */}
        <View style={styles.overlappingSearch}>
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
<<<<<<< HEAD
=======
              <Ionicons name="search-outline" size={36} color={Colors.textTertiary} />
>>>>>>> 3f814b0 (Update 2)
              <Text style={styles.emptyText}>Tidak ada hasil ditemukan.</Text>
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
  const percent = getOccupancyPercent(area.occupied, area.capacity);
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
<<<<<<< HEAD
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
=======
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
            Terakhir diperbarui: {area.lastUpdated}
          </Text>
        </View>
>>>>>>> 3f814b0 (Update 2)
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
    gap: Spacing.sm,
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
<<<<<<< HEAD
    width: 44,
    height: 44,
    borderRadius: 22,
=======
    width: 32,
    height: 32,
    borderRadius: 16,
>>>>>>> 3f814b0 (Update 2)
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
