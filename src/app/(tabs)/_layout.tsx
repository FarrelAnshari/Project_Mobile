/**
 * PARKIN — Smart Campus Parking
 * Tab Layout — Responsive Navigation
 *
 * Desktop (≥768px): Elegant Left Sidebar — hides Bottom Navigation Bar
 * Mobile (<768px):  Glassmorphism Floating Bottom Navigation Bar
 */

import { Tabs, useRouter, useSegments, usePathname } from 'expo-router';
import {
  Platform,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, FontSize, BorderRadius, Spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Breakpoint for switching to desktop layout */
const DESKTOP_BREAKPOINT = 768;

type TabDef = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  label: string;
  isCenter?: boolean;
};

const TABS: TabDef[] = [
  { name: 'index',      icon: 'home-outline',        iconFocused: 'home',        label: 'Beranda'   },
  { name: 'parking',   icon: 'car-outline',          iconFocused: 'car',         label: 'Parkir'    },
  { name: 'prediction',icon: 'stats-chart-outline',  iconFocused: 'stats-chart', label: 'Prediksi', isCenter: true },
  { name: 'history',   icon: 'time-outline',         iconFocused: 'time',        label: 'Riwayat'   },
  { name: 'profile',   icon: 'person-outline',       iconFocused: 'person',      label: 'Profil'    },
];

// ─────────────────────────────────────────────────────────────
// Mobile Pulsing Dot Indicator
// ─────────────────────────────────────────────────────────────
function PulsingDot({ color }: { color: string }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.7, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
  }, []);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.7], [0.85, 0.15], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.pulsingDot, { backgroundColor: color }, anim]} />;
}

// ─────────────────────────────────────────────────────────────
// Mobile Animated Tab Item
// ─────────────────────────────────────────────────────────────
function AnimatedTabItem({
  tab,
  focused,
  onPress,
  activeColor,
  inactiveColor,
}: {
  tab: TabDef;
  focused: boolean;
  onPress?: () => void;
  activeColor: string;
  inactiveColor: string;
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
        -1,
        false
      );
    } else {
      glowPulse.value = withTiming(1, { duration: 300 });
    }
  }, [focused]);

  const handlePress = useCallback(() => {
    pressScale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 420 }),
      withSpring(1,    { damping: 12, stiffness: 260 })
    );
    runOnJS(triggerHaptic)();
    onPress?.();
  }, [onPress]);

  const wrapAnim      = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  const iconAnim      = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const labelAnim     = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));
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
      <Pressable
        onPress={handlePress}
        style={styles.itemOuter}
        accessibilityLabel={tab.label}
        accessibilityRole="button"
      >
        <Animated.View style={[styles.centerInner, wrapAnim]}>
          <Animated.View
            style={[styles.glowRing, { backgroundColor: activeColor }, glowAnim]}
            pointerEvents="none"
          />
          <Animated.View
            style={[
              styles.centerBadge,
              { backgroundColor: activeColor, shadowColor: activeColor },
              iconAnim,
            ]}
          >
            <Ionicons name={focused ? tab.iconFocused : tab.icon} size={26} color="#FFF" />
          </Animated.View>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              { color: focused ? activeColor : inactiveColor },
              focused && styles.tabLabelActive,
              labelAnim,
            ]}
          >
            {tab.label}
          </Animated.Text>
          {focused && <PulsingDot color={activeColor} />}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.itemOuter}
      accessibilityLabel={tab.label}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.normalInner, wrapAnim]}>
        <Animated.View
          style={[styles.topBar, { backgroundColor: activeColor }, indicatorAnim]}
          pointerEvents="none"
        />
        <Animated.View style={[styles.iconWrap, iconAnim]}>
          <Ionicons
            name={focused ? tab.iconFocused : tab.icon}
            size={22}
            color={focused ? activeColor : inactiveColor}
          />
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            { color: focused ? activeColor : inactiveColor },
            focused && styles.tabLabelActive,
            labelAnim,
          ]}
        >
          {tab.label}
        </Animated.Text>
        {focused && <PulsingDot color={activeColor} />}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Desktop Left Sidebar Navigation
// ─────────────────────────────────────────────────────────────
function DesktopSidebar({ currentTab }: { currentTab: string }) {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleNav = (tabName: string) => {
    const target = tabName === 'index' ? '/(tabs)' : `/(tabs)/${tabName}`;
    router.replace(target as any);
  };

  const displayName = user?.name || 'Pengguna PARKIN';
  const role = user?.email?.includes('dosen') ? 'Dosen' : 'Mahasiswa';

  return (
    <View
      style={[
        styles.desktopSidebar,
        {
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* Brand Header */}
      <View style={styles.sidebarHeader}>
        <View style={[styles.sidebarBrandIcon, { backgroundColor: colors.primary }]}>
          <Ionicons name="car-sport" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.sidebarBrandInfo}>
          <View style={styles.sidebarBrandTitleRow}>
            <Text style={[styles.sidebarBrandName, { color: colors.textPrimary }]}>
              PARKIN
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.successBg }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>Online</Text>
            </View>
          </View>
          <Text style={[styles.sidebarBrandTagline, { color: colors.textSecondary }]}>
            Smart Campus Parking
          </Text>
        </View>
      </View>

      {/* Nav Items */}
      <View style={styles.sidebarNavList}>
        <Text style={[styles.sidebarSectionLabel, { color: colors.textTertiary }]}>
          MENU UTAMA
        </Text>
        {TABS.map((tab) => {
          const isActive = currentTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.sidebarNavItem,
                isActive && [
                  styles.sidebarNavItemActive,
                  {
                    backgroundColor: isDark
                      ? 'rgba(99, 102, 241, 0.16)'
                      : 'rgba(99, 102, 241, 0.08)',
                    borderLeftColor: colors.primary,
                  },
                ],
              ]}
              onPress={() => handleNav(tab.name)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={isActive ? tab.iconFocused : tab.icon}
                size={20}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.sidebarNavLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                  isActive && styles.sidebarNavLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View style={[styles.activePill, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Scan Action */}
      <View style={styles.sidebarActionSection}>
        <TouchableOpacity
          style={[styles.sidebarScanBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/scanner' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
          <Text style={styles.sidebarScanBtnText}>Pindai Tiket Parkir</Text>
        </TouchableOpacity>
      </View>

      {/* Sidebar Footer */}
      <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
        {/* Theme toggle */}
        <TouchableOpacity
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: isDark ? colors.background : '#F1F5F9',
              borderColor: colors.border,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={16}
            color={isDark ? '#818CF8' : '#F59E0B'}
          />
          <Text style={[styles.themeToggleText, { color: colors.textPrimary }]}>
            {isDark ? 'Mode Gelap' : 'Mode Terang'}
          </Text>
        </TouchableOpacity>

        {/* User info row */}
        <View style={styles.userInfoRow}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.userAvatarLetter}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userNameCol}>
            <Text
              style={[styles.userNameText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={[styles.userRoleText, { color: colors.textSecondary }]}>
              {role}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Keluar dari akun"
          >
            <Ionicons name="log-out-outline" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Root TabLayout Component
// ─────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const isDesktop = width >= DESKTOP_BREAKPOINT;

  // Derive active tab from pathname
  // pathname examples: '/', '/parking', '/prediction', '/history', '/profile'
  const currentTab = (() => {
    const seg = pathname.split('/').filter(Boolean).pop() || 'index';
    // If seg matches a tab name, use it; otherwise default to 'index'
    return TABS.some(t => t.name === seg) ? seg : 'index';
  })();

  const activeColor   = colors.primary;
  const inactiveColor = isDark ? 'rgba(255,255,255,0.42)' : '#94A3B8';
  // Semi-transparent bar background with blur-like effect
  const barBg   = isDark ? 'rgba(26, 28, 46, 0.97)' : 'rgba(255, 255, 255, 0.96)';
  const border  = colors.border;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Desktop-only Sidebar */}
      {isDesktop && <DesktopSidebar currentTab={currentTab} />}

      {/* Main content area (Tabs) */}
      <View style={styles.contentArea}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isDesktop
              ? { display: 'none' }       // hide on desktop — sidebar handles nav
              : [
                  styles.tabBar,
                  {
                    backgroundColor: barBg,
                    borderTopColor: border,
                    // Full-width on mobile
                    width: width,
                    left: 0,
                  },
                ],
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
          {/* Scanner screen — hidden from tab bar */}
          <Tabs.Screen
            name="scanner"
            options={{
              title: 'Scan QR',
              tabBarButton: () => null,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const BAR_H   = Platform.OS === 'ios' ? 84 : 64;
// On iOS the bottom bar already includes home indicator space
const BAR_BOT = Platform.OS === 'ios' ? 0 : 8;

const styles = StyleSheet.create({
  // Root layout — row on desktop, column on mobile
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  contentArea: {
    flex: 1,
    height: '100%',
  },

  // ─── Desktop Left Sidebar ─────────────────────────────────────
  desktopSidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    zIndex: 100,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 12,
  },
  sidebarBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sidebarBrandInfo: { flex: 1 },
  sidebarBrandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarBrandName: {
    fontSize: 18,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  sidebarBrandTagline: {
    fontSize: 11,
    marginTop: 2,
  },
  sidebarNavList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  sidebarSectionLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
    marginTop: 8,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    gap: 12,
    marginBottom: 2,
  },
  sidebarNavItemActive: {
    borderRadius: 12,
  },
  sidebarNavLabel: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  sidebarNavLabelActive: {
    fontWeight: FontWeight.bold,
  },
  activePill: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sidebarActionSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sidebarScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sidebarScanBtnText: {
    color: '#FFFFFF',
    fontWeight: FontWeight.semibold,
    fontSize: 13,
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 14,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  userNameCol: { flex: 1 },
  userNameText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
  },
  userRoleText: {
    fontSize: 11,
    marginTop: 1,
  },
  logoutBtn: {
    padding: 6,
  },

  // ─── Mobile Bottom Tab Bar ────────────────────────────────────
  tabBar: {
    position:             'absolute',
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
    flex:           1,
    height:         '100%',
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 0,
  },
  itemOuter: {
    flex:           1,
    height:         '100%',
    alignItems:     'center',
    justifyContent: 'center',
  },
  normalInner: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:             3,
    paddingVertical: 6,
    position:       'relative',
    width:          '100%',
  },
  centerInner: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:             3,
    paddingVertical: 4,
    position:       'relative',
    width:          '100%',
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
    width:          30,
    height:         30,
    alignItems:     'center',
    justifyContent: 'center',
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
