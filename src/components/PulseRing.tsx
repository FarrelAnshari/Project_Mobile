/**
 * PARKIN — Smart Campus Parking
 * Component: PulseRing
 *
 * Efek ripple/pulse ring yang memancar berulang dari titik tengah.
 * Cocok digunakan sebagai indikator lokasi pin parkir aktif.
 *
 * Menggunakan Reanimated Animated.loop + withSequence untuk multiple rings.
 *
 * Usage:
 *   <PulseRing color="#6366F1" size={60} rings={3} />
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface Props {
  color?: string;
  size?: number;
  rings?: number;
  duration?: number;
  children?: React.ReactNode;
}

function Ring({
  color,
  size,
  delay,
  duration,
}: {
  color: string;
  size: number;
  delay: number;
  duration: number;
}) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.4, { duration: 0 }),
            withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
          ),
          -1,
          false
        )
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.7, { duration: duration * 0.2, easing: Easing.out(Easing.cubic) }),
            withTiming(0, { duration: duration * 0.8, easing: Easing.out(Easing.cubic) })
          ),
          -1,
          false
        )
      );
    };
    animate();
  }, [delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

export default function PulseRing({
  color = '#6366F1',
  size = 80,
  rings = 3,
  duration = 2000,
  children,
}: Props) {
  return (
    <View style={[styles.container, { width: size, height: size, alignItems: 'center', justifyContent: 'center' }]}>
      {Array.from({ length: rings }).map((_, i) => (
        <Ring
          key={i}
          color={color}
          size={size}
          delay={(duration / rings) * i}
          duration={duration}
        />
      ))}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
