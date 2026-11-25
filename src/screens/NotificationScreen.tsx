/**
 * PARKIN — Smart Campus Parking
 * Screen: NotificationScreen (Pusat Pengaturan & Uji Notifikasi PARKIN)
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  NotificationPermissionStatus,
  NotificationTargetScreen,
} from '../types/notification';

interface QuickTemplate {
  key: string;
  label: string;
  title: string;
  body: string;
  target: NotificationTargetScreen;
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    key: 'slot',
    label: 'Slot Tersedia',
    title: 'Slot Parkir Tersedia',
    body: 'PARKIRAN 2 (Utama UMM III) kini memiliki 45 slot kosong.',
    target: 'parking',
  },
  {
    key: 'campus',
    label: 'Area Kampus',
    title: 'Info Peta Kampus',
    body: 'Cek posisi parkir terdekat dari lokasi Anda sekarang.',
    target: 'location',
  },
  {
    key: 'busy',
    label: 'Prediksi Ramai',
    title: 'Prediksi Jam Padat',
    body: 'Area parkir diprediksi ramai pukul 09.00 WIB. Berangkat lebih awal.',
    target: 'prediction',
  },
];

const TARGET_OPTIONS: { key: NotificationTargetScreen; label: string }[] = [
  { key: 'parking', label: 'Parkir' },
  { key: 'location', label: 'Peta GPS' },
  { key: 'prediction', label: 'Prediksi' },
  { key: 'history', label: 'Riwayat' },
];

const TIMER_PRESETS = [2, 5, 10, 15];

function getTargetLabel(screen: NotificationTargetScreen): string {
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

function getPermissionBadge(status: NotificationPermissionStatus): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case 'granted':
      return { label: 'Diizinkan', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.16)' };
    case 'denied':
      return { label: 'Ditolak', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
    case 'unsupported':
      return { label: 'Mode Web', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.16)' };
    default:
      return { label: 'Belum Diminta', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' };
  }
}

function formatClock(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
}

export default function NotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const toast = useToast();

  const {
    permissionStatus,
    pushToken,
    isRegistered,
    isFallbackToken,
    backendSynced,
    statusNote,
    isRegistering,
    isSending,
    notificationHistory,
    lastTappedNotification,
    registerDevice,
    sendPush,
    sendLocalTest,
    openNotificationTarget,
    clearHistory,
    markAllRead,
  } = useNotifications();

  const [titleInput, setTitleInput] = useState<string>(QUICK_TEMPLATES[0].title);
  const [bodyInput, setBodyInput] = useState<string>(QUICK_TEMPLATES[0].body);
  const [targetScreen, setTargetScreen] = useState<NotificationTargetScreen>(
    QUICK_TEMPLATES[0].target
  );
  const [delaySeconds, setDelaySeconds] = useState<number>(5);
  const [customDelayText, setCustomDelayText] = useState<string>('5');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const handleCopyToken = async () => {
    if (!pushToken) return;
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(pushToken);
        setCopiedToken(true);
        toast.success('Push Token disalin ke clipboard.');
        setTimeout(() => setCopiedToken(false), 2000);
        return;
      } catch {
        // Fallback ke Alert di bawah
      }
    }
    Alert.alert('Push Token Perangkat', pushToken);
  };

  const handleApplyTemplate = (tpl: QuickTemplate) => {
    setTitleInput(tpl.title);
    setBodyInput(tpl.body);
    setTargetScreen(tpl.target);
  };

  const handleSelectTimerPreset = (sec: number) => {
    setDelaySeconds(sec);
    setCustomDelayText(String(sec));
  };

  const handleCustomDelayChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    setCustomDelayText(digitsOnly);
    const parsed = parseInt(digitsOnly, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      setDelaySeconds(Math.min(60, parsed));
    }
  };

  const handleSendPush = async () => {
    const cleanTitle = titleInput.trim();
    const cleanBody = bodyInput.trim();
    if (!cleanTitle || !cleanBody) {
      toast.warning('Judul dan isi pesan notifikasi wajib diisi.', {
        title: 'Input Kosong',
      });
      return;
    }
    await sendPush({
      title: cleanTitle,
      body: cleanBody,
      delaySeconds,
      data: {
        screen: targetScreen,
        notificationId: `pn_${Date.now()}`,
        category: 'parkin_info',
      },
    });
  };

  const handleSendLocal = async () => {
    const cleanTitle = titleInput.trim();
    const cleanBody = bodyInput.trim();
    if (!cleanTitle || !cleanBody) {
      toast.warning('Judul dan isi pesan notifikasi wajib diisi.', {
        title: 'Input Kosong',
      });
      return;
    }
    await sendLocalTest({
      title: cleanTitle,
      body: cleanBody,
      delaySeconds,
      data: {
        screen: targetScreen,
        notificationId: `loc_${Date.now()}`,
        category: 'parkin_local',
      },
    });
  };

  const permBadge = getPermissionBadge(permissionStatus);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
            onPress={handleBack}
            accessibilityLabel="Kembali"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Notifikasi PARKIN
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Pengaturan perangkat & pemberitahuan parkir
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* KARTU 1 — STATUS PERANGKAT & PUSH TOKEN                      */}
        {/* ============================================================ */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Status Perangkat
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Izin sistem & registrasi Push Token
                </Text>
              </View>
            </View>

            <View style={[styles.badge, { backgroundColor: permBadge.bg }]}>
              <View style={[styles.dot, { backgroundColor: permBadge.color }]} />
              <Text style={[styles.badgeText, { color: permBadge.color }]}>
                {permBadge.label}
              </Text>
            </View>
          </View>

          {/* Status Registrasi & Sinkronisasi Backend */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isRegistered
                    ? 'rgba(34, 197, 94, 0.14)'
                    : 'rgba(100, 116, 139, 0.14)',
                },
              ]}
            >
              <Ionicons
                name={isRegistered ? 'checkmark-circle' : 'ellipse-outline'}
                size={14}
                color={isRegistered ? '#22C55E' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: isRegistered ? '#22C55E' : colors.textSecondary },
                ]}
              >
                {isRegistered ? 'Perangkat Terdaftar ✓' : 'Belum Terdaftar'}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: backendSynced
                    ? colors.primary + '1A'
                    : 'rgba(100, 116, 139, 0.14)',
                },
              ]}
            >
              <Ionicons
                name={backendSynced ? 'cloud-done-outline' : 'cloud-offline-outline'}
                size={14}
                color={backendSynced ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: backendSynced ? colors.primary : colors.textSecondary },
                ]}
              >
                {backendSynced ? 'Tersinkron Server' : 'Penyimpanan Lokal'}
              </Text>
            </View>
          </View>

          {permissionStatus === 'denied' && (
            <View
              style={[
                styles.warningBox,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                  borderColor: colors.danger,
                },
              ]}
            >
              <Text style={[styles.warningText, { color: colors.danger }]}>
                Izin notifikasi ditolak pada perangkat ini. Aktifkan izin melalui Pengaturan agar pemberitahuan parkir dapat muncul.
              </Text>
              <TouchableOpacity
                style={[styles.settingsBtn, { backgroundColor: colors.danger }]}
                onPress={() => Linking.openSettings().catch(() => {})}
              >
                <Ionicons name="settings-outline" size={14} color="#fff" />
                <Text style={styles.settingsBtnText}>Buka Pengaturan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Kotak Push Token */}
          <View
            style={[
              styles.tokenBox,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={styles.tokenHeaderRow}>
              <Text style={[styles.tokenLabel, { color: colors.textSecondary }]}>
                Push Token {isFallbackToken ? '(Mode Preview/Lokal)' : '(Expo Push)'}
              </Text>
              {pushToken && (
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={handleCopyToken}
                  accessibilityLabel="Salin Push Token"
                >
                  <Ionicons
                    name={copiedToken ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                    {copiedToken ? 'Tersalin' : 'Salin Token'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text
              style={[styles.tokenText, { color: colors.textPrimary }]}
              selectable
              numberOfLines={3}
            >
              {pushToken || 'Token belum dibuat. Tekan "Daftarkan Perangkat" di bawah.'}
            </Text>
          </View>

          {statusNote ? (
            <Text style={[styles.statusNoteText, { color: colors.textSecondary }]}>
              {statusNote}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: isRegistering ? 0.75 : 1 },
            ]}
            onPress={registerDevice}
            disabled={isRegistering}
            accessibilityLabel="Daftarkan perangkat untuk notifikasi"
          >
            {isRegistering ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="notifications-circle-outline" size={18} color="#fff" />
            )}
            <Text style={styles.primaryBtnText}>
              {isRegistering ? 'Mendaftarkan Perangkat…' : 'Daftarkan Perangkat'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================ */}
        {/* KARTU 2 — UJI KIRIM NOTIFIKASI                               */}
        {/* ============================================================ */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="paper-plane-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Uji Kirim Notifikasi
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Simulasi pemberitahuan & navigasi halaman tujuan
                </Text>
              </View>
            </View>
          </View>

          {/* 3 Chip Template Cepat */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Template Cepat PARKIN:
          </Text>
          <View style={styles.chipRow}>
            {QUICK_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.key}
                style={[
                  styles.templateChip,
                  { backgroundColor: colors.primary + '14', borderColor: colors.primary + '44' },
                ]}
                onPress={() => handleApplyTemplate(tpl)}
              >
                <Text style={[styles.templateChipText, { color: colors.primary }]}>
                  {tpl.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Judul Notifikasi:
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={titleInput}
            onChangeText={setTitleInput}
            placeholder="Masukkan judul notifikasi"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Isi Pesan:
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={bodyInput}
            onChangeText={setBodyInput}
            placeholder="Masukkan isi pesan pemberitahuan"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Halaman Tujuan Saat Diketuk:
          </Text>
          <View style={styles.targetRow}>
            {TARGET_OPTIONS.map((opt) => {
              const active = targetScreen === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.targetChip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setTargetScreen(opt.key)}
                >
                  <Text
                    style={[
                      styles.targetChipText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Timer Kemunculan Notifikasi (1–60 detik):
          </Text>
          <View style={styles.timerRow}>
            {TIMER_PRESETS.map((sec) => {
              const active = delaySeconds === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.timerChip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectTimerPreset(sec)}
                >
                  <Text
                    style={[
                      styles.timerChipText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {sec} dtk
                  </Text>
                </TouchableOpacity>
              );
            })}
            <View
              style={[
                styles.customTimerWrap,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.customTimerInput, { color: colors.textPrimary }]}
                value={customDelayText}
                onChangeText={handleCustomDelayChange}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="5"
                placeholderTextColor={colors.textTertiary}
                accessibilityLabel="Input detik kustom timer notifikasi"
              />
              <Text style={[styles.customTimerUnit, { color: colors.textSecondary }]}>
                dtk
              </Text>
            </View>
          </View>

          <View style={styles.sendActionsCol}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, opacity: isSending ? 0.75 : 1 },
              ]}
              onPress={handleSendPush}
              disabled={isSending}
              accessibilityLabel="Kirim Push Notification"
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={16} color="#fff" />
              )}
              <Text style={styles.primaryBtnText}>Kirim Push Notification</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
              onPress={handleSendLocal}
              disabled={isSending}
              accessibilityLabel={`Kirim Notifikasi Lokal ${delaySeconds} detik`}
            >
              <Ionicons name="alarm-outline" size={16} color={colors.primary} />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                Kirim Notifikasi Lokal ({delaySeconds} dtk)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* KARTU 3 — INTERAKSI & RIWAYAT NOTIFIKASI                     */}
        {/* ============================================================ */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Riwayat Notifikasi ({notificationHistory.length})
                </Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  Ketuk item untuk membuka halaman tujuan
                </Text>
              </View>
            </View>

            {notificationHistory.length > 0 && (
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: colors.border }]}
                onPress={clearHistory}
                accessibilityLabel="Hapus riwayat notifikasi"
              >
                <Ionicons name="trash-outline" size={14} color={colors.danger} />
                <Text style={[styles.clearBtnText, { color: colors.danger }]}>
                  Hapus Riwayat
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {lastTappedNotification && (
            <View
              style={[
                styles.lastTappedBox,
                { backgroundColor: colors.primary + '14', borderColor: colors.primary + '44' },
              ]}
            >
              <View style={styles.lastTappedHeader}>
                <Ionicons name="open-outline" size={15} color={colors.primary} />
                <Text style={[styles.lastTappedLabel, { color: colors.primary }]}>
                  Notifikasi Terakhir Dibuka
                </Text>
              </View>
              <Text style={[styles.lastTappedTitle, { color: colors.textPrimary }]}>
                {lastTappedNotification.title}
              </Text>
              <Text style={[styles.lastTappedMeta, { color: colors.textSecondary }]}>
                Tujuan: {getTargetLabel(lastTappedNotification.data.screen)} (/{lastTappedNotification.data.screen}) •{' '}
                {formatClock(lastTappedNotification.receivedAt)}
              </Text>
            </View>
          )}

          {notificationHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={34} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Belum ada riwayat notifikasi masuk.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {notificationHistory.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.historyItem,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => openNotificationTarget(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.historyTopRow}>
                    <Text
                      style={[styles.historyTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.historyTime, { color: colors.textTertiary }]}>
                      {formatClock(item.receivedAt)}
                    </Text>
                  </View>
                  <Text
                    style={[styles.historyBody, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {item.body}
                  </Text>
                  <View style={styles.historyFooter}>
                    <View
                      style={[styles.targetBadge, { backgroundColor: colors.primary + '1A' }]}
                    >
                      <Text style={[styles.targetBadgeText, { color: colors.primary }]}>
                        Tujuan: {getTargetLabel(item.data.screen)}
                      </Text>
                    </View>
                    {item.tapped && (
                      <Text style={[styles.tappedTag, { color: colors.success }]}>
                        ✓ Dibuka
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    gap: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  warningBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 17,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  settingsBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tokenBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tokenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  statusNoteText: {
    fontSize: 11,
    lineHeight: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: -4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  templateChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  targetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetChip: {
    flexGrow: 1,
    minWidth: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  targetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  timerChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customTimerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    minWidth: 74,
  },
  customTimerInput: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 26,
    textAlign: 'center',
    paddingVertical: 2,
  },
  customTimerUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  sendActionsCol: {
    gap: 8,
    marginTop: 4,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lastTappedBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  lastTappedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastTappedLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  lastTappedTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  lastTappedMeta: {
    fontSize: 11,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
  },
  historyItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  historyTime: {
    fontSize: 10,
  },
  historyBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tappedTag: {
    fontSize: 11,
    fontWeight: '700',
  },
});
