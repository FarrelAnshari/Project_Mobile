/**
 * PARKIN — Smart Campus Parking
 * Tab Layout — Floating Bottom Navigation Bar
 *
 * Features:
 *   Glassmorphism floating bar
 *   Ambient glow pada tombol aktif (Prediksi)
 *   Spring bounce animation saat tap (react-native-reanimated v4)
 *   Gliding top indicator antar tab
 *   Pulsing dot indicator pada tab aktif
 *   Haptic feedback (expo-haptics)
 *   5 icon presisi centered — flex col, items-center, justify-center
 */

import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, LightColors, DarkColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence,
  interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

type TabDef = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  label: string;
  isCenter?: boolean;
};

const TABS: TabDef[] = [
  { name: 'index',      icon: 'home-outline',       iconFocused: 'home',        label: 'Beranda'  },
  { name: 'parking',    icon: 'car-outline',         iconFocused: 'car',         label: 'Parkir'   },
  { name: 'prediction', icon: 'stats-chart-outline', iconFocused: 'stats-chart', label: 'Prediksi', isCenter: true },
  { name: 'history',    icon: 'time-outline',        iconFocused: 'time',        label: 'Riwayat'  },
  { name: 'profile',    icon: 'person-outline',      iconFocused: 'person',      label: 'Profil'   },
];

function PulsingDot({ color }: { color: string }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.7, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1, false,
    );
  }, []);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.7], [0.85, 0.15], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.pulsingDot, { backgroundColor: color }, anim]} />;
}

function AnimatedTabItem({
  tab, focused, onPress, activeColor, inactiveColor,
}: {
  tab: TabDef; focused: boolean; onPress?: () => void;
  activeColor: string; inactiveColor: string;
}) {
  const pressScale     = useSharedValue(1);
  const iconScale      = useSharedValue(focused ? 1.12 : 1);
  const labelOpacity   = useSharedValue(focused ? 1 : 0.55);
  const indicatorScale = useSharedValue(focused ? 1 : 0);
  const glowOpacity    = useSharedValue(focused ? 1 : 0);
  const glowPulse      = useSharedValue(1);

  useEffect(() => {
    iconScale.value      = withSpring(focused ? 1.12 : 1,  { damping: 14, stiffness: 320 });
    labelOpacity.value   = withTiming(focused ? 1 : 0.55,  { duration: 200 });
    indicatorScale.value = withSpring(focused ? 1 : 0,     { damping: 16, stiffness: 280 });
    glowOpacity.value    = withTiming(focused ? 1 : 0,     { duration: 250 });
    if (focused && tab.isCenter) {
      glowPulse.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 1100 }), withTiming(1, { duration: 1100 })),
        -1, false,
      );
    } else {
      glowPulse.value = withTiming(1, { duration: 300 });
    }
  }, [focused]);

  const handlePress = useCallback(() => {
    pressScale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 420 }),
      withSpring(1,    { damping: 12, stiffness: 260 }),
    );
    runOnJS(triggerHaptic)();
    onPress?.();
  }, [onPress]);

  const wrapAnim      = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  const iconAnim      = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }]  }));
  const labelAnim     = useAnimatedStyle(() => ({ opacity: labelOpacity.value              }));
  const indicatorAnim = useAnimatedStyle(() => ({
    transform: [{ scaleX: indicatorScale.value }],
    opacity: indicatorScale.value,
  }));
  const glowAnim = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowPulse.value }],
  }));

  if (tab.isCenter) {
    return (
      <Pressable onPress={handlePress} style={styles.itemOuter} accessibilityLabel={tab.label} accessibilityRole="button">
        <Animated.View style={[styles.centerInner, wrapAnim]}>
          <Animated.View style={[styles.glowRing, { backgroundColor: activeColor }, glowAnim]} pointerEvents="none" />
          <Animated.View style={[styles.centerBadge, { backgroundColor: activeColor, shadowColor: activeColor }, iconAnim]}>
            <Ionicons name={focused ? tab.iconFocused : tab.icon} size={26} color="#FFF" />
          </Animated.View>
          <Animated.Text numberOfLines={1}
            style={[styles.tabLabel, { color: focused ? activeColor : inactiveColor }, focused && styles.tabLabelActive, labelAnim]}>
            {tab.label}
          </Animated.Text>
          {focused && <PulsingDot color={activeColor} />}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.itemOuter} accessibilityLabel={tab.label} accessibilityRole="button">
      <Animated.View style={[styles.normalInner, wrapAnim]}>
        <Animated.View style={[styles.topBar, { backgroundColor: activeColor }, indicatorAnim]} pointerEvents="none" />
        <Animated.View style={[styles.iconWrap, iconAnim]}>
          <Ionicons name={focused ? tab.iconFocused : tab.icon} size={22} color={focused ? activeColor : inactiveColor} />
        </Animated.View>
        <Animated.Text numberOfLines={1}
          style={[styles.tabLabel, { color: focused ? activeColor : inactiveColor }, focused && styles.tabLabelActive, labelAnim]}>
          {tab.label}
        </Animated.Text>
        {focused && <PulsingDot color={activeColor} />}
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const { width }  = useWindowDimensions();
  const isWide     = width > 768;
  const tabWidth   = isWide ? Math.min(600, width - 48) : width;
  const leftInset  = isWide ? (width - tabWidth) / 2 : 0;

  const activeColor   = isDark ? DarkColors.primaryLight  : LightColors.primary;
  const inactiveColor = isDark ? 'rgba(255,255,255,0.38)' : '#A0A3B8';
  const barBg         = isDark ? 'rgba(12,12,24,0.93)'    : 'rgba(255,255,255,0.90)';
  const border        = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <Tabs
      screenOptions={{
        headerShown:    false,
        tabBarStyle:    [styles.tabBar, { backgroundColor: barBg, borderTopColor: border, width: tabWidth, left: leftInset }],
        tabBarItemStyle: styles.tabSlot,
        tabBarShowLabel: false,
        tabBarLabelStyle: { display: 'none' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarButton: (props) => (
              <AnimatedTabItem
                tab={tab}
                focused={props.accessibilityState?.selected ?? false}
                onPress={props.onPress as () => void}
                activeColor={activeColor}
                inactiveColor={inactiveColor}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="scanner" options={{ title: 'Scan QR', tabBarButton: () => null }} />
    </Tabs>
  );
}

const BAR_H   = Platform.OS === 'ios' ? 84 : 64;
const BAR_BOT = Platform.OS === 'ios' ? 0 : 8;

const styles = StyleSheet.create({
  tabBar: {
    position:            'absolute',
    bottom:               BAR_BOT,
    right:                0,
    height:               BAR_H,
    flexDirection:        'row',
    alignItems:           'center',
    justifyContent:       'space-around',
    paddingHorizontal:    0,
    paddingTop:           0,
    paddingBottom:        Platform.OS === 'ios' ? 20 : 0,
    borderTopLeftRadius:  22,
    borderTopRightRadius: 22,
    borderTopWidth:       0.5,
    elevation:            28,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -4 },
    shadowOpacity:        0.22,
    shadowRadius:         20,
  },
  tabSlot: {
    flex:            1,
    height:          '100%',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 0,
  },
  itemOuter: {
    flex:            1,
    height:          '100%',
    alignItems:      'center',
    justifyContent:  'center',
  },
  normalInner: {
    alignItems:      'center',
    justifyContent:  'center',
    gap:              3,
    paddingVertical:  6,
    position:        'relative',
    width:           '100%',
  },
  centerInner: {
    alignItems:      'center',
    justifyContent:  'center',
    gap:              3,
    paddingVertical:  4,
    position:        'relative',
    width:           '100%',
  },
  topBar: {
    position:               'absolute',
    top:                     0,
    alignSelf:               'center',
    height:                  3,
    width:                   28,
    borderBottomLeftRadius:  3,
    borderBottomRightRadius: 3,
  },
  iconWrap: {
    width:           30,
    height:          30,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tabLabel: {
    fontSize:           10,
    fontWeight:         FontWeight.medium,
    letterSpacing:      0.2,
    textAlign:          'center',
    includeFontPadding: false,
    lineHeight:         13,
  },
  tabLabelActive: {
    fontWeight: FontWeight.semibold,
  },
  pulsingDot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  glowRing: {
    position:     'absolute',
    width:        66,
    height:       66,
    borderRadius: 33,
    opacity:      0.3,
  },
  centerBadge: {
    width:          52,
    height:         52,
    borderRadius:   17,
    alignItems:     'center',
    justifyContent: 'center',
    shadowOffset:   { width: 0, height: 6 },
    shadowOpacity:  0.5,
    shadowRadius:   14,
    elevation:      14,
    borderWidth:    1.5,
    borderColor:    'rgba(255,255,255,0.28)',
  },
});
