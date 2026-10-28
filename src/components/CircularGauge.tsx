/**
 * PARKIN — Smart Campus Parking
 * Component: CircularGauge
 *
 * Radial / Circular Progress Gauge yang dianimasikan menggunakan
 * react-native-svg + Reanimated.
 *
 * - Arc melingkar dari 0% ke nilai target dengan animasi smooth
 * - Warna arc berubah berdasarkan tingkat kepadatan
 * - Center menampilkan persentase dengan CountUpText animation
 * - Ambient glow efek melalui shadow pada lingkaran luar
 *
 * Usage:
 *   <CircularGauge percent={72} size={160} label="Terisi" />
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';
import { FontWeight } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Warna arc berdasarkan kepadatan */
function getArcColors(percent: number): { track: string; arc: [string, string] } {
  if (percent < 50) {
    return { track: 'rgba(34,197,94,0.15)', arc: ['#22C55E', '#4ADE80'] };
  } else if (percent < 70) {
    return { track: 'rgba(245,158,11,0.15)', arc: ['#F59E0B', '#FCD34D'] };
  } else if (percent < 85) {
    return { track: 'rgba(249,115,22,0.15)', arc: ['#F97316', '#FB923C'] };
  }
  return { track: 'rgba(239,68,68,0.15)', arc: ['#EF4444', '#FCA5A5'] };
}

interface Props {
  percent: number; // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  style?: StyleProp<ViewStyle>;
}

export default function CircularGauge({
  percent,
  size = 140,
  strokeWidth = 12,
  label,
  sublabel,
  style,
}: Props) {
  const colors = useThemeColors();
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const { track, arc } = getArcColors(clampedPercent);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc dimulai dari sudut 135° (kiri-bawah) dan mencakup 270° (3/4 lingkaran)
  const arcFraction = 270 / 360; // 270 derajat dari 360
  const arcLength = circumference * arcFraction;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clampedPercent / 100, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedPercent]);

  const animatedProps = useAnimatedProps(() => {
    // strokeDashoffset: 0 = penuh, arcLength = kosong
    const dashOffset = arcLength - progress.value * arcLength;
    return {
      strokeDashoffset: dashOffset,
    };
  });

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* Ambient glow layer */}
      <View
        style={[
          styles.glowLayer,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            shadowColor: arc[0],
          },
        ]}
      />

      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', transform: [{ rotate: '135deg' }] }}
      >
        <Defs>
          <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={arc[0]} stopOpacity={1} />
            <Stop offset="100%" stopColor={arc[1]} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Track (background circle — hanya 270°) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Animated arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#arcGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          animatedProps={animatedProps}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        <Text style={[styles.percentText, { color: arc[0], fontSize: size * 0.22 }]}>
          {clampedPercent}%
        </Text>
        {label && (
          <Text style={[styles.labelText, { color: colors.textSecondary, fontSize: size * 0.09 }]}>
            {label}
          </Text>
        )}
        {sublabel && (
          <Text style={[styles.sublabelText, { color: colors.textTertiary, fontSize: size * 0.08 }]}>
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 0, // Android tidak support shadow blur, tapi oke karena ada SVG
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontWeight: FontWeight.extrabold,
    letterSpacing: -1,
    includeFontPadding: false,
  },
  labelText: {
    fontWeight: FontWeight.semibold,
    marginTop: 2,
    includeFontPadding: false,
  },
  sublabelText: {
    fontWeight: FontWeight.regular,
    marginTop: 1,
    includeFontPadding: false,
  },
});
