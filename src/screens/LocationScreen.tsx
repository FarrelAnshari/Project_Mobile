/**
 * PARKIN — Smart Campus Parking
 * Screen: LocationScreen (GPS, Maps, Geofencing & Battery Optimization)
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LocationMapView from '../components/LocationMapView';
import { useTheme } from '../context/ThemeContext';
import { parkingAreas } from '../data/parkingData';
import { useLocationService } from '../hooks/useLocationService';
import { AccuracyMode, PermissionStatusType } from '../types/location';
import {
  findNearestParkingArea,
  getAccuracyMeta,
  PARKIN_CAMPUS_GEOFENCE,
} from '../utils/geofence';

const INTERVAL_OPTIONS = [
  { label: '3 dtk', value: 3000 },
  { label: '5 dtk', value: 5000 },
  { label: '10 dtk', value: 10000 },
];

const DISTANCE_OPTIONS = [
  { label: '5 m', value: 5 },
  { label: '10 m', value: 10 },
  { label: '25 m', value: 25 },
];

function formatClock(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
}

function getPermissionBadge(status: PermissionStatusType): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case 'granted':
      return { label: 'Diizinkan', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.16)' };
    case 'denied':
      return { label: 'Ditolak', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
    default:
      return { label: 'Belum Diminta', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' };
  }
}

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const {
    permissionStatus,
    canAskAgain,
    location,
    address,
    isLoadingLocation,
    isLoadingAddress,
    error,
    geofenceStatus,
    distanceToZone,
    geofenceBanner,
    geofenceLogs,
    isTracking,
    batteryConfig,
    requestPermission,
    openSettings,
    fetchCurrentLocation,
    simulateEnterGeofence,
    simulateExitGeofence,
    startTracking,
    stopTracking,
    updateBatteryConfig,
    dismissBanner,
  } = useLocationService();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const permBadge = getPermissionBadge(permissionStatus);
  const accuracyMeta = getAccuracyMeta(location?.accuracy ?? null);

  const nearestParking = useMemo(() => {
    if (!location) return null;
    return findNearestParkingArea(
      location.latitude,
      location.longitude,
      parkingAreas
    );
  }, [location]);

  const cardBg = colors.surface;
  const cardBorder = colors.border;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={handleBack}
          accessibilityLabel="Kembali"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Lokasi & Peta PARKIN
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            GPS, Peta Kampus & Geofencing
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Notifikasi Geofence (Kondisional) */}
        {geofenceBanner && (
          <View
            style={[
              styles.bannerCard,
              {
                backgroundColor:
                  geofenceBanner.type === 'ENTER' ? colors.successBg : colors.infoBg,
                borderColor:
                  geofenceBanner.type === 'ENTER' ? colors.success : colors.info,
              },
            ]}
          >
            <Ionicons
              name={geofenceBanner.type === 'ENTER' ? 'notifications' : 'log-out-outline'}
              size={20}
              color={geofenceBanner.type === 'ENTER' ? colors.success : colors.info}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                {geofenceBanner.message}
              </Text>
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                Jarak dari pusat zona: {geofenceBanner.distanceMeters} m
                {geofenceBanner.isSimulated ? ' • Mode Simulasi' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={dismissBanner}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Tutup banner notifikasi"
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* KARTU LOKASI SAAT INI (GPS & PERMISSION)                     */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="navigate-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Lokasi Saat Ini
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Koordinat GPS & Izin Lokasi
                </Text>
              </View>
            </View>

            <View style={[styles.badge, { backgroundColor: permBadge.bg }]}>
              <View style={[styles.dot, { backgroundColor: permBadge.color }]} />
              <Text style={[styles.badgeText, { color: permBadge.color }]}>
                {permBadge.label}
              </Text>
            </View>
          </View>

          {/* Aksi Izin jika belum granted */}
          {permissionStatus !== 'granted' && (
            <View
              style={[
                styles.permPromptBox,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
                },
              ]}
            >
              <Text style={[styles.permPromptText, { color: colors.textSecondary }]}>
                {permissionStatus === 'denied' && !canAskAgain
                  ? 'Izin lokasi ditolak permanen. Buka Pengaturan perangkat untuk mengaktifkannya.'
                  : 'PARKIN memerlukan izin lokasi foreground untuk membaca posisi GPS kampus.'}
              </Text>
              {permissionStatus === 'denied' && !canAskAgain ? (
                <TouchableOpacity
                  style={[styles.permBtn, { backgroundColor: colors.warning }]}
                  onPress={openSettings}
                >
                  <Ionicons name="settings-outline" size={14} color="#fff" />
                  <Text style={styles.permBtnText}>Buka Pengaturan</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.permBtn, { backgroundColor: colors.primary }]}
                  onPress={requestPermission}
                >
                  <Ionicons name="shield-checkmark-outline" size={14} color="#fff" />
                  <Text style={styles.permBtnText}>Minta Izin Lokasi</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Grid Koordinat */}
          <View style={styles.coordGrid}>
            <View
              style={[
                styles.coordBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>Latitude</Text>
              <Text style={[styles.coordValue, { color: colors.textPrimary }]}>
                {location ? location.latitude.toFixed(6) : '—'}
              </Text>
            </View>
            <View
              style={[
                styles.coordBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>Longitude</Text>
              <Text style={[styles.coordValue, { color: colors.textPrimary }]}>
                {location ? location.longitude.toFixed(6) : '—'}
              </Text>
            </View>
          </View>

          {/* Accuracy & Waktu Update */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Akurasi:</Text>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                {location && location.accuracy !== null
                  ? `±${location.accuracy.toFixed(1)} m`
                  : '—'}
              </Text>
              <View
                style={[
                  styles.smallBadge,
                  { backgroundColor: accuracyMeta.color + '22' },
                ]}
              >
                <Text style={[styles.smallBadgeText, { color: accuracyMeta.color }]}>
                  {accuracyMeta.label}
                </Text>
              </View>
            </View>
            <Text style={[styles.metaTime, { color: colors.textTertiary }]}>
              {location ? `Update: ${formatClock(location.timestamp)}` : 'Belum diambil'}
            </Text>
          </View>

          {/* Error Box */}
          {error && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.dangerBg, borderColor: colors.danger },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          {/* Tombol Utama: Ambil Lokasi */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: isLoadingLocation ? 0.75 : 1 },
            ]}
            onPress={fetchCurrentLocation}
            disabled={isLoadingLocation}
            accessibilityLabel="Ambil lokasi GPS saat ini"
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="locate" size={18} color="#fff" />
            )}
            <Text style={styles.primaryBtnText}>
              {isLoadingLocation ? 'Mengambil Lokasi…' : 'Ambil Lokasi'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================ */}
        {/* KARTU PETA LOKASI PARKIN                                     */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="map-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Peta Lokasi PARKIN
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Posisi Pengguna, Parkiran 1–5 & Zona Kampus
                </Text>
              </View>
            </View>
          </View>

          <LocationMapView
            userLocation={location}
            parkingAreas={parkingAreas}
            geofenceZone={PARKIN_CAMPUS_GEOFENCE}
            geofenceStatus={geofenceStatus}
            height={300}
          />

          {/* Chip Info Koordinat Ringkas & Parkiran Terdekat */}
          <View
            style={[
              styles.mapSummaryBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryRow}>
              <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
                {location
                  ? `Lokasi Saya: Lat ${location.latitude.toFixed(5)}, Lng ${location.longitude.toFixed(5)}`
                  : 'Lokasi Saya: Tekan "Ambil Lokasi" atau tombol Simulasi'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="car-sport-outline" size={16} color={colors.primary} />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {nearestParking
                  ? `Terdekat: ${nearestParking.area.name} (${nearestParking.distanceMeters} m • Tersedia ${nearestParking.area.available} slot)`
                  : 'Parkiran terdekat akan dihitung setelah posisi tersedia'}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* KARTU ALAMAT SAAT INI (REVERSE GEOCODING)                    */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Alamat Saat Ini
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Detail Alamat Lokasi Terkini
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.addressBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            {isLoadingAddress ? (
              <View style={styles.addressLoadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.addressLoadingText, { color: colors.textSecondary }]}>
                  Menerjemahkan koordinat ke alamat…
                </Text>
              </View>
            ) : (
              <View style={styles.addressContentRow}>
                <Ionicons name="pin" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[styles.addressText, { color: colors.textPrimary }]}>
                  {address
                    ? address.formattedAddress
                    : 'Belum ada alamat. Ambil lokasi GPS atau jalankan simulasi demo.'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ============================================================ */}
        {/* KARTU GEOFENCING AREA PARKIR KAMPUS                          */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="radio-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Geofencing Area Kampus
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Deteksi Masuk & Keluar Zona Parkir
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    geofenceStatus === 'inside'
                      ? 'rgba(34, 197, 94, 0.16)'
                      : 'rgba(245, 158, 11, 0.16)',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: geofenceStatus === 'inside' ? '#22C55E' : '#F59E0B',
                  },
                ]}
              >
                {geofenceStatus === 'inside'
                  ? 'Dalam Area Geofence ✓'
                  : geofenceStatus === 'outside'
                  ? 'Di Luar Area Geofence'
                  : 'Belum Terdeteksi'}
              </Text>
            </View>
          </View>

          {/* Detail Zona */}
          <View
            style={[
              styles.zoneInfoBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={styles.zoneInfoRow}>
              <Text style={[styles.zoneLabel, { color: colors.textSecondary }]}>Zona Target</Text>
              <Text style={[styles.zoneVal, { color: colors.textPrimary }]}>
                {PARKIN_CAMPUS_GEOFENCE.name}
              </Text>
            </View>
            <View style={styles.zoneInfoRow}>
              <Text style={[styles.zoneLabel, { color: colors.textSecondary }]}>Radius Zona</Text>
              <Text style={[styles.zoneVal, { color: colors.textPrimary }]}>
                {PARKIN_CAMPUS_GEOFENCE.radiusMeters} m
              </Text>
            </View>
            <View style={styles.zoneInfoRow}>
              <Text style={[styles.zoneLabel, { color: colors.textSecondary }]}>Jarak Saat Ini</Text>
              <Text style={[styles.zoneVal, { color: colors.primary }]}>
                {distanceToZone !== null ? `${distanceToZone} m` : '—'}
              </Text>
            </View>
          </View>

          {/* Tombol Simulasi Demo Dalam Ruangan */}
          <Text style={[styles.demoSectionLabel, { color: colors.textSecondary }]}>
            Simulasi Demo Geofence (Dalam Ruangan):
          </Text>
          <View style={styles.simBtnRow}>
            <TouchableOpacity
              style={[
                styles.simBtn,
                { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '55' },
              ]}
              onPress={simulateEnterGeofence}
            >
              <Ionicons name="enter-outline" size={16} color={colors.primary} />
              <Text style={[styles.simBtnText, { color: colors.primary }]}>
                Simulasi Masuk Area
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.simBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={simulateExitGeofence}
            >
              <Ionicons name="exit-outline" size={16} color={colors.textPrimary} />
              <Text style={[styles.simBtnText, { color: colors.textPrimary }]}>
                Simulasi Keluar Area
              </Text>
            </TouchableOpacity>
          </View>

          {/* Riwayat Log Event Enter/Exit */}
          <Text style={[styles.demoSectionLabel, { color: colors.textSecondary, marginTop: 6 }]}>
            Riwayat Event Terakhir (Maks. 5):
          </Text>
          {geofenceLogs.length === 0 ? (
            <Text style={[styles.emptyLogText, { color: colors.textTertiary }]}>
              Belum ada perpindahan status Enter/Exit.
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              {geofenceLogs.map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.logRow,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.logTypePill,
                      {
                        backgroundColor:
                          log.type === 'ENTER' ? '#22C55E22' : '#38BDF822',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.logTypeText,
                        { color: log.type === 'ENTER' ? '#22C55E' : '#38BDF8' },
                      ]}
                    >
                      {log.type}
                    </Text>
                  </View>
                  <Text
                    style={[styles.logDesc, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {log.zoneName} ({log.distanceMeters} m)
                    {log.isSimulated ? ' [Simulasi]' : ''}
                  </Text>
                  <Text style={[styles.logTime, { color: colors.textTertiary }]}>
                    {formatClock(log.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* KARTU OPTIMASI BATERAI (BATTERY OPTIMIZATION)                */}
        {/* ============================================================ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="battery-charging-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Optimasi Baterai
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Kontrol Interval, Akurasi & Efisiensi GPS
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isTracking
                    ? 'rgba(34, 197, 94, 0.16)'
                    : 'rgba(100, 116, 139, 0.18)',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isTracking ? '#22C55E' : colors.textSecondary },
                ]}
              >
                {isTracking ? 'Subscription Aktif' : 'Subscription Dihentikan'}
              </Text>
            </View>
          </View>

          {/* Toggle Foreground Real-Time Tracking */}
          <View
            style={[
              styles.switchRow,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>
                Pelacakan Real-Time (Foreground)
              </Text>
              <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
                Gunakan watchPositionAsync hanya saat layar aktif
              </Text>
            </View>
            <Switch
              value={isTracking}
              onValueChange={(val) => {
                if (val) startTracking();
                else stopTracking();
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Pilihan Mode Akurasi */}
          <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>
            Mode Akurasi GPS:
          </Text>
          <View style={styles.optionRow}>
            {(
              [
                { key: 'balanced', label: 'Hemat (Balanced)' },
                { key: 'high', label: 'Tinggi (High)' },
              ] as { key: AccuracyMode; label: string }[]
            ).map((opt) => {
              const active = batteryConfig.accuracyMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => updateBatteryConfig({ accuracyMode: opt.key })}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      { color: active ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pilihan Interval Update */}
          <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>
            Interval Update (timeInterval):
          </Text>
          <View style={styles.optionRow}>
            {INTERVAL_OPTIONS.map((opt) => {
              const active = batteryConfig.timeIntervalMs === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => updateBatteryConfig({ timeIntervalMs: opt.value })}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      { color: active ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pilihan Jarak Minimum */}
          <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>
            Jarak Minimum (distanceInterval):
          </Text>
          <View style={styles.optionRow}>
            {DISTANCE_OPTIONS.map((opt) => {
              const active = batteryConfig.distanceIntervalMeters === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => updateBatteryConfig({ distanceIntervalMeters: opt.value })}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      { color: active ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ringkasan Praktik Efisiensi Baterai */}
          <View
            style={[
              styles.tipsBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>
              Praktik Efisiensi Baterai Aktif:
            </Text>
            <Text style={[styles.tipsItem, { color: colors.textSecondary }]}>
              • Foreground-only tracking (otomatis berhenti saat app ke background)
            </Text>
            <Text style={[styles.tipsItem, { color: colors.textSecondary }]}>
              • Interval terkontrol ({batteryConfig.timeIntervalMs / 1000} dtk) & distance-based ({batteryConfig.distanceIntervalMeters} m)
            </Text>
            <Text style={[styles.tipsItem, { color: colors.textSecondary }]}>
              • Auto-cleanup subscription saat halaman ditutup / unmount
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  permPromptBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  permPromptText: {
    fontSize: 12,
    lineHeight: 17,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  permBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  coordGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  coordBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  smallBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  smallBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaTime: {
    fontSize: 11,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  mapSummaryBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  addressBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  addressLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressLoadingText: {
    fontSize: 12,
  },
  addressContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  zoneInfoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  zoneInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  zoneLabel: {
    fontSize: 12,
  },
  zoneVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  simBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    gap: 6,
  },
  simBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyLogText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  logTypePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  logTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  logDesc: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
  },
  logTime: {
    fontSize: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipsBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipsItem: {
    fontSize: 11,
    lineHeight: 16,
  },
});
