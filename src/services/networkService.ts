/**
 * PARKIN — Smart Campus Parking
 * Service: Network Connectivity Service
 *
 * Mendeteksi status konektivitas jaringan secara cross-platform tanpa
 * bergantung pada expo-network (tidak tersedia di semua environment).
 *
 * - Web: navigator.onLine + window events
 * - Native: fetch-based ping + interval polling
 */

import { Platform } from 'react-native';

export interface NetworkStateInfo {
  isConnected: boolean;
  isInternetReachable: boolean;
  type?: string;
}

// In-memory cache status konektivitas terakhir
let lastKnownOnline = true;
const listeners = new Set<(isOnline: boolean) => void>();

/**
 * Deteksi online via fetch HEAD ke URL ringan.
 * Fallback-friendly: jika fetch diblokir CORS, kita optimistis.
 */
async function pingCheck(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

/**
 * Memeriksa apakah perangkat saat ini memiliki koneksi internet aktif.
 * Digunakan sebelum melakukan panggilan API untuk mencegah request yang pasti gagal.
 */
export async function isNetworkAvailable(): Promise<boolean> {
  try {
    // Platform Web: Gunakan Browser Navigator API
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
        lastKnownOnline = Boolean(navigator.onLine);
        return lastKnownOnline;
      }
      return true;
    }

    // Native: gunakan fetch ping sebagai pengganti expo-network
    const online = await pingCheck();
    lastKnownOnline = online;
    return online;
  } catch (err) {
    console.warn('[NetworkService] Gagal memeriksa status jaringan:', err);
    // Jika gagal mendeteksi, jangan blokir request (fallback optimistic)
    return lastKnownOnline;
  }
}

/**
 * Mendapatkan detail status jaringan lengkap
 */
export async function getNetworkDetails(): Promise<NetworkStateInfo> {
  try {
    if (Platform.OS === 'web') {
      const isOnline =
        typeof navigator !== 'undefined' && 'onLine' in navigator
          ? Boolean(navigator.onLine)
          : true;
      return {
        isConnected: isOnline,
        isInternetReachable: isOnline,
        type: 'web',
      };
    }

    const online = await pingCheck();
    return {
      isConnected: online,
      isInternetReachable: online,
      type: 'unknown',
    };
  } catch (err) {
    console.warn('[NetworkService] Gagal mendapatkan detail jaringan:', err);
    return {
      isConnected: lastKnownOnline,
      isInternetReachable: lastKnownOnline,
    };
  }
}

/**
 * Berlangganan perubahan status jaringan (online/offline)
 * Mengembalikan fungsi cleanup untuk unmount.
 */
export function subscribeNetworkChange(
  listener: (isOnline: boolean) => void
): () => void {
  listeners.add(listener);

  // Setup Web listeners
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const handleOnline = () => {
      lastKnownOnline = true;
      listeners.forEach((cb) => cb(true));
    };
    const handleOffline = () => {
      lastKnownOnline = false;
      listeners.forEach((cb) => cb(false));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // Native: polling interval setiap 5 detik
  let timerId: ReturnType<typeof setInterval> | null = null;
  timerId = setInterval(async () => {
    const online = await isNetworkAvailable();
    if (online !== lastKnownOnline) {
      lastKnownOnline = online;
      listeners.forEach((cb) => cb(online));
    }
  }, 5000);

  return () => {
    listeners.delete(listener);
    if (timerId) {
      clearInterval(timerId);
    }
  };
}

export const NetworkService = {
  isNetworkAvailable,
  getNetworkDetails,
  subscribeNetworkChange,
};

export default NetworkService;
