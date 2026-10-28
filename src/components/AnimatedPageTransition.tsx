/**
 * PARKIN — Smart Campus Parking
 * Component: AnimatedPageTransition
 *
 * Wrapper untuk page/screen transitions.
 * Setiap screen yang dibungkus dengan ini akan muncul dengan
 * animasi slide-up + fade-in saat pertama kali dirender.
 *
 * Usage:
 *   export default function ParkingScreen() {
 *     return (
 *       <AnimatedPageTransition>
 *         <YourContent />
 *       </AnimatedPageTransition>
 *     );
 *   }
 */

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Jenis transisi. Default: 'fadeInUp' */
  type?: 'fadeInUp' | 'fadeInDown';
  duration?: number;
}

export default function AnimatedPageTransition({
  children,
  style,
  duration = 400,
}: Props) {
  return (
    <Animated.View
      style={[{ flex: 1 }, style]}
      entering={FadeInUp.duration(duration).springify().damping(20).stiffness(180)}
    >
      {children}
    </Animated.View>
  );
}
