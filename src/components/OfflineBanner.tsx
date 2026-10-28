/**
 * PARKIN — Smart Campus Parking
 * Component: OfflineBanner
 *
 * Floating Banner yang melayang di bagian atas layar tanpa menghalangi UI utama.
 * - Saat offline: Tampil badge melayang ("Koneksi Terputus. Menampilkan data terakhir")
 * - Saat kembali online: Animasi transisi hijau ("Koneksi Terhubung Kembali") lalu auto-dismiss
 * - Menggunakan Reanimated untuk animasi geser & fade yang halus
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '../constants/theme';

export default function OfflineBanner() {
  const { isOffline, wasOffline, clearWasOffline } = useOnlineStatus();
  const [visible, setVisible] = useState(false);

  // Reanimated shared values
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 250 });
    } else if (wasOffline) {
      // Baru saja pulih dari offline -> tampilkan banner sukses sebentar
      setVisible(true);
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });

      // Auto dismiss setelah 2.5 detik
      const timer = setTimeout(() => {
        translateY.value = withTiming(-80, {
          duration: 350,
          easing: Easing.in(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(setVisible)(false);
            runOnJS(clearWasOffline)();
          }
        });
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Normal online state
      translateY.value = withTiming(-80, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
        }
      });
    }
  }, [isOffline, wasOffline, clearWasOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && !isOffline && !wasOffline) {
    return null;
  }

  const isReconnecting = !isOffline && wasOffline;
  const bgColor = isReconnecting ? '#059669' : '#DC2626';
  const iconName = isReconnecting ? 'checkmark-circle' : 'cloud-offline-outline';
  const message = isReconnecting
    ? 'Koneksi Terhubung Kembali'
    : 'Koneksi Terputus. Menampilkan data terakhir';

  return (
    <View style={styles.pointerEventsContainer} pointerEvents="box-none">
      <SafeAreaView pointerEvents="box-none">
        <Animated.View
          style={[
            styles.bannerContainer,
            { backgroundColor: bgColor },
            animatedStyle,
          ]}
          pointerEvents="none"
          accessibilityRole="alert"
          accessibilityLabel={message}
        >
          {/* Pulse ring for offline indicator */}
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={15} color={Colors.white} />
          </View>
          <Text style={styles.bannerText} numberOfLines={1}>
            {message}
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  pointerEventsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Shadow.md,
    maxWidth: '92%',
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
});
