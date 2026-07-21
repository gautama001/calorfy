import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/useAppTheme';
import { getDietGuide, getDietRecipes } from '@/lib/dietCatalog';
import { localizeDietGuide, localizeDietRecipes } from '@/lib/dietCatalogLocale';
import type { MealCategory } from '@/lib/diary';

const categories: MealCategory[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function DietDetailScreen() {
  const { diet } = useLocalSearchParams<{ diet: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#60766F';
  const guide = localizeDietGuide(getDietGuide(diet), i18n.resolvedLanguage);
  const recipes = localizeDietRecipes(getDietRecipes(diet), i18n.resolvedLanguage);

  if (!guide) return <View style={[styles.notFound, { backgroundColor }]}><Text style={{ color: textColor }}>{t('diet_not_found')}</Text></View>;

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: guide.shortName, headerBackTitle: t('diets') }} />
      <View style={[styles.hero, { borderColor, backgroundColor: cardColor }]}>
        <View style={[styles.heroIcon, { backgroundColor: `${guide.accent}18` }]}><Ionicons name="leaf" size={25} color={guide.accent} /></View>
        <Text style={[styles.title, { color: textColor }]}>{guide.name}</Text>
        <Text style={[styles.description, { color: mutedColor }]}>{guide.description}</Text>
        <View style={styles.principles}>
          {guide.principles.map((principle) => <View key={principle} style={styles.principle}><Ionicons name="checkmark-circle" size={17} color={guide.accent} /><Text style={[styles.principleText, { color: mutedColor }]}>{principle}</Text></View>)}
        </View>
        <Text style={[styles.disclaimer, { color: mutedColor }]}>{t('diet_guidance_note')}</Text>
      </View>

      <View style={styles.recipeHeading}>
        <View><Text style={[styles.recipeTitle, { color: textColor }]}>{t('recipe_library')}</Text><Text style={[styles.recipeSubtitle, { color: mutedColor }]}>{recipes.length} {t('recipes')} · {t('nutrition_per_serving')}</Text></View>
        <View style={[styles.countBadge, { backgroundColor: `${guide.accent}18` }]}><Text style={[styles.countText, { color: guide.accent }]}>{recipes.length}</Text></View>
      </View>

      {categories.map((category) => {
        const sectionRecipes = recipes.filter((recipe) => recipe.category === category);
        return (
          <View key={category} style={styles.section}>
            <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: textColor }]}>{t(category)}</Text><Text style={styles.sectionCount}>{sectionRecipes.length}</Text></View>
            {sectionRecipes.map((recipe) => (
              <TouchableOpacity key={recipe.id} activeOpacity={0.75} style={[styles.recipeCard, { backgroundColor: cardColor, borderColor }]} onPress={() => router.push(`/diets/recipe/${recipe.id}` as never)}>
                <View style={styles.recipeCardTop}>
                  <View style={{ flex: 1 }}><Text style={[styles.recipeName, { color: textColor }]}>{recipe.name}</Text><Text style={[styles.recipeSummary, { color: mutedColor }]}>{recipe.summary}</Text></View>
                  <View style={[styles.addCircle, { backgroundColor: `${guide.accent}18` }]}><Ionicons name="add" size={22} color={guide.accent} /></View>
                </View>
                <View style={[styles.macroRow, { borderTopColor: borderColor }]}>
                  <Text style={styles.kcal}>{recipe.calories} kcal</Text>
                  <Text style={[styles.macro, { color: mutedColor }]}>{t('protein').charAt(0)} {recipe.protein} g</Text><Text style={[styles.macro, { color: mutedColor }]}>{t('carbs').charAt(0)} {recipe.carbs} g</Text><Text style={[styles.macro, { color: mutedColor }]}>{t('fats').charAt(0)} {recipe.fat} g</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingBottom: 80 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderWidth: 1, borderRadius: 22, padding: 19, alignItems: 'flex-start' },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  title: { fontSize: 28, fontWeight: '900' },
  description: { color: '#60766F', fontSize: 14, lineHeight: 21, marginTop: 7 },
  principles: { gap: 8, marginTop: 16 },
  principle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  principleText: { flex: 1, color: '#4F685F', fontSize: 13, fontWeight: '700' },
  disclaimer: { color: '#84968F', fontSize: 10, lineHeight: 15, marginTop: 15 },
  recipeHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 17 },
  recipeTitle: { fontSize: 21, fontWeight: '900' },
  recipeSubtitle: { color: '#71877F', fontSize: 12, marginTop: 3 },
  countBadge: { minWidth: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 15, fontWeight: '900' },
  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionCount: { color: '#71877F', fontSize: 12, fontWeight: '800' },
  recipeCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 9 },
  recipeCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  recipeName: { fontSize: 15, fontWeight: '900' },
  recipeSummary: { color: '#6C817A', fontSize: 12, lineHeight: 18, marginTop: 4 },
  addCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  macroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginTop: 12, borderTopWidth: 1, borderTopColor: '#EDF3F1', paddingTop: 10 },
  kcal: { color: '#008F6D', fontSize: 11, fontWeight: '900' },
  macro: { color: '#6C817A', fontSize: 11, fontWeight: '700' },
});
