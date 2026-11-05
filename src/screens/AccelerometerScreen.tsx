/**
 * PARKIN — Smart Campus Parking
 * Screen: AccelerometerScreen (Week 7 — Task 01, 02, 03)
 *
 * Task 01: Koneksi accelerometer via expo-sensors → Accelerometer.addListener()
 * Task 02: Tampilkan nilai X, Y, Z real-time di UI + console.log ke dev console
 * Task 03: Deteksi gerakan HP (threshold), vibration feedback, status pergerakan
 *
 * CATATAN PENTING:
 * - Sensor ini mengukur GERAKAN HP PENGGUNA, bukan kendaraan parkir.
 * - State sensor TIDAK terhubung ke parkingData, occupancy, atau simulasi kendaraan.
 * - Fitur parkir PARKIN tetap berjalan independen.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SensorData {
  x: number;
  y: number;
  z: number;
}

type SensorStatus = 'initializing' | 'available' | 'unavailable';
type MovementStatus = 'stable' | 'moving';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Update interval untuk accelerometer (ms) — Task 01 requirement */
const UPDATE_INTERVAL_MS = 100;

/**
 * THRESHOLD deteksi gerakan — Task 03.
 * Dihitung dari selisih absolut nilai akselerasi antar frame.
 * Nilai dalam g-force. Mudah disesuaikan untuk testing.
 */
const MOVEMENT_THRESHOLD = 0.08; // g-force delta — turunkan untuk lebih sensitif

/** Cooldown getaran agar vibration tidak terus-menerus (ms) — Task 03 */
const VIBRATION_COOLDOWN_MS = 1200;

/** Delay stabilisasi — berapa lama perangkat harus tenang sebelum kembali "Stabil" */
const STABLE_DELAY_MS = 800;

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatAxis(val: number): string {
  return val.toFixed(4);
}

/** Hitung total delta akselerasi dari dua pembacaan — lebih akurat dari magnitude murni */
function calcDelta(prev: SensorData, curr: SensorData): number {
  return (
    Math.abs(curr.x - prev.x) +
    Math.abs(curr.y - prev.y) +
    Math.abs(curr.z - prev.z)
  );
}

// ─── Komponen Kartu Nilai Sumbu ───────────────────────────────────────────────

function AxisCard({
  axis,
  value,
  color,
  bgColor,
  isDark,
  colors,
}: {
  axis: string;
  value: number;
  color: string;
  bgColor: string;
  isDark: boolean;
  colors: any;
}) {
  const absVal = Math.abs(value);
  const barWidth = Math.min(absVal / 2, 1) * 100; // Normalisasi 0–100% (max ±2g)

  return (
    <View style={[styles.axisCard, { backgroundColor: isDark ? '#232742' : '#F8FAFC', borderColor: isDark ? '#2E3456' : '#E2E8F0' }]}>
      {/* Header */}
      <View style={styles.axisHeader}>
        <View style={[styles.axisLabelBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.axisLabelText, { color }]}>{axis}</Text>
        </View>
        <Text style={[styles.axisUnit, { color: isDark ? '#64748B' : '#94A3B8' }]}>g-force</Text>
      </View>

      {/* Nilai numerik */}
      <Text style={[styles.axisValue, { color }]}>
        {value >= 0 ? '+' : ''}{formatAxis(value)}
      </Text>

      {/* Bar indikator */}
      <View style={[styles.axisBarTrack, { backgroundColor: isDark ? '#1A1C2E' : '#E2E8F0' }]}>
        <View
          style={[
            styles.axisBarFill,
            {
              backgroundColor: color,
              width: `${barWidth}%`,
              opacity: 0.85,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Komponen Status Badge ────────────────────────────────────────────────────

function StatusBadge({ status, colors, isDark }: { status: MovementStatus; colors: any; isDark: boolean }) {
  const isMoving = status === 'moving';
  const bg = isMoving ? (isDark ? 'rgba(239,68,68,0.18)' : '#FEE2E2') : (isDark ? 'rgba(34,197,94,0.16)' : '#DCFCE7');
  const fg = isMoving ? (isDark ? '#EF4444' : '#DC2626') : (isDark ? '#22C55E' : '#16A34A');
  const icon: any = isMoving ? 'phone-portrait' : 'checkmark-circle';
  const label = isMoving ? 'Goyang Terdeteksi!' : 'Perangkat Stabil';

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg, borderColor: fg + '50' }]}>
      <Ionicons name={icon} size={22} color={fg} />
      <Text style={[styles.statusBadgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ─── Sensor Info Card ─────────────────────────────────────────────────────────

function SensorInfoCard({
  sensorStatus,
  isDark,
}: {
  sensorStatus: SensorStatus;
  isDark: boolean;
}) {
  const isAvail = sensorStatus === 'available';
  const isInit = sensorStatus === 'initializing';
  const bg = isAvail
    ? (isDark ? 'rgba(99,102,241,0.14)' : 'rgba(99,102,241,0.08)')
    : (isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.08)');
  const fg = isAvail ? '#6366F1' : isInit ? '#F59E0B' : '#EF4444';
  const label =
    sensorStatus === 'initializing'
      ? 'Menginisialisasi sensor…'
      : sensorStatus === 'available'
      ? 'Accelerometer Aktif'
      : 'Sensor Tidak Tersedia';
  const icon: any = isAvail ? 'hardware-chip' : isInit ? 'hourglass' : 'warning';

  return (
    <View style={[styles.sensorInfoCard, { backgroundColor: bg, borderColor: fg + '40' }]}>
      <Ionicons name={icon} size={16} color={fg} />
      <Text style={[styles.sensorInfoText, { color: fg }]}>{label}</Text>
      {Platform.OS === 'web' && (
        <Text style={[styles.sensorInfoSub, { color: fg + 'CC' }]}>
          (Sensor fisik terbatas di Web)
        </Text>
      )}
    </View>
  );
}

// ─── Log Panel ───────────────────────────────────────────────────────────────

function LogPanel({ logs, isDark }: { logs: string[]; isDark: boolean }) {
  return (
    <View style={[styles.logPanel, { backgroundColor: isDark ? '#0F0E1A' : '#1E293B' }]}>
      <Text style={styles.logTitle}>📟 Development Console Log</Text>
      {logs.map((line, i) => (
        <Text key={i} style={styles.logLine} numberOfLines={1}>{line}</Text>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AccelerometerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // ── Task 01 & 02: State data sensor ──────────────────────────────────────
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('initializing');
  const [data, setData] = useState<SensorData>({ x: 0, y: 0, z: 0 });

  // ── Task 03: State deteksi gerakan ────────────────────────────────────────
  const [movementStatus, setMovementStatus] = useState<MovementStatus>('stable');

  // ── Log panel (Task 02 — console output) ─────────────────────────────────
  const [logs, setLogs] = useState<string[]>(['[init] Memuat modul expo-sensors…']);

  // ── Refs untuk mencegah duplikasi listener & cooldown vibration ───────────
  const prevDataRef = useRef<SensorData>({ x: 0, y: 0, z: 0 });
  const lastVibrationRef = useRef<number>(0);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('id-ID');
    const line = `[${ts}] ${msg}`;
    // Task 02: Log ke development console
    console.log('[PARKIN Accelerometer]', line);
    setLogs(prev => [line, ...prev].slice(0, 10));
  }, []);

  // ── Task 01: Cek ketersediaan sensor ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function checkAndSubscribe() {
      addLog('Memeriksa ketersediaan Accelerometer…');

      try {
        // Task 01 requirement: Accelerometer.isAvailableAsync()
        const available = await Accelerometer.isAvailableAsync();

        if (!mounted) return;

        if (!available) {
          setSensorStatus('unavailable');
          addLog('⚠️ Accelerometer tidak tersedia di perangkat ini');
          return;
        }

        setSensorStatus('available');
        addLog('✅ Accelerometer tersedia — mulai berlangganan data');

        // Task 01 requirement: Atur update interval
        Accelerometer.setUpdateInterval(UPDATE_INTERVAL_MS);
        addLog(`⚙️ Update interval: ${UPDATE_INTERVAL_MS}ms`);

        // Task 01 requirement: Accelerometer.addListener() — baca nilai X, Y, Z
        // Task 02: nilai ditampilkan di UI + console.log
        // Task 03: digunakan untuk deteksi gerakan
        subscriptionRef.current = Accelerometer.addListener((reading: SensorData) => {
          if (!mounted) return;

          // ── Task 02: Update state & console (pembacaan riil, bukan hardcoded) ──
          setData(reading);
          console.log(
            `[PARKIN Accel] X=${reading.x.toFixed(4)} Y=${reading.y.toFixed(4)} Z=${reading.z.toFixed(4)}`
          );

          // ── Task 03: Deteksi gerakan berdasarkan delta antar frame ────────────
          const delta = calcDelta(prevDataRef.current, reading);
          prevDataRef.current = reading;

          if (delta > MOVEMENT_THRESHOLD) {
            // Perangkat bergerak
            setMovementStatus('moving');

            // Task 03: Vibration feedback dengan cooldown (tidak berulang terus)
            const now = Date.now();
            if (now - lastVibrationRef.current > VIBRATION_COOLDOWN_MS) {
              lastVibrationRef.current = now;
              try {
                Vibration.vibrate(80);
              } catch (_) {
                // Tangani platform yang tidak mendukung vibration
              }
            }

            // Reset timer stabilisasi
            if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
            stableTimerRef.current = setTimeout(() => {
              setMovementStatus('stable');
            }, STABLE_DELAY_MS);
          }
        });

        addLog('📡 Listener aktif — membaca data accelerometer');
      } catch (err: any) {
        if (!mounted) return;
        setSensorStatus('unavailable');
        addLog(`❌ Error: ${err?.message ?? 'Tidak dapat memuat sensor'}`);
      }
    }

    checkAndSubscribe();

    // Task 01 requirement: Cleanup subscription saat komponen unmount
    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
        console.log('[PARKIN Accel] Subscription dibersihkan (unmount)');
      }
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current);
      }
    };
  }, [addLog]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#1A1C2E' : '#F8FAFC' }]}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: isDark ? '#1A1C2E' : '#F8FAFC', borderBottomColor: isDark ? '#2E3456' : '#E2E8F0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Kembali">
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarTitleWrap}>
          <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Sensor Accelerometer</Text>
          <Text style={[styles.topBarSub, { color: colors.textSecondary }]}>Week 7 — Task 01, 02, 03</Text>
        </View>
        <View style={[styles.topBarBadge, { backgroundColor: '#6366F122' }]}>
          <Ionicons name="hardware-chip-outline" size={16} color="#6366F1" />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        {/* ── Sensor Status — Task 01 ── */}
        <View style={styles.section}>
          <SensorInfoCard sensorStatus={sensorStatus} isDark={isDark} />
        </View>

        {/* ── Movement Status — Task 03 ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>STATUS GERAKAN PERANGKAT</Text>
          <StatusBadge status={movementStatus} colors={colors} isDark={isDark} />

          {/* Info threshold */}
          <View style={[styles.thresholdInfo, { backgroundColor: isDark ? '#232742' : '#F1F5F9', borderColor: isDark ? '#2E3456' : '#E2E8F0' }]}>
            <Ionicons name="options-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.thresholdText, { color: colors.textTertiary }]}>
              Threshold deteksi: {MOVEMENT_THRESHOLD} g-force delta · Cooldown: {VIBRATION_COOLDOWN_MS}ms
            </Text>
          </View>
        </View>

        {/* ── Nilai Sumbu X, Y, Z — Task 02 ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PEMBACAAN REAL-TIME (g-force)</Text>

          {sensorStatus === 'unavailable' && (
            <View style={[styles.unavailableBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2', borderColor: '#EF444430' }]}>
              <Ionicons name="warning" size={16} color="#EF4444" />
              <Text style={[styles.unavailableText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                Sensor tidak tersedia. Nilai tidak dapat dibaca.
                {Platform.OS === 'web' ? ' Gunakan Expo Go di HP fisik untuk pengujian penuh.' : ''}
              </Text>
            </View>
          )}

          <View style={styles.axisGrid}>
            <AxisCard
              axis="X"
              value={data.x}
              color="#6366F1"
              bgColor={isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'}
              isDark={isDark}
              colors={colors}
            />
            <AxisCard
              axis="Y"
              value={data.y}
              color="#10B981"
              bgColor={isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)'}
              isDark={isDark}
              colors={colors}
            />
            <AxisCard
              axis="Z"
              value={data.z}
              color="#F59E0B"
              bgColor={isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)'}
              isDark={isDark}
              colors={colors}
            />
          </View>

          {/* Total magnitude */}
          <View style={[styles.magnitudeCard, { backgroundColor: isDark ? '#232742' : '#FFFFFF', borderColor: isDark ? '#2E3456' : '#E2E8F0' }]}>
            <Text style={[styles.magnitudeLabel, { color: colors.textSecondary }]}>Magnitude Total</Text>
            <Text style={[styles.magnitudeValue, { color: '#6366F1' }]}>
              {Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2).toFixed(4)} g
            </Text>
            <Text style={[styles.magnitudeNote, { color: colors.textTertiary }]}>
              √(X² + Y² + Z²)
            </Text>
          </View>
        </View>

        {/* ── Panduan Testing ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CARA PENGUJIAN</Text>
          <View style={[styles.guideCard, { backgroundColor: isDark ? '#232742' : '#FFFFFF', borderColor: isDark ? '#2E3456' : '#E2E8F0' }]}>
            {[
              { icon: 'phone-portrait-outline', text: 'Buka di HP fisik menggunakan Expo Go' },
              { icon: 'scan-outline', text: 'Scan QR Code dari terminal npx expo start' },
              { icon: 'move-outline', text: 'Goyangkan HP — status berubah ke "Goyang Terdeteksi!"' },
              { icon: 'phone-portrait', text: 'HP statis → kembali ke "Perangkat Stabil" setelah ~0.8 detik' },
              { icon: 'terminal-outline', text: 'Buka terminal Expo → lihat log X, Y, Z real-time' },
            ].map((item, i) => (
              <View key={i} style={styles.guideRow}>
                <Ionicons name={item.icon as any} size={15} color="#6366F1" />
                <Text style={[styles.guideText, { color: colors.textSecondary }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Dev Console Log — Task 02 ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DEVELOPMENT CONSOLE (10 LOG TERAKHIR)</Text>
          <LogPanel logs={logs} isDark={isDark} />
        </View>

        {/* ── Disclaimer ── */}
        <View style={[styles.disclaimerCard, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)', borderColor: '#6366F130' }]}>
          <Ionicons name="information-circle-outline" size={14} color="#6366F1" />
          <Text style={[styles.disclaimerText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Sensor ini mengukur gerakan fisik HP pengguna. Tidak terhubung ke data
            parkir, simulasi kendaraan, atau slot parkir PARKIN.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleWrap: { flex: 1 },
  topBarTitle: { fontSize: 16, fontWeight: '700' },
  topBarSub: { fontSize: 11, marginTop: 1 },
  topBarBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  // Sensor info
  sensorInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  sensorInfoText: { fontSize: 13, fontWeight: '600' },
  sensorInfoSub: { fontSize: 11, marginLeft: 4 },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
  },
  statusBadgeText: { fontSize: 18, fontWeight: '800' },

  thresholdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  thresholdText: { fontSize: 10, flex: 1 },

  // Axis cards
  axisGrid: { gap: 10 },
  axisCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  axisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  axisLabelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  axisLabelText: { fontSize: 13, fontWeight: '800' },
  axisUnit: { fontSize: 11 },
  axisValue: { fontSize: 28, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  axisBarTrack: { height: 4, borderRadius: 3, overflow: 'hidden' },
  axisBarFill: { height: '100%', borderRadius: 3 },

  // Magnitude
  magnitudeCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  magnitudeLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  magnitudeValue: { fontSize: 20, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  magnitudeNote: { fontSize: 10 },

  // Unavailable
  unavailableBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  unavailableText: { fontSize: 12, flex: 1, lineHeight: 18 },

  // Guide
  guideCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guideText: { fontSize: 13, flex: 1, lineHeight: 18 },

  // Log panel
  logPanel: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  logTitle: { color: '#818CF8', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  logLine: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },

  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  disclaimerText: { fontSize: 11, flex: 1, lineHeight: 16 },
});

