/**
 * PARKIN — Smart Campus Parking
 * Context: NotificationContext (Global State, Timer, & Clickable Navigation)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getData, saveData } from '../services/asyncStorageService';
import {
  getNotificationPermissionStatus,
  getStoredPushTokenInfo,
  NOTIFICATION_HISTORY_STORAGE_KEY,
  registerDeviceForPushNotifications,
  sendPushNotification,
  setupAndroidNotificationChannel,
  triggerLocalTestNotification,
} from '../services/notificationService';
import {
  NotificationHistoryItem,
  NotificationPayloadData,
  NotificationPermissionStatus,
  NotificationTargetScreen,
} from '../types/notification';

interface SendNotificationInput {
  title: string;
  body: string;
  data: NotificationPayloadData;
  delaySeconds?: number;
}

interface NotificationContextValue {
  permissionStatus: NotificationPermissionStatus;
  pushToken: string | null;
  isRegistered: boolean;
  isFallbackToken: boolean;
  backendSynced: boolean;
  statusNote: string | null;
  isRegistering: boolean;
  isSending: boolean;
  notificationHistory: NotificationHistoryItem[];
  lastTappedNotification: NotificationHistoryItem | null;
  unreadCount: number;
  refreshPermission: () => Promise<void>;
  registerDevice: () => Promise<void>;
  sendPush: (params: SendNotificationInput) => Promise<void>;
  sendLocalTest: (params: SendNotificationInput) => Promise<void>;
  openNotificationTarget: (item: NotificationHistoryItem) => void;
  clearHistory: () => Promise<void>;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function resolveRouteForScreen(screen?: NotificationTargetScreen): string {
  switch (screen) {
    case 'parking':
      return '/(tabs)/parking';
    case 'location':
      return '/location';
    case 'prediction':
      return '/(tabs)/prediction';
    case 'history':
      return '/(tabs)/history';
    case 'notifications':
    default:
      return '/notifications';
  }
}

function getTargetScreenLabel(screen?: NotificationTargetScreen): string {
  switch (screen) {
    case 'parking':
      return 'Parkir';
    case 'location':
      return 'Peta GPS';
    case 'prediction':
      return 'Prediksi';
    case 'history':
      return 'Riwayat';
    default:
      return 'Notifikasi';
  }
}

function clampDelaySeconds(value?: number): number {
  return Math.min(60, Math.max(1, Math.round(value ?? 2)));
}

function parseNotificationPayload(raw: unknown): NotificationPayloadData {
  if (!raw || typeof raw !== 'object') {
    return { screen: 'notifications' };
  }
  const obj = raw as Record<string, unknown>;
  const validScreens: NotificationTargetScreen[] = [
    'parking',
    'location',
    'prediction',
    'history',
    'notifications',
  ];
  const screenCandidate = String(obj.screen || 'notifications') as NotificationTargetScreen;
  const screen: NotificationTargetScreen = validScreens.includes(screenCandidate)
    ? screenCandidate
    : 'notifications';

  return {
    screen,
    areaId: typeof obj.areaId === 'string' ? obj.areaId : undefined,
    notificationId:
      typeof obj.notificationId === 'string' ? obj.notificationId : undefined,
    category: typeof obj.category === 'string' ? obj.category : undefined,
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();

  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isFallbackToken, setIsFallbackToken] = useState<boolean>(false);
  const [backendSynced, setBackendSynced] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>(
    []
  );
  const [lastTappedNotification, setLastTappedNotification] =
    useState<NotificationHistoryItem | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const handledResponseIdRef = useRef<string | null>(null);
  const webTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Bersihkan seluruh timer web saat provider unmount
  useEffect(() => {
    const timers = webTimersRef.current;
    return () => {
      for (const timerId of timers) {
        clearTimeout(timerId);
      }
      timers.length = 0;
    };
  }, []);

  const refreshPermission = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionStatus(status);
  }, []);

  // Muat token & riwayat tersimpan saat mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshPermission();
      if (Platform.OS === 'android') {
        await setupAndroidNotificationChannel();
      }
      const [storedToken, storedHistory] = await Promise.all([
        getStoredPushTokenInfo(),
        getData<NotificationHistoryItem[]>(NOTIFICATION_HISTORY_STORAGE_KEY),
      ]);
      if (!mounted) return;
      if (storedToken?.token) {
        setPushToken(storedToken.token);
        setIsFallbackToken(Boolean(storedToken.isFallbackToken));
      }
      if (Array.isArray(storedHistory)) {
        setNotificationHistory(storedHistory);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshPermission]);

  const appendHistory = useCallback((item: NotificationHistoryItem) => {
    setNotificationHistory((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      const next = exists
        ? prev.map((x) => (x.id === item.id ? { ...x, ...item } : x))
        : [item, ...prev].slice(0, 30);
      saveData(NOTIFICATION_HISTORY_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const openNotificationTarget = useCallback(
    (item: NotificationHistoryItem) => {
      const updatedItem: NotificationHistoryItem = { ...item, tapped: true };
      setLastTappedNotification(updatedItem);
      appendHistory(updatedItem);
      const targetRoute = resolveRouteForScreen(item.data.screen);
      router.push(targetRoute as any);
    },
    [appendHistory, router]
  );

  const handleNotificationTapResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier;
      if (handledResponseIdRef.current === identifier) return;
      handledResponseIdRef.current = identifier;

      const content = response.notification.request.content;
      const payload = parseNotificationPayload(content.data);
      const tappedItem: NotificationHistoryItem = {
        id: identifier || `notif_${Date.now()}`,
        title: content.title || 'Notifikasi PARKIN',
        body: content.body || '',
        data: payload,
        receivedAt: response.notification.date || Date.now(),
        tapped: true,
        source: 'push',
      };

      console.log('[PARKIN Notif Response]', payload);
      openNotificationTarget(tappedItem);
    },
    [openNotificationTarget]
  );

  // Pasang listener foreground received & tap response (khusus native)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const payload = parseNotificationPayload(content.data);
      const item: NotificationHistoryItem = {
        id: notification.request.identifier || `notif_${Date.now()}`,
        title: content.title || 'Notifikasi PARKIN',
        body: content.body || '',
        data: payload,
        receivedAt: notification.date || Date.now(),
        tapped: false,
        source: 'push',
      };
      appendHistory(item);
      setUnreadCount((c) => c + 1);
      toast.info(item.body || 'Anda menerima pemberitahuan baru.', {
        title: item.title,
        duration: 6000,
        action: {
          label: `Buka ${getTargetScreenLabel(payload.screen)} →`,
          onPress: () => openNotificationTarget(item),
        },
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationTapResponse(response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [appendHistory, handleNotificationTapResponse, openNotificationTarget, toast]);

  // Tangani Cold Start (aplikasi dibuka dari kondisi terminated setelah klik notifikasi)
  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated) return;
    let mounted = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!mounted || !response) return;
        handleNotificationTapResponse(response);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, handleNotificationTapResponse]);

  /**
   * Jadwalkan notifikasi interaktif di Web setelah `safeSeconds` detik, lengkap dengan
   * klik toast & klik notifikasi browser yang langsung membuka halaman tujuan.
   */
  const scheduleWebInteractiveNotification = useCallback(
    (params: {
      title: string;
      body: string;
      data: NotificationPayloadData;
      delaySeconds: number;
      source: 'push' | 'local';
    }) => {
      const safeSeconds = clampDelaySeconds(params.delaySeconds);
      toast.info(
        `Timer aktif: notifikasi "${params.title}" akan muncul dalam ${safeSeconds} detik.`,
        { title: 'Timer Notifikasi' }
      );

      const timerId = setTimeout(() => {
        const item: NotificationHistoryItem = {
          id: `${params.source}_web_${Date.now()}`,
          title: params.title,
          body: params.body,
          data: params.data,
          receivedAt: Date.now(),
          tapped: false,
          source: params.source,
        };
        appendHistory(item);
        setUnreadCount((c) => c + 1);

        toast.info(params.body, {
          title: params.title,
          duration: 7000,
          action: {
            label: `Buka ${getTargetScreenLabel(params.data.screen)} →`,
            onPress: () => openNotificationTarget(item),
          },
        });

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          window.Notification.permission === 'granted'
        ) {
          try {
            const browserNotif = new window.Notification(params.title, {
              body: params.body,
            });
            browserNotif.onclick = () => {
              window.focus();
              openNotificationTarget(item);
              browserNotif.close();
            };
          } catch {
            // Abaikan pembatasan browser tertentu
          }
        }
      }, safeSeconds * 1000);

      webTimersRef.current.push(timerId);
    },
    [appendHistory, openNotificationTarget, toast]
  );

  const registerDevice = useCallback(async () => {
    setIsRegistering(true);
    try {
      const res = await registerDeviceForPushNotifications(user?.id);
      setPermissionStatus(res.permissionStatus);
      setStatusNote(res.message);
      if (res.token) {
        setPushToken(res.token);
        setIsFallbackToken(res.isFallbackToken);
      }
      setBackendSynced(res.backendSynced);

      if (res.success) {
        toast.success(res.message, { title: 'Perangkat Terdaftar' });
      } else {
        toast.warning(res.message, { title: 'Izin Diperlukan' });
      }
    } finally {
      setIsRegistering(false);
    }
  }, [toast, user?.id]);

  const sendPush = useCallback(
    async (params: SendNotificationInput) => {
      const safeSeconds = clampDelaySeconds(params.delaySeconds);
      setIsSending(true);
      try {
        const res = await sendPushNotification({
          token: pushToken,
          title: params.title,
          body: params.body,
          data: params.data,
        });

        if (res.success) {
          if (Platform.OS === 'web' || res.simulated) {
            scheduleWebInteractiveNotification({
              title: params.title,
              body: params.body,
              data: params.data,
              delaySeconds: safeSeconds,
              source: 'push',
            });
          } else {
            const item: NotificationHistoryItem = {
              id: `push_${Date.now()}`,
              title: params.title,
              body: params.body,
              data: params.data,
              receivedAt: Date.now(),
              tapped: false,
              source: 'push',
            };
            appendHistory(item);
            setUnreadCount((c) => c + 1);
            toast.success(res.message, {
              title: 'Notifikasi Terkirim',
            });
          }
        } else if (res.offline) {
          if (Platform.OS === 'web') {
            scheduleWebInteractiveNotification({
              title: params.title,
              body: params.body,
              data: params.data,
              delaySeconds: safeSeconds,
              source: 'local',
            });
          } else {
            const localRes = await triggerLocalTestNotification({
              title: params.title,
              body: params.body,
              data: params.data,
              delaySeconds: safeSeconds,
            });
            if (localRes.success) {
              const item: NotificationHistoryItem = {
                id: `local_fb_${Date.now()}`,
                title: params.title,
                body: params.body,
                data: params.data,
                receivedAt: Date.now(),
                tapped: false,
                source: 'local',
              };
              appendHistory(item);
              setUnreadCount((c) => c + 1);
              toast.info(
                `Server lokal tidak aktif; notifikasi dijadwalkan secara lokal dalam ${safeSeconds} detik.`,
                { title: 'Mode Fallback Lokal' }
              );
            } else {
              toast.warning(res.message, { title: 'Server Tidak Terjangkau' });
            }
          }
        } else {
          toast.error(res.message, { title: 'Gagal Mengirim' });
        }
      } finally {
        setIsSending(false);
      }
    },
    [appendHistory, pushToken, scheduleWebInteractiveNotification, toast]
  );

  const sendLocalTest = useCallback(
    async (params: SendNotificationInput) => {
      const safeSeconds = clampDelaySeconds(params.delaySeconds);
      setIsSending(true);
      try {
        if (Platform.OS === 'web') {
          scheduleWebInteractiveNotification({
            title: params.title,
            body: params.body,
            data: params.data,
            delaySeconds: safeSeconds,
            source: 'local',
          });
          return;
        }

        const res = await triggerLocalTestNotification({
          title: params.title,
          body: params.body,
          data: params.data,
          delaySeconds: safeSeconds,
        });
        if (res.success) {
          toast.success(res.message, { title: 'Timer Notifikasi Aktif' });
        } else {
          toast.warning(res.message, { title: 'Gagal Menjadwalkan' });
        }
      } finally {
        setIsSending(false);
      }
    },
    [scheduleWebInteractiveNotification, toast]
  );

  const clearHistory = useCallback(async () => {
    setNotificationHistory([]);
    setLastTappedNotification(null);
    setUnreadCount(0);
    await saveData(NOTIFICATION_HISTORY_STORAGE_KEY, []);
    toast.info('Riwayat notifikasi telah dibersihkan.');
  }, [toast]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        permissionStatus,
        pushToken,
        isRegistered: Boolean(pushToken),
        isFallbackToken,
        backendSynced,
        statusNote,
        isRegistering,
        isSending,
        notificationHistory,
        lastTappedNotification,
        unreadCount,
        refreshPermission,
        registerDevice,
        sendPush,
        sendLocalTest,
        openNotificationTarget,
        clearHistory,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications harus digunakan di dalam NotificationProvider');
  }
  return ctx;
}
