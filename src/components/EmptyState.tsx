/**
 * PARKIN — Smart Campus Parking
 * Component: EmptyState
 *
 * Shown when there is no data, loading, or error.
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

const ICONS: Record<StateType, string> = {
  loading: '⏳',
  empty: '🅿️',
  error: '⚠️',
};

export default function EmptyState({ type, message, onRetry }: Props) {
  const displayMessage = message ?? DEFAULT_MESSAGES[type];
  const icon = ICONS[type];

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={displayMessage}
    >
      {type === 'loading' ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          accessibilityLabel="Memuat..."
        />
      ) : (
        <Text style={styles.icon} accessibilityElementsHidden>
          {icon}
        </Text>
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
    paddingVertical: Spacing.section,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
