import { useTheme } from '@react-navigation/native';

export function useAppTheme() {
  const { colors, dark } = useTheme();

  return {
    backgroundColor: colors.background,
    textColor: colors.text,
    cardColor: colors.card,
    borderColor: colors.border,
    primaryColor: colors.primary,
    notificationColor: colors.notification,
    isDarkMode: dark,
  };
}
