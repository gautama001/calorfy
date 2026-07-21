import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export function LegalScreen({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  const router = useRouter();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const muted = isDarkMode ? '#A7BBB4' : '#61776F';

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.content}>
      <TouchableOpacity style={[styles.back, { backgroundColor: cardColor, borderColor }]} onPress={() => router.back()} accessibilityRole="button">
        <Ionicons name="chevron-back" size={22} color={textColor} />
        <Text style={[styles.backText, { color: textColor }]}>Calorfy</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {updated ? <Text style={[styles.updated, { color: muted }]}>{updated}</Text> : null}
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>{children}</View>
    </ScrollView>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  const { textColor, isDarkMode } = useAppTheme();
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text><Text style={[styles.body, { color: isDarkMode ? '#C7D8D2' : '#40564F' }]}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 18, paddingTop: 24, paddingBottom: 60 },
  back: { alignSelf: 'flex-start', minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 3 },
  backText: { fontSize: 13, fontWeight: '900' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 22 },
  updated: { fontSize: 11, marginTop: 4, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
  section: { marginBottom: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  body: { fontSize: 13, lineHeight: 20 },
});
