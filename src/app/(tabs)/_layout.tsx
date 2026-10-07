/**
 * PARKIN — Smart Campus Parking
 * Tab Layout — Bottom Tab Navigation
 *
 * Uses Expo Router Tabs with custom styling.
 * 5 tabs: Beranda, Parkir, Prediksi, Riwayat, Profil
 */

import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontWeight, BorderRadius } from '../../constants/theme';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const tabWidth = isWide ? Math.min(640, width - 48) : '100%';
  const leftPos = isWide ? (width - (typeof tabWidth === 'number' ? tabWidth : 0)) / 2 : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          isWide && {
            width: tabWidth,
            left: leftPos,
            borderRadius: 28,
            bottom: 16,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarShowLabel: false, // Cleaner look similar to template
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Tab Beranda — Dashboard kepadatan parkir kampus',
        }}
      />
      <Tabs.Screen
        name="parking"
        options={{
          title: 'Parkir',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} size={26} color={color} />
          ),
          tabBarAccessibilityLabel: 'Tab Parkir — Monitoring seluruh area parkir',
        }}
      />
      <Tabs.Screen
        name="prediction"
        options={{
          title: 'Prediksi',
          tabBarIcon: ({ focused, color }) => (
            <View style={styles.floatingAction}>
               <Ionicons name="stats-chart" size={24} color={Colors.white} />
            </View>
          ),
          tabBarAccessibilityLabel: 'Tab Prediksi — Prediksi kepadatan parkir',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={26} color={color} />
          ),
          tabBarAccessibilityLabel: 'Tab Riwayat — Histori kepadatan parkir',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
          tabBarAccessibilityLabel: 'Tab Profil — Pengaturan dan profil pengguna',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1E1E2D', // Dark color matching template
    borderTopWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    position: 'absolute', // Floating effect over background
    bottom: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  tabItem: {
    paddingVertical: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  floatingAction: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 30, // Raise the middle action button
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
