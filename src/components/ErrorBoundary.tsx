/**
 * PARKIN — Smart Campus Parking
 * Component: ErrorBoundary
 *
 * Mencegah aplikasi crash total akibat unhandled render error.
 * Menampilkan UI fallback yang ramah pengguna jika terjadi error tak terduga.
 *
 * Penggunaan:
 *   <ErrorBoundary>
 *     <ChildComponent />
 *   </ErrorBoundary>
 *
 *   atau dengan fallback kustom:
 *   <ErrorBoundary fallback={<MyFallback />}>
 *     <ChildComponent />
 *   </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ============================================================
// Types
// ============================================================

interface Props {
  children: ReactNode;
  /** Komponen fallback kustom. Jika tidak disediakan, gunakan UI default. */
  fallback?: ReactNode;
  /** Callback saat error terjadi (opsional — untuk logging/monitoring) */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================
// Error Boundary Class Component
// ============================================================

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info });

    // Log ke console (production: bisa dikirim ke Sentry/Crashlytics)
    console.error('[ErrorBoundary] Unhandled render error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);

    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================
// Default Fallback UI
// ============================================================

function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset: () => void;
}) {
  const isDev = __DEV__;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="bug-outline" size={40} color="#EF4444" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Terjadi Kesalahan</Text>
        <Text style={styles.subtitle}>
          Aplikasi mengalami error yang tidak terduga. Silakan coba muat ulang halaman.
        </Text>

        {/* Dev-only error details */}
        {isDev && error && (
          <ScrollView style={styles.errorBox} contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.errorName}>{error.name}</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
          </ScrollView>
        )}

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={onReset}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Muat ulang halaman"
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.resetBtnText}>Muat Ulang Halaman</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Jika masalah berlanjut, silakan restart aplikasi.
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// HOC Wrapper — untuk membungkus screen dengan ErrorBoundary
// ============================================================

/**
 * HOC untuk membungkus screen dengan ErrorBoundary secara otomatis.
 *
 * Penggunaan:
 *   export default withErrorBoundary(MyScreen);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: { fallback?: ReactNode; onError?: (error: Error, info: ErrorInfo) => void }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={options?.fallback} onError={options?.onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName = `WithErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 11,
    color: '#991B1B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
    width: '100%',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
