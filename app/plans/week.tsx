import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { DIET_GUIDES, getDietGuide, getDietRecipes, type DietKey } from '@/lib/dietCatalog';
import { localizeDietGuide, localizeDietGuides, localizeDietRecipe } from '@/lib/dietCatalogLocale';
import { createDiaryMeal } from '@/lib/diary';
import { readCachedGoalProfile, syncGoalProfile } from '@/lib/goals';
import {
  createWeeklyPlan,
  currentWeekStart,
  getPlanItemRecipe,
  goalDietToCatalogDiet,
  localDateString,
  readCachedWeeklyPlan,
  recipeServingToDiaryInput,
  syncWeeklyPlan,
  updateWeeklyPlanItem,
  type WeeklyPlan,
  type WeeklyPlanItem,
} from '@/lib/weeklyPlan';

function addDays(date: string, amount: number) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + amount);
  return localDateString(result);
}

export default function WeeklyPlanScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const weekStart = currentWeekStart();
  const today = localDateString();
  const initialDay = Math.max(0, Math.min(6, Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${weekStart}T12:00:00`).getTime()) / 86400000)));
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [dietKey, setDietKey] = useState(goalDietToCatalogDiet(null));
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [dietPickerOpen, setDietPickerOpen] = useState(false);
  const mutedColor = isDarkMode ? '#A7BBB4' : '#637971';

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let active = true;
    (async () => {
      try {
        const [cachedPlan, cachedGoal] = await Promise.all([readCachedWeeklyPlan(user.id, weekStart), readCachedGoalProfile(user.id)]);
        if (active) {
          setPlan(cachedPlan);
          setDietKey(cachedPlan?.dietKey ?? goalDietToCatalogDiet(cachedGoal?.diet ?? null));
          setCalorieTarget(cachedGoal?.calorieGoal ?? 2000);
        }
        const [remotePlan, remoteGoal] = await Promise.all([syncWeeklyPlan(user.id, weekStart), syncGoalProfile(user.id)]);
        if (active) {
          setPlan(remotePlan);
          setDietKey(remotePlan?.dietKey ?? goalDietToCatalogDiet(remoteGoal?.diet ?? null));
          setCalorieTarget(remoteGoal?.calorieGoal ?? 2000);
        }
      } catch {
        // Cached data remains available.
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user?.id, weekStart]);

  const guide = localizeDietGuide(getDietGuide(plan?.dietKey ?? dietKey), i18n.resolvedLanguage);
  const selectedGuide = localizeDietGuide(getDietGuide(dietKey), i18n.resolvedLanguage);
  const localizedGuides = useMemo(() => localizeDietGuides(DIET_GUIDES, i18n.resolvedLanguage), [i18n.resolvedLanguage]);
  const selectedDate = addDays(weekStart, selectedDay);
  const dayItems = useMemo(() => (plan?.items ?? []).filter((item) => item.date === selectedDate).sort((a, b) => ['breakfast','lunch','snack','dinner'].indexOf(a.category) - ['breakfast','lunch','snack','dinner'].indexOf(b.category)), [plan, selectedDate]);
  const totals = dayItems.reduce((sum, item) => {
    const recipe = localizeDietRecipe(getPlanItemRecipe(item), i18n.resolvedLanguage);
    return recipe ? { calories: sum.calories + recipe.calories * item.servings, protein: sum.protein + recipe.protein * item.servings, carbs: sum.carbs + recipe.carbs * item.servings, fat: sum.fat + recipe.fat * item.servings } : sum;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    try { setPlan(await createWeeklyPlan(user.id, weekStart, dietKey, calorieTarget)); }
    catch { Alert.alert(t('weekly_plan_error'), t('connection_retry')); }
    finally { setGenerating(false); }
  };

  const patchItem = (itemId: string, changes: Partial<WeeklyPlanItem>) => setPlan((current) => current ? { ...current, items: current.items.map((item) => item.id === itemId ? { ...item, ...changes } : item) } : current);

  const changeServings = async (item: WeeklyPlanItem, delta: number) => {
    if (!user) return;
    const servings = Math.min(3, Math.max(0.5, Math.round((item.servings + delta) * 4) / 4));
    patchItem(item.id, { servings });
    try { await updateWeeklyPlanItem(user.id, item.id, { servings }); }
    catch { patchItem(item.id, { servings: item.servings }); Alert.alert(t('weekly_plan_error'), t('connection_retry')); }
  };

  const swapRecipe = async (item: WeeklyPlanItem) => {
    if (!user || !plan) return;
    const pool = getDietRecipes(plan.dietKey).filter((recipe) => recipe.category === item.category);
    const currentIndex = pool.findIndex((recipe) => recipe.id === item.recipeId);
    const replacement = pool[(currentIndex + 1) % pool.length];
    if (!replacement) return;
    patchItem(item.id, { recipeId: replacement.id, status: 'planned' });
    try { await updateWeeklyPlanItem(user.id, item.id, { recipeId: replacement.id, status: 'planned' }); }
    catch { patchItem(item.id, { recipeId: item.recipeId, status: item.status }); Alert.alert(t('weekly_plan_error'), t('connection_retry')); }
  };

  const addItemToToday = async (item: WeeklyPlanItem) => {
    if (!user) return;
    const recipe = localizeDietRecipe(getPlanItemRecipe(item), i18n.resolvedLanguage);
    if (!recipe) return;
    setBusyItem(item.id);
    try {
      await createDiaryMeal(user.id, [recipeServingToDiaryInput(recipe, item.servings)], item.category);
      await updateWeeklyPlanItem(user.id, item.id, { status: 'added' });
      patchItem(item.id, { status: 'added' });
    } catch { Alert.alert(t('could_not_add_recipe'), t('connection_retry')); }
    finally { setBusyItem(null); }
  };

  if (loading) return <View style={[styles.loading, { backgroundColor }]}><ActivityIndicator color="#00A77D" size="large" /></View>;

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: t('weekly_plan'), headerBackButtonDisplayMode: 'minimal', gestureEnabled: true, fullScreenGestureEnabled: true }} />
      <Text style={styles.eyebrow}>{t('personalized').toUpperCase()}</Text>
      <Text style={[styles.title, { color: textColor }]}>{t('weekly_plan_title')}</Text>
      <Text style={[styles.intro, { color: mutedColor }]}>{t('weekly_plan_intro')}</Text>

      {!plan ? (
        <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={30} color="#00A77D" /></View>
          <Text style={[styles.emptyTitle, { color: textColor }]}>{t('build_your_week')}</Text>
          <TouchableOpacity style={[styles.emptyDietSelector, { borderColor }]} onPress={() => setDietPickerOpen(true)}>
            <View style={[styles.optionDot, { backgroundColor: selectedGuide?.accent ?? '#00A77D' }]} />
            <View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: textColor }]}>{selectedGuide?.name}</Text><Text style={[styles.emptyText, { color: mutedColor }]}>{calorieTarget} kcal · {t('change_eating_style')}</Text></View>
            <Ionicons name="chevron-down" size={18} color="#00A77D" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={generate} disabled={generating}>{generating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t('generate_weekly_plan')}</Text>}</TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.planHeader, { backgroundColor: cardColor, borderColor }]}>
            <TouchableOpacity style={styles.dietSelector} onPress={() => setDietPickerOpen(true)} activeOpacity={0.75}>
              <View style={[styles.dietDot, { backgroundColor: guide?.accent ?? '#00A77D' }]} />
              <View style={{ flex: 1 }}><Text style={[styles.planDiet, { color: textColor }]}>{guide?.name}</Text><Text style={[styles.planMeta, { color: mutedColor }]}>{plan.calorieTarget} kcal · {t('change_eating_style')}</Text></View>
              <Ionicons name="chevron-down" size={18} color="#00A77D" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.regenerateButton} onPress={generate} disabled={generating}><Ionicons name="refresh" size={18} color="#008F6D" /></TouchableOpacity>
          </View>
          {dietKey !== plan.dietKey ? <TouchableOpacity style={styles.applyButton} onPress={generate} disabled={generating}>{generating ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="sparkles-outline" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>{t('apply_to_plan')}: {selectedGuide?.shortName}</Text></>}</TouchableOpacity> : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {Array.from({ length: 7 }).map((_, index) => {
              const date = addDays(weekStart, index);
              const selected = selectedDay === index;
              const label = new Date(`${date}T12:00:00`).toLocaleDateString(i18n.resolvedLanguage, { weekday: 'short' });
              return <TouchableOpacity key={date} style={[styles.day, { borderColor }, selected && styles.daySelected]} onPress={() => setSelectedDay(index)}><Text style={[styles.dayName, { color: mutedColor }, selected && styles.dayTextSelected]}>{label}</Text><Text style={[styles.dayNumber, { color: textColor }, selected && styles.dayTextSelected]}>{date.slice(-2)}</Text>{date === today ? <View style={[styles.todayDot, selected && { backgroundColor: '#FFFFFF' }]} /> : null}</TouchableOpacity>;
            })}
          </ScrollView>

          <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? '#163229' : '#E8F8F2', borderColor: isDarkMode ? '#285044' : '#CBEADF' }]}>
            <View><Text style={styles.summaryKcal}>{Math.round(totals.calories)} kcal</Text><Text style={[styles.summaryLabel, { color: mutedColor }]}>{t('planned_for_day')}</Text></View>
            <View style={styles.summaryMacros}><Text style={[styles.summaryMacro, { color: textColor }]}>{t('protein').charAt(0)} {Math.round(totals.protein)} g</Text><Text style={[styles.summaryMacro, { color: textColor }]}>{t('carbs').charAt(0)} {Math.round(totals.carbs)} g</Text><Text style={[styles.summaryMacro, { color: textColor }]}>{t('fats').charAt(0)} {Math.round(totals.fat)} g</Text></View>
          </View>

          {dayItems.map((item) => {
            const recipe = localizeDietRecipe(getPlanItemRecipe(item), i18n.resolvedLanguage);
            if (!recipe) return null;
            return (
              <View key={item.id} style={[styles.mealCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={styles.mealTop}><View style={{ flex: 1 }}><Text style={styles.category}>{t(item.category).toUpperCase()}</Text><Text style={[styles.recipeName, { color: textColor }]}>{recipe.name}</Text><Text style={[styles.recipeMacros, { color: mutedColor }]}>{Math.round(recipe.calories * item.servings)} kcal · {t('protein').charAt(0)} {Math.round(recipe.protein * item.servings)} · {t('carbs').charAt(0)} {Math.round(recipe.carbs * item.servings)} · {t('fats').charAt(0)} {Math.round(recipe.fat * item.servings)}</Text></View>{item.status === 'added' ? <View style={styles.addedBadge}><Ionicons name="checkmark" size={14} color="#008F6D" /><Text style={styles.addedText}>{t('added')}</Text></View> : null}</View>
                <View style={styles.actions}>
                  <View style={[styles.servingControl, { borderColor }]}><TouchableOpacity style={styles.smallButton} onPress={() => changeServings(item, -0.25)}><Ionicons name="remove" size={17} color="#008F6D" /></TouchableOpacity><Text style={[styles.servingText, { color: textColor }]}>{item.servings}x</Text><TouchableOpacity style={styles.smallButton} onPress={() => changeServings(item, 0.25)}><Ionicons name="add" size={17} color="#008F6D" /></TouchableOpacity></View>
                  <TouchableOpacity style={[styles.actionButton, { borderColor }]} onPress={() => swapRecipe(item)}><Ionicons name="swap-horizontal" size={18} color="#008F6D" /><Text style={styles.actionText}>{t('swap')}</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.addButton, item.status === 'added' && styles.addButtonDone]} onPress={() => addItemToToday(item)} disabled={busyItem === item.id || item.status === 'added'}>{busyItem === item.id ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name={item.status === 'added' ? 'checkmark' : 'add'} size={19} color="#fff" />}</TouchableOpacity>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.todayButton} onPress={() => router.replace('/(tabs)' as never)}><Ionicons name="home-outline" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>{t('view_today')}</Text></TouchableOpacity>
        </>
      )}

      <Modal visible={dietPickerOpen} transparent animationType="fade" onRequestClose={() => setDietPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>{t('weekly_plan').toUpperCase()}</Text><Text style={[styles.modalTitle, { color: textColor }]}>{t('choose_plan_style')}</Text></View><TouchableOpacity style={[styles.closeButton, { borderColor }]} onPress={() => setDietPickerOpen(false)}><Ionicons name="close" size={20} color={textColor} /></TouchableOpacity></View>
            <ScrollView style={styles.dietList} showsVerticalScrollIndicator={false}>
              {localizedGuides.map((diet) => {
                const selected = diet.key === dietKey;
                return <TouchableOpacity key={diet.key} style={[styles.dietOption, { borderColor }, selected && styles.dietOptionSelected]} onPress={() => { setDietKey(diet.key as DietKey); setDietPickerOpen(false); }}><View style={[styles.optionDot, { backgroundColor: diet.accent }]} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: textColor }]}>{diet.name}</Text><Text style={[styles.optionBody, { color: mutedColor }]} numberOfLines={1}>{diet.description}</Text></View>{selected ? <Ionicons name="checkmark-circle" size={22} color="#00A77D" /> : null}</TouchableOpacity>;
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelButton, { borderColor }]} onPress={() => setDietPickerOpen(false)}><Text style={[styles.cancelText, { color: textColor }]}>{t('cancel')}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingTop: 23, paddingBottom: 80 },
  eyebrow: { color: '#00A77D', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  title: { fontSize: 30, fontWeight: '900', marginTop: 2 },
  intro: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 18 },
  emptyCard: { borderWidth: 1, borderRadius: 22, padding: 22, alignItems: 'center', marginTop: 12 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#E4F7F0', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginTop: 13 },
  emptyText: { fontSize: 13, marginTop: 5 },
  emptyDietSelector: { width: '100%', minHeight: 65, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', marginTop: 17 },
  primaryButton: { minHeight: 52, width: '100%', borderRadius: 16, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  planHeader: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dietSelector: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  dietDot: { width: 9, height: 34, borderRadius: 5, marginRight: 11 },
  planDiet: { fontSize: 17, fontWeight: '900' },
  planMeta: { fontSize: 11, marginTop: 3 },
  regenerateButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E7F7F2', alignItems: 'center', justifyContent: 'center' },
  applyButton: { minHeight: 50, borderRadius: 15, backgroundColor: '#00A77D', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  days: { gap: 7, paddingVertical: 15 },
  day: { width: 52, height: 66, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: '#00A77D', borderColor: '#00A77D' },
  dayName: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  dayNumber: { fontSize: 16, fontWeight: '900', marginTop: 3 },
  dayTextSelected: { color: '#FFFFFF' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#00A77D', marginTop: 3 },
  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  summaryKcal: { color: '#00A77D', fontSize: 21, fontWeight: '900' },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  summaryMacros: { alignItems: 'flex-end', gap: 2 },
  summaryMacro: { fontSize: 11, fontWeight: '800' },
  mealCard: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 10 },
  mealTop: { flexDirection: 'row', gap: 8 },
  category: { color: '#00A77D', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  recipeName: { fontSize: 15, fontWeight: '900', marginTop: 4 },
  recipeMacros: { fontSize: 11, marginTop: 5 },
  addedBadge: { flexDirection: 'row', gap: 3, alignItems: 'center', backgroundColor: '#E4F7F0', borderRadius: 10, paddingHorizontal: 7, height: 25 },
  addedText: { color: '#008F6D', fontSize: 9, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 7, marginTop: 13 },
  servingControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  smallButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  servingText: { minWidth: 38, textAlign: 'center', fontSize: 12, fontWeight: '900' },
  actionButton: { flex: 1, minHeight: 40, borderWidth: 1, borderRadius: 12, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#008F6D', fontSize: 11, fontWeight: '900' },
  addButton: { width: 44, height: 40, borderRadius: 12, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center' },
  addButtonDone: { backgroundColor: '#7AA99B' },
  todayButton: { minHeight: 54, borderRadius: 17, backgroundColor: '#173C32', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '82%', borderWidth: 1, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 28 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalEyebrow: { color: '#00A77D', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  modalTitle: { fontSize: 21, fontWeight: '900', marginTop: 3 },
  closeButton: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dietList: { flexGrow: 0 },
  dietOption: { minHeight: 67, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dietOptionSelected: { borderColor: '#00A77D', borderWidth: 2 },
  optionDot: { width: 10, height: 38, borderRadius: 5, marginRight: 11 },
  optionTitle: { fontSize: 14, fontWeight: '900' },
  optionBody: { fontSize: 10, marginTop: 3, marginRight: 8 },
  cancelButton: { minHeight: 48, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  cancelText: { fontSize: 13, fontWeight: '900' },
});
