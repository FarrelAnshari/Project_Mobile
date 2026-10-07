/**
 * PARKIN — Smart Campus Parking
 * Service: Secure Storage (Expo SecureStore)
 *
<<<<<<< HEAD
 * Digunakan KHUSUS untuk menyimpan data autentikasi sensitif:
 * - Access token
 * - Refresh token
 * - Sesi kredensial minimum
 *
 * KEAMANAN:
 * - Tidak mencatat token atau password ke console.
 * - Tidak menyimpan password plaintext.
 * - Dilengkapi fallback aman yang kompatibel dengan Web & Expo Go.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'parkin_sec_access_token',
  REFRESH_TOKEN: 'parkin_sec_refresh_token',
  USER_SESSION: 'parkin_sec_user_session',
} as const;

export interface StoredUserSession {
  id: string;
  name: string;
  email: string;
  nim: string;
  prodi: string;
  angkatan: string;
  role: 'mahasiswa' | 'tamu' | 'admin';
  lastLogin: string;
}

// Memory fallback untuk platform Web di mana SecureStore native tidak tersedia
const memoryFallback = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Menyimpan nilai ke SecureStore
 */
async function setSecureItem(key: string, value: string): Promise<boolean> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      // Fallback web: memory storage (tidak disimpan plaintext di localStorage agar lebih aman)
      memoryFallback.set(key, value);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Mengambil nilai dari SecureStore
 */
async function getSecureItem(key: string): Promise<string | null> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      return await SecureStore.getItemAsync(key);
    } else {
      return memoryFallback.get(key) ?? null;
    }
  } catch {
    return null;
=======
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
>>>>>>> 3f814b0 (Update 2)
  }
}

/**
<<<<<<< HEAD
 * Menghapus nilai dari SecureStore
 */
async function deleteSecureItem(key: string): Promise<boolean> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    } else {
      memoryFallback.delete(key);
    }
    return true;
  } catch {
    return false;
  }
}

// ======== API EXPORTS ========

/**
 * Generic Secure Storage functions (TASK 02)
 */
export async function saveSecureData(key: string, value: string): Promise<boolean> {
  return await setSecureItem(key, value);
}

export async function getSecureData(key: string): Promise<string | null> {
  return await getSecureItem(key);
}

export async function removeSecureData(key: string): Promise<boolean> {
  return await deleteSecureItem(key);
}

export async function saveAuthToken(token: string): Promise<boolean> {
  if (!token) return false;
  return await setSecureItem(KEYS.ACCESS_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return await getSecureItem(KEYS.ACCESS_TOKEN);
}

export async function deleteAuthToken(): Promise<boolean> {
  return await deleteSecureItem(KEYS.ACCESS_TOKEN);
}

export async function saveRefreshToken(token: string): Promise<boolean> {
  if (!token) return false;
  return await setSecureItem(KEYS.REFRESH_TOKEN, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return await getSecureItem(KEYS.REFRESH_TOKEN);
}

export async function deleteRefreshToken(): Promise<boolean> {
  return await deleteSecureItem(KEYS.REFRESH_TOKEN);
}

export async function saveUserSession(session: StoredUserSession): Promise<boolean> {
  try {
    const serialized = JSON.stringify(session);
    return await setSecureItem(KEYS.USER_SESSION, serialized);
  } catch {
    return false;
  }
}

export async function getUserSession(): Promise<StoredUserSession | null> {
  try {
    const raw = await getSecureItem(KEYS.USER_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUserSession;
=======
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
>>>>>>> 3f814b0 (Update 2)
  } catch {
    return null;
  }
}

<<<<<<< HEAD
export async function deleteUserSession(): Promise<boolean> {
  return await deleteSecureItem(KEYS.USER_SESSION);
}

/**
 * Menghapus seluruh sesi autentikasi dan token saat logout
 */
export async function clearAllSecureAuth(): Promise<boolean> {
  try {
    await Promise.all([
      deleteAuthToken(),
      deleteRefreshToken(),
      deleteUserSession(),
    ]);
    return true;
  } catch {
    return false;
  }
=======
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
>>>>>>> 3f814b0 (Update 2)
}
