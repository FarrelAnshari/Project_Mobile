/**
 * PARKIN — Smart Campus Parking
 * Screen: Register
 *
 * Halaman pendaftaran akun PARKIN.
 * Dilengkapi validasi form, ikon modern tanpa OS emoji,
 * card container tegas, tema dinamis, dan toast notification.
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';

// Validasi form
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isStrongPassword(password: string): boolean {
  return password.length >= 6;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();

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

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmRef = useRef<any>(null);

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
        setSuccessMsg('Akun berhasil dibuat! Mengarahkan ke halaman masuk...');
        toast.success('Registrasi Berhasil! Silakan masuk dengan akun baru Anda.');
        setTimeout(() => {
          router.replace('/login');
        }, 1200);
      } else {
        const err = result.error ?? 'Registrasi gagal. Silakan coba kembali.';
        setGeneralError(err);
        toast.error(err);
      }
    } catch {
      const err = 'Terjadi kesalahan sistem. Periksa koneksi dan coba lagi.';
      setGeneralError(err);
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali ke halaman login"
          >
            <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
            <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>Kembali</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="car-sport" size={32} color="#FFFFFF" />
            </View>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>Buat Akun PARKIN</Text>
            <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
              Daftar dan mulai pantau ketersediaan parkir kampus
            </Text>
          </View>

          {/* Card Form */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#000000',
              },
            ]}
          >
            {/* Success banner */}
            {!!successMsg && (
              <View
                style={[
                  styles.successBanner,
                  { backgroundColor: colors.successBg, borderColor: colors.success },
                ]}
                accessibilityRole="alert"
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[styles.successText, { color: colors.success }]}>{successMsg}</Text>
              </View>
            )}

            {/* General error */}
            {!!generalError && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.dangerBg, borderColor: colors.danger },
                ]}
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{generalError}</Text>
              </View>
            )}

            {/* Nama Lengkap */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Nama Lengkap
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                    borderColor: nameError ? colors.danger : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={nameError ? colors.danger : colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Nama lengkap kamu"
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (nameError) setNameError('');
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  accessibilityLabel="Nama Lengkap"
                  editable={!loading}
                />
              </View>
              {!!nameError && (
                <Text style={[styles.fieldError, { color: colors.danger }]} accessibilityRole="alert">
                  {nameError}
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Email Mahasiswa / Kampus
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                    borderColor: emailError ? colors.danger : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={emailError ? colors.danger : colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={emailRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="email@student.ac.id"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (emailError) setEmailError('');
                  }}
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
                <Text style={[styles.fieldError, { color: colors.danger }]} accessibilityRole="alert">
                  {emailError}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Kata Sandi
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                    borderColor: passwordError ? colors.danger : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={passwordError ? colors.danger : colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  accessibilityLabel="Kata Sandi"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {!!passwordError && (
                <Text style={[styles.fieldError, { color: colors.danger }]} accessibilityRole="alert">
                  {passwordError}
                </Text>
              )}
            </View>

            {/* Konfirmasi Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Konfirmasi Kata Sandi
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? colors.background : '#F8FAFC',
                    borderColor: confirmError ? colors.danger : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={confirmError ? colors.danger : colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Ulangi kata sandi"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={(t) => {
                    setConfirmPassword(t);
                    if (confirmError) setConfirmError('');
                  }}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  accessibilityLabel="Konfirmasi Kata Sandi"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirm ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {!!confirmError && (
                <Text style={[styles.fieldError, { color: colors.danger }]} accessibilityRole="alert">
                  {confirmError}
                </Text>
              )}
            </View>

            {/* Tombol Register */}
            <TouchableOpacity
              style={[
                styles.registerBtn,
                { backgroundColor: colors.primary },
                loading && styles.registerBtnDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Daftar Akun"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.registerBtnText}>Daftar Sekarang</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Link ke Login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace('/login')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
                Sudah punya akun?{' '}
                <Text style={[styles.loginLinkBold, { color: colors.primary }]}>Masuk di sini</Text>
              </Text>
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
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'web' ? 40 : 28,
    paddingBottom: Spacing.xxxl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: 6,
  },
  backBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: FontSize.sm,
    marginTop: 4,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: Platform.OS === 'web' ? 32 : 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  successText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  fieldError: {
    fontSize: FontSize.xs,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: FontWeight.medium,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  registerBtnDisabled: {
    opacity: 0.65,
  },
  registerBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  loginLinkText: {
    fontSize: FontSize.sm,
  },
  loginLinkBold: {
    fontWeight: FontWeight.bold,
  },
});
