/**
 * PARKIN — Smart Campus Parking
 * Component: CheckInSuccessModal
 *
 * Modal konfirmasi "Check-in / Check-out Berhasil" dengan:
 *  - Animasi masuk spring dari bawah
 *  - Ikon centang berputar + warna sukses
 *  - Detail payload QR (Slot ID, waktu, tipe)
 *  - Tombol "Selesai"
 */

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { height: SH } = Dimensions.get('window');

export interface ScanResult {
  raw: string;
  slotId?: string;
  action?: 'checkin' | 'checkout';
  location?: string;
  timestamp: string;
}

interface Props {
  visible: boolean;
  result: ScanResult | null;
  onClose: () => void;
  onGoHome?: () => void;
}

export default function CheckInSuccessModal({ visible, result, onClose, onGoHome }: Props) {
  const translateY = useSharedValue(SH * 0.5);
  const opacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkRotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      checkScale.value = withDelay(
        200,
        withSpring(1, { damping: 10, stiffness: 260 }),
      );
      checkRotate.value = withDelay(
        200,
        withSequence(
          withTiming(-20, { duration: 120, easing: Easing.out(Easing.ease) }),
          withSpring(0, { damping: 8, stiffness: 200 }),
        ),
      );
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(SH * 0.5, { duration: 220 });
      checkScale.value = 0;
      checkRotate.value = 0;
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotate.value}deg` },
    ],
  }));

  const isCheckout = result?.action === 'checkout';
  const accentColor = isCheckout ? '#F59E0B' : '#22C55E';
  const actionLabel = isCheckout ? 'Check-out Berhasil! 🚗' : 'Check-in Berhasil! 🎉';

  if (!result) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Icon */}
          <Animated.View
            style={[styles.iconCircle, { backgroundColor: accentColor + '20', borderColor: accentColor }, checkStyle]}
          >
            <Text style={styles.iconEmoji}>{isCheckout ? '🏁' : '✅'}</Text>
          </Animated.View>

          <Text style={[styles.title, { color: accentColor }]}>{actionLabel}</Text>
          <Text style={styles.subtitle}>Data parkir telah direkam secara otomatis</Text>

          {/* Detail rows */}
          <View style={styles.detailBox}>
            <DetailRow label="Slot Parkir" value={result.slotId ?? '—'} />
            <DetailRow label="Lokasi" value={result.location ?? 'Kampus Utama'} />
            <DetailRow label="Waktu" value={result.timestamp} />
            <DetailRow label="ID Sesi" value={result.raw.slice(0, 16) + '…'} />
          </View>

          <View style={styles.btnRow}>
            <Pressable
              style={[styles.btn, { backgroundColor: accentColor, flex: 1 }]}
              onPress={onClose}
            >
              <Text style={styles.btnText}>Pindai Lagi</Text>
            </Pressable>
            {onGoHome && (
              <Pressable
                style={[styles.btn, styles.homeBtn, { borderColor: accentColor, flex: 1 }]}
                onPress={onGoHome}
              >
                <Text style={[styles.btnText, { color: '#E0E7FF' }]}>Lihat Beranda</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#1E1B4B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 24,
    shadowOpacity: 0.5,
    elevation: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#A5B4FC',
    marginBottom: 24,
    textAlign: 'center',
  },
  detailBox: {
    backgroundColor: '#312E81',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '500',
  },
  rowValue: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  homeBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
  },
});
