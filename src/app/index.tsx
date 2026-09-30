/**
 * PARKIN — Smart Campus Parking
 * Initial Route / Auth Gatekeeper
 *
 * Memeriksa sesi pengguna di SecureStore saat aplikasi dimulai:
 * - Jika sesi valid: redirect ke dashboard /(tabs)
 * - Jika belum login: redirect ke /(auth)/login
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.logoBox, Shadow.md]}>
          <Text style={styles.logoLetter}>P</Text>
        </View>
        <Text style={styles.appName}>PARKIN</Text>
        <Text style={styles.tagline}>Smart Campus Parking</Text>
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Memeriksa sesi pengguna...</Text>
        </View>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={'/(tabs)' as any} />;
  }

  return <Redirect href={'/(auth)/login' as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
});
