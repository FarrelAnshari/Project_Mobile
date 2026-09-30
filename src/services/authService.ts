/**
 * PARKIN — Smart Campus Parking
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
}

export interface AuthResult {
  success: boolean;
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
  } catch {
    return null;
  }
}

/**
 * Logout Pengguna
 */
export async function logoutUser(): Promise<void> {
  // 1. Bersihkan token & session dari SecureStore
  await clearAllSecureAuth();
  // 2. Bersihkan cache lokal spesifik akun agar tidak bocor ke akun berikutnya
  await clearAccountLocalData();
}
