/**
 * PARKIN — Smart Campus Parking
 * Service: API Client Utility (Task 02 — Attach Token to API Request)
 *
 * Mengelola HTTP Request terpusat ke backend REST API:
 * 1. Mengambil token dari SecureStore (SecureStore.getItemAsync('access_token'))
 * 2. Menyertakan header:
 *    - Authorization: Bearer <token>
 *    - Content-Type: application/json
 *    - Accept: application/json
 * 3. Menangani timeout, network error, dan status HTTP (termasuk 401 Unauthorized)
 * 4. Menampilkan notifikasi toast otomatis untuk setiap error HTTP
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';
import { SECURE_KEYS, getSecureData } from './secureStorageService';
import { toast } from '../context/ToastContext';

// ============================================================
// Types
// ============================================================

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  requiresAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Callback untuk notifikasi ketika token expired (401 Unauthorized)
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: () => void) {
  onUnauthorizedCallback = cb;
}

/**
 * Menampilkan toast yang sesuai berdasarkan HTTP status code.
 * Dipanggil secara otomatis oleh interceptor di apiRequest().
 *
 * Status yang ditangani:
 *  - 401  → Ditangani terpisah (session clear + toast)
 *  - 403  → Akses ditolak
 *  - 404  → Data tidak ditemukan
 *  - 408  → Timeout
 *  - 5xx  → Server error
 *  - lainnya → Pesan generik
 */
function _handleHttpErrorToast(status: number, serverMessage?: string): void {
  switch (status) {
    case 403:
      toast.error('Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.', {
        title: 'Akses Ditolak',
      });
      break;
    case 404:
      toast.warning('Data yang Anda cari tidak ditemukan.', {
        title: 'Data Tidak Ditemukan',
      });
      break;
    case 408:
      toast.error('Permintaan timeout. Silakan coba lagi.', {
        title: 'Koneksi Timeout',
      });
      break;
    case 422:
      toast.warning(serverMessage || 'Data yang dikirim tidak valid. Periksa kembali inputan Anda.', {
        title: 'Data Tidak Valid',
      });
      break;
    case 429:
      toast.warning('Terlalu banyak permintaan. Silakan tunggu sebentar.', {
        title: 'Terlalu Banyak Permintaan',
      });
      break;
    default:
      if (status >= 500) {
        toast.error('Terjadi kesalahan pada server. Silakan coba lagi nanti.', {
          title: 'Kesalahan Server',
          duration: 5000,
        });
      } else if (status >= 400) {
        toast.error(serverMessage || `Permintaan gagal (${status}).`, {
          title: 'Permintaan Gagal',
        });
      }
      break;
  }
}

/**
 * Task 02: Mengambil token autentikasi dari SecureStore
 * Menggunakan fallback safe untuk web jika diperlukan.
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await getSecureData(SECURE_KEYS.ACCESS_TOKEN);
    }
    return await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.warn('[ApiClient] Gagal membaca token dari SecureStore:', error);
    return null;
  }
}

/**
 * Fungsi Inti HTTP Request dengan penanganan token otomatis
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = API_CONFIG.TIMEOUT_MS,
    requiresAuth = true,
    params,
    headers: customHeaders = {},
    ...restOptions
  } = options;

  // 1. Buat URL lengkap dengan query parameters (jika ada)
  let url = endpoint.startsWith('http')
    ? endpoint
    : `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // 2. Setup Headers: Content-Type & Accept
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // 3. Sertakan Authorization Header: Bearer <token> (Task 02)
  if (requiresAuth) {
    const token = await getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Task 02 Checklist: Aplikasi hanya bisa mengakses data melalui protected API
      // Jika token tidak ada di SecureStore, tolak akses dan kembalikan 401
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.', { title: 'Sesi Berakhir' });
      throw new ApiError('Akses ditolak: Token autentikasi tidak ditemukan di SecureStore. Silakan login kembali.', 401);
    }
  }

  // 4. Setup timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 5. Cek token kadaluarsa / tidak valid (401 Unauthorized)
    if (response.status === 401) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.', {
        title: 'Sesi Berakhir',
        duration: 5000,
      });
      throw new ApiError('Sesi Anda telah berakhir. Silakan login kembali.', 401);
    }

    // 6. Tangani response data
    const contentType = response.headers.get('content-type');
    let responseData: any = null;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        `Request gagal dengan status ${response.status}`;

      // 7. Tampilkan toast berdasarkan HTTP status code
      _handleHttpErrorToast(response.status, errorMessage);

      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      toast.error('Koneksi timeout. Silakan periksa jaringan Anda.', {
        title: 'Koneksi Timeout',
        duration: 5000,
      });
      throw new ApiError('Koneksi timeout. Silakan periksa jaringan Anda.', 408);
    }
    if (error instanceof ApiError) {
      // Error sudah ditangani sebelumnya (401, dst) — jangan tampilkan toast duplikat
      throw error;
    }
    // Network error (offline, DNS gagal, dsb)
    toast.error('Gagal terhubung ke server. Periksa koneksi internet Anda.', {
      title: 'Tidak Ada Koneksi',
      duration: 5000,
    });
    throw new ApiError(error.message || 'Terjadi gangguan jaringan.', 0);
  }
}

// ============================================================
// Convenience API Methods (GET, POST, PUT, DELETE)
// ============================================================

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
