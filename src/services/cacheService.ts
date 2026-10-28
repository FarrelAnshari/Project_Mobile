/**
 * PARKIN — Smart Campus Parking
 * Service: Cache Service (Offline-First Storage)
 *
 * Mengelola cache data API ke localStorage (Web) dan AsyncStorage (Mobile).
 * Memastikan pengalaman Offline-First: pengguna tetap dapat melihat data parkir terakhir
 * meskipun koneksi internet terputus.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const CACHE_KEYS = {
  PARKING_AREAS: 'parkin_cached_parking_areas',
  LAST_FETCH_TIME: 'parkin_cached_last_fetch_time',
  CAMPUS_STATS: 'parkin_cached_campus_stats',
} as const;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  formattedTime: string;
}

/**
 * Format timestamp menjadi string terbaca
 */
function getFormattedTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Simpan data response API ke localStorage dan AsyncStorage
 */
export async function cacheApiResponse<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    formattedTime: getFormattedTimestamp(),
  };
  const jsonString = JSON.stringify(entry);

  try {
    // 1. Simpan ke window.localStorage jika berjalan di browser/web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, jsonString);
    }
  } catch (err) {
    console.warn('[CacheService] Gagal menulis ke localStorage:', err);
  }

  try {
    // 2. Simpan juga ke AsyncStorage (mendukung React Native Web & Mobile)
    await AsyncStorage.setItem(key, jsonString);
  } catch (err) {
    console.warn('[CacheService] Gagal menulis ke AsyncStorage:', err);
  }
}

/**
 * Ambil data response API dari localStorage atau AsyncStorage
 */
export async function getCachedApiResponse<T>(
  key: string
): Promise<CacheEntry<T> | null> {
  let rawJson: string | null = null;

  try {
    // 1. Coba baca dari window.localStorage terlebih dahulu (Web)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      rawJson = window.localStorage.getItem(key);
    }
  } catch (err) {
    console.warn('[CacheService] Gagal membaca dari localStorage:', err);
  }

  // 2. Fallback ke AsyncStorage jika localStorage kosong atau di native
  if (!rawJson) {
    try {
      rawJson = await AsyncStorage.getItem(key);
    } catch (err) {
      console.warn('[CacheService] Gagal membaca dari AsyncStorage:', err);
    }
  }

  if (!rawJson) return null;

  try {
    return JSON.parse(rawJson) as CacheEntry<T>;
  } catch {
    return null;
  }
}

/**
 * Hapus data cache tertentu
 */
export async function removeCachedApiResponse(key: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export default {
  cacheApiResponse,
  getCachedApiResponse,
  removeCachedApiResponse,
  CACHE_KEYS,
};
