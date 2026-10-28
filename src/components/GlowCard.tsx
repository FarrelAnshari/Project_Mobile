/**
 * PARKIN — Smart Campus Parking
 * Component: GlowCard
 *
 * Kartu dengan efek "Ambient Glow" — bayangan berpijar berwarna
 * di belakang kartu yang aktif. Menggunakan Reanimated untuk
 * animasi glow on mount dan hover (press feedback).
 *
 * Usage:
 *   <GlowCard glowColor="#6366F1" onPress={...}>
 *     <Content />
 *   </GlowCard>
 */

import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useThemeColors } from '../hooks/useThemeColors';
import { BorderRadius } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  glowColor?: string;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Intensitas glow 0–1. Default 0.18 */
  glowIntensity?: number;
  /** Radius glow. Default 20 */
  glowRadius?: number;
  borderRadius?: number;
  disabled?: boolean;
}

export default function GlowCard({
  children,
  glowColor = '#6366F1',
  style,
  innerStyle,
  onPress,
  glowIntensity = 0.18,
  glowRadius = 20,
  borderRadius = BorderRadius.xl,
  disabled = false,
}: Props) {
  const colors = useThemeColors();
  const pressed = useSharedValue(0);
  const mounted = useSharedValue(0);

  useEffect(() => {
    mounted.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const tap = Gesture.Tap()
    .enabled(!disabled && !!onPress)
    .onBegin(() => {
      pressed.value = withSpring(1, { damping: 12, stiffness: 300 });
    })
    .onFinalize((e, success) => {
      pressed.value = withSpring(0, { damping: 10, stiffness: 200 });
      if (success && onPress) runOnJS(onPress)();
    });

  const containerStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const glowOpacity = interpolate(
      mounted.value + pressed.value * 0.3,
      [0, 1.3],
      [0, glowIntensity]
    );
    return {
      transform: [{ scale }],
      shadowOpacity: glowOpacity,
    };
  });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.card,
          {
            borderRadius,
            shadowColor: glowColor,
            shadowRadius: glowRadius,
            backgroundColor: colors.surface,
          },
          containerStyle,
          style,
        ]}
      >
        <View style={[styles.inner, { borderRadius }, innerStyle]}>
          {children}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inner: {
    overflow: 'hidden',
  },
});
