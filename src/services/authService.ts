/**
 * PARKIN — Smart Campus Parking
<<<<<<< HEAD
 * Service: Authentication Service
 *
 * Mengelola alur login, registrasi, validasi kredensial, dan sesi.
 *
 * INTEGRASI BACKEND:
 * - Saat ini project berada pada tahap Prototype / Mobile Client.
 * - Service ini dipisahkan secara modular agar siap dihubungkan ke endpoint
 *   REST API / OAuth2 backend di Sprint 02 tanpa perlu mengubah UI screen.
 * - Mode demo mahasiswa disediakan dengan transparansi penuh untuk pengujian.
 */

import {
  saveAuthToken,
  saveRefreshToken,
  saveUserSession,
  getUserSession,
  clearAllSecureAuth,
  StoredUserSession,
} from './secureStorageService';
import {
  saveRememberedEmail,
  clearRememberedEmail,
  clearAccountLocalData,
} from './storageService';

export interface User {
  id: string;
  name: string;
  email: string;
  nim: string;
  prodi: string;
  angkatan: string;
  role: 'mahasiswa' | 'tamu' | 'admin';
=======
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

import { saveData, getData, STORAGE_KEYS } from './asyncStorageService';
import { saveSecureData, getSecureData, clearAllSecureData, SECURE_KEYS } from './secureStorageService';

// ============================================================
// Types
// ============================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  expiresAt: number; // Unix timestamp ms
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
>>>>>>> 3f814b0 (Update 2)
}

export interface AuthResult {
  success: boolean;
<<<<<<< HEAD
  user?: User;
  token?: string;
  message?: string;
  errors?: Record<string, string>;
}

export interface RegisterData {
  name: string;
  email: string;
  nim?: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

// Akun Mahasiswa Demo Bawaan untuk keperluan pengujian
export const DEMO_CREDENTIALS = {
  email: 'mahasiswa@kampus.ac.id',
  password: 'Password123!',
  name: 'Ahmad Fauzi',
  nim: '2021310042',
  prodi: 'Teknik Informatika',
  angkatan: '2021',
};

// Registri akun demo in-memory (memungkinkan pengujian akun baru yang didaftarkan saat runtime)
interface InternalAccount extends User {
  passwordHash: string; // disimulasikan
}

const registeredAccounts: InternalAccount[] = [
  {
    id: 'usr_001',
    name: DEMO_CREDENTIALS.name,
    email: DEMO_CREDENTIALS.email.toLowerCase(),
    nim: DEMO_CREDENTIALS.nim,
    prodi: DEMO_CREDENTIALS.prodi,
    angkatan: DEMO_CREDENTIALS.angkatan,
    role: 'mahasiswa',
    passwordHash: DEMO_CREDENTIALS.password,
  },
  {
    id: 'usr_002',
    name: 'Sarah Putri',
    email: 'sarah.putri@kampus.ac.id',
    nim: '2022310118',
    prodi: 'Sistem Informasi',
    angkatan: '2022',
    role: 'mahasiswa',
    passwordHash: 'Password123!',
  },
];

// ======== VALIDATION HELPERS ========

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: 'lemah' | 'sedang' | 'kuat';
  message: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      score: 'lemah',
      message: 'Password minimal 8 karakter.',
    };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteriaCount = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (criteriaCount >= 3) {
    return {
      isValid: true,
      score: 'kuat',
      message: 'Kekuatan password: Kuat',
    };
  } else if (criteriaCount >= 2) {
    return {
      isValid: true,
      score: 'sedang',
      message: 'Kekuatan password: Cukup (tambahkan simbol atau angka)',
    };
  } else {
    return {
      isValid: false,
      score: 'lemah',
      message: 'Gunakan kombinasi huruf besar, huruf kecil, dan angka.',
    };
  }
}

// ======== AUTH ACTIONS ========

/**
 * Login Mahasiswa
 */
export async function loginUser(
  emailInput: string,
  passwordInput: string,
  rememberMe: boolean = false,
): Promise<AuthResult> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  // Validasi input sisi klien
  if (!email) {
    return { success: false, message: 'Email mahasiswa wajib diisi.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, message: 'Format email tidak valid (contoh: nama@kampus.ac.id).' };
  }
  if (!password) {
    return { success: false, message: 'Password wajib diisi.' };
  }

  // Simulasi network latency (400ms)
  await new Promise((r) => setTimeout(r, 400));

  // Cek akun pada basis data simulasi
  const account = registeredAccounts.find(
    (acc) => acc.email === email && acc.passwordHash === password,
  );

  if (!account) {
    return {
      success: false,
      message: 'Email atau password salah. Silakan periksa kembali kredensial Anda.',
    };
  }

  // Simulasi JWT Token dari backend
  const simulatedToken = `parkin_jwt_${account.id}_${Date.now()}`;
  const simulatedRefreshToken = `parkin_rt_${account.id}_${Date.now()}`;

  const sessionData: StoredUserSession = {
    id: account.id,
    name: account.name,
    email: account.email,
    nim: account.nim,
    prodi: account.prodi,
    angkatan: account.angkatan,
    role: account.role,
    lastLogin: new Date().toISOString(),
  };

  // Simpan kredensial & sesi ke SecureStore
  await saveAuthToken(simulatedToken);
  await saveRefreshToken(simulatedRefreshToken);
  await saveUserSession(sessionData);

  // Simpan atau bersihkan email jika "Ingat Saya" dicentang
  if (rememberMe) {
    await saveRememberedEmail(email);
  } else {
    await clearRememberedEmail();
  }

  const userResult: User = {
    id: account.id,
    name: account.name,
    email: account.email,
    nim: account.nim,
    prodi: account.prodi,
    angkatan: account.angkatan,
    role: account.role,
  };

  return {
    success: true,
    user: userResult,
    token: simulatedToken,
    message: 'Login berhasil.',
  };
}

/**
 * Pendaftaran Akun Mahasiswa Baru
 */
export async function registerUser(data: RegisterData): Promise<AuthResult> {
  const { name, email: rawEmail, password, confirmPassword, agreeTerms } = data;
  const email = rawEmail.trim().toLowerCase();
  const errors: Record<string, string> = {};

  if (!name.trim()) {
    errors.name = 'Nama lengkap wajib diisi.';
  }

  if (!email) {
    errors.email = 'Email mahasiswa wajib diisi.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Format email tidak valid.';
  }

  const passwordVal = validatePasswordStrength(password);
  if (!password) {
    errors.password = 'Password wajib diisi.';
  } else if (!passwordVal.isValid) {
    errors.password = passwordVal.message;
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak cocok.';
  }

  if (!agreeTerms) {
    errors.agreeTerms = 'Anda harus menyetujui syarat & ketentuan layanan.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Periksa kembali data formulir pendaftaran Anda.',
      errors,
    };
  }

  // Cek apakah email sudah terdaftar
  const existing = registeredAccounts.find((a) => a.email === email);
  if (existing) {
    return {
      success: false,
      message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.',
      errors: { email: 'Email sudah terdaftar.' },
    };
  }

  // Simulasi proses pembuatan akun
  await new Promise((r) => setTimeout(r, 500));

  const newId = `usr_${Date.now().toString().slice(-4)}`;
  const newAccount: InternalAccount = {
    id: newId,
    name: name.trim(),
    email,
    nim: data.nim?.trim() || `2024${Math.floor(100000 + Math.random() * 900000)}`,
    prodi: 'Teknik Informatika',
    angkatan: '2024',
    role: 'mahasiswa',
    passwordHash: password,
  };

  registeredAccounts.push(newAccount);

  return {
    success: true,
    user: {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      nim: newAccount.nim,
      prodi: newAccount.prodi,
      angkatan: newAccount.angkatan,
      role: newAccount.role,
    },
    message: 'Pendaftaran akun mahasiswa berhasil. Silakan masuk dengan akun baru Anda.',
  };
}

/**
 * Permintaan Reset Password
 */
export async function requestPasswordReset(emailInput: string): Promise<{
  success: boolean;
  message: string;
  isBackendSupported: boolean;
}> {
  const email = emailInput.trim().toLowerCase();

  if (!email) {
    return {
      success: false,
      message: 'Email mahasiswa wajib diisi.',
      isBackendSupported: false,
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      message: 'Format email tidak valid.',
      isBackendSupported: false,
    };
  }

  await new Promise((r) => setTimeout(r, 400));

  // Transparansi prototype: beri tahu bahwa ini simulasi dan memerlukan backend mailer
  return {
    success: true,
    message: `Permintaan reset password untuk ${email} telah dicatat. Pada tahap produksi, tautan pemulihan akan dikirimkan oleh backend mail server.`,
    isBackendSupported: false,
  };
}

/**
 * Pulihkan sesi saat aplikasi dibuka kembali
 */
export async function restoreUserSession(): Promise<User | null> {
  try {
    const session = await getUserSession();
    if (!session) return null;
    return {
      id: session.id,
      name: session.name,
      email: session.email,
      nim: session.nim,
      prodi: session.prodi,
      angkatan: session.angkatan,
      role: session.role,
    };
=======
  error?: string;
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
 * Login user.
 * → Validasi email + password.
 * → Buat session dan simpan token ke SecureStore.
 * → Simpan profile ke AsyncStorage.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  // Simulasi delay jaringan
  await delay(1000);

  const users = await getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase()
  );

  if (!user) {
    return { success: false, error: 'Email atau password salah.' };
  }

  if (user.passwordHash !== hashPassword(input.password)) {
    return { success: false, error: 'Email atau password salah.' };
  }

  // Buat session
  const token = generateMockToken(user.id);
  const session: AuthSession = {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 hari
  };

  // Simpan token ke SecureStore (TIDAK di AsyncStorage)
  await saveSecureData(SECURE_KEYS.ACCESS_TOKEN, token);
  // Simpan session ke SecureStore
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
 * Cek apakah ada session yang valid.
 * → Ambil session dari SecureStore.
 * → Validasi expiry.
 * → Ambil profile dari AsyncStorage.
 */
export async function restoreSession(): Promise<UserProfile | null> {
  try {
    const sessionJson = await getSecureData(SECURE_KEYS.SESSION);
    if (!sessionJson) return null;

    const session: AuthSession = JSON.parse(sessionJson);

    // Cek apakah session masih valid
    if (Date.now() > session.expiresAt) {
      await logout();
      return null;
    }

    // Ambil profile dari AsyncStorage
    const profile = await getData<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    return profile;
>>>>>>> 3f814b0 (Update 2)
  } catch {
    return null;
  }
}

/**
<<<<<<< HEAD
 * Logout Pengguna
 */
export async function logoutUser(): Promise<void> {
  // 1. Bersihkan token & session dari SecureStore
  await clearAllSecureAuth();
  // 2. Bersihkan cache lokal spesifik akun agar tidak bocor ke akun berikutnya
  await clearAccountLocalData();
=======
 * Logout: hapus semua data sensitif.
 */
export async function logout(): Promise<void> {
  // Hapus semua SecureStore data
  await clearAllSecureData();
  // Hapus profile dari AsyncStorage
  await saveData(STORAGE_KEYS.USER_PROFILE, null);
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
>>>>>>> 3f814b0 (Update 2)
}
