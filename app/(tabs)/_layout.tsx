// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { cardColor, borderColor, isDarkMode } = useAppTheme();
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#00C896" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDarkMode ? '#3ED5AA' : '#00A77D',
        tabBarInactiveTintColor: isDarkMode ? '#8FA49D' : '#687B75',
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: cardColor,
          borderTopColor: borderColor,
          minHeight: 62,
          paddingTop: 5,
        },
        tabBarItemStyle: { minHeight: 50 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('today'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color}/>
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('scan'),
          tabBarIcon: ({ color, size }) => <Ionicons name="sync-outline" size={size} color={color}/>
        }}
      />
      <Tabs.Screen
        name="diets"
        options={{
          title: t('diets'),
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition-outline" size={size} color={color}/>
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: t('weekly_plan'),
          tabBarLabel: t('weekly_plan').split(' ')[0],
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color}/>
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('goals'),
          tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" size={size} color={color}/>
        }}
      />
      <Tabs.Screen
        name="levels"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color}/>
        }}
      />
    </Tabs>
  );
}
