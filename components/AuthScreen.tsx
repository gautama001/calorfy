import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CalorfyBrand from '@/components/CalorfyBrand';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AuthScreen({ children }: PropsWithChildren) {
  const { backgroundColor, cardColor, borderColor, isDarkMode } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets>
          <View style={styles.brandRow}>
            <CalorfyBrand inverse={isDarkMode} />
          </View>
          <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>{children}</View>
          <View style={[styles.orb, styles.orbOne, { backgroundColor: isDarkMode ? '#123E32' : '#D9F6ED' }]} />
          <View style={[styles.orb, styles.orbTwo, { backgroundColor: isDarkMode ? '#0D3027' : '#E7F1EC' }]} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 32, justifyContent: 'center', overflow: 'hidden' },
  brandRow: { width: '100%', maxWidth: 440, alignSelf: 'center', marginBottom: 22, zIndex: 2 },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#002B20',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
    zIndex: 2,
  },
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.8 },
  orbOne: { width: 220, height: 220, right: -100, top: 40 },
  orbTwo: { width: 180, height: 180, left: -100, bottom: 20 },
});
