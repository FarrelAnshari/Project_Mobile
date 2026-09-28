/**
 * PARKIN — Smart Campus Parking
 * Tab Layout — Bottom Tab Navigation
 *
 * Uses Expo Router Tabs with custom styling.
 * 5 tabs: Beranda, Parkir, Prediksi, Riwayat, Profil
 */

import { Tabs } from 'expo-router';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../../constants/theme';

// Tab icon component using emoji (no external icon library needed)
function TabIcon({
  icon,
  focused,
  label,
}: {
  icon: string;
  focused: boolean;
  label: string;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icon}
      </Text>
    </View>
  );
}

export default function TabLayout() {
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
            <TabIcon icon="🏠" focused={focused} label="Beranda" />
          ),
          tabBarAccessibilityLabel: 'Tab Beranda — Dashboard kepadatan parkir kampus',
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: 'Parkir',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🅿️" focused={focused} label="Parkir" />
          ),
          tabBarAccessibilityLabel: 'Tab Parkir — Monitoring seluruh area parkir',
        }}
      />
      <Tabs.Screen
        name="prediction"
        options={{
          title: 'Prediksi',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📈" focused={focused} label="Prediksi" />
          ),
          tabBarAccessibilityLabel: 'Tab Prediksi — Prediksi kepadatan parkir',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" focused={focused} label="Riwayat" />
          ),
          tabBarAccessibilityLabel: 'Tab Riwayat — Histori kepadatan parkir',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} label="Profil" />
          ),
          tabBarAccessibilityLabel: 'Tab Profil — Pengaturan dan profil pengguna',
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
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
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
    width: 32,
    height: 28,
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
