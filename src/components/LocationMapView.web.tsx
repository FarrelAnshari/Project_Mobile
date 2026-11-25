/**
 * PARKIN — Smart Campus Parking
 * Component: LocationMapView (Web Visual Interactive Fallback)
 *
 * Menggunakan komponen View/Text/TouchableOpacity murni (tanpa react-native-maps maupun
 * react-native-svg) agar berjalan mulus tanpa error React 19 DOM saat `expo start --web`.
 */

import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ParkingArea } from '../models/parking';
import { calculateDistanceMeters } from '../utils/geofence';
import { LocationMapViewProps } from './LocationMapView.types';

function getMarkerColor(status: ParkingArea['status']): string {
  switch (status) {
    case 'AVAILABLE':
      return '#22C55E';
    case 'BUSY':
      return '#F59E0B';
    case 'NEAR FULL':
      return '#F97316';
    case 'FULL':
      return '#EF4444';
    default:
      return '#6366F1';
  }
}

function getShortCode(area: ParkingArea): string {
  const digits = area.id.replace(/\D/g, '');
  return digits ? `P${digits}` : area.name.slice(0, 3).toUpperCase();
}

export default function LocationMapView({
  userLocation,
  parkingAreas,
  geofenceZone,
  geofenceStatus,
  onSelectParkingArea,
  height = 300,
}: LocationMapViewProps) {
  const { colors, isDark } = useTheme();
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [centerOnUser, setCenterOnUser] = useState<boolean>(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 400,
    height,
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w > 0 && h > 0) {
      setCanvasSize({ width: w, height: h });
    }
  };

  // Padding ~18% di sekeliling diameter geofence 500m agar P1–P5 & lingkaran terlihat lega
  const baseSpan = (((geofenceZone.radiusMeters * 2) / 111320) * 1.48) / zoomScale;
  const vbW = canvasSize.width;
  const vbH = canvasSize.height;

  const centerLat =
    centerOnUser && userLocation ? userLocation.latitude : geofenceZone.latitude;
  const centerLng =
    centerOnUser && userLocation ? userLocation.longitude : geofenceZone.longitude;

  const project = useMemo(() => {
    const aspect = vbH > 0 ? vbW / vbH : 1.5;
    const latSpan = baseSpan;
    const lngSpan = baseSpan * aspect;
    return (lat: number, lng: number) => {
      const x = vbW / 2 + ((lng - centerLng) / lngSpan) * vbW;
      const y = vbH / 2 - ((lat - centerLat) / latSpan) * vbH;
      return { x, y };
    };
  }, [baseSpan, centerLat, centerLng, vbW, vbH]);

  const zoneCenter = project(geofenceZone.latitude, geofenceZone.longitude);
  const zoneRadiusPx = Math.max(
    24,
    (geofenceZone.radiusMeters / 111320 / baseSpan) * vbH
  );
  const userPt = userLocation
    ? project(userLocation.latitude, userLocation.longitude)
    : null;

  const selectedArea = useMemo(
    () => parkingAreas.find((a) => a.id === selectedAreaId) ?? null,
    [parkingAreas, selectedAreaId]
  );

  const selectedDistanceMeters = useMemo(() => {
    if (!selectedArea?.geo) return null;
    const refLat = userLocation ? userLocation.latitude : geofenceZone.latitude;
    const refLng = userLocation ? userLocation.longitude : geofenceZone.longitude;
    return calculateDistanceMeters(
      refLat,
      refLng,
      selectedArea.geo.latitude,
      selectedArea.geo.longitude
    );
  }, [selectedArea, userLocation, geofenceZone]);

  const isInside = geofenceStatus === 'inside';
  const strokeClr = isInside ? '#22C55E' : '#6366F1';
  const fillClr = isInside ? 'rgba(34, 197, 94, 0.16)' : 'rgba(99, 102, 241, 0.14)';
  const canvasBg = isDark ? '#14172B' : '#EEF2FF';
  const gridClr = isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(99, 102, 241, 0.10)';

  return (
    <View style={styles.outerWrap}>
      <View
        onLayout={handleLayout}
        style={[
          styles.wrapper,
          { height, backgroundColor: canvasBg, borderColor: colors.border },
        ]}
      >
        {/* Grid latar peta */}
        {[0.18, 0.36, 0.54, 0.72, 0.88].map((ratio) => (
          <View
            key={`h-${ratio}`}
            pointerEvents="none"
            style={[
              styles.gridLineH,
              { top: `${ratio * 100}%`, backgroundColor: gridClr },
            ]}
          />
        ))}
        {[0.16, 0.33, 0.5, 0.67, 0.84].map((ratio) => (
          <View
            key={`v-${ratio}`}
            pointerEvents="none"
            style={[
              styles.gridLineV,
              { left: `${ratio * 100}%`, backgroundColor: gridClr },
            ]}
          />
        ))}

        {/* Lingkaran Geofence Kampus UMM III */}
        <View
          pointerEvents="none"
          style={[
            styles.geofenceCircle,
            {
              width: zoneRadiusPx * 2,
              height: zoneRadiusPx * 2,
              borderRadius: zoneRadiusPx,
              left: zoneCenter.x - zoneRadiusPx,
              top: zoneCenter.y - zoneRadiusPx,
              borderColor: strokeClr,
              backgroundColor: fillClr,
            },
          ]}
        />

        {/* Marker Area Parkir UMM Kampus III (dot 14px + badge P1–P5) */}
        {parkingAreas.map((area) => {
          if (!area.geo) return null;
          const pt = project(area.geo.latitude, area.geo.longitude);
          const color = getMarkerColor(area.status);
          const isSelected = area.id === selectedAreaId;

          return (
            <TouchableOpacity
              key={area.id}
              activeOpacity={0.85}
              onPress={() => {
                setSelectedAreaId((prev) => (prev === area.id ? null : area.id));
                onSelectParkingArea?.(area);
              }}
              style={[
                styles.markerWrap,
                { left: pt.x - 18, top: pt.y - 7 },
                isSelected && styles.markerWrapSelected,
              ]}
              accessibilityLabel={`${area.name}. ${area.available} slot tersedia.`}
            >
              <View
                style={[
                  styles.markerDot,
                  { backgroundColor: color },
                  isSelected && styles.markerDotSelected,
                ]}
              />
              <View style={styles.markerPill}>
                <Text style={styles.markerPillText}>{getShortCode(area)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Titik Lokasi User (dot biru 14px + halo 26px + label "Saya") */}
        {userPt && (
          <View
            pointerEvents="none"
            style={[styles.userWrap, { left: userPt.x - 20, top: userPt.y - 13 }]}
          >
            <View style={styles.userPulse}>
              <View style={styles.userDot} />
            </View>
            <View style={styles.userPill}>
              <Text style={styles.userLabelText}>Saya</Text>
            </View>
          </View>
        )}

        {/* Badge Mode Preview Web */}
        <View
          style={[
            styles.webBadge,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="globe-outline" size={12} color={colors.primary} />
          <Text style={[styles.webBadgeText, { color: colors.textSecondary }]}>
            Mode Preview Web — Native Maps aktif di Android/iOS
          </Text>
        </View>

        {/* Kontrol overlay: Re-center, Zoom In, Zoom Out */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setCenterOnUser((prev) => !prev)}
            accessibilityLabel="Pusatkan peta ke lokasi saya"
          >
            <Ionicons
              name="locate"
              size={18}
              color={centerOnUser ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setZoomScale((z) => Math.min(z * 1.4, 4))}
            accessibilityLabel="Perbesar peta"
          >
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setZoomScale((z) => Math.max(z / 1.4, 0.45))}
            accessibilityLabel="Perkecil peta"
          >
            <Ionicons name="remove" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Kartu Detail Parkiran Terpilih di bawah peta */}
      {selectedArea && (
        <View
          style={[
            styles.detailCard,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleGroup}>
              <View
                style={[
                  styles.detailStatusDot,
                  { backgroundColor: getMarkerColor(selectedArea.status) },
                ]}
              />
              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>
                {selectedArea.name} ({getShortCode(selectedArea)})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedAreaId(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Tutup detail parkiran"
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {selectedArea.description ? (
            <Text style={[styles.detailDesc, { color: colors.textSecondary }]}>
              {selectedArea.description}
            </Text>
          ) : null}

          <View style={styles.detailMetaRow}>
            <Text style={[styles.detailMetaText, { color: colors.success }]}>
              Tersedia {selectedArea.available}/{selectedArea.capacity} slot ({selectedArea.status})
            </Text>
            {selectedDistanceMeters !== null && (
              <Text style={[styles.detailMetaText, { color: colors.primary }]}>
                • {selectedDistanceMeters} m {userLocation ? 'dari Anda' : 'dari pusat UMM III'}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    width: '100%',
    gap: 8,
  },
  wrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  geofenceCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  markerWrap: {
    position: 'absolute',
    width: 36,
    alignItems: 'center',
    zIndex: 2,
  },
  markerWrapSelected: {
    zIndex: 10,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerDotSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  markerPill: {
    marginTop: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  markerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userWrap: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
    zIndex: 5,
  },
  userPulse: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(37, 99, 235, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userPill: {
    marginTop: 2,
    backgroundColor: 'rgba(37, 99, 235, 0.92)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  userLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  webBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 12,
  },
  webBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 6,
    zIndex: 12,
  },
  ctrlBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  detailTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  detailStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  detailMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  detailMetaText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
