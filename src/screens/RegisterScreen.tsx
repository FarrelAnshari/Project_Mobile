/**
 * PARKIN — Smart Campus Parking
 * Screen: Register
 *
 * Halaman pendaftaran akun PARKIN.
 * Setelah berhasil → arahkan ke Login.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

// Validasi
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isStrongPassword(password: string): boolean {
  return password.length >= 6;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  function validate(): boolean {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setGeneralError('');

    if (!name.trim()) {
      setNameError('Nama lengkap wajib diisi.');
      valid = false;
    } else if (name.trim().length < 2) {
      setNameError('Nama minimal 2 karakter.');
      valid = false;
    }

    if (!email.trim()) {
      setEmailError('Email wajib diisi.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Format email tidak valid.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password wajib diisi.');
      valid = false;
    } else if (!isStrongPassword(password)) {
      setPasswordError('Password minimal 6 karakter.');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Konfirmasi password wajib diisi.');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Password dan konfirmasi password tidak sama.');
      valid = false;
    }

    return valid;
  }

  async function handleRegister() {
    if (!validate()) return;

    setLoading(true);
    setGeneralError('');
    setSuccessMsg('');

    try {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (result.success) {
        setSuccessMsg('Akun berhasil dibuat! Silakan masuk.');
        // Delay sedikit untuk user baca pesan, lalu ke login
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      } else {
        setGeneralError(result.error ?? 'Registrasi gagal. Coba lagi.');
      }
    } catch {
      setGeneralError('Terjadi kesalahan. Periksa koneksi dan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali ke halaman login"
          >
            <Text style={styles.backBtnText}>← Kembali</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🅿️</Text>
            </View>
            <Text style={styles.appName}>Buat Akun PARKIN</Text>
            <Text style={styles.appTagline}>
              Daftar dan mulai pantau parkir kampus
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, Shadow.md]}>
            {/* Success banner */}
            {!!successMsg && (
              <View style={styles.successBanner} accessibilityRole="alert">
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* General error */}
            {!!generalError && (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            )}

            {/* Nama Lengkap */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nama Lengkap</Text>
              <View style={[styles.inputWrapper, !!nameError && styles.inputError]}>
                <Text style={styles.inputIcon} accessibilityElementsHidden>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nama lengkap kamu"
                  placeholderTextColor={Colors.textTertiary}
                  value={name}
                  onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  accessibilityLabel="Nama Lengkap"
                  editable={!loading}
                />
              </View>
              {!!nameError && (
                <Text style={styles.fieldError} accessibilityRole="alert">{nameError}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Mahasiswa</Text>
              <View style={[styles.inputWrapper, !!emailError && styles.inputError]}>
                <Text style={styles.inputIcon} accessibilityElementsHidden>✉️</Text>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="email@student.ac.id"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  accessibilityLabel="Email Mahasiswa"
                  editable={!loading}
                />
              </View>
              {!!emailError && (
                <Text style={styles.fieldError} accessibilityRole="alert">{emailError}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrapper, !!passwordError && styles.inputError]}>
                <Text style={styles.inputIcon} accessibilityElementsHidden>🔒</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  accessibilityLabel="Password"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {!!passwordError && (
                <Text style={styles.fieldError} accessibilityRole="alert">{passwordError}</Text>
              )}
            </View>

            {/* Konfirmasi Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
              <View style={[styles.inputWrapper, !!confirmError && styles.inputError]}>
                <Text style={styles.inputIcon} accessibilityElementsHidden>🔑</Text>
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  placeholder="Ulangi password"
                  placeholderTextColor={Colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); if (confirmError) setConfirmError(''); }}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  accessibilityLabel="Konfirmasi Password"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {!!confirmError && (
                <Text style={styles.fieldError} accessibilityRole="alert">{confirmError}</Text>
              )}
            </View>

            {/* Tombol Daftar */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Daftar akun PARKIN"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.registerBtnText}>Daftar</Text>
              )}
            </TouchableOpacity>

            {/* Link ke Login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace('/login')}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sudah punya akun? Masuk"
            >
              <Text style={styles.loginLinkText}>
                Sudah punya akun?{' '}
                <Text style={styles.loginLinkBold}>Masuk</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            ⚠️ Demo Prototype — Data tersimpan lokal di perangkat ini
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  logoEmoji: { fontSize: 34 },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  appTagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  successIcon: { fontSize: 16 },
  successText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.medium,
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
  errorIcon: { fontSize: 16 },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  fieldGroup: { marginBottom: Spacing.md },
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
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg + '40',
  },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  fieldError: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 6,
    marginLeft: 2,
  },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  registerBtnDisabled: { backgroundColor: Colors.textTertiary },
  registerBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  loginLinkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  loginLinkBold: { color: Colors.primary, fontWeight: FontWeight.bold },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
