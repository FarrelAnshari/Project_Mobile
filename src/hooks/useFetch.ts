/**
 * PARKIN — Smart Campus Parking
 * Hook: useFetch
 *
 * Custom hook untuk data fetching yang terstruktur rapi:
 * - Mengelola siklus UI State secara otomatis:
 *   - Loading State (`isLoading`, `isRefetching`)
 *   - Error State (`isError`, `error`, `errorMessage`)
 *   - Success State (`isSuccess`, `data`)
 * - Fitur Retry (`refetch`) untuk pull-to-refresh atau tombol coba lagi
 * - Aman terhadap memory leak (tidak mengupdate state jika komponen telah unmount)
 * - Ekstraksi pesan error yang ramah pengguna
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../services/apiClient';
import { ParkingApiError } from '../services/parkingApi';

export interface UseFetchOptions<T> {
  /** Data awal sebelum fetch selesai (opsional) */
  initialData?: T;
  /** Apakah fetch langsung dijalankan saat mount (default: true) */
  enabled?: boolean;
  /** Jumlah percobaan retry otomatis saat gagal sebelum melempar error (default: 0) */
  retryCount?: number;
  /** Jeda waktu retry dalam ms (default: 1000) */
  retryDelayMs?: number;
  /** Callback saat fetch berhasil */
  onSuccess?: (data: T) => void;
  /** Callback saat fetch gagal */
  onError?: (error: Error) => void;
}

export interface UseFetchResult<T> {
  /** Data hasil response */
  data: T | undefined;
  /** True saat pertama kali memuat data (belum ada data di cache/state) -> tampilkan Skeleton */
  isLoading: boolean;
  /** True saat background refresh / pull-to-refresh (data lama tetap tampil) */
  isRefetching: boolean;
  /** True jika terjadi error */
  isError: boolean;
  /** True jika fetch berhasil dan data tersedia */
  isSuccess: boolean;
  /** Object error asli */
  error: Error | null;
  /** String pesan error ramah pengguna yang siap ditampilkan di UI */
  errorMessage: string | null;
  /** Fungsi untuk memicu pengambilan data ulang (Retry / Refresh) */
  refetch: (isManualRefresh?: boolean) => Promise<T | null>;
  /** Fungsi untuk memperbarui state data secara manual (optimistic update) */
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
  /** Helper mutate state */
  mutate: (newData: T | ((prev: T | undefined) => T)) => void;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof ParkingApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  return 'Gagal memuat data dari server. Silakan coba beberapa saat lagi.';
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    initialData,
    enabled = true,
    retryCount = 0,
    retryDelayMs = 1000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && initialData === undefined);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simpan referensi fetchFn dan callbacks agar tidak memicu re-render tak perlu
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Lacak status mount komponen
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Simpan data dalam ref agar executeFetch tidak berubah referensi saat data diperbarui
  const dataRef = useRef<T | undefined>(data);
  dataRef.current = data;

  const executeFetch = useCallback(
    async (isManualRefresh = false): Promise<T | null> => {
      // Jika data sudah ada, tandai isRefetching (agar skeleton tidak berkedip ulang)
      // Jika belum ada data sama sekali, tandai isLoading (tampilkan Skeleton)
      if (dataRef.current !== undefined || isManualRefresh) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setErrorMessage(null);

      let attempts = 0;
      const maxAttempts = 1 + (retryCount > 0 ? retryCount : 0);

      while (attempts < maxAttempts) {
        try {
          const result = await fetchFnRef.current();

          if (!isMountedRef.current) return null;

          setData(result);
          setError(null);
          setErrorMessage(null);
          setIsLoading(false);
          setIsRefetching(false);

          onSuccessRef.current?.(result);
          return result;
        } catch (err: any) {
          attempts += 1;

          if (attempts < maxAttempts) {
            // Tunggu delay sebelum percobaan berikutnya
            await new Promise((res) => setTimeout(res, retryDelayMs));
            continue;
          }

          if (!isMountedRef.current) return null;

          const standardError = err instanceof Error ? err : new Error(String(err));
          const friendlyMsg = extractErrorMessage(err);

          setError(standardError);
          setErrorMessage(friendlyMsg);
          setIsLoading(false);
          setIsRefetching(false);

          onErrorRef.current?.(standardError);
          return null;
        }
      }

      return null;
    },
    [retryCount, retryDelayMs]
  );

  // Jalankan fetch saat mount jika enabled
  useEffect(() => {
    if (enabled) {
      executeFetch(false);
    }
  }, [enabled, executeFetch]);

  const mutate = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setData((prev) => (typeof updater === 'function' ? (updater as any)(prev) : updater));
  }, []);

  return {
    data,
    isLoading,
    isRefetching,
    isError: error !== null,
    isSuccess: error === null && data !== undefined,
    error,
    errorMessage,
    refetch: (isManualRefresh = true) => executeFetch(isManualRefresh),
    setData,
    mutate,
  };
}

export default useFetch;
