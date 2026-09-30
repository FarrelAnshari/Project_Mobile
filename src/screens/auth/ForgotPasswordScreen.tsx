/**
 * PARKIN — Smart Campus Parking
 * Screen: Forgot Password / Lupa Password
 *
 * Halaman permohonan reset password dengan:
 * - Input email terdaftar
 * - Status transparan bahwa pengiriman email reset memerlukan integrasi backend mail server
 * - Feedback status permohonan
 * - Tautan kembali ke halaman masuk
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
import { requestPasswordReset, isValidEmail } from '../../services/authService';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../constants/theme';
import { useResponsive } from '../../utils/responsive';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { horizontalPadding } = useResponsive();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async () => {
    setEmailError('');
    setFeedback(null);

    if (!email.trim()) {
      setEmailError('Email mahasiswa wajib diisi.');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Format email tidak valid (contoh: nama@kampus.ac.id).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal memproses permintaan. Silakan periksa koneksi Anda.',
      });
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman login"
            >
              <Text style={styles.backArrow}>‹</Text>
              <Text style={styles.backText}>Masuk</Text>
            </TouchableOpacity>

            <Text style={styles.screenTitle}>Lupa Password</Text>
            <Text style={styles.subtitle}>
              Masukkan alamat email mahasiswa Anda yang terdaftar untuk menerima instruksi pemulihan akun.
            </Text>
          </View>

          {/* Prototype Backend Status Banner */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconBox}>
              <Text style={styles.infoIcon}>i</Text>
            </View>
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>Informasi Integrasi Backend</Text>
              <Text style={styles.infoDesc}>
                Fitur pengiriman email reset password memerlukan integrasi SMTP mail server pada backend (direncanakan pada Sprint 02). Permintaan saat ini dicatat sebagai simulasi prototype.
              </Text>
            </View>
          </View>

          {/* Feedback Banner */}
          {feedback ? (
            <View
              style={[
                styles.feedbackAlert,
                feedback.type === 'success'
                  ? styles.feedbackSuccess
                  : styles.feedbackError,
              ]}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLabel={feedback.message}
            >
              <Text
                style={[
                  styles.feedbackIcon,
                  feedback.type === 'success'
                    ? styles.feedbackIconSuccess
                    : styles.feedbackIconError,
                ]}
              >
                {feedback.type === 'success' ? '✓' : '!'}
              </Text>
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'success'
                    ? styles.feedbackTextSuccess
                    : styles.feedbackTextError,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Mahasiswa Terdaftar</Text>
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
                  accessibilityLabel="Input email terdaftar"
                  accessibilityHint="Ketik email mahasiswa Anda yang akan dipulihkan"
                />
              </View>
              {emailError ? (
                <Text style={styles.fieldErrorText} accessibilityRole="alert">
                  {emailError}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
                Shadow.sm,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Kirim instruksi reset password"
              accessibilityHint="Mengirim permohonan pemulihan kata sandi"
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Kirim Instruksi Pemulihan</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Return to Login */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.backToLoginBtn}
              onPress={() => router.push('/(auth)/login' as any)}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman masuk"
            >
              <Text style={styles.backToLoginText}>Kembali ke Halaman Masuk</Text>
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
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.infoBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  infoIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoIcon: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  infoTextBlock: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  infoDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  feedbackAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  feedbackSuccess: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  feedbackError: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
  },
  feedbackIcon: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  feedbackIconSuccess: {
    color: Colors.success,
  },
  feedbackIconError: {
    color: Colors.danger,
  },
  feedbackText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
    fontWeight: FontWeight.medium,
  },
  feedbackTextSuccess: {
    color: Colors.success,
  },
  feedbackTextError: {
    color: Colors.danger,
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg + '20',
  },
  textInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  fieldErrorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: FontWeight.medium,
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
  },
  backToLoginBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  backToLoginText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
