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

import { setOnUnauthorizedCallback } from '../services/apiClient';

// ============================================================
// Types
// ============================================================

type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthContextValue {
  /** State autentikasi saat ini */
  authState: AuthState;
  /** Boolean status autentikasi (Task 01 & Task 03) */
  isAuthenticated: boolean;
  /** Boolean status loading saat restore session */
  isLoading: boolean;
  /** User yang sedang login (null jika belum login) */
  user: UserProfile | null;
  /** Login dengan email dan password (Task 01) */
  login: (input: LoginInput) => Promise<AuthResult>;
  /** Register akun baru */
  register: (input: RegisterInput) => Promise<AuthResult>;
  /** Logout dan hapus session (Task 03) */
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

  // Task 03: Memeriksa token di SecureStore saat aplikasi dibuka kembali (Persistent Session)
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const restoredUser = await restoreSession();
      if (restoredUser) {
        setUser(restoredUser);
        setAuthState('authenticated');
      } else {
        setUser(null);
        setAuthState('unauthenticated');
      }
    } catch {
      setUser(null);
      setAuthState('unauthenticated');
    }
  }

  // Task 01: Login berhasil → Update global authentication state
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
      return result;
    },
    []
  );

  // Task 03: Logout → Hapus token dari SecureStore & set state unauthenticated
  const logout = useCallback(async () => {
    try {
      await authLogout();
    } finally {
      setUser(null);
      setAuthState('unauthenticated');
    }
  }, []);

  // Hubungkan auto-logout ketika API Client menerima status 401 Unauthorized
  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      logout();
    });
  }, [logout]);

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
    isAuthenticated: authState === 'authenticated',
    isLoading: authState === 'loading',
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
