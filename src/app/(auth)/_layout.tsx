/**
 * PARKIN — Smart Campus Parking
 * Auth Group Layout — using Expo Router Stack
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Masuk' }} />
      <Stack.Screen name="register" options={{ title: 'Daftar' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Lupa Password' }} />
    </Stack>
  );
}
