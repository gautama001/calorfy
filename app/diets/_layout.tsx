import { Stack } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function DietsLayout() {
  const { backgroundColor, cardColor, textColor } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#00A77D',
        headerStyle: { backgroundColor: cardColor },
        headerTitleStyle: { fontWeight: '800', color: textColor },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[diet]" />
      <Stack.Screen name="recipe/[id]" />
    </Stack>
  );
}
