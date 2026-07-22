import * as Haptics from 'expo-haptics';
import { Platform, Pressable } from 'react-native';

// Expo Router and React Navigation currently expose equivalent tab-button props
// from separate type entry points. Keep this adapter permissive until they converge.
export function HapticTab({ onPress, onPressIn, ...props }: any) {
  const handlePress = (event: any) => {
    if (Platform.OS === 'web' && props.href != null) {
      const modified = event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
      const leftClick = event.button == null || event.button === 0;
      const selfTarget = !event.currentTarget?.target || event.currentTarget.target === 'self';
      if (!modified && leftClick && selfTarget) {
        event.preventDefault?.();
        onPress?.(event);
      }
      return;
    }
    onPress?.(event);
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      onPressIn={(ev: any) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
    />
  );
}
