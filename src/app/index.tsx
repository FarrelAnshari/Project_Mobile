/**
 * PARKIN — Smart Campus Parking
 * Root Index Route: "/"
 *
 * Auth Guard Redirect:
 *   - Loading → show spinner overlay (native splash hides after auth check)
 *   - Authenticated → Dashboard /(tabs)
 *   - Unauthenticated → /login
 */
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // While restoring session from SecureStore, show nothing
  // (native splash + AnimatedSplash overlay in _layout.tsx covers this)
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1C2E' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  // Auth Guard: redirect based on authentication state
  return isAuthenticated
    ? <Redirect href="/(tabs)" />
    : <Redirect href="/login" />;
}
