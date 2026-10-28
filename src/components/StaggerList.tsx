/**
 * PARKIN — Smart Campus Parking
 * Component: StaggerList
 *
 * Membungkus daftar item dengan animasi staggered entrance:
 * setiap child muncul satu per satu dengan delay bertahap.
 * Menggunakan Reanimated layout animation (FadeInDown).
 *
 * Usage:
 *   <StaggerList>
 *     {items.map(item => <Card key={item.id} ... />)}
 *   </StaggerList>
 */

import React, { Children } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  /** Delay antar item dalam ms. Default 80 */
  staggerDelay?: number;
  /** Delay awal sebelum item pertama. Default 0 */
  initialDelay?: number;
  /** Style untuk wrapper tiap item */
  itemStyle?: StyleProp<ViewStyle>;
}

export default function StaggerList({
  children,
  staggerDelay = 80,
  initialDelay = 0,
  itemStyle,
}: Props) {
  const childArray = Children.toArray(children);

  return (
    <>
      {childArray.map((child, index) => (
        <Animated.View
          key={index}
          entering={FadeInDown.delay(initialDelay + index * staggerDelay)
            .springify()
            .damping(16)
            .stiffness(180)}
          style={itemStyle}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
}
