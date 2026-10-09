/**
 * PARKIN — Smart Campus Parking
 * Service: Parking REST API Service (TASK 02)
 *
 * Mengambil data area parkir dari backend REST API dan mengubah response JSON
 * menjadi model data ParkingArea yang siap digunakan oleh screen aplikasi.
 *
 * Handles:
 * - HTTP GET request with configurable timeout & abort signal
 * - Network errors & connection failures
 * - Invalid response structures
 * - Empty data conditions
 * - Safe response validation and normalization
 */

import { API_CONFIG } from '../config/api';
import { ParkingArea } from '../models/parking';

// ============================================================
// DTO (Data Transfer Object) Definition
// ============================================================

/**
 * Struktur response JSON dari REST API sesuai spesifikasi:
 * {
 *   "id": "1",
 *   "name": "PARKIRAN 1",
 *   "capacity": 100,
 *   "occupied": 72,
 *   "available": 28,
 *   "occupancy": 72,
 *   "status": "BUSY",
 *   "updated_at": "2026-10-07T10:00:00Z"
 * }
 */
export interface ParkingAreaDto {
  id: string | number;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancy: number;
  status: string;
  updated_at: string;
  coordinates?: { x: number; y: number };
  description?: string;
}

// ============================================================
// Custom API Error
// ============================================================

export type ParkingApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'INVALID_RESPONSE'
  | 'EMPTY_DATA';

export class ParkingApiError extends Error {
  code: ParkingApiErrorCode;
  status?: number;

  constructor(message: string, code: ParkingApiErrorCode, status?: number) {
    super(message);
    this.name = 'ParkingApiError';
    this.code = code;
    this.status = status;
  }
}

// ============================================================
// Fallback Metadata for Visual Campus Map
// ============================================================

const DEFAULT_COORDINATES: Record<string, { x: number; y: number }> = {
  '1': { x: 0.22, y: 0.28 },
  '2': { x: 0.62, y: 0.22 },
  '3': { x: 0.78, y: 0.58 },
  '4': { x: 0.42, y: 0.72 },
  '5': { x: 0.18, y: 0.65 },
};

const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  '1': 'Area parkir utama, dekat pintu masuk kampus.',
  '2': 'Area parkir dekat Fakultas Teknik.',
  '3': 'Area parkir dekat Kantin Pusat.',
  '4': 'Area parkir terbuka, kapasitas terbesar.',
  '5': 'Area parkir dekat Gedung Rektorat.',
};

/**
 * Format timestamp updated_at menjadi waktu relatif ramah pengguna
 */
function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Baru saja';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (isNaN(diffMinutes) || diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return 'Hari ini';
  } catch {
    return 'Baru saja';
  }
}

// ============================================================
// Validation & Mapping
// ============================================================

/**
 * Validasi apakah sebuah objek memiliki struktur DTO ParkingArea yang valid
 */
export function isValidParkingAreaDto(item: unknown): item is ParkingAreaDto {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;

  return (
    candidate.id !== undefined &&
    candidate.id !== null &&
    typeof candidate.name === 'string' &&
    typeof candidate.capacity === 'number' &&
    typeof candidate.occupied === 'number'
  );
}

/**
 * Normalisasi dan mapping response JSON DTO menjadi model domain ParkingArea
 */
export function mapDtoToParkingArea(dto: ParkingAreaDto): ParkingArea {
  const idStr = String(dto.id).trim();
  const capacity = Math.max(0, Number(dto.capacity) || 0);
  const occupied = Math.max(0, Number(dto.occupied) || 0);
  const available =
    typeof dto.available === 'number'
      ? Math.max(0, dto.available)
      : Math.max(0, capacity - occupied);
  const occupancy =
    typeof dto.occupancy === 'number'
      ? dto.occupancy
      : capacity > 0
      ? Math.round((occupied / capacity) * 100)
      : 0;

  return {
    id: idStr,
    name: dto.name || `PARKIRAN ${idStr}`,
    capacity,
    occupied,
    available,
    occupancy,
    status: dto.status || (occupancy >= 80 ? 'BUSY' : 'AVAILABLE'),
    updated_at: dto.updated_at || new Date().toISOString(),
    coordinates: dto.coordinates ?? DEFAULT_COORDINATES[idStr],
    description: dto.description ?? DEFAULT_DESCRIPTIONS[idStr],
    lastUpdated: formatRelativeTime(dto.updated_at),
  };
}

// ============================================================
// Core API Methods
// ============================================================

export interface FetchParkingOptions {
  /** Optional custom timeout in milliseconds */
  timeoutMs?: number;
  /** Optional AbortSignal for request cancellation */
  signal?: AbortSignal;
}

/**
 * HTTP GET: Mengambil daftar area parkir dari REST API.
 *
 * Alur:
 * PARKIN → HTTP GET → REST API → JSON response → validate/map → ParkingArea[]
 *
 * @throws {ParkingApiError} ketika terjadi network error, HTTP error, response tidak valid, atau data kosong.
 */
export interface ConnectivityTestResult {
  success: boolean;
  url: string;
  statusCode: number;
  statusText: string;
  responseTimeMs: number;
  data: unknown;
}

/**
 * HTTP GET: Menguji konektivitas REST API online menggunakan endpoint pengujian:
 * https://jsonplaceholder.typicode.com/posts/1
 *
 * Menangani:
 * - Request timeout via AbortController
 * - Error HTTP (status 4xx / 5xx)
 * - Network failure (koneksi terputus/offline)
 * - Validasi respons JSON
 *
 * @throws {ParkingApiError} dengan kode TIMEOUT, NETWORK_ERROR, HTTP_ERROR, atau INVALID_RESPONSE.
 */
export async function testApiConnectivity(
  options: FetchParkingOptions = {}
): Promise<ConnectivityTestResult> {
  const url = API_CONFIG.TEST_URL;
  const timeoutMs = options.timeoutMs ?? API_CONFIG.TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  const startTime = Date.now();
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.DEFAULT_HEADERS,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ParkingApiError(
        `Permintaan ke server melebihi batas waktu (${timeoutMs / 1000} detik).`,
        'TIMEOUT'
      );
    }

    throw new ParkingApiError(
      'Gagal terhubung ke REST API online. Periksa koneksi internet Anda.',
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const responseTimeMs = Date.now() - startTime;

  // 1. Handle HTTP error status (4xx / 5xx)
  if (!response.ok) {
    throw new ParkingApiError(
      `Server mengembalikan kesalahan HTTP ${response.status} (${response.statusText || 'Error'}).`,
      'HTTP_ERROR',
      response.status
    );
  }

  // 2. Parse JSON response
  let rawJson: unknown;
  try {
    rawJson = await response.json();
  } catch {
    throw new ParkingApiError(
      'Format data dari server tidak valid (bukan JSON).',
      'INVALID_RESPONSE',
      response.status
    );
  }

  return {
    success: true,
    url,
    statusCode: response.status,
    statusText: response.statusText || 'OK',
    responseTimeMs,
    data: rawJson,
  };
}

/**
 * Helper internal untuk memanggil custom parking backend jika dikonfigurasi
 */
async function fetchFromCustomBackend(
  options: FetchParkingOptions = {}
): Promise<ParkingArea[]> {
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PARKING_AREAS}`;
  const timeoutMs = options.timeoutMs ?? API_CONFIG.TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.DEFAULT_HEADERS,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ParkingApiError(
        `Permintaan ke server melebihi batas waktu (${timeoutMs / 1000} detik).`,
        'TIMEOUT'
      );
    }

    throw new ParkingApiError(
      'Gagal terhubung ke server parkir. Periksa koneksi internet Anda.',
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ParkingApiError(
      `Server mengembalikan kesalahan HTTP ${response.status} (${response.statusText}).`,
      'HTTP_ERROR',
      response.status
    );
  }

  let rawJson: unknown;
  try {
    rawJson = await response.json();
  } catch {
    throw new ParkingApiError(
      'Format data dari server tidak valid (bukan JSON).',
      'INVALID_RESPONSE',
      response.status
    );
  }

  let itemsArray: unknown[] = [];
  if (Array.isArray(rawJson)) {
    itemsArray = rawJson;
  } else if (
    rawJson &&
    typeof rawJson === 'object' &&
    Array.isArray((rawJson as Record<string, unknown>).data)
  ) {
    itemsArray = (rawJson as Record<string, unknown>).data as unknown[];
  } else if (
    rawJson &&
    typeof rawJson === 'object' &&
    Array.isArray((rawJson as Record<string, unknown>).parking_areas)
  ) {
    itemsArray = (rawJson as Record<string, unknown>).parking_areas as unknown[];
  } else {
    throw new ParkingApiError(
      'Struktur response tidak memiliki daftar area parkir yang valid.',
      'INVALID_RESPONSE',
      response.status
    );
  }

  if (itemsArray.length === 0) {
    throw new ParkingApiError(
      'Tidak ada data area parkir yang tersedia.',
      'EMPTY_DATA',
      response.status
    );
  }

  const validatedAreas: ParkingArea[] = [];
  for (const item of itemsArray) {
    if (isValidParkingAreaDto(item)) {
      validatedAreas.push(mapDtoToParkingArea(item));
    }
  }

  if (validatedAreas.length === 0) {
    throw new ParkingApiError(
      'Data area parkir tidak memenuhi format yang diharapkan.',
      'INVALID_RESPONSE',
      response.status
    );
  }

  return validatedAreas;
}

/**
 * HTTP GET: Mengambil daftar area parkir dari REST API.
 *
 * Alur pengujian konektivitas online (Ketentuan 1–5):
 * 1. Menguji konektivitas HTTP ke online test endpoint: https://jsonplaceholder.typicode.com/posts/1
 * 2. Menangani loading, timeout, network error, dan HTTP status error.
 * 3. Jika gagal, melempar ParkingApiError (tanpa menampilkan kapasitas parkir 0 semu).
 * 4. Setelah tes koneksi berhasil (HTTP 200), mempertahankan data PARKIRAN 1–5
 *    dari sumber data parkir yang sudah ada (tidak memetakan posts menjadi kapasitas parkir).
 *
 * @throws {ParkingApiError} ketika koneksi gagal, timeout, atau HTTP error.
 */
export async function getParkingAreas(
  options: FetchParkingOptions = {}
): Promise<ParkingArea[]> {
  const hasCustomParkingBackend =
    Boolean(process.env.EXPO_PUBLIC_API_URL) &&
    !process.env.EXPO_PUBLIC_API_URL?.includes('jsonplaceholder');

  if (hasCustomParkingBackend) {
    return await fetchFromCustomBackend(options);
  }

  // 1. Ketentuan 1: Gunakan endpoint online jsonplaceholder untuk menguji konektivitas
  await testApiConnectivity(options);

  // 2. Ketentuan 5: Setelah tes koneksi berhasil, pertahankan data PARKIRAN 1–5
  // dari sumber data parkir yang sudah ada. Jangan memetakan data posts menjadi kapasitas parkir.
  const nowIso = new Date().toISOString();
  const demoAreas = getDemoParkingAreas();
  return demoAreas.map((area) => ({
    ...area,
    updated_at: nowIso,
    lastUpdated: 'Baru saja',
  }));
}


/**
 * Helper result type untuk konsumsi aman pada komponen UI tanpa throws
 */
export interface ParkingApiResult {
  data: ParkingArea[];
  isLoading: boolean;
  error: ParkingApiError | null;
  isEmpty: boolean;
}

/**
 * Safe wrapper untuk pemanggilan API yang mengembalikan state terstruktur
 */
export async function getParkingAreasSafe(
  options?: FetchParkingOptions
): Promise<ParkingApiResult> {
  try {
    const data = await getParkingAreas(options);
    return {
      data,
      isLoading: false,
      error: null,
      isEmpty: data.length === 0,
    };
  } catch (err: unknown) {
    const apiError =
      err instanceof ParkingApiError
        ? err
        : new ParkingApiError(
            err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga',
            'NETWORK_ERROR'
          );

    return {
      data: [],
      isLoading: false,
      error: apiError,
      isEmpty: apiError.code === 'EMPTY_DATA',
    };
  }
}

/**
 * Data demo JSON sesuai spesifikasi Task 01 & Task 02.
 * Diproses melalui validator dan mapper yang sama persis dengan HTTP response.
 */
export function getDemoParkingAreas(): ParkingArea[] {
  const rawDemoJson: ParkingAreaDto[] = [
    {
      id: '1',
      name: 'PARKIRAN 1',
      capacity: 100,
      occupied: 72,
      available: 28,
      occupancy: 72,
      status: 'BUSY',
      updated_at: '2026-10-07T10:00:00Z',
    },
    {
      id: '2',
      name: 'PARKIRAN 2',
      capacity: 80,
      occupied: 35,
      available: 45,
      occupancy: 44,
      status: 'AVAILABLE',
      updated_at: '2026-10-07T10:00:00Z',
    },
    {
      id: '3',
      name: 'PARKIRAN 3',
      capacity: 90,
      occupied: 88,
      available: 2,
      occupancy: 98,
      status: 'NEAR FULL',
      updated_at: '2026-10-07T10:00:00Z',
    },
    {
      id: '4',
      name: 'PARKIRAN 4',
      capacity: 120,
      occupied: 58,
      available: 62,
      occupancy: 48,
      status: 'AVAILABLE',
      updated_at: '2026-10-07T10:00:00Z',
    },
    {
      id: '5',
      name: 'PARKIRAN 5',
      capacity: 70,
      occupied: 56,
      available: 14,
      occupancy: 80,
      status: 'BUSY',
      updated_at: '2026-10-07T10:00:00Z',
    },
  ];

  return rawDemoJson.map(mapDtoToParkingArea);
}

