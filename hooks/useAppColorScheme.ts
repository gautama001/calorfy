import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark';

export function useAppColorScheme() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  useEffect(() => {
    (async () => {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        setColorScheme(savedDarkMode === 'true' ? 'dark' : 'light');
      } else {
        const systemScheme = Appearance.getColorScheme();
        setColorScheme(systemScheme === 'dark' ? 'dark' : 'light');
      }
    })();
  }, []);

  return colorScheme;
}
