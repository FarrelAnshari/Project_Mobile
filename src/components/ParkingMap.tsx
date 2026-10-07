/**
 * PARKIN — Smart Campus Parking
 * Component: ParkingMap
 *
 * Visual campus map using React Native Views (no API key needed).
 * Fallback map for Expo Go compatibility.
 * Each parking area shown as a marker card.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ParkingArea } from '../data/parkingData';
import { getOccupancyPercent, getStatusColor } from '../utils/parkingStatus';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

interface Props {
  areas: ParkingArea[];
  onMarkerPress?: (area: ParkingArea) => void;
}

export default function ParkingMap({ areas, onMarkerPress }: Props) {
  const { width } = useWindowDimensions();
  const mapWidth = Math.min(width - Spacing.lg * 2, 860);
  const mapHeight = width > 768 ? 260 : 220;
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleMarkerPress = (area: ParkingArea) => {
    setSelectedId(area.id === selectedId ? null : area.id);
    onMarkerPress?.(area);
  };

  return (
    <View style={styles.wrapper}>
      {/* Map header */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>🗺️ Peta Parkir Kampus</Text>
        <Text style={styles.mapSubtitle}>Visual — tanpa API key</Text>
      </View>

      {/* Map canvas */}
      <View
        style={[styles.mapCanvas, { width: mapWidth, height: mapHeight }]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel="Peta visual lokasi area parkir kampus"
      >
        {/* Campus grid lines */}
        <View style={styles.gridLine1} />
        <View style={styles.gridLine2} />

        {/* Campus label */}
        <View style={styles.campusLabel}>
          <Text style={styles.campusLabelText}>🏫 Kampus</Text>
        </View>

        {/* Parking markers */}
        {areas.map((area) => {
          const x = area.coordinates.x * mapWidth;
          const y = area.coordinates.y * mapHeight;
          const percent = getOccupancyPercent(area.occupied, area.capacity);
          const statusColor = getStatusColor(area.status);
          const isSelected = area.id === selectedId;

          return (
            <TouchableOpacity
              key={area.id}
              style={[
                styles.marker,
                {
                  left: x - 16,
                  top: y - 16,
                  borderColor: statusColor,
                  backgroundColor: isSelected ? statusColor : Colors.surface,
                },
                isSelected && styles.markerSelected,
              ]}
              onPress={() => handleMarkerPress(area)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${area.name}. Status: ${area.status}. ${area.available} slot tersedia.`}
              accessibilityHint="Ketuk untuk melihat info parkir ini"
            >
              <Text
                style={[
                  styles.markerText,
                  { color: isSelected ? Colors.white : statusColor },
                ]}
              >
                {percent}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info popup for selected marker */}
      {selectedId && (() => {
        const selectedArea = areas.find((a) => a.id === selectedId);
        if (!selectedArea) return null;
        const percent = getOccupancyPercent(selectedArea.occupied, selectedArea.capacity);
        const color = getStatusColor(selectedArea.status);
        return (
          <View
            style={[styles.popup, Shadow.md, { borderLeftColor: color }]}
            accessibilityRole="none"
            accessibilityLabel={`Info: ${selectedArea.name}. ${percent} persen terisi. ${selectedArea.available} slot tersedia.`}
          >
            <Text style={[styles.popupName, { color }]}>{selectedArea.name}</Text>
            <Text style={styles.popupDetails}>
              {selectedArea.occupied} / {selectedArea.capacity} kendaraan · {percent}%
            </Text>
            <Text style={styles.popupSlot}>
              {selectedArea.available} slot tersedia
            </Text>
          </View>
        );
      })()}

      {/* Legend */}
      <View style={styles.legend} accessibilityElementsHidden>
        {[
          { label: 'Sepi', color: Colors.sepi },
          { label: 'Sedang', color: Colors.sedang },
          { label: 'Ramai', color: Colors.ramai },
          { label: 'Hampir Penuh', color: Colors.hampirPenuh },
          { label: 'Penuh', color: Colors.penuh },
        ].map(({ label, color }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  mapTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  mapSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  mapCanvas: {
    backgroundColor: '#EEF4FF',
    position: 'relative',
    margin: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gridLine1: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#C7D7F5',
  },
  gridLine2: {
    position: 'absolute',
    left: '66%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#C7D7F5',
  },
  campusLabel: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  campusLabelText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  marker: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // minimum touch target via hitSlop
  },
  markerSelected: {
    transform: [{ scale: 1.25 }],
    zIndex: 10,
  },
  markerText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  popup: {
    margin: Spacing.sm,
    marginTop: 0,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
  },
  popupName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  popupDetails: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  popupSlot: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
