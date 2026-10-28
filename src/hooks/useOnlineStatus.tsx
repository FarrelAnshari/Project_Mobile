/**
 * PARKIN — Smart Campus Parking
 * Hook: useOnlineStatus
 *
 * Custom hook untuk mendeteksi status konektivitas internet secara real-time.
 * Menggunakan event listener window.addEventListener('online') dan window.addEventListener('offline').
 *
 * Fitur:
 * - isOnline: boolean — true jika ada koneksi internet
 * - isOffline: boolean — true jika koneksi terputus
 * - wasOffline: boolean — true jika sebelumnya pernah offline dan baru saja terhubung kembali
 * - reconnectedAt: Date | null — waktu saat koneksi pulih
 * - offlineSince: Date | null — waktu saat koneksi terputus
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

export interface OnlineStatusContextValue {
  /** True jika terhubung ke internet */
  isOnline: boolean;
  /** True jika offline / koneksi terputus */
  isOffline: boolean;
  /** True jika baru saja kembali online dari keadaan offline */
  wasOffline: boolean;
  /** Timestamp saat offline terjadi */
  offlineSince: Date | null;
  /** Timestamp saat koneksi pulih kembali */
  reconnectedAt: Date | null;
  /** Reset flag wasOffline setelah animasi selesai */
  clearWasOffline: () => void;
}

const OnlineStatusContext = createContext<OnlineStatusContextValue | null>(null);

function getInitialOnlineStatus(): boolean {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

export function useOnlineStatusInternal(): OnlineStatusContextValue {
  const [isOnline, setIsOnline] = useState<boolean>(getInitialOnlineStatus);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const [reconnectedAt, setReconnectedAt] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setReconnectedAt(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineSince(new Date());
    };

    // Pasang event listener 'online' dan 'offline' pada window hanya untuk Web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Inisialisasi ulang dengan status window/navigator terkini
      if (typeof window.navigator !== 'undefined' && typeof window.navigator.onLine === 'boolean') {
        setIsOnline(window.navigator.onLine);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const clearWasOffline = React.useCallback(() => {
    setWasOffline(false);
  }, []);

  return React.useMemo(
    () => ({
      isOnline,
      isOffline: !isOnline,
      wasOffline,
      offlineSince,
      reconnectedAt,
      clearWasOffline,
    }),
    [isOnline, wasOffline, offlineSince, reconnectedAt, clearWasOffline]
  );
}

/**
 * Provider untuk membagikan status koneksi internet ke seluruh hierarki aplikasi
 */
export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const status = useOnlineStatusInternal();
  return (
    <OnlineStatusContext.Provider value={status}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

const DEFAULT_ONLINE_STATUS: OnlineStatusContextValue = {
  isOnline: true,
  isOffline: false,
  wasOffline: false,
  offlineSince: null,
  reconnectedAt: null,
  clearWasOffline: () => {},
};

/**
 * Custom hook untuk digunakan di dalam komponen React
 */
export function useOnlineStatus(): OnlineStatusContextValue {
  const context = useContext(OnlineStatusContext);
  return context ?? DEFAULT_ONLINE_STATUS;
}

export default useOnlineStatus;
