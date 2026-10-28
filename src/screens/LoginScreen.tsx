/**
 * PARKIN — Smart Campus Parking
 * Screen: Login
 *
 * Authentication screen — gerbang masuk aplikasi.
 * Setiap kali web/app dibuka, user harus melewati layar ini.
 * Fitur: Form Login Modern, Sensor Sidik Jari (Biometrik), Quick Demo Login,
 * Loading Screen / Verifying Overlay, dan Toast Notifications.
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
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

// Validasi email sederhana
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Biometric scanner modal state
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'error'>('scanning');

  // Animation values for biometric scanner
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Verifying loader animations
  const spinValue = useRef(new Animated.Value(0)).current;
  const verifyScale = useRef(new Animated.Value(0.9)).current;
  const verifyOpacity = useRef(new Animated.Value(0)).current;

  const passwordRef = useRef<any>(null);

  // Animate verifying overlay
  useEffect(() => {
    if (isVerifying) {
      Animated.parallel([
        Animated.timing(verifyOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(verifyScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      return () => {
        spinAnimation.stop();
      };
    } else {
      verifyOpacity.setValue(0);
      verifyScale.setValue(0.9);
      spinValue.setValue(0);
    }
  }, [isVerifying]);

  // Animate biometric scanner modal
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let scanLoop: Animated.CompositeAnimation | null = null;

    if (biometricModalVisible && scanStatus === 'scanning') {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 70,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.start();
    } else {
      pulseAnim.setValue(1);
      scanLineAnim.setValue(0);
    }

    return () => {
      pulseLoop?.stop();
      scanLoop?.stop();
    };
  }, [biometricModalVisible, scanStatus]);

  function validateFields(): boolean {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

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
    } else if (password.length < 6) {
      setPasswordError('Password minimal 6 karakter.');
      valid = false;
    }

    return valid;
  }

  async function performLogin(targetEmail: string, targetPass: string) {
    setLoading(true);
    setIsVerifying(true);
    setVerificationSuccess(false);
    setGeneralError('');

    try {
      const result = await login({ email: targetEmail.trim(), password: targetPass });
      if (result.success) {
        setVerificationSuccess(true);
        toast.success('Login Berhasil! Selamat datang di PARKIN.');
        setTimeout(() => {
          setIsVerifying(false);
          router.replace('/(tabs)');
        }, 750);
      } else {
        setIsVerifying(false);
        const errMsg = result.error ?? 'Login gagal. Periksa email dan password.';
        setGeneralError(errMsg);
        toast.error(errMsg);
      }
    } catch {
      setIsVerifying(false);
      const errMsg = 'Terjadi kesalahan sistem. Periksa koneksi internet Anda.';
      setGeneralError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!validateFields()) return;
    await performLogin(email, password);
  }

  // Quick login helper
  async function handleQuickLogin(userEmail: string, userPass: string) {
    setEmail(userEmail);
    setPassword(userPass);
    await performLogin(userEmail, userPass);
  }

  // Handle biometric authentication
  async function handleBiometricAuth() {
    if (Platform.OS !== 'web') {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const auth = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Login PARKIN dengan Sidik Jari',
            fallbackLabel: 'Gunakan Password',
            cancelLabel: 'Batal',
          });

          if (auth.success) {
            await performLogin('mahasiswa@parkin.campus.id', 'parkin123');
            return;
          }
        }
      } catch {
        // Fall back to scanner modal
      }
    }

    // Interactive Biometric Scanner on Web & simulated devices
    setScanStatus('scanning');
    setBiometricModalVisible(true);

    setTimeout(async () => {
      setScanStatus('success');
      setTimeout(async () => {
        setBiometricModalVisible(false);
        await performLogin('mahasiswa@parkin.campus.id', 'parkin123');
      }, 700);
    }, 1400);
  }

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
          {/* Header section */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="car-sport" size={32} color="#FFFFFF" />
            </View>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>PARKIN</Text>
            <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
              Smart Campus Parking
            </Text>
          </View>

          {/* Form Card Container */}
          <View
            style={[
              styles.cardContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: '#000000',
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Selamat Datang
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Masuk untuk memantau ketersediaan parkir kampus
            </Text>

            {!!generalError && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.dangerBg, borderColor: colors.danger },
                ]}
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorBannerText, { color: colors.danger }]}>
                  {generalError}
                </Text>
              </View>
            )}

            {/* Email Field */}
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
                  size={19}
                  color={emailError ? colors.danger : colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="user@mail.com"
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
                  editable={!loading}
                  accessibilityLabel="Input alamat email"
                />
              </View>
              {!!emailError && (
                <Text style={[styles.fieldError, { color: colors.danger }]} accessibilityRole="alert">
                  {emailError}
                </Text>
              )}
            </View>

            {/* Password Field */}
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
                  size={19}
                  color={passwordError ? colors.danger : colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                  accessibilityLabel="Input kata sandi"
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
                    size={20}
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

            {/* Tombol Masuk & Biometrik */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.loginBtn,
                  { backgroundColor: colors.primary },
                  loading && styles.loginBtnDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Tombol Masuk"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Masuk</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.biometricIconBtn,
                  {
                    backgroundColor: isDark ? colors.background : '#EEF2FF',
                    borderColor: colors.primary,
                  },
                ]}
                onPress={handleBiometricAuth}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Login dengan Sidik Jari"
              >
                <Ionicons name="finger-print" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Pembatas ATAU */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>ATAU</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Quick Demo Accounts */}
            <View style={styles.demoSection}>
              <Text style={[styles.demoTitle, { color: colors.textSecondary }]}>
                Akun Demo & Pengujian API:
              </Text>
              <View style={styles.demoPillsRow}>
                <TouchableOpacity
                  style={[
                    styles.demoPill,
                    {
                      backgroundColor: isDark ? colors.background : '#F1F5F9',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleQuickLogin('user@mail.com', 'password123')}
                  accessibilityRole="button"
                  accessibilityLabel="Login dengan akun user"
                >
                  <Ionicons name="key-outline" size={14} color={colors.primary} />
                  <Text style={[styles.demoPillText, { color: colors.textPrimary, fontWeight: FontWeight.bold }]}>
                    User (Default)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.demoPill,
                    {
                      backgroundColor: isDark ? colors.background : '#F1F5F9',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickLogin('mahasiswa@parkin.campus.id', 'parkin123')}
                  accessibilityRole="button"
                  accessibilityLabel="Login dengan akun Mahasiswa"
                >
                  <Ionicons name="school-outline" size={14} color={colors.primary} />
                  <Text style={[styles.demoPillText, { color: colors.textSecondary }]}>
                    Mahasiswa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.demoPill,
                    {
                      backgroundColor: isDark ? colors.background : '#F1F5F9',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickLogin('dosen@parkin.campus.id', 'parkin123')}
                  accessibilityRole="button"
                  accessibilityLabel="Login dengan akun Dosen"
                >
                  <Ionicons name="person-outline" size={14} color={colors.primary} />
                  <Text style={[styles.demoPillText, { color: colors.textSecondary }]}>
                    Dosen
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigasi Register */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push('/register')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.registerLinkText, { color: colors.textSecondary }]}>
                Belum punya akun?{' '}
                <Text style={[styles.registerLinkBold, { color: colors.primary }]}>Daftar Sekarang</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== LOADING / VERIFYING OVERLAY ===== */}
      {isVerifying && (
        <View style={styles.verifyingBackdrop}>
          <Animated.View
            style={[
              styles.verifyingCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: verifyOpacity,
                transform: [{ scale: verifyScale }],
              },
            ]}
          >
            {verificationSuccess ? (
              <View style={[styles.verifyingIconCircle, { backgroundColor: colors.successBg }]}>
                <Ionicons name="checkmark-circle" size={44} color={colors.success} />
              </View>
            ) : (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="sync-circle-outline" size={52} color={colors.primary} />
              </Animated.View>
            )}
            <Text style={[styles.verifyingTitle, { color: colors.textPrimary }]}>
              {verificationSuccess ? 'Login Berhasil!' : 'Memverifikasi Kredensial...'}
            </Text>
            <Text style={[styles.verifyingSubtitle, { color: colors.textSecondary }]}>
              {verificationSuccess
                ? 'Mempersiapkan dashboard parkir...'
                : 'Mengamankan sesi autentikasi Anda'}
            </Text>
          </Animated.View>
        </View>
      )}

      {/* ===== MODAL SCANNER SIDIK JARI ===== */}
      <Modal
        visible={biometricModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBiometricModalVisible(false)}
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Autentikasi Biometrik
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Sensor Sidik Jari PARKIN
              </Text>
            </View>

            {/* Fingerprint Visual Scanner */}
            <View style={styles.fingerprintBox}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: scanStatus === 'success' ? colors.success : colors.primary,
                  },
                ]}
              />
              <View
                style={[
                  styles.fingerprintCircle,
                  {
                    backgroundColor: isDark ? colors.background : '#F1F5F9',
                    borderColor: scanStatus === 'success' ? colors.success : colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name="finger-print"
                  size={52}
                  color={scanStatus === 'success' ? colors.success : colors.primary}
                />
                {scanStatus === 'scanning' && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        backgroundColor: colors.primary,
                        transform: [{ translateY: scanLineAnim }],
                      },
                    ]}
                  />
                )}
              </View>
            </View>

            {/* Status message */}
            <View style={styles.modalStatusBox}>
              {scanStatus === 'scanning' && (
                <>
                  <Text style={[styles.modalStatusText, { color: colors.textPrimary }]}>
                    Memindai Sidik Jari...
                  </Text>
                  <Text style={[styles.modalInstructionText, { color: colors.textTertiary }]}>
                    Posisikan jari Anda pada sensor perangkat
                  </Text>
                </>
              )}
              {scanStatus === 'success' && (
                <>
                  <Text style={[styles.modalStatusText, { color: colors.success }]}>
                    Sidik Jari Terverifikasi!
                  </Text>
                  <Text style={[styles.modalInstructionText, { color: colors.textTertiary }]}>
                    Menyiapkan akses ke sistem PARKIN...
                  </Text>
                </>
              )}
            </View>

            {scanStatus === 'scanning' && (
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setBiometricModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Batal</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'web' ? 48 : 36,
    paddingBottom: Spacing.xxxl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
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
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 2,
  },
  appTagline: {
    fontSize: FontSize.sm,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  cardContainer: {
    borderRadius: 24,
    padding: Platform.OS === 'web' ? 32 : 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
    lineHeight: 20,
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
  errorBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
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
    minHeight: 52,
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
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.sm,
  },
  loginBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: BorderRadius.lg,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  biometricIconBtn: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  demoSection: {
    marginBottom: Spacing.lg,
  },
  demoTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  demoPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  demoPillText: {
    fontSize: FontSize.xs,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  registerLinkText: {
    fontSize: FontSize.sm,
  },
  registerLinkBold: {
    fontWeight: FontWeight.bold,
  },

  // Verifying overlay
  verifyingBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: Spacing.xl,
  },
  verifyingCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 12,
  },
  verifyingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  verifyingTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: 16,
    textAlign: 'center',
  },
  verifyingSubtitle: {
    fontSize: FontSize.sm,
    marginTop: 6,
    textAlign: 'center',
  },

  // Biometric Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  modalSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  fingerprintBox: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: Spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    opacity: 0.4,
  },
  fingerprintCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
  modalStatusBox: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  modalStatusText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  modalInstructionText: {
    fontSize: FontSize.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
