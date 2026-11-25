/**
 * PARKIN — Smart Campus Parking
 * Component: LocationMapView (Native iOS / Android via react-native-maps)
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ParkingArea } from '../models/parking';
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
  const { colors } = useTheme();
  const mapRef = useRef<MapView | null>(null);
  const regionRef = useRef<Region>({
    latitude: geofenceZone.latitude,
    longitude: geofenceZone.longitude,
    latitudeDelta: 0.009,
    longitudeDelta: 0.009,
  });

  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    const nextRegion: Region = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: regionRef.current.latitudeDelta,
      longitudeDelta: regionRef.current.longitudeDelta,
    };
    regionRef.current = nextRegion;
    mapRef.current.animateToRegion(nextRegion, 450);
  }, [userLocation]);

  const handleRecenter = () => {
    const targetLat = userLocation ? userLocation.latitude : geofenceZone.latitude;
    const targetLng = userLocation ? userLocation.longitude : geofenceZone.longitude;
    const nextRegion: Region = {
      latitude: targetLat,
      longitude: targetLng,
      latitudeDelta: 0.009,
      longitudeDelta: 0.009,
    };
    regionRef.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 400);
  };

  const handleZoom = (factor: number) => {
    const current = regionRef.current;
    const nextRegion: Region = {
      latitude: current.latitude,
      longitude: current.longitude,
      latitudeDelta: Math.min(Math.max(current.latitudeDelta * factor, 0.0015), 0.2),
      longitudeDelta: Math.min(Math.max(current.longitudeDelta * factor, 0.0015), 0.2),
    };
    regionRef.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 250);
  };

  const isInside = geofenceStatus === 'inside';
  const circleStroke = isInside ? 'rgba(34, 197, 94, 0.85)' : 'rgba(99, 102, 241, 0.85)';
  const circleFill = isInside ? 'rgba(34, 197, 94, 0.16)' : 'rgba(99, 102, 241, 0.14)';

  return (
    <View style={[styles.wrapper, { height, borderColor: colors.border }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={regionRef.current}
        onRegionChangeComplete={(reg) => {
          regionRef.current = reg;
        }}
        showsUserLocation={false}
        showsCompass={true}
      >
        <Circle
          center={{
            latitude: geofenceZone.latitude,
            longitude: geofenceZone.longitude,
          }}
          radius={geofenceZone.radiusMeters}
          strokeWidth={2}
          strokeColor={circleStroke}
          fillColor={circleFill}
        />

        {parkingAreas.map((area) => {
          if (!area.geo) return null;
          const markerColor = getMarkerColor(area.status);
          return (
            <Marker
              key={area.id}
              coordinate={{
                latitude: area.geo.latitude,
                longitude: area.geo.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              title={area.name}
              description={`${area.description ? `${area.description} • ` : ''}Tersedia ${area.available}/${area.capacity} slot (${area.status})`}
              onPress={() => onSelectParkingArea?.(area)}
            >
              <View style={styles.customMarkerWrap}>
                <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
                <View style={styles.markerPill}>
                  <Text style={styles.markerPillText}>{getShortCode(area)}</Text>
                </View>
              </View>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            title="Lokasi Saya"
            description={`Lat ${userLocation.latitude.toFixed(5)}, Lng ${userLocation.longitude.toFixed(5)}`}
          >
            <View style={styles.userMarkerWrap}>
              <View style={styles.userHalo}>
                <View style={styles.userDot} />
              </View>
              <View style={styles.userPill}>
                <Text style={styles.userPillText}>Saya</Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Kontrol overlay pojok kanan bawah: Re-center, Zoom In, Zoom Out */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.ctrlBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={handleRecenter}
          accessibilityLabel="Pusatkan peta ke lokasi saya"
        >
          <Ionicons name="locate" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.ctrlBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => handleZoom(0.6)}
          accessibilityLabel="Perbesar peta"
        >
          <Ionicons name="add" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.ctrlBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => handleZoom(1.6)}
          accessibilityLabel="Perkecil peta"
        >
          <Ionicons name="remove" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  customMarkerWrap: {
    alignItems: 'center',
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerPill: {
    marginTop: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  markerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userMarkerWrap: {
    alignItems: 'center',
  },
  userHalo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
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
  userPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  controls: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 6,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
});
