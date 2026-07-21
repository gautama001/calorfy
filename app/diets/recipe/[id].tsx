import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getDietGuide, getDietRecipe } from '@/lib/dietCatalog';
import { localizeDietGuide, localizeDietRecipe } from '@/lib/dietCatalogLocale';
import { createDiaryMeal, type DiaryFoodInput, type MealCategory } from '@/lib/diary';

const categories: MealCategory[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function DietRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#637971';
  const recipe = localizeDietRecipe(getDietRecipe(id), i18n.resolvedLanguage);
  const guide = localizeDietGuide(getDietGuide(recipe?.diet), i18n.resolvedLanguage);
  const [servings, setServings] = useState(1);
  const [category, setCategory] = useState<MealCategory>(recipe?.category ?? 'lunch');
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    setCategory(recipe.category);
    setServings(1);
    setAdded(false);
  }, [recipe?.id]);

  if (!recipe || !guide) return <View style={[styles.notFound, { backgroundColor }]}><Text style={{ color: textColor }}>{t('recipe_not_found')}</Text></View>;

  const scaled = (value: number) => Math.round(value * servings * 10) / 10;

  const addToDiary = async () => {
    if (!user) {
      Alert.alert(t('could_not_add_recipe'), t('session_required'));
      return;
    }
    const grams = scaled(recipe.servingGrams);
    const food: DiaryFoodInput = {
      food: {
        id: '', canonical_name: recipe.name, display_name: recipe.name, food_type: 'diet_recipe', group_code: 'RECIPE', origin_country_code: null,
        default_portion_g: recipe.servingGrams, energy_kcal: recipe.calories * 100 / recipe.servingGrams,
        protein_g: recipe.protein * 100 / recipe.servingGrams, carbohydrate_g: recipe.carbs * 100 / recipe.servingGrams,
        fat_g: recipe.fat * 100 / recipe.servingGrams, rank: 0,
      },
      quantity: grams,
      unit: 'g',
      grams,
      calories: scaled(recipe.calories),
      protein: scaled(recipe.protein),
      carbs: scaled(recipe.carbs),
      fat: scaled(recipe.fat),
    };
    setSaving(true);
    try {
      const savedMeal = await createDiaryMeal(user.id, [food], category) as { category?: MealCategory };
      if (savedMeal.category !== category) throw new Error(`Category mismatch: requested ${category}, saved ${savedMeal.category ?? 'unknown'}`);
      setAdded(true);
    } catch (error) {
      console.error('Could not add diet recipe:', error);
      Alert.alert(t('could_not_add_recipe'), t('connection_retry'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: guide.shortName, headerBackTitle: t('recipes') }} />
      <View style={styles.heading}>
        <View style={[styles.dietPill, { backgroundColor: `${guide.accent}18` }]}><Text style={[styles.dietPillText, { color: guide.accent }]}>{guide.name}</Text></View>
        <Text style={[styles.title, { color: textColor }]}>{recipe.name}</Text>
        <Text style={[styles.summary, { color: mutedColor }]}>{recipe.summary}</Text>
      </View>

      <View style={[styles.nutritionCard, { backgroundColor: '#153F34' }]}>
        <View><Text style={styles.nutritionEyebrow}>{t('nutrition_per_serving').toUpperCase()}</Text><Text style={styles.calories}>{scaled(recipe.calories)} kcal</Text></View>
        <View style={styles.nutritionGrid}>
          <View><Text style={styles.nutritionValue}>{scaled(recipe.protein)} g</Text><Text style={styles.nutritionLabel}>{t('protein')}</Text></View>
          <View><Text style={styles.nutritionValue}>{scaled(recipe.carbs)} g</Text><Text style={styles.nutritionLabel}>{t('carbs')}</Text></View>
          <View><Text style={styles.nutritionValue}>{scaled(recipe.fat)} g</Text><Text style={styles.nutritionLabel}>{t('fats')}</Text></View>
          <View><Text style={styles.nutritionValue}>{scaled(recipe.servingGrams)} g</Text><Text style={styles.nutritionLabel}>{t('portion')}</Text></View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('ingredients')}</Text>
        {recipe.ingredients.map((ingredient) => <View key={ingredient} style={styles.listRow}><View style={[styles.bullet, { backgroundColor: guide.accent }]} /><Text style={[styles.listText, { color: mutedColor }]}>{ingredient}</Text></View>)}
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('preparation')}</Text>
        {recipe.instructions.map((instruction, index) => <View key={instruction} style={styles.step}><View style={[styles.stepNumber, { backgroundColor: `${guide.accent}18` }]}><Text style={[styles.stepNumberText, { color: guide.accent }]}>{index + 1}</Text></View><Text style={[styles.stepText, { color: mutedColor }]}>{instruction}</Text></View>)}
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('add_to_diary')}</Text>
        {added ? (
          <View style={styles.successBox}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={25} color="#FFFFFF" /></View>
            <Text style={[styles.successTitle, { color: textColor }]}>{t('added_to_diary')}</Text>
            <Text style={[styles.successText, { color: mutedColor }]}>{t('recipe_added_message')}</Text>
            <TouchableOpacity style={[styles.addButton, styles.successPrimaryButton]} onPress={() => router.replace('/(tabs)' as never)}><Ionicons name="calendar" size={21} color="#FFFFFF" /><Text style={styles.successPrimaryText}>{t('view_today')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace(`/diets/${recipe.diet}` as never)}><Ionicons name="book-outline" size={18} color="#008F6D" /><Text style={styles.secondaryButtonText}>{t('back_to_recipes')}</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.fieldLabel, { color: mutedColor }]}>{t('servings')}</Text>
            <View style={[styles.stepper, { borderColor }]}><TouchableOpacity style={[styles.stepperButton, isDarkMode && { backgroundColor: '#20372F' }]} onPress={() => setServings((value) => Math.max(0.5, value - 0.5))}><Ionicons name="remove" size={20} color="#008F6D" /></TouchableOpacity><Text style={[styles.servings, { color: textColor }]}>{servings.toLocaleString(undefined, { maximumFractionDigits: 1 })}</Text><TouchableOpacity style={[styles.stepperButton, isDarkMode && { backgroundColor: '#20372F' }]} onPress={() => setServings((value) => Math.min(10, value + 0.5))}><Ionicons name="add" size={20} color="#008F6D" /></TouchableOpacity></View>
            <Text style={[styles.fieldLabel, { color: mutedColor }]}>{t('meal_time')}</Text>
            <View style={styles.categories}>{categories.map((item) => {
              const selected = category === item;
              return <TouchableOpacity key={item} accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.category, { borderColor }, selected && styles.categoryActive, selected && isDarkMode && { backgroundColor: '#203C33' }]} onPress={() => setCategory(item)}><Text style={[styles.categoryText, { color: mutedColor }, selected && styles.categoryTextActive]}>{t(item)}</Text>{selected ? <Ionicons name="checkmark-circle" size={17} color="#00A77D" /> : null}</TouchableOpacity>;
            })}</View>
            <TouchableOpacity style={[styles.addButton, saving && styles.disabled]} disabled={saving} onPress={addToDiary}>{saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="add-circle" size={20} color="#fff" /><Text style={styles.addButtonText}>{t('add_recipe_to_today')}</Text></>}</TouchableOpacity>
          </>
        )}
      </View>
      <Text style={[styles.note, { color: mutedColor }]}>{t('recipe_nutrition_note')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingBottom: 70 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { paddingVertical: 8, marginBottom: 14 },
  dietPill: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  dietPillText: { fontSize: 11, fontWeight: '900' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900' },
  summary: { color: '#637971', fontSize: 14, lineHeight: 21, marginTop: 7 },
  nutritionCard: { borderRadius: 21, padding: 18, marginBottom: 13 },
  nutritionEyebrow: { color: '#9BCBBD', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  calories: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
  nutritionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 },
  nutritionValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  nutritionLabel: { color: '#A8C9BF', fontSize: 10, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 19, padding: 17, marginBottom: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 13 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  bullet: { width: 7, height: 7, borderRadius: 4 },
  listText: { flex: 1, color: '#587068', fontSize: 14, textTransform: 'capitalize' },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 12 },
  stepNumber: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 12, fontWeight: '900' },
  stepText: { flex: 1, color: '#587068', fontSize: 13, lineHeight: 20, paddingTop: 3 },
  fieldLabel: { color: '#637971', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 7, marginBottom: 8 },
  stepper: { height: 48, borderWidth: 1, borderColor: '#D6E5E0', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  stepperButton: { width: 52, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF8F4' },
  servings: { fontSize: 16, fontWeight: '900' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  category: { flexGrow: 1, minWidth: '45%', minHeight: 44, borderWidth: 1, borderColor: '#D6E5E0', borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  categoryActive: { backgroundColor: '#E7F8F2', borderColor: '#00A77D' },
  categoryText: { color: '#637971', fontSize: 12, fontWeight: '800' },
  categoryTextActive: { color: '#008F6D' },
  addButton: { minHeight: 52, backgroundColor: '#00A77D', borderRadius: 15, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  successBox: { alignItems: 'center', paddingTop: 4 },
  successIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  successTitle: { fontSize: 18, fontWeight: '900' },
  successText: { color: '#637971', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5, marginBottom: 2 },
  successPrimaryButton: { width: '100%', minHeight: 58, borderRadius: 17, marginTop: 18 },
  successPrimaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: { minHeight: 50, width: '100%', borderWidth: 1, borderColor: '#00A77D', borderRadius: 15, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  secondaryButtonText: { color: '#008F6D', fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  note: { color: '#84968F', fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 18 },
});
