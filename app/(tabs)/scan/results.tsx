import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { createDiaryClientEventId, createDiaryMeal, type DiaryFoodInput, type MealCategory } from '@/lib/diary';

interface Nutrients {
  ENERC_KCAL?: { quantity: number; unit: string };
  PROCNT?: { quantity: number; unit: string };
  FAT?: { quantity: number; unit: string };
  CHOCDF?: { quantity: number; unit: string };
}

const categories: MealCategory[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function suggestedCategory(): MealCategory {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 19) return 'snack';
  return 'dinner';
}

function validCategory(value?: string): value is MealCategory {
  return categories.includes(value as MealCategory);
}

export default function ResultsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { backgroundColor, cardColor, textColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A9BBB5' : '#5F736C';
  const { name, image, category: categoryParam, nutrients: serializedNutrients, totalWeight: serializedWeight } = useLocalSearchParams<{
    name: string;
    image?: string;
    category?: string;
    nutrients?: string;
    totalWeight?: string;
  }>();
  const [category, setCategory] = useState<MealCategory>(() => validCategory(categoryParam) ? categoryParam : suggestedCategory());
  const [saving, setSaving] = useState(false);
  const [saveEventId] = useState(createDiaryClientEventId);

  const nutrients = useMemo<Nutrients | null>(() => {
    if (!serializedNutrients) return null;
    try {
      return JSON.parse(serializedNutrients) as Nutrients;
    } catch {
      return null;
    }
  }, [serializedNutrients]);

  const saveMeal = async () => {
    if (!nutrients || !user || saving) {
      if (!user) Alert.alert(t('error'), t('scan_session_required'));
      return;
    }

    try {
      setSaving(true);
      const grams = Math.max(1, Number(serializedWeight) || 100);
      const calories = Number(nutrients.ENERC_KCAL?.quantity || 0);
      const protein = Number(nutrients.PROCNT?.quantity || 0);
      const carbs = Number(nutrients.CHOCDF?.quantity || 0);
      const fat = Number(nutrients.FAT?.quantity || 0);
      const perHundred = 100 / grams;
      const food: DiaryFoodInput = {
        food: {
          id: '',
          canonical_name: name,
          display_name: name,
          food_type: 'scanned',
          group_code: 'OTHER',
          origin_country_code: null,
          default_portion_g: grams,
          energy_kcal: calories * perHundred,
          protein_g: protein * perHundred,
          carbohydrate_g: carbs * perHundred,
          fat_g: fat * perHundred,
          rank: 0,
        },
        quantity: grams,
        unit: 'g',
        grams,
        calories,
        protein,
        carbs,
        fat,
      };

      await createDiaryMeal(user.id, [food], category, saveEventId);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Scanned meal save error:', error);
      Alert.alert(t('error'), t('connection_retry'));
    } finally {
      setSaving(false);
    }
  };

  if (!nutrients) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <Text style={{ color: textColor }}>{t('scan_missing_nutrition')}</Text>
        <TouchableOpacity onPress={() => router.replace('/scan' as never)} style={[styles.outlineButton, { borderColor }]}><Text style={[styles.outlineText, { color: textColor }]}>{t('scan_again')}</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{name}</Text>
      {image && <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />}
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.detail, { color: textColor }]}>{Math.round(nutrients.ENERC_KCAL?.quantity || 0)} kcal</Text>
        <Text style={[styles.detail, { color: textColor }]}>{(nutrients.PROCNT?.quantity || 0).toFixed(2)} g {t('protein').toLowerCase()}</Text>
        <Text style={[styles.detail, { color: textColor }]}>{(nutrients.CHOCDF?.quantity || 0).toFixed(1)} g {t('carbs').toLowerCase()}</Text>
        <Text style={[styles.detail, { color: textColor }]}>{(nutrients.FAT?.quantity || 0).toFixed(2)} g {t('fats').toLowerCase()}</Text>
      </View>
      <Text style={[styles.categoryLabel, { color: textColor }]}>{t('category')}</Text>
      <View style={styles.categoryRow}>
        {categories.map((item) => {
          const selected = category === item;
          return (
            <TouchableOpacity
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.categoryButton,
                { borderColor, backgroundColor: cardColor },
                selected && { borderColor: '#00A77D', backgroundColor: isDarkMode ? '#203C33' : '#E2F7F0' },
              ]}
              onPress={() => setCategory(item)}
              disabled={saving}
            >
              <Text style={[styles.categoryText, { color: mutedColor }, selected && styles.categoryTextSelected]}>{t(item)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={saveMeal} disabled={saving}>
        <Text style={styles.saveText}>{saving ? t('saving') : t('saveMeal')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.outlineButton, { borderColor }]} onPress={() => router.replace('/scan' as never)}><Text style={[styles.outlineText, { color: mutedColor }]}>{t('scan_again')}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12, textTransform: 'capitalize' },
  image: { width: '100%', height: 240, borderRadius: 18, marginBottom: 24 },
  card: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  detail: { fontSize: 16, marginBottom: 6 },
  categoryLabel: { width: '100%', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  categoryRow: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  categoryButton: { flexGrow: 1, minWidth: '46%', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 11 },
  categoryText: { fontSize: 14, fontWeight: '700' },
  categoryTextSelected: { color: '#008F6D' },
  saveButton: { backgroundColor: '#00C896', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 32, marginBottom: 16 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  outlineButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 32, paddingVertical: 14, paddingHorizontal: 40 },
  outlineText: { fontSize: 15, color: '#444' },
  disabled: { opacity: 0.65 },
});
