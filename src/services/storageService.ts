/**
 * PARKIN — Smart Campus Parking
 * Service: Local Storage (AsyncStorage)
 *
 * Digunakan KHUSUS untuk data lokal non-sensitif:
 * - Preferensi tampilan (kontras tinggi, teks besar)
 * - Pengaturan notifikasi lokal
 * - Area parkir terakhir yang dipilih
 * - Email yang diingat ("Ingat Saya")
 * - Cache aktivitas / histori parkir lokal
 *
 * PERINGATAN KEAMANAN:
 * JANGAN menyimpan token autentikasi, password, atau data sensitif di sini!
 * Gunakan secureStorageService untuk data kredensial.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'parkin_user_preferences',
  NOTIFICATION_SETTINGS: 'parkin_notification_settings',
  LAST_SELECTED_PARKING: 'parkin_last_selected_parking',
  REMEMBERED_EMAIL: 'parkin_remembered_email',
  PARKING_HISTORY: 'parkin_parking_history',
} as const;

export interface UserPreferences {
  largeText: boolean;
  highContrast: boolean;
  autoRefresh: boolean;
}

export interface NotificationSettings {
  notifAlmostFull: boolean;
  notifFull: boolean;
  notifPrediction: boolean;
}

export interface LocalParkingHistoryItem {
  id: string;
  parkingId: number;
  parkingName: string;
  timestamp: string;
  action: 'viewed' | 'reserved' | 'navigated';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  largeText: false,
  highContrast: false,
  autoRefresh: true,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  notifAlmostFull: true,
  notifFull: true,
  notifPrediction: false,
};

// ======== GENERIC HELPERS (TASK 02) ========

export async function saveLocalData<T = any>(key: string, value: T): Promise<boolean> {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export async function getLocalData<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch {
    return defaultValue;
  }
}

export async function removeLocalData(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export async function clearLocalData(): Promise<boolean> {
  try {
    await AsyncStorage.clear();
    return true;
  } catch {
    return false;
  }
}

async function getJsonItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

async function setJsonItem<T>(key: string, value: T): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

// ======== USER PREFERENCES ========

export async function getUserPreferences(): Promise<UserPreferences> {
  return await getJsonItem<UserPreferences>(
    STORAGE_KEYS.USER_PREFERENCES,
    DEFAULT_PREFERENCES,
  );
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<boolean> {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    return await setJsonItem(STORAGE_KEYS.USER_PREFERENCES, updated);
  } catch {
    return false;
  }
}

// ======== NOTIFICATION SETTINGS ========

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return await getJsonItem<NotificationSettings>(
    STORAGE_KEYS.NOTIFICATION_SETTINGS,
    DEFAULT_NOTIFICATIONS,
  );
}

export async function saveNotificationSettings(
  settings: Partial<NotificationSettings>,
): Promise<boolean> {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    return await setJsonItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, updated);
  } catch {
    return false;
  }
}

// ======== LAST SELECTED PARKING ========

export async function getLastSelectedParking(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SELECTED_PARKING);
    if (!raw) return 3; // Default PARKIRAN 3
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 3 : parsed;
  } catch {
    return 3;
  }
}

export async function saveLastSelectedParking(areaId: number): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SELECTED_PARKING, areaId.toString());
    return true;
  } catch {
    return false;
  }
}

// ======== REMEMBERED EMAIL (INGAT SAYA) ========

export async function getRememberedEmail(): Promise<string> {
  try {
    const email = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBERED_EMAIL);
    return email ?? '';
  } catch {
    return '';
  }
}

export async function saveRememberedEmail(email: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBERED_EMAIL, email.trim());
    return true;
  } catch {
    return false;
  }
}

export async function clearRememberedEmail(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBERED_EMAIL);
    return true;
  } catch {
    return false;
  }
}

// ======== PARKING HISTORY LOGS ========

export async function getLocalParkingHistory(): Promise<LocalParkingHistoryItem[]> {
  return await getJsonItem<LocalParkingHistoryItem[]>(
    STORAGE_KEYS.PARKING_HISTORY,
    [],
  );
}

export async function addLocalParkingHistory(
  item: Omit<LocalParkingHistoryItem, 'id' | 'timestamp'>,
): Promise<boolean> {
  try {
    const history = await getLocalParkingHistory();
    const newItem: LocalParkingHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    // Keep max 20 recent items
    const updated = [newItem, ...history].slice(0, 20);
    return await setJsonItem(STORAGE_KEYS.PARKING_HISTORY, updated);
  } catch {
    return false;
  }
}

// ======== CLEAR ACCOUNT SPECIFIC DATA ON LOGOUT ========

/**
 * Menghapus data akun lokal saat logout agar data akun sebelumnya
 * tidak tertinggal saat berganti pengguna.
 */
export async function clearAccountLocalData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PARKING_HISTORY,
      STORAGE_KEYS.LAST_SELECTED_PARKING,
    ]);
  } catch {
    // Silent fail safely
  }
}
