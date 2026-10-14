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
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';
import { SECURE_KEYS, getSecureData } from './secureStorageService';

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

  // 3. Sertakan Authorization Header: Bearer <token>
  if (requiresAuth) {
    const token = await getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError('Koneksi timeout. Silakan periksa jaringan Anda.', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
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
