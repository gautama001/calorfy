import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: ThemeType;
  isReady: boolean;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  isReady: false,
  setTheme: () => {},
});

function getInitialTheme(): ThemeType {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const storedTheme = window.localStorage.getItem('darkMode');
    if (storedTheme !== null) return storedTheme === 'true' ? 'dark' : 'light';
  }

  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export function ThemeProviderCustom({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(getInitialTheme);
  // Keep the native splash / web background visible until storage hydration
  // finishes. Rendering the navigation tree earlier causes a light-frame flash.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('darkMode');
        if (storedTheme !== null) {
          setThemeState(storedTheme === 'true' ? 'dark' : 'light');
        } else {
          const systemTheme = Appearance.getColorScheme();
          if (systemTheme === 'light' || systemTheme === 'dark') {
            setThemeState(systemTheme);
          }
        }
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content',
        newTheme === 'dark' ? '#0B1713' : '#F3F7F5',
      );
    }
    AsyncStorage.setItem('darkMode', newTheme === 'dark' ? 'true' : 'false');
  };

  return (
    <ThemeContext.Provider value={{ theme, isReady, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
