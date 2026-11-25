/**
 * PARKIN — Smart Campus Parking
 * Hook: useLocationService (Week 10 — Task 01, Task 03 & Battery Optimization)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useToast } from '../context/ToastContext';
import {
  AddressData,
  BatteryOptimizationConfig,
  GeofenceBannerEvent,
  GeofenceLogItem,
  GeofenceStatus,
  LocationData,
  PermissionStatusType,
} from '../types/location';
import {
  evaluateGeofence,
  formatPlacemarkAddress,
  PARKIN_CAMPUS_GEOFENCE,
} from '../utils/geofence';

const DEFAULT_BATTERY_CONFIG: BatteryOptimizationConfig = {
  accuracyMode: 'balanced',
  timeIntervalMs: 5000,
  distanceIntervalMeters: 10,
};

function mapExpoAccuracy(mode: BatteryOptimizationConfig['accuracyMode']): Location.Accuracy {
  return mode === 'high' ? Location.Accuracy.High : Location.Accuracy.Balanced;
}

function mapPermissionStatus(status: Location.PermissionStatus): PermissionStatusType {
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  if (status === Location.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

export function useLocationService() {
  const toast = useToast();

  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatusType>('undetermined');
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus>('unknown');
  const [distanceToZone, setDistanceToZone] = useState<number | null>(null);
  const [geofenceBanner, setGeofenceBanner] =
    useState<GeofenceBannerEvent | null>(null);
  const [geofenceLogs, setGeofenceLogs] = useState<GeofenceLogItem[]>([]);

  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [batteryConfig, setBatteryConfig] =
    useState<BatteryOptimizationConfig>(DEFAULT_BATTERY_CONFIG);

  const prevGeofenceStatusRef = useRef<GeofenceStatus>('unknown');
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isTrackingRef = useRef<boolean>(false);
  const batteryConfigRef = useRef<BatteryOptimizationConfig>(DEFAULT_BATTERY_CONFIG);

  useEffect(() => {
    batteryConfigRef.current = batteryConfig;
  }, [batteryConfig]);

  // Cek izin lokasi awal saat hook dipasang
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await Location.getForegroundPermissionsAsync();
        if (!mounted) return;
        setPermissionStatus(mapPermissionStatus(res.status));
        setCanAskAgain(res.canAskAgain);
      } catch (err) {
        console.warn('[PARKIN GPS] Gagal memeriksa izin lokasi awal:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      const mapped = mapPermissionStatus(res.status);
      setPermissionStatus(mapped);
      setCanAskAgain(res.canAskAgain);
      if (mapped !== 'granted') {
        setError(
          res.canAskAgain
            ? 'Izin lokasi belum diberikan. Izinkan akses lokasi agar PARKIN dapat membaca posisi GPS Anda.'
            : 'Izin lokasi ditolak permanen. Buka Pengaturan perangkat untuk mengaktifkan izin lokasi PARKIN.'
        );
        return false;
      }
      setError(null);
      return true;
    } catch {
      setError('Gagal meminta izin lokasi dari perangkat.');
      return false;
    }
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  /**
   * Task 03A — Reverse Geocoding dengan fallback aman jika offline / web.
   */
  const performReverseGeocode = useCallback(
    async (latitude: number, longitude: number, fallbackLabel?: string) => {
      setIsLoadingAddress(true);
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results && results.length > 0) {
          const formatted = formatPlacemarkAddress(results[0]);
          setAddress(formatted);
        } else {
          setAddress({
            formattedAddress:
              fallbackLabel ??
              `Alamat tidak dapat dimuat (Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
          });
        }
      } catch {
        setAddress({
          formattedAddress:
            fallbackLabel ??
            `Alamat tidak dapat dimuat (Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        });
      } finally {
        setIsLoadingAddress(false);
      }
    },
    []
  );

  /**
   * Task 03B — Evaluasi Geofencing + Anti-Spam Notifikasi (hanya saat status berubah).
   */
  const handleGeofenceCheck = useCallback(
    (latitude: number, longitude: number, isSimulated = false) => {
      const { inside, distanceMeters } = evaluateGeofence(
        latitude,
        longitude,
        PARKIN_CAMPUS_GEOFENCE
      );
      const nextStatus: GeofenceStatus = inside ? 'inside' : 'outside';
      const prevStatus = prevGeofenceStatusRef.current;

      setGeofenceStatus(nextStatus);
      setDistanceToZone(distanceMeters);

      if (nextStatus === 'inside' && prevStatus !== 'inside') {
        const now = Date.now();
        const message = 'Anda masuk Area Parkir Kampus PARKIN — Selamat datang!';
        prevGeofenceStatusRef.current = 'inside';

        setGeofenceBanner({
          type: 'ENTER',
          message,
          distanceMeters,
          timestamp: now,
          isSimulated,
        });
        toast.success(message, { title: 'Geofence Enter' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setGeofenceLogs((prev) =>
          [
            {
              id: `geo_${now}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'ENTER' as const,
              zoneName: PARKIN_CAMPUS_GEOFENCE.name,
              distanceMeters,
              timestamp: now,
              isSimulated,
            },
            ...prev,
          ].slice(0, 5)
        );
      } else if (nextStatus === 'outside' && prevStatus === 'inside') {
        const now = Date.now();
        const message = 'Anda keluar dari Area Parkir Kampus PARKIN.';
        prevGeofenceStatusRef.current = 'outside';

        setGeofenceBanner({
          type: 'EXIT',
          message,
          distanceMeters,
          timestamp: now,
          isSimulated,
        });
        toast.info(message, { title: 'Geofence Exit' });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setGeofenceLogs((prev) =>
          [
            {
              id: `geo_${now}_${Math.random().toString(36).slice(2, 6)}`,
              type: 'EXIT' as const,
              zoneName: PARKIN_CAMPUS_GEOFENCE.name,
              distanceMeters,
              timestamp: now,
              isSimulated,
            },
            ...prev,
          ].slice(0, 5)
        );
      } else {
        prevGeofenceStatusRef.current = nextStatus;
      }
    },
    [toast]
  );

  /**
   * Task 01 — Ambil lokasi GPS saat ini secara on-demand.
   */
  const fetchCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setError(null);

    try {
      let granted = permissionStatus === 'granted';
      if (!granted) {
        const perm = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(mapPermissionStatus(perm.status));
        setCanAskAgain(perm.canAskAgain);
        granted = perm.status === Location.PermissionStatus.GRANTED;
      }

      if (!granted) {
        granted = await requestPermission();
      }

      if (!granted) {
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: mapExpoAccuracy(batteryConfigRef.current.accuracyMode),
      });

      const nextLocation: LocationData = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
        altitude: pos.coords.altitude ?? null,
        timestamp: pos.timestamp || Date.now(),
      };

      console.log(
        `[PARKIN GPS] Lat: ${nextLocation.latitude.toFixed(6)}, Lng: ${nextLocation.longitude.toFixed(6)}, Accuracy: ±${nextLocation.accuracy?.toFixed(1) ?? '-'} m`
      );

      setLocation(nextLocation);
      handleGeofenceCheck(nextLocation.latitude, nextLocation.longitude, false);
      await performReverseGeocode(nextLocation.latitude, nextLocation.longitude);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? `Gagal membaca lokasi GPS (${err.message}). Pastikan layanan lokasi/GPS perangkat aktif.`
          : 'Gagal membaca lokasi GPS. Pastikan layanan lokasi/GPS perangkat aktif.';
      setError(msg);
      toast.error(msg, { title: 'GPS Tidak Tersedia' });
    } finally {
      setIsLoadingLocation(false);
    }
  }, [permissionStatus, requestPermission, handleGeofenceCheck, performReverseGeocode, toast]);

  /**
   * Simulasi masuk area kampus untuk demo dalam ruangan (Parkiran Utama UMM III).
   */
  const simulateEnterGeofence = useCallback(async () => {
    const simLat = -7.921462;
    const simLng = 112.596922;
    const simLoc: LocationData = {
      latitude: simLat,
      longitude: simLng,
      accuracy: 5,
      timestamp: Date.now(),
    };
    setError(null);
    setLocation(simLoc);
    console.log(
      `[PARKIN GPS Simulasi ENTER] Lat: ${simLat}, Lng: ${simLng}, Accuracy: ±5.0 m`
    );
    handleGeofenceCheck(simLat, simLng, true);
    await performReverseGeocode(
      simLat,
      simLng,
      'Parkiran Utama UMM Kampus III — Dekat Gerbang Utama & Helipad, Malang (Simulasi)'
    );
  }, [handleGeofenceCheck, performReverseGeocode]);

  /**
   * Simulasi keluar area kampus (~850m di luar radius) untuk demo dalam ruangan.
   */
  const simulateExitGeofence = useCallback(async () => {
    const simLat = -7.9282;
    const simLng = 112.6035;
    const simLoc: LocationData = {
      latitude: simLat,
      longitude: simLng,
      accuracy: 8,
      timestamp: Date.now(),
    };
    setError(null);
    setLocation(simLoc);
    console.log(
      `[PARKIN GPS Simulasi EXIT] Lat: ${simLat}, Lng: ${simLng}, Accuracy: ±8.0 m`
    );
    handleGeofenceCheck(simLat, simLng, true);
    await performReverseGeocode(
      simLat,
      simLng,
      'Di Luar Area Parkir Kampus UMM III (~850 m), Malang (Simulasi)'
    );
  }, [handleGeofenceCheck, performReverseGeocode]);

  /**
   * Hentikan subscription watchPositionAsync untuk hemat baterai.
   */
  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (isTrackingRef.current) {
      console.log('[PARKIN GPS] Pelacakan real-time dihentikan (hemat baterai).');
    }
    isTrackingRef.current = false;
    setIsTracking(false);
  }, []);

  /**
   * Mulai pelacakan foreground dengan konfigurasi optimasi baterai.
   */
  const startTracking = useCallback(
    async (configOverride?: BatteryOptimizationConfig) => {
      const activeConfig = configOverride ?? batteryConfigRef.current;

      let granted = permissionStatus === 'granted';
      if (!granted) {
        const perm = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(mapPermissionStatus(perm.status));
        setCanAskAgain(perm.canAskAgain);
        granted = perm.status === Location.PermissionStatus.GRANTED;
      }
      if (!granted) {
        granted = await requestPermission();
      }
      if (!granted) {
        setIsTracking(false);
        isTrackingRef.current = false;
        return;
      }

      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: mapExpoAccuracy(activeConfig.accuracyMode),
            timeInterval: activeConfig.timeIntervalMs,
            distanceInterval: activeConfig.distanceIntervalMeters,
          },
          (pos) => {
            const nextLoc: LocationData = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy ?? null,
              altitude: pos.coords.altitude ?? null,
              timestamp: pos.timestamp || Date.now(),
            };
            console.log(
              `[PARKIN GPS Watch] Lat: ${nextLoc.latitude.toFixed(6)}, Lng: ${nextLoc.longitude.toFixed(6)}, Accuracy: ±${nextLoc.accuracy?.toFixed(1) ?? '-'} m`
            );
            setLocation(nextLoc);
            setError(null);
            handleGeofenceCheck(nextLoc.latitude, nextLoc.longitude, false);
            performReverseGeocode(nextLoc.latitude, nextLoc.longitude);
          }
        );

        subscriptionRef.current = subscription;
        isTrackingRef.current = true;
        setIsTracking(true);
        setError(null);
      } catch (err: unknown) {
        stopTracking();
        const msg =
          err instanceof Error && err.message
            ? `Gagal memulai pelacakan GPS: ${err.message}`
            : 'Gagal memulai pelacakan GPS secara real-time.';
        setError(msg);
        toast.error(msg, { title: 'Pelacakan Gagal' });
      }
    },
    [
      permissionStatus,
      requestPermission,
      handleGeofenceCheck,
      performReverseGeocode,
      stopTracking,
      toast,
    ]
  );

  /**
   * Ubah konfigurasi optimasi baterai; restart listener bila tracking sedang aktif.
   */
  const updateBatteryConfig = useCallback(
    async (partial: Partial<BatteryOptimizationConfig>) => {
      const nextConfig: BatteryOptimizationConfig = {
        ...batteryConfigRef.current,
        ...partial,
      };
      batteryConfigRef.current = nextConfig;
      setBatteryConfig(nextConfig);

      if (isTrackingRef.current) {
        await startTracking(nextConfig);
      }
    },
    [startTracking]
  );

  // Wajib: Auto-cleanup saat unmount atau aplikasi masuk ke background (foreground-only tracking)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        (nextAppState === 'background' || nextAppState === 'inactive') &&
        isTrackingRef.current
      ) {
        stopTracking();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      appStateSub.remove();
      stopTracking();
    };
  }, [stopTracking]);

  const dismissBanner = useCallback(() => {
    setGeofenceBanner(null);
  }, []);

  return {
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
  };
}
