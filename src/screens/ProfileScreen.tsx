/**
 * PARKIN — Smart Campus Parking
 * Screen: Profil
 *
<<<<<<< HEAD
 * User profile, local storage preferences (AsyncStorage),
 * secure token info (SecureStore), and logout flow with confirmation.
 */

import React, { useState, useEffect } from 'react';
=======
 * Menampilkan data user yang sedang login.
 * Nama dan email berasal dari AuthContext (bukan hardcoded).
 * Fitur: Edit profil, Ubah password, Logout, Notifikasi, Tentang.
 */

import React, { useState, useCallback } from 'react';
>>>>>>> 3f814b0 (Update 2)
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  Modal,
<<<<<<< HEAD
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
=======
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
>>>>>>> 3f814b0 (Update 2)
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
import { saveData, getData, STORAGE_KEYS } from '../services/asyncStorageService';

<<<<<<< HEAD
=======
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
>>>>>>> 3f814b0 (Update 2)
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { horizontalPadding } = useResponsive();
<<<<<<< HEAD

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
=======
  const { user, logout, updateProfile, changePassword } = useAuth();

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

  // Status sesi modal
  const [sessionModalVisible, setSessionModalVisible] = useState(false);

  // Logout confirmation
  const handleLogout = useCallback(() => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Keluar dari PARKIN?\nKamu perlu login kembali untuk mengakses aplikasi.');
      if (confirmed) {
        logout();
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
            },
          },
        ]
      );
    }
  }, [logout]);

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
>>>>>>> 3f814b0 (Update 2)

  return (
    <View style={styles.container}>
      {/* PURPLE HEADER SECTION */}
      <View style={styles.purpleHeader}>
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
<<<<<<< HEAD
        {/* Profile header */}
        <View style={[styles.profileCard, Shadow.md]}>
          <View
            style={styles.avatarCircle}
            accessible={false}
            importantForAccessibility="no"
          >
            <Text style={styles.avatarText}>{initials}</Text>
=======
        {/* ===== Header Profil (Overlapping) ===== */}
        <View style={styles.overlappingCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
>>>>>>> 3f814b0 (Update 2)
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={styles.profileName}
              accessibilityRole="header"
              numberOfLines={1}
            >
<<<<<<< HEAD
              {user?.name || 'Ahmad Fauzi'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || 'mahasiswa@kampus.ac.id'}</Text>
            <Text style={styles.profileNim}>NIM: {user?.nim || '2021310042'}</Text>
            <Text style={styles.profileProdi}>{user?.prodi || 'Teknik Informatika'}</Text>
            <Text style={styles.profileAngkatan}>
              Angkatan {user?.angkatan || '2021'}
=======
              {user?.name ?? 'Pengguna'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email ?? '-'}
>>>>>>> 3f814b0 (Update 2)
            </Text>
            <View style={styles.accountBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={styles.accountBadgeText}>Akun Aktif</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => {
              setEditName(user?.name ?? '');
              setEditModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit profil pengguna"
          >
            <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ===== Akun ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Akun
          </Text>
          <View style={[styles.menuList, Shadow.sm]}>
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

<<<<<<< HEAD
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
=======
        {/* ===== Keamanan ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Keamanan
          </Text>
          <View style={[styles.menuList, Shadow.sm]}>
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
              subtitle="Sesi aktif · 7 hari"
              onPress={() => setSessionModalVisible(true)}
              isLast
              accessibilityLabel="Lihat status sesi"
            />
          </View>
        </View>

        {/* ===== Notifikasi ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Notifikasi
          </Text>
          <View style={[styles.settingsList, Shadow.sm]}>
            <SettingRow
              label="Hampir Penuh"
              description="Notifikasi saat area ≥80% terisi"
              value={notif.almostFull}
              onValueChange={(v) => handleNotifChange('almostFull', v)}
>>>>>>> 3f814b0 (Update 2)
              accessibilityLabel="Notifikasi area hampir penuh"
            />
            <SettingRow
              label="Area Penuh"
<<<<<<< HEAD
              description="Notifikasi saat area parkir 100% terisi"
              value={notifFull}
              onValueChange={handleToggleNotifFull}
=======
              description="Notifikasi saat area 100% terisi"
              value={notif.full}
              onValueChange={(v) => handleNotifChange('full', v)}
>>>>>>> 3f814b0 (Update 2)
              accessibilityLabel="Notifikasi area penuh"
            />
            <SettingRow
              label="Prediksi Pagi"
<<<<<<< HEAD
              description="Prediksi kepadatan parkir setiap pagi hari"
              value={notifPrediction}
              onValueChange={handleToggleNotifPrediction}
=======
              description="Prediksi kepadatan setiap pagi"
              value={notif.prediction}
              onValueChange={(v) => handleNotifChange('prediction', v)}
>>>>>>> 3f814b0 (Update 2)
              accessibilityLabel="Notifikasi prediksi kepadatan pagi"
              isLast
            />
          </View>
        </View>

<<<<<<< HEAD
        {/* Accessibility settings (AsyncStorage) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Aksesibilitas (Local Storage)
=======
        {/* ===== Aksesibilitas ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Aksesibilitas
>>>>>>> 3f814b0 (Update 2)
          </Text>
          <View style={[styles.settingsList, Shadow.sm]}>
            <SettingRow
              label="Teks Lebih Besar"
<<<<<<< HEAD
              description="Perbesar ukuran teks untuk keterbacaan yang lebih baik"
              value={largeText}
              onValueChange={handleToggleLargeText}
=======
              description="Perbesar ukuran teks untuk keterbacaan"
              value={a11y.largeText}
              onValueChange={(v) => handleA11yChange('largeText', v)}
>>>>>>> 3f814b0 (Update 2)
              accessibilityLabel="Aktifkan teks lebih besar"
            />
            <SettingRow
              label="Kontras Tinggi"
<<<<<<< HEAD
              description="Tingkatkan kontras warna untuk visibilitas lebih baik"
              value={highContrast}
              onValueChange={handleToggleHighContrast}
=======
              description="Tingkatkan kontras warna"
              value={a11y.highContrast}
              onValueChange={(v) => handleA11yChange('highContrast', v)}
>>>>>>> 3f814b0 (Update 2)
              accessibilityLabel="Aktifkan mode kontras tinggi"
              isLast
            />
          </View>
          <Text style={styles.a11yNote}>
            PARKIN dirancang dengan standar aksesibilitas WCAG. Seluruh
            komponen mendukung screen reader dan navigasi keyboard.
          </Text>
        </View>

        {/* ===== Tentang PARKIN ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Tentang PARKIN
          </Text>
          <View style={[styles.aboutCard, Shadow.sm]}>
            <View style={styles.aboutHeader}>
              <View style={styles.aboutLogoBox}>
<<<<<<< HEAD
                <Text style={styles.aboutLogoText}>P</Text>
=======
                <Text style={styles.aboutLogo}>P</Text>
>>>>>>> 3f814b0 (Update 2)
              </View>
              <View>
                <Text style={styles.aboutAppName}>PARKIN</Text>
                <Text style={styles.aboutTagline}>Smart Campus Parking</Text>
              </View>
            </View>
<<<<<<< HEAD
            <Text style={styles.aboutVersion}>Versi 1.1.0 · Auth & Storage Flow</Text>
=======
            <Text style={styles.aboutVersion}>Versi 1.0.0 · Sprint 01 + Task 01 & 02</Text>
>>>>>>> 3f814b0 (Update 2)
            <Text style={styles.aboutDesc}>
              PARKIN membantu mahasiswa memantau kondisi parkir kampus secara
              efisien, mengurangi waktu mencari tempat parkir, dan meningkatkan
              mobilitas di lingkungan kampus.
            </Text>
            <View style={styles.aboutBadges}>
<<<<<<< HEAD
              <AboutBadge label="Expo Go" />
              <AboutBadge label="React Native" />
              <AboutBadge label="SecureStore" />
              <AboutBadge label="AsyncStorage" />
            </View>
            <View style={styles.aboutDisclaimer}>
              <Text style={styles.aboutDisclaimerTitle}>Catatan Autentikasi</Text>
              <Text style={styles.aboutDisclaimerText}>
                Autentikasi saat ini berjalan dalam Mode Prototype Mahasiswa. Token sesi disimpan secara aman menggunakan Expo SecureStore.
=======
              <AboutBadge icon="phone-portrait-outline" label="Expo Go" />
              <AboutBadge icon="logo-react" label="React Native" />
              <AboutBadge icon="accessibility-outline" label="Accessible" />
              <AboutBadge icon="shield-checkmark-outline" label="SecureStore" />
              <AboutBadge icon="server-outline" label="AsyncStorage" />
            </View>
            <View style={styles.aboutDisclaimerBox}>
              <Ionicons name="warning-outline" size={14} color={Colors.warning} />
              <Text style={styles.aboutDisclaimer}>
                Data parkir dan prediksi merupakan simulasi/mock data.
                Authentication menggunakan mock service (bukan backend nyata).
>>>>>>> 3f814b0 (Update 2)
              </Text>
            </View>
          </View>
        </View>

        {/* ===== Logout ===== */}
        <View style={styles.section}>
<<<<<<< HEAD
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
=======
          <TouchableOpacity
            style={[styles.logoutBtn, Shadow.sm]}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Keluar dari akun PARKIN"
            accessibilityHint="Tekan untuk logout dari aplikasi"
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>Keluar dari Akun</Text>
          </TouchableOpacity>
>>>>>>> 3f814b0 (Update 2)
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

<<<<<<< HEAD
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
=======
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
                disabled={editLoading}
                accessibilityRole="button"
                accessibilityLabel="Simpan perubahan profil"
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.modalSave}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
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
                disabled={pwLoading}
                accessibilityRole="button"
                accessibilityLabel="Simpan password baru"
              >
                {pwLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.modalSave}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
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

      {/* ===== Modal Status Sesi ===== */}
      <Modal
        visible={sessionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSessionModalVisible(false)}
        accessibilityViewIsModal
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          <View style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', maxWidth: 400, ...Shadow.md }}>
            <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.success} />
              </View>
              <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary }}>Status Sesi Aktif</Text>
              <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 }}>Informasi autentikasi & keamanan</Text>
            </View>

            <View style={{ backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>Pengguna:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary }}>{user?.email}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>Perangkat:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary }}>{Platform.OS === 'web' ? 'Web Browser' : Platform.OS}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>Tipe Token:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary }}>Bearer JWT (Mock)</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>Masa Berlaku:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.success }}>7 Hari (Auto-renew)</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary }}>Penyimpanan:</Text>
                <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary }}>SecureStore Enkripsi</Text>
              </View>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' }}
              onPress={() => setSessionModalVisible(false)}
            >
              <Text style={{ color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>Tutup</Text>
            </TouchableOpacity>
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
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      {...wrapperProps}
    >
      <View style={styles.menuIconBox} accessibilityElementsHidden>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={styles.menuLabel}>{label}</Text>
        {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} accessibilityElementsHidden />
      )}
    </Wrapper>
>>>>>>> 3f814b0 (Update 2)
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
  return (
    <View style={[styles.settingRow, !isLast && styles.settingRowBorder]}>
      <View style={styles.settingTextBlock}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.textTertiary}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

<<<<<<< HEAD
// ======== AboutBadge ========
function AboutBadge({ label }: { label: string }) {
  return (
    <View
      style={styles.aboutBadge}
      accessible={true}
      accessibilityLabel={label}
    >
=======
function AboutBadge({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.aboutBadge} accessible accessibilityLabel={label}>
      <Ionicons name={icon} size={12} color={Colors.textSecondary} accessibilityElementsHidden />
>>>>>>> 3f814b0 (Update 2)
      <Text style={styles.aboutBadgeLabel}>{label}</Text>
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
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          accessibilityLabel={label}
        />
        <TouchableOpacity
          onPress={toggleShow}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={show ? 'Sembunyikan password' : 'Tampilkan password'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textTertiary} />
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
<<<<<<< HEAD
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
=======
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
>>>>>>> 3f814b0 (Update 2)
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
<<<<<<< HEAD
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
=======
    fontSize: 22,
>>>>>>> 3f814b0 (Update 2)
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
<<<<<<< HEAD
  profileEmail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  profileNim: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
=======
  avatarCircleLg: {
    width: 88,
    height: 88,
    borderRadius: 44,
>>>>>>> 3f814b0 (Update 2)
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 3f814b0 (Update 2)
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
    lineHeight: 18,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aboutLogoBox: {
<<<<<<< HEAD
    width: 52,
    height: 52,
=======
    width: 48,
    height: 48,
>>>>>>> 3f814b0 (Update 2)
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
<<<<<<< HEAD
  aboutLogoText: {
=======
  aboutLogo: {
>>>>>>> 3f814b0 (Update 2)
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  aboutAppName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
  },
  aboutTagline: { fontSize: FontSize.sm, color: Colors.textSecondary },
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
<<<<<<< HEAD
  aboutDisclaimer: {
=======
  aboutDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
>>>>>>> 3f814b0 (Update 2)
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
<<<<<<< HEAD
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuLabel: {
    flex: 1,
=======
  },
  logoutText: {
>>>>>>> 3f814b0 (Update 2)
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
<<<<<<< HEAD
  menuArrow: {
    fontSize: FontSize.xl,
    color: Colors.textTertiary,
=======
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
>>>>>>> 3f814b0 (Update 2)
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
