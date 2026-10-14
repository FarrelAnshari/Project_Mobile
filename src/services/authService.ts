/**
 * PARKIN — Smart Campus Parking
 * Service: Authentication (Mock / Demo)
 *
 * Ini adalah MOCK authentication service untuk prototype.
 * Tidak terhubung ke backend. Gunakan struktur ini saat backend tersedia.
 *
 * TIDAK menyimpan password.
 * TIDAK mengklaim sebagai production authentication.
 * Token yang dihasilkan adalah mock token — BUKAN JWT nyata.
 *
 * Saat backend tersedia:
 * → Ganti implementasi register() dan login() dengan API calls.
 * → AuthContext dan UI tidak perlu diubah.
 */

import { API_CONFIG } from '../config/api';
import { saveData, getData, STORAGE_KEYS } from './asyncStorageService';
import {
  saveSecureData,
  getSecureData,
  clearAllSecureData,
  SECURE_KEYS,
  setAccessToken,
  getAccessToken,
  deleteAccessToken,
} from './secureStorageService';

// ============================================================
// Types
// ============================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type User = UserProfile;

export interface AuthSession {
  userId: string;
  expiresAt: number; // Unix timestamp ms
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  nim?: string;
  confirmPassword?: string;
  agreeTerms?: boolean;
}

export type RegisterData = RegisterInput;

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  errors?: { name?: string; email?: string; password?: string };
  user?: UserProfile;
}

// ============================================================
// Mock user database (AsyncStorage)
// ============================================================

const USERS_KEY = 'parkin_mock_users';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  // Password di-hash (SHA-256 simple simulation via btoa — BUKAN kriptografi nyata)
  // Untuk demo saja. Jangan digunakan di production.
  passwordHash: string;
  createdAt: string;
}

/** Buat simple hash dari password (cross-platform, aman untuk Hermes React Native) */
function hashPassword(password: string): string {
  const salted = `parkin_salt_${password}_2026`;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'hp_' + Math.abs(hash).toString(36) + '_' + salted.length;
}

/** Buat mock token (cross-platform, aman untuk Hermes React Native) */
function generateMockToken(userId: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `parkin_tk_${userId}_${ts}_${rand}`;
}

// Akun demo bawaan aplikasi
const DEFAULT_DEMO_USERS: StoredUser[] = [
  {
    id: 'user_demo_mahasiswa_01',
    name: 'Farrel Anshari',
    email: 'mahasiswa@parkin.campus.id',
    passwordHash: hashPassword('parkin123'),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_demo_dosen_02',
    name: 'Dr. Hendra Gunawan',
    email: 'dosen@parkin.campus.id',
    passwordHash: hashPassword('parkin123'),
    createdAt: new Date().toISOString(),
  },
];

/** Ambil semua user dari storage (dengan fallback ke akun demo jika baru pertama kali) */
async function getUsers(): Promise<StoredUser[]> {
  const stored = await getData<StoredUser[]>(USERS_KEY);
  if (!stored || stored.length === 0) {
    // Seed default demo accounts
    await saveData(USERS_KEY, DEFAULT_DEMO_USERS);
    return [...DEFAULT_DEMO_USERS];
  }
  return stored;
}

/** Simpan semua user ke storage */
async function saveUsers(users: StoredUser[]): Promise<void> {
  await saveData(USERS_KEY, users);
}

// ============================================================
// Auth Service API
// ============================================================

/**
 * Registrasi user baru.
 * → Simpan user ke AsyncStorage (non-sensitive data saja).
 * → Password di-hash sebelum disimpan.
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  // Simulasi delay jaringan
  await delay(800);

  const users = await getUsers();

  // Cek apakah email sudah terdaftar
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase()
  );
  if (existingUser) {
    return { success: false, error: 'Email sudah terdaftar. Silakan gunakan email lain.' };
  }

  const id = generateId();
  const createdAt = new Date().toISOString();

  const newUser: StoredUser = {
    id,
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    passwordHash: hashPassword(input.password),
    createdAt,
  };

  users.push(newUser);
  await saveUsers(users);

  const profile: UserProfile = {
    id,
    name: newUser.name,
    email: newUser.email,
    createdAt,
  };

  return { success: true, user: profile };
}

/**
 * Task 01 – Implement Token Authentication:
 * 1. Mengirim POST request (email & password) ke endpoint /login.
 * 2. Menerima respons berupa access_token (JWT).
 * 3. Menyimpan access_token secara aman ke SecureStore (SecureStore.setItemAsync('access_token', token)).
 * 4. Mengembalikan data profil user untuk mengupdate global state AuthContext.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const emailClean = input.email.trim();
  const passwordClean = input.password;

  // 1. Coba kirim POST request ke endpoint backend nyata jika tersedia
  try {
    const loginUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: emailClean,
        password: passwordClean,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // Terima respons access_token (JWT)
      const token = data.access_token || data.token;
      if (token) {
        // Simpan access_token secara aman ke SecureStore (Task 01)
        await setAccessToken(token);

        const profile: UserProfile = data.user || {
          id: data.userId || generateId(),
          name: data.name || emailClean.split('@')[0],
          email: emailClean,
          createdAt: new Date().toISOString(),
        };

        // Simpan data profil non-sensitif ke AsyncStorage
        await saveData<UserProfile>(STORAGE_KEYS.USER_PROFILE, profile);
        return { success: true, user: profile };
      }
    } else if (response.status === 401 || response.status === 400) {
      const errData = await response.json().catch(() => null);
      return {
        success: false,
        error: errData?.message || 'Email atau password salah.',
      };
    }
  } catch {
    // Backend offline / network timeout / server belum aktif:
    // Lanjutkan ke validasi demo offline agar mahasiswa tetap bisa demo & uji aplikasi.
  }

  // Fallback demo database lokal (AsyncStorage)
  await delay(800);

  const users = await getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === emailClean.toLowerCase()
  );

  if (!user) {
    return { success: false, error: 'Email atau password salah.' };
  }

  if (user.passwordHash !== hashPassword(passwordClean)) {
    return { success: false, error: 'Email atau password salah.' };
  }

  // Buat mock JWT token
  const token = generateMockToken(user.id);
  const session: AuthSession = {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 hari
  };

  // Simpan access_token secara aman ke SecureStore (SecureStore.setItemAsync('access_token', token))
  await setAccessToken(token);
  // Simpan session expiry ke SecureStore
  await saveSecureData(SECURE_KEYS.SESSION, JSON.stringify(session));

  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  // Simpan profile non-sensitif ke AsyncStorage
  await saveData<UserProfile>(STORAGE_KEYS.USER_PROFILE, profile);

  return { success: true, user: profile };
}

/**
 * Task 03 – Protect the PARKIN Session (Sesi Login Persisten):
 * Saat aplikasi dibuka kembali, cek apakah access_token ada di SecureStore
 * (SecureStore.getItemAsync('access_token')).
 * Jika ada, kembalikan user profile agar langsung masuk ke halaman utama.
 */
export async function restoreSession(): Promise<UserProfile | null> {
  try {
    // 1. Ambil token dari SecureStore
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    // 2. Ambil profile dari AsyncStorage
    const profile = await getData<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    if (profile) {
      return profile;
    }

    // Fallback profil default jika profile hilang di AsyncStorage tetapi token ada
    return {
      id: 'restored_user',
      name: 'Pengguna PARKIN',
      email: 'mahasiswa@parkin.campus.id',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[authService] Gagal memulihkan sesi:', error);
    return null;
  }
}

/**
 * Task 03 – Protect the PARKIN Session (Logout):
 * 1. Menghapus token dari secure storage (SecureStore.deleteItemAsync('access_token'))
 * 2. Menghapus data profile dan session
 */
export async function logout(): Promise<void> {
  try {
    // Hapus access_token dari SecureStore (Task 03)
    await deleteAccessToken();
    // Hapus semua data sensitif sesi lainnya
    await clearAllSecureData();
    // Hapus data profile non-sensitif dari AsyncStorage
    await saveData(STORAGE_KEYS.USER_PROFILE, null);
  } catch (error) {
    console.warn('[authService] Error saat logout:', error);
  }
}

/**
 * Update profile pengguna (nama saja untuk demo).
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'name'>>
): Promise<UserProfile | null> {
  await delay(500);

  const users = await getUsers();
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx === -1) return null;

  if (updates.name) {
    users[userIdx].name = updates.name.trim();
  }

  await saveUsers(users);

  const profile: UserProfile = {
    id: users[userIdx].id,
    name: users[userIdx].name,
    email: users[userIdx].email,
    createdAt: users[userIdx].createdAt,
  };

  // Update profile di AsyncStorage
  await saveData<UserProfile>(STORAGE_KEYS.USER_PROFILE, profile);

  return profile;
}

/**
 * Ubah password.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  await delay(700);

  const users = await getUsers();
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx === -1) return { success: false, error: 'User tidak ditemukan.' };

  if (users[userIdx].passwordHash !== hashPassword(currentPassword)) {
    return { success: false, error: 'Password lama tidak sesuai.' };
  }

  users[userIdx].passwordHash = hashPassword(newPassword);
  await saveUsers(users);

  return { success: true };
}

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Compatibility Helpers
// ============================================================

export const loginUser = async (
  email: string,
  password: string,
  _rememberMe?: boolean
): Promise<AuthResult> => {
  return await login({ email, password });
};

export const registerUser = async (data: RegisterData): Promise<AuthResult> => {
  return await register(data);
};

export const logoutUser = async (): Promise<void> => {
  return await logout();
};

export const restoreUserSession = async (): Promise<UserProfile | null> => {
  return await restoreSession();
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: 'lemah' | 'sedang' | 'kuat';
  label: string;
  message: string;
} {
  if (password.length < 6) {
    return { isValid: false, score: 'lemah', label: 'Lemah', message: 'Minimal 6 karakter' };
  }
  if (password.length < 8) {
    return { isValid: true, score: 'sedang', label: 'Sedang', message: 'Kombinasikan angka & huruf' };
  }
  return { isValid: true, score: 'kuat', label: 'Kuat', message: 'Password kuat' };
}

export const DEMO_CREDENTIALS = {
  email: 'mahasiswa@parkin.campus.id',
  password: 'parkin123',
};


export async function requestPasswordReset(_email: string): Promise<{ success: boolean; message: string }> {
  return { success: true, message: 'Tautan reset password telah dikirim ke email Anda.' };
}
