import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
});

export function ThemeProviderCustom({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    (async () => {
      const storedTheme = await AsyncStorage.getItem('darkMode');
      if (storedTheme !== null) {
        setThemeState(storedTheme === 'true' ? 'dark' : 'light');
      } else {
        const systemTheme = Appearance.getColorScheme();
        if (systemTheme) {
          setThemeState(systemTheme);
        }
      }
    })();
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('darkMode', newTheme === 'dark' ? 'true' : 'false');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
