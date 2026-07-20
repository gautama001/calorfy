import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DietKey = 'keto' | 'paleo' | 'vegan' | 'mediterranean' | 'raw' | 'macrobiotic';

const images: Record<DietKey, number> = {
  keto: require('@/assets/images/keto.png'),
  paleo: require('@/assets/images/paleo.png'),
  vegan: require('@/assets/images/vegan.png'),
  mediterranean: require('@/assets/images/mediterranean.png'),
  raw: require('@/assets/images/raw.png'),
  macrobiotic: require('@/assets/images/macrobiotic.png'),
};

const DIETS: { key: DietKey; nameKey: string }[] = [
  { key: 'keto', nameKey: 'keto' },
  { key: 'paleo', nameKey: 'paleo' },
  { key: 'vegan', nameKey: 'vegan' },
  { key: 'mediterranean', nameKey: 'mediterranean' },
  { key: 'raw', nameKey: 'raw_food' },
  { key: 'macrobiotic', nameKey: 'macrobiotic' },
];

export default function DietsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadDarkMode = async () => {
      const stored = await AsyncStorage.getItem('darkMode');
      setDarkMode(stored === 'true');
    };
    loadDarkMode();
  }, []);

  const backgroundColor = darkMode ? '#000' : '#fff';
  const textColor = darkMode ? '#fff' : '#333';
  const cardColor = darkMode ? '#1a1a1a' : '#f9f9f9';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{ padding: 20, alignItems: 'center', backgroundColor }}
    >
      <Text style={[styles.title, { color: textColor }]}>{t('explore_diets')}</Text>
      <View style={styles.grid}>
        {DIETS.map((diet) => (
          <TouchableOpacity
            key={diet.key}
            style={[styles.card, { backgroundColor: cardColor }]}
            onPress={() => router.push(`/diets/${diet.key}`)}
          >
            <Image source={images[diet.key]} style={styles.image} />
            <Text style={[styles.label, { color: textColor }]}>{t(diet.nameKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 100,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 10,
  },
});
