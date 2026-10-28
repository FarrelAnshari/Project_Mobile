/**
 * PARKIN — Smart Campus Parking
 * Component: PulseIndicator
 *
 * Animated pulsing dot to indicate live/real-time status.
 * Uses react-native-reanimated for smooth, performant animation.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  color?: string;
  size?: number;
}

export default function PulseIndicator({ color = '#34D399', size = 8 }: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1,
      false
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.wrapper, { width: size * 2.5, height: size * 2.5 }]}>
      {/* Outer pulsing ring */}
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: color + '40',
          },
        ]}
      />
      {/* Inner solid dot */}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  dot: {},
});
