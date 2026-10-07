/**
 * PARKIN — Smart Campus Parking
 * Context: AuthContext
 *
 * Menyediakan authentication state ke seluruh aplikasi.
 * State: loading → unauthenticated | authenticated
 *
 * Gunakan useAuth() hook untuk mengakses context ini.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  restoreSession,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  updateProfile as authUpdateProfile,
  changePassword as authChangePassword,
  UserProfile,
  LoginInput,
  RegisterInput,
  AuthResult,
} from '../services/authService';

// ============================================================
// Types
// ============================================================

type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthContextValue {
  /** State autentikasi saat ini */
  authState: AuthState;
  /** User yang sedang login (null jika belum login) */
  user: UserProfile | null;
  /** Login dengan email dan password */
  login: (input: LoginInput) => Promise<AuthResult>;
  /** Register akun baru */
  register: (input: RegisterInput) => Promise<AuthResult>;
  /** Logout dan hapus session */
  logout: () => Promise<void>;
  /** Update nama/data profile */
  updateProfile: (updates: Partial<Pick<UserProfile, 'name'>>) => Promise<boolean>;
  /** Ubah password */
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Saat app/web dibuka: selalu arahkan lewat Login page terlebih dahulu
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    // Memastikan setiap kali app/web dibuka, harus melewati halaman login
    setUser(null);
    setAuthState('unauthenticated');
  }

  const login = useCallback(async (input: LoginInput): Promise<AuthResult> => {
    const result = await authLogin(input);
    if (result.success && result.user) {
      setUser(result.user);
      setAuthState('authenticated');
    }
    return result;
  }, []);

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthResult> => {
      const result = await authRegister(input);
      // Registrasi berhasil → redirect ke login (tidak auto-login)
      return result;
    },
    []
  );

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setAuthState('unauthenticated');
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'name'>>): Promise<boolean> => {
      if (!user) return false;
      const updated = await authUpdateProfile(user.id, updates);
      if (updated) {
        setUser(updated);
        return true;
      }
      return false;
    },
    [user]
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'Tidak terautentikasi.' };
      return authChangePassword(user.id, currentPassword, newPassword);
    },
    [user]
  );

  const value: AuthContextValue = {
    authState,
    user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
