/**
 * PARKIN — Smart Campus Parking
 * Tab Layout — Bottom Tab Navigation
 *
 * Uses Expo Router Tabs with custom styling.
 * 5 tabs: Beranda, Parkir, Prediksi, Riwayat, Profil
 * No emoji icons — uses text-based icon shapes for accessibility.
 */

import { Tabs, Redirect } from 'expo-router';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

/**
 * TabIcon — text-based icon (no emoji, no external lib needed).
 * Uses a styled letter/symbol inside a container.
 * Active state uses background fill + different color (not color-only).
 */
function TabIcon({
  symbol,
  focused,
}: {
  symbol: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
      <Text style={[styles.tabSymbol, focused && styles.tabSymbolActive]}>
        {symbol}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href={'/(auth)/login' as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="⌂" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Beranda — Dashboard kepadatan parkir kampus',
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: 'Parkir',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="P" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Parkir — Monitoring seluruh area parkir',
        }}
      />
      <Tabs.Screen
        name="prediction"
        options={{
          title: 'Prediksi',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="↗" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Prediksi — Prediksi kepadatan parkir',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="≡" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Riwayat — Histori kepadatan parkir',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon symbol="◉" focused={focused} />
          ),
          tabBarAccessibilityLabel: 'Profil — Pengaturan dan profil pengguna',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabItem: {
    paddingVertical: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
    borderRadius: BorderRadius.sm,
  },
  tabIconContainerActive: {
    backgroundColor: Colors.primary + '15',
  },
  tabSymbol: {
    fontSize: 18,
    color: Colors.textTertiary,
    lineHeight: 22,
  },
  tabSymbolActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
