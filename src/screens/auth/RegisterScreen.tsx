/**
 * PARKIN — Smart Campus Parking
 * Screen: Register / Pendaftaran Akun Mahasiswa
 *
 * Formulir pendaftaran akun mahasiswa baru dengan:
 * - Nama lengkap, email mahasiswa, password, konfirmasi password
 * - Live password strength validator (teks + meter bar, non-color only)
 * - Checkbox persetujuan syarat dan ketentuan
 * - Validasi input presisi dan pencegahan keyboard overflow
 */

import React, { useState } from 'react';
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
import {
  isValidEmail,
  validatePasswordStrength,
} from '../../services/authService';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../constants/theme';
import { useResponsive } from '../../utils/responsive';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { horizontalPadding } = useResponsive();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const passwordStrength = validatePasswordStrength(password);

  const handleRegister = async () => {
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email mahasiswa wajib diisi.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Format email tidak valid (contoh: nama@kampus.ac.id).';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi.';
    } else if (!passwordStrength.isValid) {
      newErrors.password = passwordStrength.message;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok dengan password di atas.';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'Anda harus menyetujui syarat & ketentuan layanan.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        name,
        email,
        nim: nim.trim() || undefined,
        password,
        confirmPassword,
        agreeTerms,
      });

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        }
        setGeneralError(result.message || 'Pendaftaran gagal.');
      } else {
        setSuccessMessage('Akun mahasiswa berhasil didaftarkan! Mengarahkan ke halaman masuk...');
        setTimeout(() => {
          router.replace('/(auth)/login' as any);
        }, 1500);
      }
    } catch {
      setGeneralError('Terjadi kesalahan jaringan saat memproses pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStrengthBarWidth = () => {
    if (!password) return '0%';
    if (passwordStrength.score === 'lemah') return '33%';
    if (passwordStrength.score === 'sedang') return '66%';
    return '100%';
  };

  const getStrengthBarColor = () => {
    if (passwordStrength.score === 'lemah') return Colors.danger;
    if (passwordStrength.score === 'sedang') return Colors.warning;
    return Colors.success;
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman login"
              accessibilityHint="Kembali ke halaman sebelumnya"
            >
              <Text style={styles.backArrow}>‹</Text>
              <Text style={styles.backText}>Masuk</Text>
            </TouchableOpacity>

            <View style={styles.logoBadge} accessibilityElementsHidden>
              <Text style={styles.logoLetter}>P</Text>
            </View>
            <Text style={styles.brandName}>PARKIN</Text>
            <Text style={styles.screenTitle}>Buat Akun PARKIN</Text>
            <Text style={styles.subtitle}>
              Lengkapi formulir di bawah ini untuk membuat akun mahasiswa baru.
            </Text>
          </View>

          {/* Success Alert */}
          {successMessage ? (
            <View
              style={styles.successAlert}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLabel={successMessage}
            >
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* General Error Alert */}
          {generalError ? (
            <View
              style={styles.errorAlert}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLabel={`Terjadi kesalahan: ${generalError}`}
            >
              <Text style={styles.errorAlertIcon}>!</Text>
              <Text style={styles.errorAlertText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Input Nama Lengkap */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.name ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Contoh: Budi Santoso"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="words"
                  accessibilityLabel="Input nama lengkap"
                  accessibilityHint="Ketik nama lengkap Anda sesuai kartu mahasiswa"
                />
              </View>
              {errors.name ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {errors.name}
                </Text>
              ) : null}
            </View>

            {/* Input Email Mahasiswa */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Mahasiswa</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.email ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="nama@kampus.ac.id"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Input email mahasiswa"
                  accessibilityHint="Ketik email mahasiswa resmi Anda"
                />
              </View>
              {errors.email ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {errors.email}
                </Text>
              ) : null}
            </View>

            {/* Input NIM (Opsional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NIM (Nomor Induk Mahasiswa)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={nim}
                  onChangeText={setNim}
                  placeholder="Contoh: 2022310055 (opsional)"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                  accessibilityLabel="Input nomor induk mahasiswa opsional"
                />
              </View>
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={[styles.textInput, { paddingRight: 48 }]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Minimal 8 karakter kombinasi"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Input password baru"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <Text style={styles.eyeText}>{showPassword ? 'Tutup' : 'Lihat'}</Text>
                </TouchableOpacity>
              </View>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthBar,
                        {
                          width: getStrengthBarWidth(),
                          backgroundColor: getStrengthBarColor(),
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.strengthText,
                      { color: getStrengthBarColor() },
                    ]}
                  >
                    {passwordStrength.message}
                  </Text>
                </View>
              )}

              {errors.password ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {errors.password}
                </Text>
              ) : null}
            </View>

            {/* Input Konfirmasi Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konfirmasi Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.confirmPassword ? styles.inputWrapperError : null,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Ketik ulang password Anda"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Input konfirmasi password"
                />
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {errors.confirmPassword}
                </Text>
              ) : null}
            </View>

            {/* Checkbox Syarat & Ketentuan */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                setAgreeTerms(!agreeTerms);
                if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: '' }));
              }}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreeTerms }}
              accessibilityLabel="Saya menyetujui Syarat dan Ketentuan penggunaan aplikasi PARKIN"
            >
              <View
                style={[
                  styles.checkbox,
                  agreeTerms && styles.checkboxActive,
                  errors.agreeTerms ? styles.checkboxError : null,
                ]}
              >
                {agreeTerms && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.termsLabel}>
                Saya menyetujui{' '}
                <Text style={styles.termsHighlight}>Syarat & Ketentuan</Text> serta{' '}
                <Text style={styles.termsHighlight}>Kebijakan Privasi</Text> PARKIN Kampus.
              </Text>
            </TouchableOpacity>
            {errors.agreeTerms ? (
              <Text style={styles.fieldErrorText} accessibilityRole="alert">
                {errors.agreeTerms}
              </Text>
            ) : null}

            {/* Tombol Daftar */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
                Shadow.sm,
              ]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Daftar akun mahasiswa"
              accessibilityHint="Mengirim formulir pendaftaran akun"
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Daftar Akun</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer - Link Login */}
          <View style={styles.footer}>
            <Text style={styles.footerPrompt}>Sudah memiliki akun terdaftar?</Text>
            <TouchableOpacity
              style={styles.loginLinkBtn}
              onPress={() => router.push('/(auth)/login' as any)}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman masuk"
            >
              <Text style={styles.loginLinkText}>Masuk ke Akun Anda</Text>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
    lineHeight: FontSize.xxl + 2,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    alignSelf: 'center',
  },
  logoLetter: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  brandName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 6,
    alignSelf: 'center',
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
    textAlign: 'center',
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
    marginBottom: Spacing.md,
  },
  successIcon: {
    fontSize: FontSize.md,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  successText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
    lineHeight: 18,
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
  strengthContainer: {
    marginTop: 6,
    gap: 4,
  },
  strengthTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  fieldErrorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxError: {
    borderColor: Colors.danger,
  },
  checkboxCheck: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  termsLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  termsHighlight: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.md,
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
    marginTop: Spacing.lg,
    gap: 4,
  },
  footerPrompt: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  loginLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  loginLinkText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
