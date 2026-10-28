/**
 * PARKIN — Smart Campus Parking
 * Component: ScannerOverlay
 *
 * Overlay visual untuk viewfinder QR scanner:
 *  - 4 sudut bracket animasi (glow pulse)
 *  - Garis scan vertikal yang bergerak naik-turun
 *  - Bayangan semi-transparan di luar area target
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

const FRAME_SIZE = Math.min(SW * 0.68, 280);
const CORNER_LEN = 28;
const CORNER_W = 3;
const BRACKET_COLOR = '#6366F1'; // indigo-500
const SCAN_COLOR = 'rgba(99,102,241,0.55)';

interface Props {
  /** Aktifkan animasi scan line (saat scanning berlangsung) */
  scanning?: boolean;
  /** Warna bracket saat sukses */
  success?: boolean;
}

export default function ScannerOverlay({ scanning = true, success = false }: Props) {
  const scanY = useSharedValue(0);
  const cornerGlow = useSharedValue(0);
  const successFlash = useSharedValue(0);

  useEffect(() => {
    // Scan line naik-turun
    if (scanning) {
      scanY.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(scanY);
    }

    // Corner pulse glow
    cornerGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.4, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [scanning]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (success) {
      successFlash.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 500 }),
      );
    }
  }, [success]); // eslint-disable-line react-hooks/exhaustive-deps

  const scanLineStyle = useAnimatedStyle(() => ({
    top: interpolate(scanY.value, [0, 1], [4, FRAME_SIZE - 6]),
    opacity: scanning ? 0.85 : 0,
  }));

  const bracketColor = success ? '#22C55E' : BRACKET_COLOR;

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cornerGlow.value, [0, 1], [0.6, 1]),
    shadowOpacity: interpolate(cornerGlow.value, [0, 1], [0.2, 0.9]),
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: successFlash.value * 0.35,
  }));

  // Frame position
  const frameTop = (SH - FRAME_SIZE) / 2 - 40;
  const frameLeft = (SW - FRAME_SIZE) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dark masks */}
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: frameTop }]} />
      <View
        style={[
          styles.mask,
          { top: frameTop, left: 0, width: frameLeft, height: FRAME_SIZE },
        ]}
      />
      <View
        style={[
          styles.mask,
          {
            top: frameTop,
            left: frameLeft + FRAME_SIZE,
            right: 0,
            height: FRAME_SIZE,
          },
        ]}
      />
      <View
        style={[
          styles.mask,
          { top: frameTop + FRAME_SIZE, left: 0, right: 0, bottom: 0 },
        ]}
      />

      {/* Scanner frame */}
      <View
        style={[
          styles.frame,
          {
            top: frameTop,
            left: frameLeft,
            width: FRAME_SIZE,
            height: FRAME_SIZE,
          },
        ]}
      >
        {/* Scan line */}
        <Animated.View style={[styles.scanLine, scanLineStyle]} />

        {/* Success flash overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.flashOverlay,
            flashStyle,
          ]}
        />

        {/* Corner brackets */}
        {/* Top-left */}
        <Animated.View style={[styles.cornerBase, styles.cornerTL, cornerStyle, { borderColor: bracketColor }]} />
        {/* Top-right */}
        <Animated.View style={[styles.cornerBase, styles.cornerTR, cornerStyle, { borderColor: bracketColor }]} />
        {/* Bottom-left */}
        <Animated.View style={[styles.cornerBase, styles.cornerBL, cornerStyle, { borderColor: bracketColor }]} />
        {/* Bottom-right */}
        <Animated.View style={[styles.cornerBase, styles.cornerBR, cornerStyle, { borderColor: bracketColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  frame: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: SCAN_COLOR,
    shadowColor: BRACKET_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0.8,
    elevation: 4,
  },
  flashOverlay: {
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  cornerBase: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderWidth: CORNER_W,
    shadowColor: BRACKET_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
});
