// app/(tabs)/_layout.tsx
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useColorScheme();
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
        tabBarActiveTintColor: Colors[theme ?? 'light'].tint,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({ ios:{position:'absolute'}, default:{} }),
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
        name="../upload"
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
        name="goals"
        options={{
          title: t('goals'),
          tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" size={size} color={color}/>
        }}
      />
      <Tabs.Screen
        name="levels"
        options={{
          title: t('level'),
          href: Platform.OS === 'web' ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color}/>
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'LATAM',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color}/>
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
