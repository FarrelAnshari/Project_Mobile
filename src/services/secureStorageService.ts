/**
 * PARKIN — Smart Campus Parking
 * Service: Secure Storage (Expo SecureStore)
 *
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
  }
}

/**
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
  } catch {
    return null;
  }
}

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
}
