/**
 * PARKIN — Smart Campus Parking
 * Component: EmptyState
 *
 * Shown when there is no data, loading, or error.
 * Clean, professional UI — no emoji decorations.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';

type StateType = 'loading' | 'empty' | 'error';

interface Props {
  type: StateType;
  message?: string;
  onRetry?: () => void;
}

const DEFAULT_MESSAGES: Record<StateType, string> = {
  loading: 'Memuat data parkir...',
  empty: 'Data parkir belum tersedia.',
  error: 'Gagal memuat data parkir.',
};

export default function EmptyState({ type, message, onRetry }: Props) {
  const displayMessage = message ?? DEFAULT_MESSAGES[type];

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={displayMessage}
    >
      {type === 'loading' && (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          accessibilityLabel="Memuat data..."
        />
      )}

      {type === 'empty' && (
        <View style={styles.iconCircle} accessibilityElementsHidden>
          <Text style={styles.iconLetter}>P</Text>
        </View>
      )}

      {type === 'error' && (
        <View style={[styles.iconCircle, styles.iconCircleError]} accessibilityElementsHidden>
          <Text style={[styles.iconLetter, styles.iconLetterError]}>!</Text>
        </View>
      )}

      <Text style={styles.message}>{displayMessage}</Text>

      {type === 'error' && onRetry && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={onRetry}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Coba lagi memuat data parkir"
          accessibilityHint="Mengulangi permintaan data"
        >
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.borderLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  iconCircleError: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
  },
  iconLetter: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  iconLetterError: {
    color: Colors.danger,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
