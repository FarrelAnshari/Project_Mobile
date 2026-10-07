/**
 * PARKIN — Smart Campus Parking
 * Root Layout — Protected Navigation + AuthProvider
 *
 * Flow:
 *   App Start → Animated Loading Screen → Authenticated? → (tabs) | Login
 *   Logout → Login (back button tidak bisa kembali ke Home)
 */

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Animated, Easing, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ============================================================
// Animated Loading / Splash Screen
// ============================================================
function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1: Glow ring appears
    Animated.parallel([
      Animated.timing(glowScale, {
        toValue: 1.5,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0.3,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Logo bounces in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Step 3: Title slides up
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Step 4: Tagline fades in
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 5: Loading dots appear + animate
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Pulsing dots animation loop
      const pulseDot = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );

      pulseDot(dot1, 0).start();
      pulseDot(dot2, 150).start();
      pulseDot(dot3, 300).start();
    });

    // Step 6: Glow pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Step 7: Fade out after minimum display time
    const timer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: containerOpacity }]}>
      {/* Background gradient effect using overlapping views */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      {/* Glow ring behind logo */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <View style={styles.logoBg}>
          <Text style={styles.logoText}>P</Text>
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.Text
        style={[
          styles.splashTitle,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
          },
        ]}
      >
        PARKIN
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.splashTagline, { opacity: taglineOpacity }]}>
        Smart Campus Parking
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsContainer, { opacity: dotsOpacity }]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { opacity: dot },
            ]}
          />
        ))}
      </Animated.View>

      {/* Version text */}
      <Animated.Text style={[styles.versionText, { opacity: taglineOpacity }]}>
        v1.0.0
      </Animated.Text>
    </Animated.View>
  );
}

// ============================================================
// Navigation Guard
// Memastikan user tidak bisa akses (tabs) tanpa login
// ============================================================
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (authState === 'loading') return;

    // Sembunyikan native splash screen setelah sesi dicek
    SplashScreen.hideAsync().catch(() => {});

    const firstSegment = segments[0] as string | undefined;
    const inLoginPage = firstSegment === 'login';
    const inRegisterPage = firstSegment === 'register';
    const isAuthRoute = inLoginPage || inRegisterPage;

    if (authState === 'unauthenticated' && !isAuthRoute) {
      // User belum login dan sedang berada di luar login/register → redirect ke login
      router.replace('/login' as any);
    } else if (authState === 'authenticated' && isAuthRoute) {
      // User sudah login tapi berada di halaman login/register → redirect ke home
      router.replace('/(tabs)' as any);
    }
  }, [authState, segments]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <View style={styles.flexOne}>
      {children}
      {showSplash && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
          <AnimatedSplash onFinish={handleSplashFinish} />
        </View>
      )}
    </View>
  );
}

// ============================================================
// Root Layout
// ============================================================
export default function RootLayout() {

  return (
    <AuthProvider>
      <NavigationGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              // Tidak bisa swipe back ke tabs setelah logout
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </Stack>
      </NavigationGuard>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  // Splash screen
  splashContainer: {
    flex: 1,
    backgroundColor: '#1a1336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#231B4A',
    opacity: 0.7,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#120E28',
    opacity: 0.7,
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
  },
  logoContainer: {
    marginBottom: 20,
    zIndex: 2,
  },
  logoBg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 6,
    zIndex: 2,
  },
  splashTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    letterSpacing: 2,
    zIndex: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
    zIndex: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryLight,
  },
  versionText: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    zIndex: 2,
  },
});
