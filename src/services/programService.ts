/**
 * PARKIN — Smart Campus Parking
 * Service: Program Service (Task 02 — Protected Endpoint GET /programs)
 *
 * Mengambil data program kampus dari endpoint yang dilindungi token autentikasi.
 * Menggunakan apiClient yang otomatis menyertakan header:
 * Authorization: Bearer <access_token>
 */

import { API_CONFIG } from '../config/api';
import apiClient, { ApiError } from './apiClient';

// ============================================================
// Types
// ============================================================

export interface ProgramItem {
  id: string | number;
  title: string;
  description: string;
  category: 'MAHASISWA' | 'DOSEN' | 'UMUM' | 'RAMAH_LINGKUNGAN';
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
  quota: number;
  remainingQuota: number;
  validUntil: string;
}

// Fallback data demo untuk keperluan presentasi jika backend belum aktif
export const DEMO_PROGRAMS: ProgramItem[] = [
  {
    id: 'PRG-01',
    title: 'Parkir Berlangganan Semester Ganjil',
    description: 'Akses tanpa batas area parkir Gedung Utama untuk mahasiswa aktif.',
    category: 'MAHASISWA',
    status: 'ACTIVE',
    quota: 250,
    remainingQuota: 42,
    validUntil: '2026-12-31',
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
  },
];

/**
 * Task 02: Panggil endpoint yang dilindungi (GET /programs)
 * Header Authorization: Bearer <token> disematkan secara otomatis oleh apiClient.
 */
export async function getPrograms(): Promise<{
  data: ProgramItem[];
  isDemoFallback: boolean;
}> {
  try {
    // Panggil GET /programs via apiClient (Bearer Token otomatis disisipkan)
    const data = await apiClient.get<ProgramItem[]>(API_CONFIG.ENDPOINTS.PROGRAMS, {
      requiresAuth: true,
    });

    if (Array.isArray(data) && data.length > 0) {
      return { data, isDemoFallback: false };
    }

    // Jika data kosong dari server, gunakan demo
    return { data: DEMO_PROGRAMS, isDemoFallback: true };
  } catch (error: any) {
    // Jika backend offline atau endpoint belum dibuat di server dummy,
    // tampilkan demo data agar UI tetap interaktif dan tidak crash saat presentasi
    console.warn(
      '[ProgramService] Gagal memuat /programs dari server, beralih ke fallback data:',
      error.message
    );
    return { data: DEMO_PROGRAMS, isDemoFallback: true };
  }
}
