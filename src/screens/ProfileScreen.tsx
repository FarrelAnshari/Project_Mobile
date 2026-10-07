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
  const { horizontalPadding } = useResponsive();
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
        {/* ===== Header Profil (Overlapping) ===== */}
        <View style={styles.overlappingCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={styles.profileName}
              accessibilityRole="header"
              numberOfLines={1}
            >
              {user?.name ?? 'Pengguna'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email ?? '-'}
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
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Aksesibilitas
          </Text>
          <View style={[styles.settingsList, Shadow.sm]}>
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
                <Text style={styles.aboutLogo}>P</Text>
              </View>
              <View>
                <Text style={styles.aboutAppName}>PARKIN</Text>
                <Text style={styles.aboutTagline}>Smart Campus Parking</Text>
              </View>
            </View>
            <Text style={styles.aboutVersion}>Versi 1.0.0 · Sprint 01 + Task 01 & 02</Text>
            <Text style={styles.aboutDesc}>
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
            <View style={styles.aboutDisclaimerBox}>
              <Ionicons name="warning-outline" size={14} color={Colors.warning} />
              <Text style={styles.aboutDisclaimer}>
                Data parkir dan prediksi merupakan simulasi/mock data.
                Authentication menggunakan mock service (bukan backend nyata).
              </Text>
            </View>
          </View>
        </View>

        {/* ===== Logout ===== */}
        <View style={styles.section}>
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

function AboutBadge({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.aboutBadge} accessible accessibilityLabel={label}>
      <Ionicons name={icon} size={12} color={Colors.textSecondary} accessibilityElementsHidden />
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
