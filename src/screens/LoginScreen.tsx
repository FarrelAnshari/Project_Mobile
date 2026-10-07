/**
 * PARKIN — Smart Campus Parking
 * Screen: Login
 *
 * Authentication screen — gerbang masuk aplikasi.
 * Setiap kali web/app dibuka, user harus melewati layar ini.
 * Fitur: Form Login, Sensor Sidik Jari (Biometrik), dan Quick Demo Login.
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
  Alert,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

// Validasi email sederhana
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const passwordRef = useRef<TextInput>(null);

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

  async function handleLogin() {
    if (!validateFields()) return;

    setLoading(true);
    setGeneralError('');

    try {
      const result = await login({ email: email.trim(), password });
      if (!result.success) {
        setGeneralError(result.error ?? 'Login gagal. Coba lagi.');
      }
    } catch {
      setGeneralError('Terjadi kesalahan. Periksa koneksi dan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  // Quick login helper
  async function handleQuickLogin(userEmail: string, userPass: string) {
    setEmail(userEmail);
    setPassword(userPass);
    setLoading(true);
    setGeneralError('');
    try {
      const result = await login({ email: userEmail, password: userPass });
      if (!result.success) {
        setGeneralError(result.error ?? 'Login gagal.');
      }
    } catch {
      setGeneralError('Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  }

  // Handle biometric authentication
  async function handleBiometricAuth() {
    // If native device supports LocalAuthentication, try native prompt first
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
            setLoading(true);
            await login({
              email: 'mahasiswa@parkin.campus.id',
              password: 'parkin123',
            });
            setLoading(false);
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

    // Simulate authenticating biometric fingerprint
    setTimeout(async () => {
      setScanStatus('success');
      setTimeout(async () => {
        setBiometricModalVisible(false);
        setLoading(true);
        const result = await login({
          email: 'mahasiswa@parkin.campus.id',
          password: 'parkin123',
        });
        if (!result.success) {
          setGeneralError(result.error ?? 'Verifikasi sidik jari gagal.');
        }
        setLoading(false);
      }, 700);
    }, 1500);
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
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>P</Text>
            </View>
            <Text style={styles.appName}>PARKIN</Text>
            <Text style={styles.appTagline}>Smart Campus Parking</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {!!generalError && (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Ionicons name="warning-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputWrapper, !!emailError && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="mahasiswa@parkin.campus.id"
                  placeholderTextColor={Colors.textTertiary}
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
                />
              </View>
              {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrapper, !!passwordError && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
            </View>

            {/* Login & Biometric Buttons Row */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>Masuk</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.biometricIconBtn}
                onPress={handleBiometricAuth}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Login dengan Sidik Jari"
              >
                <Ionicons name="finger-print" size={26} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Prominent Biometric / Fingerprint Card */}
            <TouchableOpacity
              style={[styles.biometricCard, Shadow.sm]}
              onPress={handleBiometricAuth}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Masuk dengan Sidik Jari / Biometrik"
            >
              <View style={styles.biometricIconCircle}>
                <Ionicons name="finger-print" size={28} color={Colors.primary} />
              </View>
              <View style={styles.biometricTextContainer}>
                <Text style={styles.biometricTitle}>Masuk dengan Sidik Jari</Text>
                <Text style={styles.biometricSubtitle}>Verifikasi cepat biometrik satu sentuhan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>

            {/* Demo Accounts Quick Login */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Akun Demo Cepat:</Text>
              <View style={styles.demoPillsRow}>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => handleQuickLogin('mahasiswa@parkin.campus.id', 'parkin123')}
                >
                  <Ionicons name="school-outline" size={14} color={Colors.primary} />
                  <Text style={styles.demoPillText}>Mahasiswa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => handleQuickLogin('dosen@parkin.campus.id', 'parkin123')}
                >
                  <Ionicons name="person-outline" size={14} color={Colors.primary} />
                  <Text style={styles.demoPillText}>Dosen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoPill}
                  onPress={() => handleQuickLogin('staff@parkin.campus.id', 'parkin123')}
                >
                  <Ionicons name="briefcase-outline" size={14} color={Colors.primary} />
                  <Text style={styles.demoPillText}>Staff</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push('/register')}
              disabled={loading}
            >
              <Text style={styles.registerLinkText}>
                Belum punya akun? <Text style={styles.registerLinkBold}>Daftar</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ===== MODAL SCANNER SIDIK JARI ===== */}
      <Modal
        visible={biometricModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBiometricModalVisible(false)}
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.md]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Autentikasi Biometrik</Text>
              <Text style={styles.modalSubtitle}>Sensor Sidik Jari PARKIN</Text>
            </View>

            {/* Fingerprint Visual Scanner */}
            <View style={styles.fingerprintBox}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: scanStatus === 'success' ? Colors.success : Colors.primary,
                  },
                ]}
              />
              <View
                style={[
                  styles.fingerprintCircle,
                  scanStatus === 'success' && { backgroundColor: Colors.success + '15', borderColor: Colors.success },
                ]}
              >
                {scanStatus === 'success' ? (
                  <Ionicons name="checkmark-circle" size={54} color={Colors.success} />
                ) : (
                  <>
                    <Ionicons name="finger-print" size={54} color={Colors.primary} />
                    {/* Animated laser line */}
                    <Animated.View
                      style={[
                        styles.laserLine,
                        {
                          transform: [{ translateY: scanLineAnim }],
                        },
                      ]}
                    />
                  </>
                )}
              </View>
            </View>

            {/* Scan Status Text */}
            <View style={styles.statusBox}>
              {scanStatus === 'scanning' ? (
                <>
                  <Text style={styles.statusTitle}>Memindai Sidik Jari...</Text>
                  <Text style={styles.statusDescription}>
                    Tempelkan jari Anda pada sensor untuk verifikasi instan.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.statusTitle, { color: Colors.success }]}>
                    Sidik Jari Terverifikasi!
                  </Text>
                  <Text style={styles.statusDescription}>
                    Autentikasi berhasil. Mengalihkan ke dashboard...
                  </Text>
                </>
              )}
            </View>

            {/* Cancel Button */}
            {scanStatus === 'scanning' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setBiometricModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
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
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.xxxl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logoLetter: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  appName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  appTagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
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
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: 6,
  },
  fieldError: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: 6,
    marginLeft: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  loginBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  biometricIconBtn: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '35',
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
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  biometricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  biometricIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  biometricSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  demoSection: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  demoPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  registerLinkText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  registerLinkBold: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  fingerprintBox: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    overflow: 'hidden',
  },
  laserLine: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  statusBox: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  cancelBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
});
