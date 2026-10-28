/**
 * PARKIN — Smart Campus Parking
 * Screen: Profil
 *
 * Menampilkan data user yang sedang login.
 * Nama dan email berasal dari AuthContext (bukan hardcoded).
 * Fitur: Edit profil, Ubah password, Logout, Notifikasi, Tentang.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useResponsive } from '../utils/responsive';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { saveData, STORAGE_KEYS } from '../services/asyncStorageService';
import { getAccessToken } from '../services/secureStorageService';

// ============================================================
// Types
// ============================================================
interface NotifSettings {
  almostFull: boolean;
  full: boolean;
  prediction: boolean;
}

interface A11ySettings {
  largeText: boolean;
  highContrast: boolean;
}

// ============================================================
// Screen
// ============================================================
export default function ProfileScreen() {
  const router = useRouter();
  const { horizontalPadding } = useResponsive();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { themeMode, isDark, colors, setThemeMode, toggleTheme } = useTheme();
  const { isOffline } = useOnlineStatus();

  // Settings state
  const [notif, setNotif] = useState<NotifSettings>({
    almostFull: true,
    full: true,
    prediction: false,
  });
  const [a11y, setA11y] = useState<A11ySettings>({
    largeText: false,
    highContrast: false,
  });

  // Edit profil modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editNameError, setEditNameError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Ubah password modal
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Status sesi modal (Task 03)
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  const handleOpenSessionModal = useCallback(async () => {
    try {
      const token = await getAccessToken();
      setSessionToken(token);
    } catch {
      setSessionToken(null);
    }
    setSessionModalVisible(true);
  }, []);

  // Task 03: Logout confirmation & redirect ke /login
  const handleLogout = useCallback(() => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Keluar dari PARKIN?\nKamu perlu login kembali untuk mengakses aplikasi.');
      if (confirmed) {
        logout().then(() => {
          router.replace('/login' as any);
        });
      }
    } else {
      Alert.alert(
        'Keluar dari PARKIN?',
        'Kamu perlu login kembali untuk mengakses aplikasi.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Keluar',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/login' as any);
            },
          },
        ]
      );
    }
  }, [logout, router]);

  // Save notification settings to AsyncStorage
  async function handleNotifChange(
    key: keyof NotifSettings,
    value: boolean
  ) {
    const updated = { ...notif, [key]: value };
    setNotif(updated);
    await saveData(STORAGE_KEYS.NOTIFICATION_SETTINGS, updated);
  }

  // Save a11y settings
  async function handleA11yChange(key: keyof A11ySettings, value: boolean) {
    const updated = { ...a11y, [key]: value };
    setA11y(updated);
    await saveData(STORAGE_KEYS.ACCESSIBILITY_SETTINGS, updated);
  }

  // Save profile edits
  async function handleSaveProfile() {
    setEditNameError('');
    if (!editName.trim()) {
      setEditNameError('Nama tidak boleh kosong.');
      return;
    }
    if (editName.trim().length < 2) {
      setEditNameError('Nama minimal 2 karakter.');
      return;
    }
    setEditLoading(true);
    try {
      const success = await updateProfile({ name: editName.trim() });
      if (success) {
        setEditModalVisible(false);
      } else {
        setEditNameError('Gagal memperbarui nama. Coba lagi.');
      }
    } finally {
      setEditLoading(false);
    }
  }

  // Change password
  async function handleChangePassword() {
    setPwError('');
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('Semua kolom wajib diisi.');
      return;
    }
    if (newPw.length < 6) {
      setPwError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Password baru dan konfirmasi tidak sama.');
      return;
    }
    setPwLoading(true);
    try {
      const result = await changePassword(currentPw, newPw);
      if (result.success) {
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setPwModalVisible(false);
        Alert.alert('Berhasil', 'Password berhasil diubah.');
      } else {
        setPwError(result.error ?? 'Gagal mengubah password.');
      }
    } finally {
      setPwLoading(false);
    }
  }

  // Inisial avatar dari nama user
  const avatarInitial = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* PURPLE HEADER SECTION */}
      <View style={[styles.purpleHeader, { backgroundColor: isDark ? colors.surface : colors.primary }]}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <SafeAreaView>
          <View style={[styles.headerInner, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Header Profil (Overlapping) ===== */}
        <View style={[styles.overlappingCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={[styles.profileName, { color: colors.textPrimary }]}
              accessibilityRole="header"
              numberOfLines={1}
            >
              {user?.name ?? 'Pengguna'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email ?? '-'}
            </Text>
            <View style={[styles.accountBadge, { backgroundColor: colors.successBg }]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={[styles.accountBadgeText, { color: colors.success }]}>Akun Aktif</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => {
              setEditName(user?.name ?? '');
              setEditModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit profil pengguna"
          >
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ===== Akun ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
            Akun
          </Text>
          <View style={[styles.menuList, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <MenuRow
              icon="person-outline"
              label="Edit Profil"
              onPress={() => {
                setEditName(user?.name ?? '');
                setEditModalVisible(true);
              }}
              isLast
              accessibilityLabel="Edit profil"
            />
          </View>
        </View>

        {/* ===== Fitur Cepat ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
            Fitur Cepat
          </Text>
          <View style={[styles.menuList, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <MenuRow
              icon="qr-code-outline"
              label="Pindai QR Tiket Parkir"
              subtitle="Sensor kamera untuk check-in / check-out otomatis"
              onPress={() => router.push('/scanner' as any)}
              isLast
              accessibilityLabel="Buka pemindai QR tiket parkir"
            />
          </View>
        </View>

        {/* ===== Keamanan ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
            Keamanan
          </Text>
          <View style={[styles.menuList, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <MenuRow
              icon="lock-closed-outline"
              label="Ubah Password"
              onPress={() => {
                setCurrentPw('');
                setNewPw('');
                setConfirmPw('');
                setPwError('');
                setPwModalVisible(true);
              }}
              accessibilityLabel="Ubah password akun"
            />
            <MenuRow
              icon="phone-portrait-outline"
              label="Status Sesi"
              subtitle="Sesi aktif · Token SecureStore"
              onPress={handleOpenSessionModal}
              isLast
              accessibilityLabel="Lihat status sesi dan token autentikasi"
            />
          </View>
        </View>

        {/* ===== Tampilan (Dark & Light Mode) ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
            Tampilan
          </Text>
          <View style={[styles.settingsList, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <SettingRow
              label="Mode Gelap"
              description={isDark ? "Tema gelap aktif (nyaman di mata & hemat baterai)" : "Tema terang aktif"}
              value={isDark}
              onValueChange={toggleTheme}
              accessibilityLabel="Saklar mode gelap"
            />
            <View style={[styles.themePillsRow, { borderTopColor: colors.borderLight }]}>
              <Text style={[styles.themePillsLabel, { color: colors.textSecondary }]}>Preferensi Tema</Text>
              <View style={styles.themePillsGroup}>
                {(['system', 'light', 'dark'] as const).map((mode) => {
                  const active = themeMode === mode;
                  const modeLabel = mode === 'system' ? 'Sistem' : mode === 'light' ? 'Terang' : 'Gelap';
                  const modeIcon = mode === 'system' ? 'phone-portrait-outline' : mode === 'light' ? 'sunny' : 'moon';
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setThemeMode(mode)}
                      style={[
                        styles.themePillBtn,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? (isDark ? colors.primaryDark : colors.primary) : colors.background,
                        },
                      ]}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Pilih tema ${modeLabel}`}
                    >
                      <Ionicons
                        name={modeIcon as any}
                        size={13}
                        color={active ? '#FFFFFF' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.themePillBtnText,
                          { color: active ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {modeLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ===== Notifikasi ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
            Notifikasi
          </Text>
          <View style={[styles.settingsList, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <SettingRow
              label="Hampir Penuh"
              description="Notifikasi saat area ≥80% terisi"
              value={notif.almostFull}
              onValueChange={(v) => handleNotifChange('almostFull', v)}
              accessibilityLabel="Notifikasi area hampir penuh"
            />
            <SettingRow
              label="Area Penuh"
              description="Notifikasi saat area 100% terisi"
              value={notif.full}
              onValueChange={(v) => handleNotifChange('full', v)}
              accessibilityLabel="Notifikasi area penuh"
            />
            <SettingRow
              label="Prediksi Pagi"
              description="Prediksi kepadatan setiap pagi"
              value={notif.prediction}
              onValueChange={(v) => handleNotifChange('prediction', v)}
              accessibilityLabel="Notifikasi prediksi kepadatan pagi"
              isLast
            />
          </View>
        </View>

        {/* ===== Aksesibilitas ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
            Aksesibilitas
          </Text>
          <View style={[styles.settingsList, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <SettingRow
              label="Teks Lebih Besar"
              description="Perbesar ukuran teks untuk keterbacaan"
              value={a11y.largeText}
              onValueChange={(v) => handleA11yChange('largeText', v)}
              accessibilityLabel="Aktifkan teks lebih besar"
            />
            <SettingRow
              label="Kontras Tinggi"
              description="Tingkatkan kontras warna"
              value={a11y.highContrast}
              onValueChange={(v) => handleA11yChange('highContrast', v)}
              accessibilityLabel="Aktifkan mode kontras tinggi"
              isLast
            />
          </View>
          <Text style={[styles.a11yNote, { color: colors.textTertiary }]}>
            PARKIN dirancang dengan standar aksesibilitas WCAG. Seluruh
            komponen mendukung screen reader dan navigasi keyboard.
          </Text>
        </View>

        {/* ===== Tentang PARKIN ===== */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]} accessibilityRole="header">
            Tentang PARKIN
          </Text>
          <View style={[styles.aboutCard, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: isDark ? 1 : 0 }]}>
            <View style={styles.aboutHeader}>
              <View style={[styles.aboutLogoBox, { backgroundColor: colors.primary }]}>
                <Text style={styles.aboutLogo}>P</Text>
              </View>
              <View>
                <Text style={[styles.aboutAppName, { color: colors.textPrimary }]}>PARKIN</Text>
                <Text style={[styles.aboutTagline, { color: colors.textSecondary }]}>Smart Campus Parking</Text>
              </View>
            </View>
            <Text style={[styles.aboutVersion, { color: colors.textTertiary }]}>Versi 1.0.0 · Light & Dark Mode Ready</Text>
            <Text style={[styles.aboutDesc, { color: colors.textSecondary }]}>
              PARKIN membantu mahasiswa memantau kondisi parkir kampus secara
              efisien, mengurangi waktu mencari tempat parkir, dan meningkatkan
              mobilitas di lingkungan kampus.
            </Text>
            <View style={styles.aboutBadges}>
              <AboutBadge icon="phone-portrait-outline" label="Expo Go" />
              <AboutBadge icon="logo-react" label="React Native" />
              <AboutBadge icon="accessibility-outline" label="Accessible" />
              <AboutBadge icon="shield-checkmark-outline" label="SecureStore" />
              <AboutBadge icon="server-outline" label="AsyncStorage" />
            </View>
            <View style={[styles.aboutDisclaimerBox, { backgroundColor: colors.warningBg, borderColor: colors.warning + '40', borderWidth: 1 }]}>
              <Ionicons name="warning-outline" size={14} color={colors.warning} />
              <Text style={[styles.aboutDisclaimer, { color: colors.warning }]}>
                Data parkir dan prediksi merupakan simulasi/mock data.
                Authentication menggunakan mock service (bukan backend nyata).
              </Text>
            </View>
          </View>
        </View>

        {/* ===== Logout ===== */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, Shadow.sm, { backgroundColor: colors.surface, borderColor: colors.danger + '35', borderWidth: 1 }]}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Keluar dari akun PARKIN"
            accessibilityHint="Tekan untuk logout dari aplikasi"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ===== Modal Edit Profil ===== */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
        accessibilityViewIsModal
      >
        <KeyboardAvoidingView
          style={styles.modalFlex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Tutup modal edit profil"
              >
                <Text style={styles.modalCancel}>Batal</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={editLoading || isOffline}
                accessibilityRole="button"
                accessibilityLabel="Simpan perubahan profil"
                style={isOffline && { opacity: 0.4 }}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={[styles.modalSave, isOffline && { color: Colors.textTertiary }]}>
                    {isOffline ? 'Offline' : 'Simpan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              {isOffline && (
                <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5', marginBottom: Spacing.md }]}>
                  <Ionicons name="cloud-offline-outline" size={16} color={Colors.danger} />
                  <Text style={[styles.errorBannerText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                    Koneksi offline: Pengiriman data profil dinonaktifkan.
                  </Text>
                </View>
              )}

              {/* Avatar preview */}
              <View style={styles.editAvatarRow}>
                <View style={[styles.avatarCircle, styles.avatarCircleLg]}>
                  <Text style={styles.avatarTextLg}>
                    {editName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '?'}
                  </Text>
                </View>
              </View>

              {/* Nama */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                <View style={[styles.inputWrapper, !!editNameError && styles.inputError]}>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={(t) => {
                      setEditName(t);
                      if (editNameError) setEditNameError('');
                    }}
                    placeholder="Nama lengkap"
                    placeholderTextColor={Colors.textTertiary}
                    autoFocus
                    accessibilityLabel="Nama lengkap"
                  />
                </View>
                {!!editNameError && (
                  <Text style={styles.fieldError} accessibilityRole="alert">
                    {editNameError}
                  </Text>
                )}
              </View>

              {/* Email (read-only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email (tidak dapat diubah)</Text>
                <View style={[styles.inputWrapper, styles.inputReadonly]}>
                  <TextInput
                    style={[styles.input, styles.inputReadonlyText]}
                    value={user?.email ?? ''}
                    editable={false}
                    accessibilityLabel="Email (read-only)"
                  />
                  <Ionicons name="lock-closed-outline" size={16} color={Colors.textTertiary} />
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Modal Ubah Password ===== */}
      <Modal
        visible={pwModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPwModalVisible(false)}
        accessibilityViewIsModal
      >
        <KeyboardAvoidingView
          style={styles.modalFlex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setPwModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Tutup modal ubah password"
              >
                <Text style={styles.modalCancel}>Batal</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Ubah Password</Text>
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={pwLoading || isOffline}
                accessibilityRole="button"
                accessibilityLabel="Simpan password baru"
                style={isOffline && { opacity: 0.4 }}
              >
                {pwLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={[styles.modalSave, isOffline && { color: Colors.textTertiary }]}>
                    {isOffline ? 'Offline' : 'Simpan'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              {isOffline && (
                <View style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5', marginBottom: Spacing.md }]}>
                  <Ionicons name="cloud-offline-outline" size={16} color={Colors.danger} />
                  <Text style={[styles.errorBannerText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                    Koneksi offline: Pengubahan password dinonaktifkan.
                  </Text>
                </View>
              )}

              {!!pwError && (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                  <Text style={styles.errorBannerText}>{pwError}</Text>
                </View>
              )}

              <PwField
                label="Password Lama"
                value={currentPw}
                onChange={setCurrentPw}
                show={showCurrentPw}
                toggleShow={() => setShowCurrentPw((v) => !v)}
              />
              <PwField
                label="Password Baru"
                value={newPw}
                onChange={setNewPw}
                show={showNewPw}
                toggleShow={() => setShowNewPw((v) => !v)}
                placeholder="Minimal 6 karakter"
              />
              <PwField
                label="Konfirmasi Password Baru"
                value={confirmPw}
                onChange={setConfirmPw}
                show={showNewPw}
                toggleShow={() => setShowNewPw((v) => !v)}
                placeholder="Ulangi password baru"
              />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Modal Status Sesi (Task 03) ===== */}
      <Modal
        visible={sessionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSessionModalVisible(false)}
        accessibilityViewIsModal
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', maxWidth: 440, ...Shadow.md, borderWidth: isDark ? 1 : 0, borderColor: colors.borderLight }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
                <Ionicons name="shield-checkmark" size={32} color={colors.success} />
              </View>
              <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary }}>Status Sesi Aktif</Text>
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 4 }}>Task 03: Protect the Session (Login, Token, Logout)</Text>
            </View>

            <View style={{ backgroundColor: colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Pengguna:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: colors.textPrimary }}>{user?.email}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Nama:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: colors.textPrimary }}>{user?.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Penyimpanan Token:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.primary }}>Expo SecureStore</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Kunci SecureStore:</Text>
                <Text style={{ fontSize: FontSize.xs, fontFamily: 'monospace', fontWeight: FontWeight.semibold, color: colors.textPrimary }}>{'"access_token"'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Status Autentikasi:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.success }}>Terautentikasi (Valid)</Text>
              </View>
            </View>

            {/* Token Viewer */}
            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: colors.textSecondary }}>
                  Access Token di SecureStore:
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!sessionToken) return;
                    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(sessionToken);
                      setTokenCopied(true);
                      setTimeout(() => setTokenCopied(false), 2000);
                    } else {
                      Alert.alert('Access Token Disalin', sessionToken);
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel="Salin token sesi"
                >
                  <Ionicons name={tokenCopied ? 'checkmark' : 'copy-outline'} size={13} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: FontWeight.semibold, color: colors.primary }}>
                    {tokenCopied ? 'Tersalin' : 'Salin Token'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ backgroundColor: colors.background, padding: Spacing.sm, borderRadius: BorderRadius.sm, maxHeight: 70, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontSize: 10, fontFamily: 'monospace', color: colors.textSecondary }} numberOfLines={3} selectable>
                  {sessionToken || 'Tidak ada token aktif'}
                </Text>
              </View>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, alignItems: 'center' }}
                onPress={() => setSessionModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Tutup dialog status sesi"
              >
                <Text style={{ color: '#FFFFFF', fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>Tutup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: colors.danger + '15', borderWidth: 1, borderColor: colors.danger + '40', paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                onPress={() => {
                  setSessionModalVisible(false);
                  setTimeout(() => handleLogout(), 300);
                }}
                accessibilityRole="button"
                accessibilityLabel="Hapus token dan logout (Task 03)"
              >
                <Ionicons name="log-out-outline" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>Hapus Token & Logout (Task 03)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  isLast = false,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress
    ? {
        onPress,
        activeOpacity: 0.7,
        accessibilityRole: 'button' as const,
        accessibilityLabel: accessibilityLabel ?? label,
        accessibilityHint: `Membuka ${label}`,
      }
    : {};

  return (
    <Wrapper
      style={[
        styles.menuRow,
        !isLast && [styles.menuRowBorder, { borderBottomColor: colors.borderLight }],
      ]}
      {...wrapperProps}
    >
      <View style={[styles.menuIconBox, { backgroundColor: colors.primary + '18' }]} accessibilityElementsHidden>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
        {!!subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} accessibilityElementsHidden />
      )}
    </Wrapper>
  );
}

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
  const { colors } = useTheme();
  return (
    <View style={[styles.settingRow, !isLast && [styles.settingRowBorder, { borderBottomColor: colors.borderLight }]]}>
      <View style={styles.settingTextBlock}>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textTertiary}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

function AboutBadge({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.aboutBadge, { backgroundColor: colors.background, borderColor: colors.borderLight }]} accessible accessibilityLabel={label}>
      <Ionicons name={icon} size={12} color={colors.textSecondary} accessibilityElementsHidden />
      <Text style={[styles.aboutBadgeLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function PwField({
  label,
  value,
  onChange,
  show,
  toggleShow,
  placeholder = '••••••••',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggleShow: () => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label}
        />
        <TouchableOpacity
          onPress={toggleShow}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={show ? 'Sembunyikan password' : 'Tampilkan password'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  purpleHeader: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: '15%',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  headerInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  scroll: { flex: 1 },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: 120,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },

  // Profile card
  overlappingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: 0,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  avatarCircleLg: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarTextLg: {
    fontSize: 30,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  accountBadge: {
    marginTop: 6,
    backgroundColor: Colors.successBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountBadgeText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
  editProfileBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Sections
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Menu list
  menuList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    minHeight: 52,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBlock: { flex: 1 },
  menuLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },


  // Settings
  settingsList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
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
  themePillsRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  themePillsLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  themePillsGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  themePillBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  settingTextBlock: { flex: 1 },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  a11yNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
    paddingHorizontal: Spacing.xs,
  },

  // About card
  aboutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aboutLogoBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLogo: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  aboutAppName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  aboutTagline: { fontSize: FontSize.sm, color: Colors.textSecondary },
  aboutVersion: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  aboutDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  aboutBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  aboutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aboutBadgeLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  aboutDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  aboutDisclaimer: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.dangerLight,
    minHeight: 52,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
  },

  // Modal
  modalFlex: { flex: 1 },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalCancel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  modalSave: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  modalContent: {
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  editAvatarRow: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  // Form
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputError: { borderColor: Colors.danger, backgroundColor: Colors.dangerBg + '40' },
  inputReadonly: { backgroundColor: Colors.borderLight },
  inputReadonlyText: { color: Colors.textTertiary },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  eyeBtn: { padding: 4 },
  fieldError: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 6,
    marginLeft: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
});
