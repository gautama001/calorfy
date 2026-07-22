import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '@/i18n';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProviderCustom, useThemeContext } from '@/context/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  return (
    <ThemeProviderCustom>
      <RootContent fontsLoaded={loaded} />
    </ThemeProviderCustom>
  );
}

function RootContent({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isReady } = useThemeContext();

  useEffect(() => {
    if (fontsLoaded && isReady) SplashScreen.hideAsync();
  }, [fontsLoaded, isReady]);

  if (!fontsLoaded || !isReady) return null;

  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}

const calorfyLightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#00A77D', background: '#F3F7F5', card: '#FFFFFF', text: '#173C32', border: '#DDEAE5', notification: '#00A77D' },
};

const calorfyDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#3ED5AA', background: '#0B1713', card: '#14251F', text: '#F0F8F5', border: '#294039', notification: '#3ED5AA' },
};

function AppNavigation() {
  const { theme } = useThemeContext();
  const dark = theme === 'dark';
  return (
    <ThemeProvider value={dark ? calorfyDarkTheme : calorfyLightTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: dark ? '#0B1713' : '#F3F7F5' } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/callback" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
