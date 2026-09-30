/**
 * PARKIN — Smart Campus Parking
 * Screen: Login / Masuk
 *
 * Halaman masuk akun mahasiswa dengan:
 * - Logo dan identitas PARKIN
 * - Validasi input email dan password
 * - Toggle show/hide password (min touch target 44x44 pt)
 * - Checkbox "Ingat Saya"
 * - Quick-fill kredensial demo untuk kemudahan pengujian
 * - Tautan Lupa Password dan Registrasi
 * - Dukungan penuh screen reader & keyboard avoiding
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { DEMO_CREDENTIALS, isValidEmail } from '../../services/authService';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../constants/theme';
import { useResponsive } from '../../utils/responsive';

export default function LoginScreen() {
  const router = useRouter();
  const { login, rememberedEmail, isAuthenticated } = useAuth();
  const { horizontalPadding } = useResponsive();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Isi email jika ada yang diingat sebelumnya
  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [rememberedEmail]);

  // Redirect jika sudah terautentikasi
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  const handleQuickFillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setEmailError('');
    setPasswordError('');
    setErrorMessage('');
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email.trim()) {
      setEmailError('Email mahasiswa wajib diisi.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Format email tidak valid (contoh: nama@kampus.ac.id).');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password wajib diisi.');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.message || 'Login gagal.');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={styles.logoBadge} accessibilityElementsHidden>
              <Text style={styles.logoLetter}>P</Text>
            </View>
            <Text style={styles.brandName}>PARKIN</Text>
            <Text style={styles.welcomeTitle}>Selamat Datang Kembali</Text>
            <Text style={styles.subtitle}>
              Masuk ke akun mahasiswa untuk memantau ketersediaan slot parkir kampus secara real-time.
            </Text>
          </View>

          {/* Banner Prototype Info & Quick Fill */}
          <View style={styles.demoBanner}>
            <View style={styles.demoBannerHeader}>
              <View style={styles.demoDot} />
              <Text style={styles.demoBannerTitle}>Mode Prototype Mahasiswa</Text>
            </View>
            <Text style={styles.demoBannerText}>
              Gunakan kredensial pengujian berikut untuk masuk:
            </Text>
            <Text style={styles.demoCredentials}>
              {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
            </Text>
            <TouchableOpacity
              style={styles.quickFillBtn}
              onPress={handleQuickFillDemo}
              accessibilityRole="button"
              accessibilityLabel="Isi otomatis akun demo mahasiswa"
              accessibilityHint="Mengisi email dan password akun demo ke dalam formulir"
            >
              <Text style={styles.quickFillText}>Isi Otomatis Akun Demo</Text>
            </TouchableOpacity>
          </View>

          {/* General Error Banner */}
          {errorMessage ? (
            <View
              style={styles.errorAlert}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLabel={`Terjadi kesalahan: ${errorMessage}`}
            >
              <Text style={styles.errorAlertIcon}>!</Text>
              <Text style={styles.errorAlertText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Inputs */}
          <View style={styles.form}>
            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Mahasiswa</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailError ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="mahasiswa@kampus.ac.id"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Input email mahasiswa"
                  accessibilityHint="Ketik alamat email kampus Anda"
                />
              </View>
              {emailError ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Lupa Password"
                  accessibilityHint="Buka halaman permintaan reset password"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  passwordError ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={[styles.textInput, { paddingRight: 48 }]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Masukkan password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Input password"
                  accessibilityHint="Ketik password akun Anda"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  accessibilityHint="Mengubah tampilan teks password"
                >
                  <Text style={styles.eyeText}>{showPassword ? 'Tutup' : 'Lihat'}</Text>
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* Checkbox Ingat Saya */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
              accessibilityLabel="Ingat saya di perangkat ini"
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxActive,
                ]}
              >
                {rememberMe && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.rememberLabel}>Ingat Saya di perangkat ini</Text>
            </TouchableOpacity>

            {/* Tombol Masuk */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
                Shadow.sm,
              ]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Masuk ke aplikasi"
              accessibilityHint="Memproses login dengan kredensial yang dimasukkan"
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Masuk</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer - Tautan Registrasi */}
          <View style={styles.footer}>
            <Text style={styles.footerPrompt}>Belum memiliki akun mahasiswa?</Text>
            <TouchableOpacity
              style={styles.registerLinkBtn}
              onPress={() => router.push('/(auth)/register' as any)}
              accessibilityRole="button"
              accessibilityLabel="Daftar Akun Baru"
              accessibilityHint="Buka formulir pendaftaran akun mahasiswa baru"
            >
              <Text style={styles.registerLinkText}>Daftar Akun Baru</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  logoLetter: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  brandName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  demoBanner: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  demoBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  demoBannerTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoBannerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  demoCredentials: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  quickFillBtn: {
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  quickFillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginBottom: Spacing.md,
  },
  errorAlertIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  errorAlertText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    minHeight: 48,
    position: 'relative',
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg + '20',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  fieldErrorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxCheck: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  rememberLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 4,
  },
  footerPrompt: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  registerLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  registerLinkText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
