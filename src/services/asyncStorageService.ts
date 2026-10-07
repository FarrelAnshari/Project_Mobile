/**
 * PARKIN — Smart Campus Parking
 * Service: AsyncStorage
 *
 * Wrapper untuk @react-native-async-storage/async-storage.
 * Digunakan untuk data NON-SENSITIF:
 * - preferensi pengguna
 * - setting notifikasi
 * - riwayat parkir lokal
 * - parkir favorit
 * - data profile non-sensitif (nama, email)
 *
 * JANGAN simpan token, password, atau data sensitif di sini.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys yang digunakan di AsyncStorage
export const STORAGE_KEYS = {
  USER_PROFILE: 'parkin_user_profile',
  NOTIFICATION_SETTINGS: 'parkin_notification_settings',
  LAST_SELECTED_PARKING: 'parkin_last_selected_parking',
  PARKING_HISTORY: 'parkin_parking_history',
  FAVORITE_PARKING: 'parkin_favorite_parking',
  ONBOARDING_COMPLETED: 'parkin_onboarding_completed',
  ACCESSIBILITY_SETTINGS: 'parkin_accessibility_settings',
} as const;

/**
 * Simpan object JSON ke AsyncStorage
 */
export async function saveData<T>(key: string, value: T): Promise<void> {
  try {
    const json = JSON.stringify(value);
    await AsyncStorage.setItem(key, json);
  } catch (e) {
    console.warn('[AsyncStorage] Gagal menyimpan key:', key);
  }
}

/**
 * Ambil object dari AsyncStorage
 */
export async function getData<T>(key: string): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(key);
    if (json == null) return null;
    return JSON.parse(json) as T;
  } catch (e) {
    console.warn('[AsyncStorage] Gagal membaca key:', key);
    return null;
  }
}

/**
 * Hapus data dari AsyncStorage
 */
export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('[AsyncStorage] Gagal menghapus key:', key);
  }
}

/**
 * Simpan string ke AsyncStorage (untuk nilai sederhana)
 */
export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.warn('[AsyncStorage] Gagal menyimpan string key:', key);
  }
}

/**
 * Ambil string dari AsyncStorage
 */
export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn('[AsyncStorage] Gagal membaca string key:', key);
    return null;
  }
}
