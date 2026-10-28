/**
 * PARKIN — Smart Campus Parking
 * Screen: QRScannerScreen
 *
 * Halaman pemindai QR / Tiket Parkir untuk Check-in & Check-out otomatis.
 *
 * Alur:
 *  1. Permission Check → request kamera jika belum diberikan
 *  2. CameraView live stream + ScannerOverlay animated frame
 *  3. onBarcodeScanned → parsing payload → feedback (haptic + vibration + suara)
 *  4. CheckInSuccessModal confirmation (spring animation)
 *  5. Debounce 3 detik agar tidak terpicu berulang
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Vibration,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from 'react-native-reanimated';

import ScannerOverlay from '../components/ScannerOverlay';
import CheckInSuccessModal, { ScanResult } from '../components/CheckInSuccessModal';
import AnimatedPressable from '../components/AnimatedPressable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW } = Dimensions.get('window');

// ─── QR Payload Parser ──────────────────────────────────────────────────────
/**
 * Parse payload QR code PARKIN.
 * Format yang diharapkan: "PARKIN:SLOT_A1:checkin" atau "PARKIN:SLOT_B3:checkout"
 * Jika format tidak dikenal, tetap tampilkan modal dengan data mentah.
 */
function parseQRPayload(raw: string): Omit<ScanResult, 'timestamp'> {
  const parts = raw.split(':');
  if (parts[0] === 'PARKIN' && parts.length >= 3) {
    return {
      raw,
      slotId: parts[1],
      action: parts[2] === 'checkout' ? 'checkout' : 'checkin',
      location: parts[3] ?? 'Gedung Kuliah Utama',
    };
  }
  // Format bebas — tetap diproses sebagai check-in
  return {
    raw,
    slotId: raw.slice(0, 12).toUpperCase(),
    action: 'checkin',
    location: 'Area Parkir Kampus',
  };
}

// ─── Threshold validation ────────────────────────────────────────────────────
/** Minimum panjang payload agar dianggap valid */
const MIN_PAYLOAD_LEN = 4;

function isValidPayload(raw: string): boolean {
  return raw.trim().length >= MIN_PAYLOAD_LEN;
}

// ─── Format timestamp ────────────────────────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Feedback (Audio + Haptic + Vibration) ───────────────────────────────────
function playShortBeepSound() {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      }
    }
  } catch (_) {
    // Abaikan jika browser membatasi autoplay
  }
}

async function triggerSuccessFeedback() {
  playShortBeepSound();
  try {
    // Haptic (iOS & Android via expo-haptics)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (_) {
    // Fallback to Vibration API jika haptic tidak tersedia
    Vibration.vibrate([0, 80, 60, 80]);
  }
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function QRScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [useMockCamera, setUseMockCamera] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [cameraMountError, setCameraMountError] = useState<string | null>(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [detectedData, setDetectedData] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [modalResult, setModalResult] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [simModalVisible, setSimModalVisible] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchOn, setTorchOn] = useState(false);

  // Debounce: mencegah trigger berulang dalam 3 detik
  const lastScanTime = useRef<number>(0);
  const DEBOUNCE_MS = 3000;

  // Status log
  const [statusLog, setStatusLog] = useState<string[]>([
    `[${new Date().toLocaleTimeString('id-ID')}] Camera module loaded`,
    `[${new Date().toLocaleTimeString('id-ID')}] Menunggu izin kamera...`,
  ]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setStatusLog(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 5));
  }, []);

  // Timeout untuk modul kamera
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadTimedOut(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Request permission dengan Web MediaDevices fallback
  const handleRequestPermission = useCallback(async () => {
    addLog('Meminta izin akses kamera...');
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          stream.getTracks().forEach((track) => track.stop());
          addLog('✅ Izin akses kamera web berhasil');
        } catch (webErr: any) {
          addLog(`⚠️ Browser warning: ${webErr.name || webErr.message}`);
        }
      }
      const result = await requestPermission();
      if (result.granted) {
        addLog('✅ Permission Granted — Camera Active');
      } else {
        addLog('❌ Izin ditolak atau diblokir');
      }
    } catch (err: any) {
      addLog(`❌ Error meminta izin: ${err.message}`);
    }
  }, [addLog, requestPermission]);

  // Log permission status
  useEffect(() => {
    if (!permission) return;
    if (permission.granted) {
      addLog('✅ Permission Granted — Camera Active');
    } else if (permission.status === 'denied') {
      addLog('❌ Permission Denied');
    }
  }, [permission, addLog]);

  // Set camera ready saat mock mode aktif
  useEffect(() => {
    if (useMockCamera) {
      setIsCameraReady(true);
      addLog('🟡 Mode Kamera Virtual Aktif — Siap memindai');
    }
  }, [useMockCamera, addLog]);

  // ── Barcode handler ──────────────────────────────────────────────────────
  const handleBarcodeScanned = useCallback(
    ({ data, type }: BarcodeScanningResult) => {
      const now = Date.now();
      if (now - lastScanTime.current < DEBOUNCE_MS) return;
      if (!isValidPayload(data)) {
        addLog(`⚠️ Payload terlalu pendek, diabaikan`);
        return;
      }

      lastScanTime.current = now;
      addLog(`📦 Code Detected — type: ${type}`);
      addLog(`📋 Data: ${data.slice(0, 30)}${data.length > 30 ? '…' : ''}`);

      setDetectedData(data);
      setScanSuccess(true);

      // Trigger feedback
      triggerSuccessFeedback().catch(() => {});

      // Parse & show modal setelah delay singkat (efek animasi overlay)
      setTimeout(() => {
        const parsed = parseQRPayload(data);
        const result: ScanResult = {
          ...parsed,
          timestamp: formatTime(new Date()),
        };

        // Otomatis sinkronisasi dengan widget Pin Lokasi Parkirku
        if (parsed.action === 'checkin') {
          AsyncStorage.setItem(
            '@parkin_pin_location',
            JSON.stringify({
              zone: parsed.location ?? 'Area Kampus',
              note: `Slot ${parsed.slotId} (Tiket QR)`,
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            })
          ).catch(() => {});
        } else if (parsed.action === 'checkout') {
          AsyncStorage.removeItem('@parkin_pin_location').catch(() => {});
        }

        setModalResult(result);
        setModalVisible(true);
        addLog(`🎉 ${parsed.action === 'checkout' ? 'Check-out' : 'Check-in'} diproses untuk slot ${parsed.slotId}`);
      }, 600);
    },
    [addLog],
  );

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setScanSuccess(false);
    setDetectedData(null);
    // Reset debounce agar bisa scan lagi
    lastScanTime.current = 0;
    addLog('🔁 Scanner direset, siap memindai');
  }, [addLog]);

  // ── Camera ready ─────────────────────────────────────────────────────────
  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
    addLog('📷 Camera Active — Arahkan kamera ke QR Code');
  }, [addLog]);

  // ── Permission loading state ─────────────────────────────────────────────
  if (!permission && !loadTimedOut && !useMockCamera) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <Pressable
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>← Kembali</Text>
        </Pressable>
        <Text style={styles.loadingText}>Memuat modul sensor kamera…</Text>
        <TouchableOpacity
          onPress={() => setUseMockCamera(true)}
          style={[styles.secondarySimBtn, { marginTop: 24 }]}
        >
          <Text style={styles.secondarySimBtnText}>⚡ Buka Mode Kamera Virtual Langsung</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Permission denied / Fallback ─────────────────────────────────────────
  if ((!permission || !permission.granted) && !useMockCamera) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top + 20 }]}>
        <StatusBar barStyle="light-content" />

        {/* Back button */}
        <Pressable
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>← Kembali</Text>
        </Pressable>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
          <Text style={styles.permissionDesc}>
            PARKIN memerlukan akses kamera untuk memindai QR Code tiket parkir
            dan melakukan Check-in / Check-out secara otomatis.
          </Text>

          <AnimatedPressable onPress={handleRequestPermission} style={styles.grantBtn}>
            <Text style={styles.grantBtnText}>Berikan Izin Kamera</Text>
          </AnimatedPressable>

          <TouchableOpacity
            onPress={() => setUseMockCamera(true)}
            style={styles.secondarySimBtn}
          >
            <Text style={styles.secondarySimBtnText}>⚡ Buka Kamera Virtual / Simulasi Sensor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSimModalVisible(true)}
            style={styles.textActionBtn}
          >
            <Text style={styles.textActionBtnLabel}>✏️ Input Kode / Tiket Manual</Text>
          </TouchableOpacity>

          {permission?.status === 'denied' && (
            <Animated.Text entering={FadeIn.delay(400)} style={styles.deniedNote}>
              Izin telah ditolak oleh sistem. Kamu dapat mengaktifkannya di pengaturan perangkat atau menggunakan mode simulasi di atas.
            </Animated.Text>
          )}
        </Animated.View>

        {/* Status log */}
        <StatusLogPanel logs={statusLog} />

        {/* Simulation Modal directly accessible on permission screen */}
        <Modal
          visible={simModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSimModalVisible(false)}
        >
          <View style={styles.simOverlay}>
            <View style={styles.simCard}>
              <Text style={styles.simTitle}>Simulasi Sensor QR Code</Text>
              <Text style={styles.simDesc}>
                Pilih tiket sampel atau masukkan kode kustom untuk menguji alur verifikasi, getaran, suara bip, dan modal konfirmasi.
              </Text>

              <View style={styles.simPresets}>
                <TouchableOpacity
                  style={styles.simPresetBtn}
                  onPress={() => {
                    setSimModalVisible(false);
                    setUseMockCamera(true);
                    handleBarcodeScanned({
                      data: 'PARKIN:SLOT_B4:checkin:Parkiran 2',
                      type: 'qr',
                    } as any);
                  }}
                >
                  <Text style={styles.simPresetIcon}>🅿️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simPresetTitle}>Check-in Slot B4</Text>
                    <Text style={styles.simPresetSub}>Area: Parkiran 2</Text>
                  </View>
                  <Text style={styles.simPresetBadge}>Check-in</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.simPresetBtn}
                  onPress={() => {
                    setSimModalVisible(false);
                    setUseMockCamera(true);
                    handleBarcodeScanned({
                      data: 'PARKIN:SLOT_A1:checkout:Gedung Kuliah Utama',
                      type: 'qr',
                    } as any);
                  }}
                >
                  <Text style={styles.simPresetIcon}>🚗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simPresetTitle}>Check-out Slot A1</Text>
                    <Text style={styles.simPresetSub}>Area: Gedung Kuliah Utama</Text>
                  </View>
                  <Text style={[styles.simPresetBadge, { backgroundColor: '#F59E0B25', color: '#F59E0B' }]}>Check-out</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.simInputRow}>
                <TextInput
                  style={styles.simInput}
                  placeholder="Atau ketik payload QR..."
                  placeholderTextColor="#64748B"
                  value={manualInput}
                  onChangeText={setManualInput}
                />
                <TouchableOpacity
                  style={styles.simSubmitBtn}
                  onPress={() => {
                    if (!isValidPayload(manualInput)) {
                      addLog('⚠️ Validasi gagal: payload minimal 4 karakter');
                      return;
                    }
                    setSimModalVisible(false);
                    setUseMockCamera(true);
                    handleBarcodeScanned({
                      data: manualInput.trim(),
                      type: 'qr',
                    } as any);
                    setManualInput('');
                  }}
                >
                  <Text style={styles.simSubmitText}>Kirim</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.simCloseBtn}
                onPress={() => setSimModalVisible(false)}
              >
                <Text style={styles.simCloseText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Success modal */}
        <CheckInSuccessModal
          visible={modalVisible}
          result={modalResult}
          onClose={handleModalClose}
          onGoHome={() => {
            handleModalClose();
            router.replace('/(tabs)' as any);
          }}
        />
      </View>
    );
  }

  // ── Main scanner view ─────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera / Live Feed / Simulated Viewfinder */}
      {!useMockCamera && !cameraMountError ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torchOn}
          onCameraReady={handleCameraReady}
          onBarcodeScanned={scanSuccess ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39'] }}
          onMountError={(e) => {
            addLog(`❌ Camera Error: ${e.message}`);
            setCameraMountError(e.message);
          }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.mockViewfinder]}>
          <View style={styles.mockViewfinderContent}>
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>🟡 SENSOR KAMERA VIRTUAL (SIMULASI)</Text>
            </View>
            <Text style={styles.mockInstructions}>
              {cameraMountError
                ? `Kamera fisik tidak tersedia (${cameraMountError}). Menggunakan sensor virtual.`
                : 'Arahkan sensor ke QR tiket parkir atau gunakan tombol sampel di bawah:'}
            </Text>
            <View style={styles.mockChipsRow}>
              <TouchableOpacity
                style={styles.mockChip}
                onPress={() => {
                  handleBarcodeScanned({
                    data: 'PARKIN:SLOT_B4:checkin:Parkiran 2',
                    type: 'qr',
                  } as any);
                }}
              >
                <Text style={styles.mockChipText}>🅿️ Scan Tiket B4 (In)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mockChip}
                onPress={() => {
                  handleBarcodeScanned({
                    data: 'PARKIN:SLOT_A1:checkout:Gedung Kuliah Utama',
                    type: 'qr',
                  } as any);
                }}
              >
                <Text style={styles.mockChipText}>🚗 Scan Tiket A1 (Out)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Scanner overlay */}
      <ScannerOverlay scanning={isCameraReady && !scanSuccess} success={scanSuccess} />

      {/* Top bar */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <AnimatedPressable onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>✕</Text>
        </AnimatedPressable>

        <Text style={styles.topTitle}>Scan QR Parkir</Text>

        <AnimatedPressable onPress={() => setTorchOn(p => !p)} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>{torchOn ? '🔦' : '💡'}</Text>
        </AnimatedPressable>
      </Animated.View>

      {/* Hint text */}
      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        style={styles.hintContainer}
      >
        <Text style={styles.hintText}>
          {!isCameraReady
            ? 'Menyiapkan kamera…'
            : scanSuccess
              ? '✅ QR Code Terdeteksi!'
              : 'Arahkan kamera ke QR Code tiket parkir'}
        </Text>
      </Animated.View>

      {/* Detected data badge */}
      {detectedData && (
        <Animated.View entering={SlideInDown.springify()} style={styles.detectedBadge}>
          <Text style={styles.detectedLabel}>📋 Code Detected</Text>
          <Text style={styles.detectedValue} numberOfLines={1}>
            {detectedData}
          </Text>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}
      >
        {/* Flip camera */}
        <AnimatedPressable
          onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
          style={styles.controlBtn}
          disabled={scanSuccess}
        >
          <Text style={styles.controlBtnIcon}>🔄</Text>
          <Text style={styles.controlBtnLabel}>Balik</Text>
        </AnimatedPressable>

        {/* Status indicator */}
        <View style={styles.statusDot}>
          <View
            style={[
              styles.statusDotInner,
              {
                backgroundColor: isCameraReady
                  ? scanSuccess
                    ? '#22C55E'
                    : '#6366F1'
                  : '#94A3B8',
              },
            ]}
          />
          <Text style={styles.statusDotLabel}>
            {isCameraReady ? (scanSuccess ? 'Terdeteksi' : 'Aktif') : 'Memuat'}
          </Text>
        </View>

        {/* Manual / Simulasi Scan */}
        <AnimatedPressable
          onPress={() => setSimModalVisible(true)}
          style={styles.controlBtn}
          disabled={scanSuccess}
        >
          <Text style={styles.controlBtnIcon}>⚡</Text>
          <Text style={styles.controlBtnLabel}>Simulasi</Text>
        </AnimatedPressable>
      </Animated.View>

      {/* Status log panel */}
      <Animated.View
        entering={FadeIn.delay(500)}
        style={[styles.logPanel, { bottom: insets.bottom + 90 }]}
      >
        {Platform.OS === 'web' ? null : <StatusLogPanel logs={statusLog} compact />}
      </Animated.View>

      {/* Simulation / Manual Scan Modal */}
      <Modal
        visible={simModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSimModalVisible(false)}
      >
        <View style={styles.simOverlay}>
          <View style={styles.simCard}>
            <Text style={styles.simTitle}>Simulasi Sensor QR Code</Text>
            <Text style={styles.simDesc}>
              Pilih tiket sampel atau masukkan kode kustom untuk menguji alur verifikasi, getaran, suara bip, dan modal konfirmasi.
            </Text>

            <View style={styles.simPresets}>
              <TouchableOpacity
                style={styles.simPresetBtn}
                onPress={() => {
                  setSimModalVisible(false);
                  handleBarcodeScanned({
                    data: 'PARKIN:SLOT_B4:checkin:Parkiran 2',
                    type: 'qr',
                  } as any);
                }}
              >
                <Text style={styles.simPresetIcon}>🅿️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.simPresetTitle}>Check-in Slot B4</Text>
                  <Text style={styles.simPresetSub}>Area: Parkiran 2</Text>
                </View>
                <Text style={styles.simPresetBadge}>Check-in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simPresetBtn}
                onPress={() => {
                  setSimModalVisible(false);
                  handleBarcodeScanned({
                    data: 'PARKIN:SLOT_A1:checkout:Gedung Kuliah Utama',
                    type: 'qr',
                  } as any);
                }}
              >
                <Text style={styles.simPresetIcon}>🚗</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.simPresetTitle}>Check-out Slot A1</Text>
                  <Text style={styles.simPresetSub}>Area: Gedung Kuliah Utama</Text>
                </View>
                <Text style={[styles.simPresetBadge, { backgroundColor: '#F59E0B25', color: '#F59E0B' }]}>Check-out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.simInputRow}>
              <TextInput
                style={styles.simInput}
                placeholder="Atau ketik payload QR..."
                placeholderTextColor="#64748B"
                value={manualInput}
                onChangeText={setManualInput}
              />
              <TouchableOpacity
                style={styles.simSubmitBtn}
                onPress={() => {
                  if (!isValidPayload(manualInput)) {
                    addLog('⚠️ Validasi gagal: payload minimal 4 karakter');
                    return;
                  }
                  setSimModalVisible(false);
                  handleBarcodeScanned({
                    data: manualInput.trim(),
                    type: 'qr',
                  } as any);
                  setManualInput('');
                }}
              >
                <Text style={styles.simSubmitText}>Kirim</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.simCloseBtn}
              onPress={() => setSimModalVisible(false)}
            >
              <Text style={styles.simCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success modal */}
      <CheckInSuccessModal
        visible={modalVisible}
        result={modalResult}
        onClose={handleModalClose}
        onGoHome={() => {
          handleModalClose();
          router.replace('/(tabs)' as any);
        }}
      />
    </View>
  );
}

// ─── Status Log Panel ─────────────────────────────────────────────────────────
function StatusLogPanel({
  logs,
  compact = false,
}: {
  logs: string[];
  compact?: boolean;
}) {
  const displayLogs = compact ? logs.slice(0, 2) : logs.slice(0, 4);
  return (
    <View style={[styles.logContainer, compact && styles.logContainerCompact]}>
      <Text style={styles.logTitle}>📟 Status Log</Text>
      {displayLogs.map((line, i) => (
        <Text key={i} style={[styles.logLine, { opacity: 1 - i * 0.2 }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F0E1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#A5B4FC',
    fontSize: 16,
    fontWeight: '500',
  },

  // ── Permission ──
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F0E1A',
    alignItems: 'center',
    padding: 24,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  backBtnText: {
    color: '#A5B4FC',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionCard: {
    marginTop: 60,
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.3,
    elevation: 12,
  },
  permissionIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  permissionTitle: {
    color: '#E0E7FF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  permissionDesc: {
    color: '#818CF8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  grantBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.5,
    elevation: 8,
  },
  grantBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deniedNote: {
    color: '#F87171',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },

  // ── Top bar ──
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 18,
  },
  topTitle: {
    color: '#E0E7FF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // ── Hint ──
  hintContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginTop: 160,
  },
  hintText: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // ── Detected badge ──
  detectedBadge: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    padding: 12,
  },
  detectedLabel: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detectedValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // ── Bottom controls ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlBtn: {
    alignItems: 'center',
    gap: 4,
  },
  controlBtnIcon: {
    fontSize: 24,
  },
  controlBtnLabel: {
    color: '#A5B4FC',
    fontSize: 12,
    fontWeight: '600',
  },
  statusDot: {
    alignItems: 'center',
    gap: 6,
  },
  statusDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDotLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Log panel ──
  logPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  logContainer: {
    backgroundColor: 'rgba(15,14,26,0.82)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    gap: 3,
    marginTop: 20,
    width: SW - 48,
  },
  logContainerCompact: {
    padding: 10,
  },
  logTitle: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  logLine: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },

  // ── Simulation modal ──
  simOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  simCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  simTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  simDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  simPresets: {
    gap: 10,
    marginBottom: 16,
  },
  simPresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  simPresetIcon: {
    fontSize: 24,
  },
  simPresetTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700',
  },
  simPresetSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  simPresetBadge: {
    color: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  simInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  simInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  simSubmitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simSubmitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  simCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  simCloseText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  secondarySimBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  secondarySimBtnText: {
    color: '#C7D2FE',
    fontSize: 14,
    fontWeight: '700',
  },
  textActionBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  textActionBtnLabel: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '600',
  },
  mockViewfinder: {
    backgroundColor: '#0F0E1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockViewfinderContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 360,
  },
  mockBadge: {
    backgroundColor: 'rgba(234,179,8,0.18)',
    borderWidth: 1,
    borderColor: '#EAB308',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  mockBadgeText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mockInstructions: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  mockChipsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  mockChip: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderWidth: 1,
    borderColor: '#818CF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mockChipText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
  },
});
