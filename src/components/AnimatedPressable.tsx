/**
 * PARKIN — Smart Campus Parking
 * Component: AnimatedPressable
 *
 * Wrapper pressable dengan spring physics micro-interaction.
 * Menggantikan TouchableOpacity biasa untuk efek yang lebih hidup.
 *
 * Usage:
 *   <AnimatedPressable onPress={...} style={...}>
 *     <Text>Tekan Saya</Text>
 *   </AnimatedPressable>
 */

import React from 'react';
import { StyleProp, ViewStyle, AccessibilityState } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Scale saat ditekan. Default 0.95 */
  pressScale?: number;
  /** Apakah interaksi dinonaktifkan */
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityState?: AccessibilityState;
}

export default function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  pressScale = 0.95,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withSpring(pressScale, { damping: 12, stiffness: 300 });
      opacity.value = withSpring(0.82, { damping: 12, stiffness: 300 });
    })
    .onFinalize((e, success) => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      opacity.value = withSpring(1, { damping: 10, stiffness: 200 });
      if (success && onPress) {
        runOnJS(onPress)();
      }
    });

  const longPress = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) runOnJS(onLongPress)();
    });

  const composed = Gesture.Exclusive(longPress, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[animStyle, style]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
