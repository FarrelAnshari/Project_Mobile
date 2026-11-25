/**
 * PARKIN — Smart Campus Parking
 * Service: Push & Local Notification Management
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';
import {
  NotificationPayloadData,
  NotificationPermissionStatus,
  PushRegistrationResult,
  SendPushResult,
} from '../types/notification';
import { getData, saveData } from './asyncStorageService';

export const PUSH_TOKEN_STORAGE_KEY = 'parkin_push_token';
export const NOTIFICATION_HISTORY_STORAGE_KEY = 'parkin_notification_history';
export const ANDROID_CHANNEL_ID = 'parkin-default';

// Konfigurasi handler agar notifikasi tetap tampil saat aplikasi di Foreground (khusus native)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (err) {
    console.warn('[PARKIN Notif] Gagal mengatur notification handler:', err);
  }
}

function mapExpoPermStatus(status: Notifications.PermissionStatus): NotificationPermissionStatus {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

/**
 * Membuat notification channel pada Android 8.0+.
 */
export async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // 7 === Notifications.AndroidImportance.MAX
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Notifikasi PARKIN',
      importance: 7 as Notifications.AndroidImportance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  } catch (err) {
    console.warn('[PARKIN Notif] Gagal membuat channel Android:', err);
  }
}

/**
 * Memeriksa status izin notifikasi saat ini tanpa memicu prompt.
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    const perm = window.Notification.permission;
    if (perm === 'granted') return 'granted';
    if (perm === 'denied') return 'denied';
    return 'undetermined';
  }

  try {
    const res = await Notifications.getPermissionsAsync();
    return mapExpoPermStatus(res.status);
  } catch {
    return 'unsupported';
  }
}

/**
 * Meminta izin notifikasi dari sistem perangkat.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const perm = await window.Notification.requestPermission();
      if (perm === 'granted') return 'granted';
      if (perm === 'denied') return 'denied';
      return 'undetermined';
    } catch {
      return 'unsupported';
    }
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === Notifications.PermissionStatus.GRANTED) {
      return 'granted';
    }
    const requested = await Notifications.requestPermissionsAsync();
    return mapExpoPermStatus(requested.status);
  } catch {
    return 'denied';
  }
}


export async function registerDeviceForPushNotifications(
  userId?: string
): Promise<PushRegistrationResult> {
  const permStatus = await requestNotificationPermission();

  if (Platform.OS !== 'web') {
    await setupAndroidNotificationChannel();
    if (permStatus !== 'granted') {
      return {
        success: false,
        permissionStatus: permStatus,
        token: null,
        isFallbackToken: false,
        backendSynced: false,
        message:
          permStatus === 'denied'
            ? 'Izin notifikasi ditolak. Aktifkan melalui Pengaturan perangkat.'
            : 'Izin notifikasi belum diberikan.',
      };
    }
  }

  let token: string | null = null;
  let isFallbackToken = false;

  if (Platform.OS === 'web') {
    token = 'WebPreviewToken[parkin-browser-preview]';
    isFallbackToken = true;
  } else if (Device.isDevice) {
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const tokenRes = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenRes.data;
    } catch (err) {
      console.warn(
        '[PARKIN Notif] Tidak dapat mengambil Expo Push Token asli (menggunakan token lokal perangkat):',
        err
      );
      const safeDevice = (Device.modelName || Platform.OS).replace(/[^a-zA-Z0-9_-]/g, '');
      token = `LocalDeviceToken[${Platform.OS}-${safeDevice}]`;
      isFallbackToken = true;
    }
  } else {
    token = `SimulatorToken[${Platform.OS}-emulator]`;
    isFallbackToken = true;
  }

  console.log('[PARKIN Push Token]', token);

  // Simpan secara lokal di AsyncStorage
  await saveData(PUSH_TOKEN_STORAGE_KEY, {
    token,
    isFallbackToken,
    registeredAt: Date.now(),
  });

  // Sinkronkan ke backend REST API
  let backendSynced = false;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER_PUSH_TOKEN}`,
      {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({
          token,
          userId: userId || 'guest',
          platform: Platform.OS,
          deviceName: Device.modelName || (Platform.OS === 'web' ? 'Web Browser' : 'Perangkat PARKIN'),
        }),
        signal: controller.signal,
      }
    );
    backendSynced = response.ok;
  } catch {
    backendSynced = false;
  } finally {
    clearTimeout(timeoutId);
  }

  const message = backendSynced
    ? isFallbackToken
      ? 'Perangkat terdaftar dengan token preview/lokal dan tersinkron ke server.'
      : 'Perangkat berhasil terdaftar dan Push Token tersinkron ke server.'
    : 'Token tersimpan di perangkat (server lokal tidak aktif saat ini).';

  return {
    success: true,
    permissionStatus: permStatus,
    token,
    isFallbackToken,
    backendSynced,
    message,
  };
}

/**
 * Mengambil token tersimpan di AsyncStorage jika ada.
 */
export async function getStoredPushTokenInfo(): Promise<{
  token: string;
  isFallbackToken: boolean;
} | null> {
  return getData<{ token: string; isFallbackToken: boolean }>(PUSH_TOKEN_STORAGE_KEY);
}

/**
 * Mengirim Push Notification melalui backend POST /notifications/send.
 */
export async function sendPushNotification(params: {
  token?: string | null;
  title: string;
  body: string;
  data: NotificationPayloadData;
}): Promise<SendPushResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_PUSH_NOTIFICATION}`,
      {
        method: 'POST',
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({
          token: params.token || undefined,
          title: params.title,
          body: params.body,
          data: params.data,
        }),
        signal: controller.signal,
      }
    );

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        message: json?.message || `Server mengembalikan status ${response.status}.`,
      };
    }

    return {
      success: true,
      simulated: Boolean(json?.simulated),
      message:
        json?.message || 'Push Notification berhasil diproses oleh server.',
    };
  } catch {
    return {
      success: false,
      offline: true,
      message:
        'Server lokal tidak aktif. Gunakan tombol Notifikasi Lokal (2 dtk) untuk uji coba langsung di perangkat.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Menjadwalkan notifikasi sistem lokal dengan timer yang dapat diatur (1–60 detik)
 * untuk demo Foreground & Background.
 */
export async function triggerLocalTestNotification(params: {
  title: string;
  body: string;
  data: NotificationPayloadData;
  delaySeconds?: number;
}): Promise<{ success: boolean; message: string }> {
  const safeSeconds = Math.min(60, Math.max(1, Math.round(params.delaySeconds ?? 2)));

  if (Platform.OS === 'web') {
    return {
      success: true,
      message: `Notifikasi akan muncul dalam ${safeSeconds} detik.`,
    };
  }

  try {
    const perm = await requestNotificationPermission();
    await setupAndroidNotificationChannel();
    if (perm !== 'granted') {
      return {
        success: false,
        message: 'Izin notifikasi diperlukan untuk menampilkan notifikasi lokal.',
      };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data as unknown as Record<string, unknown>,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: safeSeconds,
      },
    });

    return {
      success: true,
      message: `Notifikasi lokal akan muncul dalam ${safeSeconds} detik.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menjadwalkan notifikasi lokal.';
    return { success: false, message: msg };
  }
}
