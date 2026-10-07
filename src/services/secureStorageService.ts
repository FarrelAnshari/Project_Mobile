/**
 * PARKIN — Smart Campus Parking
 * Service: Secure Storage (Expo SecureStore)
 *
 * Wrapper untuk expo-secure-store.
 * Digunakan HANYA untuk data sensitif seperti token autentikasi.
 *
 * JANGAN simpan password atau credential lain di sini.
 * JANGAN console.log token.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Keys yang digunakan di SecureStore
export const SECURE_KEYS = {
  SESSION: 'parkin_session',
  ACCESS_TOKEN: 'parkin_access_token',
} as const;

function getWebStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Simpan data sensitif ke SecureStore (dengan fallback localStorage pada platform Web).
 * @param key - Key dari SECURE_KEYS
 * @param value - String value
 */
export async function saveSecureData(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const storage = getWebStorage();
      if (storage) {
        storage.setItem(key, value);
      }
    } catch {
      console.warn('[SecureStore/Web] Gagal menyimpan key:', key);
    }
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    console.warn('[SecureStore] Gagal menyimpan key:', key);
  }
}

/**
 * Ambil data dari SecureStore (dengan fallback localStorage pada platform Web).
 * @param key - Key dari SECURE_KEYS
 * @returns string | null
 */
export async function getSecureData(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      const storage = getWebStorage();
      return storage ? storage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/**
 * Hapus data dari SecureStore (dengan fallback localStorage pada platform Web).
 * @param key - Key dari SECURE_KEYS
 */
export async function removeSecureData(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const storage = getWebStorage();
      if (storage) {
        storage.removeItem(key);
      }
    } catch {
      // ignore
    }
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

/**
 * Hapus semua data sensitif saat logout.
 */
export async function clearAllSecureData(): Promise<void> {
  await Promise.all(
    Object.values(SECURE_KEYS).map((key) => removeSecureData(key))
  );
}
