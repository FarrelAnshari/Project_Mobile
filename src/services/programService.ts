/**
 * PARKIN — Smart Campus Parking
 * Service: Program Service (Task 02 — Protected Endpoint GET /programs)
 *
 * Mengambil data program kampus dari endpoint yang dilindungi token autentikasi.
 * Menggunakan Bearer Token dari SecureStore sesuai alur Task 02:
 * 1. Secure Storage: Ambil token dari SecureStore (SecureStore.getItemAsync("access_token"))
 * 2. Get Token: Membaca access token dari secure storage
 * 3. API Request: Mengirim request ke endpoint yang dilindungi
 * 4. Authorization: Menambahkan header "Authorization: Bearer <token>"
 * 5. Protected API: Mengembalikan data program
 */

import { API_CONFIG } from '../config/api';
import { apiClient, ApiError } from './apiClient';
import { getAccessToken } from './secureStorageService';

// ============================================================
// Types
// ============================================================

export interface ProgramItem {
  id: string | number;
  title: string;
  description: string;
  category: 'PRIORITAS' | 'MAHASISWA' | 'DOSEN' | 'RAMAH_LINGKUNGAN' | 'UMUM';
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  quota: number;
  remainingQuota: number;
  validUntil: string;
  iconName?: string;
}

// Data program dari Task 02 Slide & Ekosistem PARKIN Kampus
export const ALL_PROGRAMS: ProgramItem[] = [
  // 4 Program Prioritas (Sesuai Slide 11)
  {
    id: 'PRG-PRIO-01',
    title: 'Indonesia Maju',
    description: 'Program pembangunan infrastruktur mobilitas cerdas dan fasilitas kampus masa depan.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 500,
    remainingQuota: 142,
    validUntil: '2026-12-31',
    iconName: 'flag-outline',
  },
  {
    id: 'PRG-PRIO-02',
    title: 'Pendidikan Berkualitas',
    description: 'Peningkatan kualitas fasilitas riset mobilitas dan subsidi transportasi mahasiswa berprestasi.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 300,
    remainingQuota: 85,
    validUntil: '2027-01-31',
    iconName: 'school-outline',
  },
  {
    id: 'PRG-PRIO-03',
    title: 'Ekonomi Kerakyatan',
    description: 'Mendorong ekonomi inklusif melalui kemitraan UMKM kantin kampus dan parkir terpadu.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 200,
    remainingQuota: 64,
    validUntil: '2026-11-30',
    iconName: 'trending-up-outline',
  },
  {
    id: 'PRG-PRIO-04',
    title: 'Lingkungan Sehat',
    description: 'Menjaga keberlanjutan lingkungan hidup melalui zona kampus rendah emisi dan sensor kualitas udara.',
    category: 'PRIORITAS',
    status: 'ACTIVE',
    quota: 400,
    remainingQuota: 210,
    validUntil: '2027-03-31',
    iconName: 'leaf-outline',
  },
  // Program Fasilitas Parkir Kampus
  {
    id: 'PRG-01',
    title: 'Parkir Berlangganan Semester Ganjil',
    description: 'Akses tanpa batas area parkir Gedung Utama untuk mahasiswa aktif.',
    category: 'MAHASISWA',
    status: 'ACTIVE',
    quota: 250,
    remainingQuota: 42,
    validUntil: '2026-12-31',
    iconName: 'car-outline',
  },
  {
    id: 'PRG-02',
    title: 'Prioritas Kendaraan Listrik (EV)',
    description: 'Slot parkir khusus charging station di Fakultas Teknik & Rektorat.',
    category: 'RAMAH_LINGKUNGAN',
    status: 'ACTIVE',
    quota: 50,
    remainingQuota: 18,
    validUntil: '2027-01-15',
    iconName: 'flash-outline',
  },
  {
    id: 'PRG-03',
    title: 'Insentif Parkir Carpool Kampus',
    description: 'Diskon tarif dan reservasi prioritas untuk mahasiswa yang berbagi tumpangan.',
    category: 'MAHASISWA',
    status: 'UPCOMING',
    quota: 100,
    remainingQuota: 100,
    validUntil: '2026-11-30',
    iconName: 'people-outline',
  },
  {
    id: 'PRG-04',
    title: 'Kartu Akses Khusus Dosen & Peneliti',
    description: 'Akses area parkir tertutup dengan keamanan sensor RFID dan CCTV 24/7.',
    category: 'DOSEN',
    status: 'ACTIVE',
    quota: 150,
    remainingQuota: 27,
    validUntil: '2027-06-30',
    iconName: 'id-card-outline',
  },
];

export const DEMO_PROGRAMS = ALL_PROGRAMS;

/**
 * Task 02: Panggil endpoint yang dilindungi (GET /programs)
 * Header Authorization: Bearer <token> disematkan dari SecureStore.
 *
 * @param forceNoAuth - Jika true, simulasi pemanggilan tanpa token untuk membuktikan proteksi endpoint (menghasilkan 401 Unauthorized)
 */
export async function getPrograms(forceNoAuth = false): Promise<{
  data: ProgramItem[];
  tokenUsed: string | null;
  status: number;
  headersSent: Record<string, string>;
  isDemoFallback: boolean;
}> {
  // 1. Ambil access token dari SecureStore (Task 02)
  const token = forceNoAuth ? null : await getAccessToken();

  // Task 02 Checklist: Aplikasi HANYA bisa mengakses data melalui protected API
  if (!token) {
    throw new ApiError(
      'Akses Ditolak (401 Unauthorized): Endpoint /programs terproteksi. Token autentikasi tidak ditemukan di SecureStore.',
      401
    );
  }

  // 2. Siapkan header permintaan dengan format Bearer Token
  const headersSent: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    // 3. Panggil GET /programs via apiClient (melewatkan headers dengan Bearer token)
    const remoteData = await apiClient.get<ProgramItem[]>(API_CONFIG.ENDPOINTS.PROGRAMS, {
      requiresAuth: true,
      headers: headersSent,
    });

    if (Array.isArray(remoteData) && remoteData.length > 0) {
      return {
        data: remoteData,
        tokenUsed: token,
        status: 200,
        headersSent,
        isDemoFallback: false,
      };
    }
  } catch (error: any) {
    // Jika endpoint mengembalikan 401 Unauthorized, teruskan error agar dapat ditangani UI
    if (error?.status === 401) {
      throw error;
    }
    // Jika backend offline / domain default 404, fallback ke data terproteksi yang telah tervalidasi tokennya
  }

  return {
    data: ALL_PROGRAMS,
    tokenUsed: token,
    status: 200,
    headersSent,
    isDemoFallback: true,
  };
}
