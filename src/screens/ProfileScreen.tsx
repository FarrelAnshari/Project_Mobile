/**
 * PARKIN — Smart Campus Parking
 * Screen: Profil
 *
 * User profile, local storage preferences (AsyncStorage),
 * secure token info (SecureStore), and logout flow with confirmation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserPreferences,
  saveUserPreferences,
  getNotificationSettings,
  saveNotificationSettings,
} from '../services/storageService';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useResponsive } from '../utils/responsive';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { horizontalPadding } = useResponsive();

  // Preferences state (AsyncStorage)
  const [notifAlmostFull, setNotifAlmostFull] = useState(true);
  const [notifFull, setNotifFull] = useState(true);
  const [notifPrediction, setNotifPrediction] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    async function loadStoredSettings() {
      try {
        const [prefs, notifs] = await Promise.all([
          getUserPreferences(),
          getNotificationSettings(),
        ]);
        setLargeText(prefs.largeText);
        setHighContrast(prefs.highContrast);
        setNotifAlmostFull(notifs.notifAlmostFull);
        setNotifFull(notifs.notifFull);
        setNotifPrediction(notifs.notifPrediction);
      } catch {
        // Fallback default
      }
    }
    loadStoredSettings();
  }, []);

  // Update handlers with persistent AsyncStorage write
  const handleToggleNotifAlmostFull = async (val: boolean) => {
    setNotifAlmostFull(val);
    await saveNotificationSettings({ notifAlmostFull: val });
  };

  const handleToggleNotifFull = async (val: boolean) => {
    setNotifFull(val);
    await saveNotificationSettings({ notifFull: val });
  };

  const handleToggleNotifPrediction = async (val: boolean) => {
    setNotifPrediction(val);
    await saveNotificationSettings({ notifPrediction: val });
  };

  const handleToggleLargeText = async (val: boolean) => {
    setLargeText(val);
    await saveUserPreferences({ largeText: val });
  };

  const handleToggleHighContrast = async (val: boolean) => {
    setHighContrast(val);
    await saveUserPreferences({ highContrast: val });
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      router.replace('/(auth)/login' as any);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AF';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={[styles.profileCard, Shadow.md]}>
          <View
            style={styles.avatarCircle}
            accessible={false}
            importantForAccessibility="no"
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={styles.profileName}
              accessibilityRole="header"
            >
              {user?.name || 'Ahmad Fauzi'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || 'mahasiswa@kampus.ac.id'}</Text>
            <Text style={styles.profileNim}>NIM: {user?.nim || '2021310042'}</Text>
            <Text style={styles.profileProdi}>{user?.prodi || 'Teknik Informatika'}</Text>
            <Text style={styles.profileAngkatan}>
              Angkatan {user?.angkatan || '2021'}
            </Text>
          </View>
        </View>

        {/* TASK 02: Storage & Security Architecture Badge Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Penyimpanan & Keamanan Data (TASK 02)
          </Text>
          <View style={[styles.securityCard, Shadow.sm]}>
            <View style={styles.securityRow}>
              <View style={styles.securityDotActive} />
              <View style={styles.securityTextCol}>
                <Text style={styles.securityItemTitle}>Token Sesi & Autentikasi</Text>
                <Text style={styles.securityItemDesc}>
                  Disimpan terenkripsi di <Text style={styles.highlightText}>Expo SecureStore</Text> (Keystore / Keychain perangkat). Tidak disimpan di AsyncStorage.
                </Text>
              </View>
            </View>

            <View style={styles.securityDivider} />

            <View style={styles.securityRow}>
              <View style={[styles.securityDotActive, { backgroundColor: Colors.primary }]} />
              <View style={styles.securityTextCol}>
                <Text style={styles.securityItemTitle}>Preferensi & Pengaturan Tampilan</Text>
                <Text style={styles.securityItemDesc}>
                  Disimpan lokal secara efisien di <Text style={styles.highlightText}>AsyncStorage</Text> (Local Storage non-sensitif).
                </Text>
              </View>
            </View>

            <View style={styles.securityDivider} />

            <View style={styles.securityRow}>
              <View style={[styles.securityDotActive, { backgroundColor: Colors.textTertiary }]} />
              <View style={styles.securityTextCol}>
                <Text style={styles.securityItemTitle}>Privasi Password</Text>
                <Text style={styles.securityItemDesc}>
                  Password tidak pernah disimpan dalam bentuk plaintext di media penyimpanan mana pun.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notification settings (AsyncStorage) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Preferensi Notifikasi (Local Storage)
          </Text>
          <View style={[styles.settingsList, Shadow.sm]}>
            <SettingRow
              label="Area Hampir Penuh"
              description="Notifikasi saat area parkir terisi lebih dari 80%"
              value={notifAlmostFull}
              onValueChange={handleToggleNotifAlmostFull}
              accessibilityLabel="Notifikasi area hampir penuh"
            />
            <SettingRow
              label="Area Penuh"
              description="Notifikasi saat area parkir 100% terisi"
              value={notifFull}
              onValueChange={handleToggleNotifFull}
              accessibilityLabel="Notifikasi area penuh"
            />
            <SettingRow
              label="Prediksi Pagi"
              description="Prediksi kepadatan parkir setiap pagi hari"
              value={notifPrediction}
              onValueChange={handleToggleNotifPrediction}
              accessibilityLabel="Notifikasi prediksi kepadatan pagi"
              isLast
            />
          </View>
        </View>

        {/* Accessibility settings (AsyncStorage) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Aksesibilitas (Local Storage)
          </Text>
          <View style={[styles.settingsList, Shadow.sm]}>
            <SettingRow
              label="Teks Lebih Besar"
              description="Perbesar ukuran teks untuk keterbacaan yang lebih baik"
              value={largeText}
              onValueChange={handleToggleLargeText}
              accessibilityLabel="Aktifkan teks lebih besar"
            />
            <SettingRow
              label="Kontras Tinggi"
              description="Tingkatkan kontras warna untuk visibilitas lebih baik"
              value={highContrast}
              onValueChange={handleToggleHighContrast}
              accessibilityLabel="Aktifkan mode kontras tinggi"
              isLast
            />
          </View>
          <Text style={styles.a11yNote}>
            PARKIN dirancang dengan standar aksesibilitas WCAG. Seluruh
            komponen mendukung screen reader dan navigasi keyboard.
          </Text>
        </View>

        {/* About PARKIN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Tentang PARKIN
          </Text>
          <View style={[styles.aboutCard, Shadow.sm]}>
            <View style={styles.aboutHeader}>
              <View style={styles.aboutLogoBox}>
                <Text style={styles.aboutLogoText}>P</Text>
              </View>
              <View>
                <Text style={styles.aboutAppName}>PARKIN</Text>
                <Text style={styles.aboutTagline}>Smart Campus Parking</Text>
              </View>
            </View>
            <Text style={styles.aboutVersion}>Versi 1.1.0 · Auth & Storage Flow</Text>
            <Text style={styles.aboutDesc}>
              PARKIN membantu mahasiswa memantau kondisi parkir kampus secara
              efisien, mengurangi waktu mencari tempat parkir, dan meningkatkan
              mobilitas di lingkungan kampus.
            </Text>
            <View style={styles.aboutBadges}>
              <AboutBadge label="Expo Go" />
              <AboutBadge label="React Native" />
              <AboutBadge label="SecureStore" />
              <AboutBadge label="AsyncStorage" />
            </View>
            <View style={styles.aboutDisclaimer}>
              <Text style={styles.aboutDisclaimerTitle}>Catatan Autentikasi</Text>
              <Text style={styles.aboutDisclaimerText}>
                Autentikasi saat ini berjalan dalam Mode Prototype Mahasiswa. Token sesi disimpan secara aman menggunakan Expo SecureStore.
              </Text>
            </View>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.section}>
          {[
            { label: 'Kebijakan Privasi' },
            { label: 'Syarat & Ketentuan' },
            { label: 'Bantuan' },
            { label: 'Hubungi Kami' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, Shadow.sm]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint={`Membuka halaman ${item.label}`}
            >
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow} accessibilityElementsHidden>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, Shadow.sm]}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Keluar dari akun PARKIN"
            accessibilityHint="Membuka dialog konfirmasi untuk keluar dari sesi"
          >
            <Text style={styles.logoutBtnText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.md]}>
            <View style={styles.modalAlertIconBox}>
              <Text style={styles.modalAlertIcon}>!</Text>
            </View>
            <Text style={styles.modalTitle}>Konfirmasi Keluar</Text>
            <Text style={styles.modalMessage}>
              Apakah Anda yakin ingin keluar dari akun <Text style={{ fontWeight: 'bold' }}>{user?.name || 'Mahasiswa'}</Text>? Sesi autentikasi Anda akan dihapus secara aman dari perangkat ini.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel="Batal keluar"
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel="Ya, konfirmasi keluar"
              >
                {isLoggingOut ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Ya, Keluar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ======== SettingRow ========
function SettingRow({
  label,
  description,
  value,
  onValueChange,
  accessibilityLabel,
  isLast = false,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.settingRow, !isLast && styles.settingRowBorder]}>
      <View style={styles.settingTextBlock}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: Colors.border,
          true: Colors.primaryLight,
        }}
        thumbColor={value ? Colors.primary : Colors.textTertiary}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

// ======== AboutBadge ========
function AboutBadge({ label }: { label: string }) {
  return (
    <View
      style={styles.aboutBadge}
      accessible={true}
      accessibilityLabel={label}
    >
      <Text style={styles.aboutBadgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.lg,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  profileNim: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  profileProdi: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  profileAngkatan: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  securityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  securityDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    marginTop: 4,
  },
  securityTextCol: {
    flex: 1,
  },
  securityItemTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  securityItemDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  highlightText: {
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  securityDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  settingsList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 60,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingTextBlock: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  a11yNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
    paddingHorizontal: Spacing.xs,
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aboutLogoBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogoText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  aboutAppName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  aboutTagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  aboutVersion: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  aboutDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  aboutBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  aboutBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aboutBadgeLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  aboutDisclaimer: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  aboutDisclaimerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.warning,
    marginBottom: 2,
  },
  aboutDisclaimerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuArrow: {
    fontSize: FontSize.xl,
    color: Colors.textTertiary,
  },
  logoutBtn: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  logoutBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalAlertIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalAlertIcon: {
    fontSize: FontSize.xl,
    color: Colors.danger,
    fontWeight: FontWeight.bold,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalCancelText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalConfirmText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
