/**
 * PARKIN — Smart Campus Parking
 * Component: CountUpText
 *
 * Animasi count-up angka dari 0 ke nilai target.
 * Menggunakan React state + requestAnimationFrame untuk
 * kompatibilitas maksimal tanpa masalah worklet.
 *
 * Usage:
 *   <CountUpText value={72} suffix="%" style={styles.bigNumber} />
 */

import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
  decimals?: number;
}

export default function CountUpText({
  value,
  suffix = '',
  prefix = '',
  style,
  duration = 900,
  decimals = 0,
}: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const current = startValueRef.current + (value - startValueRef.current) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return (
    <Text style={style}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </Text>
  );
}
