/**
 * PARKIN — Smart Campus Parking
 * Context: AuthContext
 *
 * Mengelola state autentikasi global aplikasi:
 * - Menyimpan data pengguna aktif
 * - Memulihkan sesi saat cold start dari SecureStore
 * - Menyediakan fungsi login, register, dan logout terpusat
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
  User,
  AuthResult,
  RegisterData,
  loginUser,
  registerUser,
  logoutUser,
  restoreUserSession,
} from '../services/authService';
import { getRememberedEmail } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  rememberedEmail: string;
  login: (email: string, password: string, rememberMe: boolean) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rememberedEmail, setRememberedEmail] = useState<string>('');

  // 1. Pulihkan sesi dan remembered email saat aplikasi pertama kali dibuka
  const loadInitialSession = useCallback(async () => {
    try {
      const [restoredUser, storedEmail] = await Promise.all([
        restoreUserSession(),
        getRememberedEmail(),
      ]);

      if (restoredUser) {
        setUser(restoredUser);
      }
      if (storedEmail) {
        setRememberedEmail(storedEmail);
      }
    } catch {
      // Gagal membaca sesi, tetap berada pada state unauthenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialSession();
  }, [loadInitialSession]);

  // 2. Fungsi Login
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean): Promise<AuthResult> => {
      const result = await loginUser(email, password, rememberMe);
      if (result.success && result.user) {
        setUser(result.user);
        if (rememberMe) {
          setRememberedEmail(result.user.email);
        } else {
          setRememberedEmail('');
        }
      }
      return result;
    },
    [],
  );

  // 3. Fungsi Register
  const register = useCallback(
    async (data: RegisterData): Promise<AuthResult> => {
      return await registerUser(data);
    },
    [],
  );

  // 4. Fungsi Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }, []);

  // 5. Fungsi Refresh Sesi
  const refreshSession = useCallback(async (): Promise<void> => {
    const refreshed = await restoreUserSession();
    setUser(refreshed);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    rememberedEmail,
    login,
    register,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
