/**
 * PARKIN — Smart Campus Parking
 * Screen: Profil
 *
 * User profile, notification preferences, accessibility settings, about.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';
import { useResponsive } from '../utils/responsive';

const MOCK_USER = {
  name: 'Ahmad Fauzi',
  nim: '2021310042',
  prodi: 'Teknik Informatika',
  angkatan: '2021',
  avatar: '👤',
};

export default function ProfileScreen() {
  const { horizontalPadding } = useResponsive();
  const [notifAlmostFull, setNotifAlmostFull] = useState(true);
  const [notifFull, setNotifFull] = useState(true);
  const [notifPrediction, setNotifPrediction] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

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
          <View style={styles.avatarCircle} accessibilityElementsHidden>
            <Text style={styles.avatarText}>{MOCK_USER.avatar}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={styles.profileName}
              accessibilityRole="header"
            >
              {MOCK_USER.name}
            </Text>
            <Text style={styles.profileNim}>NIM: {MOCK_USER.nim}</Text>
            <Text style={styles.profileProdi}>{MOCK_USER.prodi}</Text>
            <Text style={styles.profileAngkatan}>
              Angkatan {MOCK_USER.angkatan}
            </Text>
          </View>
        </View>

        {/* Notification settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            🔔 Preferensi Notifikasi
          </Text>
          <View style={[styles.settingsList, Shadow.sm]}>
            <SettingRow
              label="Hampir Penuh"
              description="Notifikasi saat area ≥80% terisi"
              value={notifAlmostFull}
              onValueChange={setNotifAlmostFull}
              accessibilityLabel="Notifikasi area hampir penuh"
            />
            <SettingRow
              label="Area Penuh"
              description="Notifikasi saat area 100% terisi"
              value={notifFull}
              onValueChange={setNotifFull}
              accessibilityLabel="Notifikasi area penuh"
            />
            <SettingRow
              label="Prediksi Pagi"
              description="Prediksi kepadatan setiap pagi"
              value={notifPrediction}
              onValueChange={setNotifPrediction}
              accessibilityLabel="Notifikasi prediksi kepadatan pagi"
              isLast
            />
          </View>
        </View>

        {/* Accessibility settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            ♿ Aksesibilitas
          </Text>
          <View style={[styles.settingsList, Shadow.sm]}>
            <SettingRow
              label="Teks Lebih Besar"
              description="Perbesar ukuran teks untuk keterbacaan"
              value={largeText}
              onValueChange={setLargeText}
              accessibilityLabel="Aktifkan teks lebih besar"
            />
            <SettingRow
              label="Kontras Tinggi"
              description="Tingkatkan kontras warna"
              value={highContrast}
              onValueChange={setHighContrast}
              accessibilityLabel="Aktifkan mode kontras tinggi"
              isLast
            />
          </View>
          <Text style={styles.a11yNote}>
            💡 PARKIN dirancang dengan standar aksesibilitas WCAG. Seluruh
            komponen mendukung screen reader dan navigasi keyboard.
          </Text>
        </View>

        {/* About PARKIN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            ℹ️ Tentang PARKIN
          </Text>
          <View style={[styles.aboutCard, Shadow.sm]}>
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutLogo}>🅿️</Text>
              <View>
                <Text style={styles.aboutAppName}>PARKIN</Text>
                <Text style={styles.aboutTagline}>Smart Campus Parking</Text>
              </View>
            </View>
            <Text style={styles.aboutVersion}>Versi 1.0.0 · Sprint 01</Text>
            <Text style={styles.aboutDesc}>
              PARKIN membantu mahasiswa memantau kondisi parkir kampus secara
              efisien, mengurangi waktu mencari tempat parkir, dan meningkatkan
              mobilitas di lingkungan kampus.
            </Text>
            <View style={styles.aboutBadges}>
              <AboutBadge icon="📱" label="Expo Go" />
              <AboutBadge icon="⚛️" label="React Native" />
              <AboutBadge icon="♿" label="Accessible" />
              <AboutBadge icon="📊" label="Mock Data" />
            </View>
            <Text style={styles.aboutDisclaimer}>
              ⚠️ Data parkir dan prediksi merupakan simulasi/mock data.
              Integrasi API real-time dan model ML direncanakan pada Sprint 02.
            </Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.section}>
          {[
            { icon: '🔒', label: 'Kebijakan Privasi' },
            { icon: '📋', label: 'Syarat & Ketentuan' },
            { icon: '❓', label: 'Bantuan' },
            { icon: '📧', label: 'Hubungi Kami' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, Shadow.sm]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityHint={`Membuka halaman ${item.label}`}
            >
              <Text style={styles.menuIcon} accessibilityElementsHidden>
                {item.icon}
              </Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow} accessibilityElementsHidden>
                →
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
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
function AboutBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <View
      style={styles.aboutBadge}
      accessible={true}
      accessibilityLabel={label}
    >
      <Text style={styles.aboutBadgeIcon} accessibilityElementsHidden>
        {icon}
      </Text>
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
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
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
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aboutLogo: {
    fontSize: 40,
  },
  aboutAppName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  aboutTagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
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
  aboutBadgeIcon: {
    fontSize: 12,
  },
  aboutBadgeLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  aboutDisclaimer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
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
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuArrow: {
    fontSize: FontSize.lg,
    color: Colors.textTertiary,
  },
});
