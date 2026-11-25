/**
 * PARKIN — Smart Campus Parking
 * Utils: Geofence, Distance (Haversine), Accuracy & Address Formatter (Week 10)
 */

import type { LocationGeocodedAddress } from 'expo-location';
import { ParkingArea } from '../models/parking';
import { AddressData, GeofenceZone } from '../types/location';

export const PARKIN_CAMPUS_GEOFENCE: GeofenceZone = {
  id: 'parkin-campus-main',
  name: 'Area Parkir Kampus UMM III',
  description: 'Zona geofence utama area parkir kampus UMM III',
  latitude: -7.921757,
  longitude: 112.598508,
  radiusMeters: 500,
};

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Menghitung jarak antara dua koordinat GPS dalam meter menggunakan rumus Haversine.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Mengevaluasi apakah posisi pengguna berada di dalam radius zona geofence.
 */
export function evaluateGeofence(
  userLat: number,
  userLng: number,
  zone: GeofenceZone
): { inside: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceMeters(
    userLat,
    userLng,
    zone.latitude,
    zone.longitude
  );
  return {
    inside: distanceMeters <= zone.radiusMeters,
    distanceMeters,
  };
}

/**
 * Mencari area parkir PARKIN terdekat dari koordinat pengguna.
 */
export function findNearestParkingArea(
  userLat: number,
  userLng: number,
  areas: ParkingArea[]
): { area: ParkingArea; distanceMeters: number } | null {
  let nearest: { area: ParkingArea; distanceMeters: number } | null = null;

  for (const area of areas) {
    if (!area.geo) continue;
    const distanceMeters = calculateDistanceMeters(
      userLat,
      userLng,
      area.geo.latitude,
      area.geo.longitude
    );
    if (!nearest || distanceMeters < nearest.distanceMeters) {
      nearest = { area, distanceMeters };
    }
  }

  return nearest;
}

/**
 * Mengembalikan label & warna status kualitas akurasi GPS.
 */
export function getAccuracyMeta(accuracy: number | null): {
  label: string;
  color: string;
} {
  if (accuracy === null || Number.isNaN(accuracy)) {
    return { label: 'Tidak Diketahui', color: '#64748B' };
  }
  if (accuracy <= 20) {
    return { label: 'Tinggi', color: '#22C55E' };
  }
  if (accuracy <= 100) {
    return { label: 'Sedang', color: '#F59E0B' };
  }
  return { label: 'Rendah', color: '#EF4444' };
}

/**
 * Merangkai hasil reverseGeocodeAsync menjadi alamat rapi tanpa koma kosong.
 */
export function formatPlacemarkAddress(
  placemark: LocationGeocodedAddress
): AddressData {
  const streetPart = [placemark.street, placemark.streetNumber]
    .filter((v): v is string => Boolean(v && v.trim()))
    .join(' ')
    .trim();
  const primaryStreet = streetPart || placemark.name?.trim() || undefined;
  const district =
    placemark.district?.trim() || placemark.subregion?.trim() || undefined;
  const city = placemark.city?.trim() || undefined;
  const region = placemark.region?.trim() || undefined;
  const postalCode = placemark.postalCode?.trim() || undefined;

  const parts = [primaryStreet, district, city, region, postalCode].filter(
    (part): part is string => Boolean(part)
  );

  // Deduplikasi berurutan apabila name/street/district bernilai sama
  const uniqueParts: string[] = [];
  for (const part of parts) {
    if (!uniqueParts.includes(part)) {
      uniqueParts.push(part);
    }
  }

  return {
    formattedAddress:
      uniqueParts.length > 0
        ? uniqueParts.join(', ')
        : 'Alamat tidak tersedia untuk koordinat ini',
    street: primaryStreet,
    district,
    city,
    region,
    postalCode,
  };
}
