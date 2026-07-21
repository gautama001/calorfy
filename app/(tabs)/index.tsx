// app/(tabs)/index.tsx
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import CalendarWeek from '@/components/CalendarWeek';
import CalorieBar from '@/components/CalorieBar';
import MacroCircle from '@/components/MacroCircle';
import AddFoodModal from '@/components/AddFoodModal';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuth } from '@/context/AuthContext';
import {
  deleteDiaryMeal,
  type DiaryMeal,
  type MealCategory,
  listDiaryShortcuts,
  readCachedDiaryDay,
  syncDiaryDay,
  updateDiaryMealCategory,
  updateDiaryMealFavorite,
} from '@/lib/diary';
import {
  createPersonalRecipeFromMeal,
  listPersonalRecipes,
  type PersonalRecipe,
} from '@/lib/recipes';
import { type GoalProfile, readCachedGoalProfile, syncGoalProfile } from '@/lib/goals';

const categories: MealCategory[] = ['breakfast', 'lunch', 'snack', 'dinner'];

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#666';
  const softSurface = isDarkMode ? '#20372F' : '#E4EFEB';
  const inputSurface = isDarkMode ? '#13251F' : '#F9FCFB';
  const [selectedDate, setSelectedDate] = useState(todayLocal);
  const [meals, setMeals] = useState<DiaryMeal[]>([]);
  const [calories, setCalories] = useState(0);
  const [macrosTotal, setMacrosTotal] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [macrosTarget, setMacrosTarget] = useState({ protein: 100, carbs: 100, fat: 100 });
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [expanded, setExpanded] = useState<MealCategory | null>('lunch');
  const [modalMeal, setModalMeal] = useState<DiaryMeal | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DiaryMeal | null>(null);
  const [repeatMeal, setRepeatMeal] = useState<DiaryMeal | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [shortcuts, setShortcuts] = useState<DiaryMeal[]>([]);
  const [recipes, setRecipes] = useState<PersonalRecipe[]>([]);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeYield, setRecipeYield] = useState('1');
  const [recipeYieldLabel, setRecipeYieldLabel] = useState(() => t('servings').toLowerCase());
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);

  const applyMeals = (dayMeals: DiaryMeal[]) => {
    setMeals(dayMeals);
    const totals = dayMeals.reduce((sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    setCalories(totals.calories);
    setMacrosTotal({
      protein: Number(totals.protein.toFixed(1)),
      carbs: Number(totals.carbs.toFixed(1)),
      fat: Number(totals.fat.toFixed(1)),
    });
  };

  const applyTargets = (profile: GoalProfile | null) => {
    if (!profile) return;
    setDailyLimit(profile.calorieGoal ?? 2000);
    setMacrosTarget({
      protein: profile.proteinGoalG ?? 100,
      carbs: profile.carbsGoalG ?? 100,
      fat: profile.fatGoalG ?? 100,
    });
  };

  const loadAll = async (date: string) => {
    if (!user) return applyMeals([]);

    const [cachedMeals, cachedGoals] = await Promise.all([
      readCachedDiaryDay(user.id, date),
      readCachedGoalProfile(user.id),
    ]);
    applyMeals(cachedMeals);
    applyTargets(cachedGoals);
    try {
      const [remoteMeals, remoteShortcuts, remoteRecipes, remoteGoals] = await Promise.all([
        syncDiaryDay(user.id, date),
        listDiaryShortcuts(user.id),
        listPersonalRecipes(user.id),
        syncGoalProfile(user.id),
      ]);
      applyMeals(remoteMeals);
      setShortcuts(remoteShortcuts);
      setRecipes(remoteRecipes);
      applyTargets(remoteGoals);
    } catch {
      // Cached data remains usable while the connection is unavailable.
    }
  };

  useFocusEffect(useCallback(() => {
    loadAll(selectedDate);
  }, [selectedDate, user?.id]));

  const updateMealCategory = async (meal: DiaryMeal, newCategory: MealCategory) => {
    if (!user) return;
    try {
      await updateDiaryMealCategory(user.id, meal.id, newCategory);
      setModalMeal(null);
      await loadAll(selectedDate);
    } catch {
      Alert.alert(t('move_meal_error'), t('connection_retry'));
    }
  };

  const deleteMeal = async (meal: DiaryMeal) => {
    if (!user) return;
    try {
      await deleteDiaryMeal(user.id, meal.id);
      setDeleteCandidate(null);
      setModalMeal(null);
      await loadAll(selectedDate);
    } catch {
      Alert.alert(t('delete_meal_error'), t('connection_retry'));
    }
  };

  const confirmDeleteMeal = (meal: DiaryMeal) => {
    setDeleteCandidate(meal);
  };

  const closeMealModal = () => {
    if (deleteCandidate) return setDeleteCandidate(null);
    setModalMeal(null);
  };

  const toggleFavorite = async (meal: DiaryMeal) => {
    if (!user) return;
    const nextFavorite = !meal.isFavorite;
    try {
      await updateDiaryMealFavorite(user.id, meal.id, nextFavorite);
      setModalMeal({ ...meal, isFavorite: nextFavorite });
      await loadAll(selectedDate);
    } catch {
      Alert.alert(t('favorite_update_error'), t('connection_retry'));
    }
  };

  const repeatSelectedMeal = (meal: DiaryMeal) => {
    if (meal.items.length === 0) {
      return Alert.alert(t('legacy_meal_title'), t('legacy_repeat_body'));
    }
    setEditingMealId(null);
    setRepeatMeal(meal);
    setModalMeal(null);
    setShowAddFoodModal(true);
  };

  const editSelectedMeal = (meal: DiaryMeal) => {
    if (meal.items.length === 0) {
      return Alert.alert(t('legacy_meal_title'), t('legacy_edit_body'));
    }
    setEditingMealId(meal.id);
    setRepeatMeal(meal);
    setModalMeal(null);
    setShowAddFoodModal(true);
  };

  const openRecipeForm = (meal: DiaryMeal) => {
    setRecipeName(meal.name.slice(0, 100));
    setRecipeYield('1');
    setRecipeYieldLabel(t('servings').toLowerCase());
    setShowRecipeForm(true);
  };

  const saveRecipe = async (meal: DiaryMeal) => {
    if (!user) return;
    const parsedYield = Number(recipeYield.replace(',', '.'));
    if (!recipeName.trim() || !recipeYieldLabel.trim() || !Number.isFinite(parsedYield) || parsedYield <= 0 || parsedYield > 1000) {
      return Alert.alert(t('recipe_review_title'), t('recipe_details_invalid'));
    }
    setSavingRecipe(true);
    try {
      await createPersonalRecipeFromMeal(user.id, meal, recipeName.trim(), parsedYield, recipeYieldLabel.trim());
      setRecipes(await listPersonalRecipes(user.id));
      setShowRecipeForm(false);
      Alert.alert(t('recipe_saved_title'), t('recipe_saved_body'));
    } catch {
      Alert.alert(t('save_personal_recipe_error'), t('connection_retry'));
    } finally {
      setSavingRecipe(false);
    }
  };

  const remStyle = (rem: number) => ({
    color: rem < 0 ? '#FF6B6B' : '#00C896'
  });

  return (
    <View style={[styles.wrap, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CalendarWeek onSelectDate={setSelectedDate} />
        <CalorieBar current={calories} limit={dailyLimit} />
        <View style={styles.macros}>
          {(['protein', 'carbs', 'fat'] as const).map((m) => {
            const rem = macrosTarget[m] - macrosTotal[m];
            return (
              <View key={m} style={styles.mcol}>
                <MacroCircle
                  label={t(m === 'fat' ? 'fats' : m)}
                  value={macrosTotal[m]}
                  goal={macrosTarget[m]}
                  color={m === 'protein' ? '#7C5CFC' : m === 'carbs' ? '#FFB020' : '#00C896'}
                />
                <Text style={[styles.rem, remStyle(rem)]}>
                  {rem < 0 ? t('over') : t('left')}: {Math.abs(rem).toFixed(1)} g
                </Text>
              </View>
            );
          })}
        </View>

        {categories.map((cat) => (
          <View key={cat}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ expanded: expanded === cat }}
              onPress={() => setExpanded(expanded === cat ? null : cat)}
            >
              <Text style={[styles.sub, { color: textColor }]}>{t(cat)}</Text>
            </TouchableOpacity>

            {expanded === cat && meals
              .filter(meal => meal.category === cat)
              .map((meal) => (
                <TouchableOpacity accessibilityRole="button" key={meal.id} onPress={() => { setShowRecipeForm(false); setDeleteCandidate(null); setModalMeal(meal); }}>
                  <View style={[styles.card, { backgroundColor: cardColor, borderColor, borderWidth: 1 }]}>
                    {meal.image && (
                      <Image source={{ uri: meal.image }} style={styles.image} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mealName, { color: textColor }]}>{meal.name}</Text>
                      <Text style={[styles.mealDetail, { color: mutedColor }]}>
                        {Math.round(meal.calories)} kcal • {meal.protein.toFixed(1)}g {t('protein')} • {meal.fat.toFixed(1)}g {t('fats')}
                      </Text>
                      <Text style={[styles.timestamp, { color: isDarkMode ? '#82968F' : '#999' }]}>
                        {meal.timestamp ? `${t('loggedAt')} ${new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={t('add_food')}
        onPress={() => { setRepeatMeal(null); setEditingMealId(null); setShowAddFoodModal(true); }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddFoodModal
        visible={showAddFoodModal}
        onClose={() => { setShowAddFoodModal(false); setRepeatMeal(null); setEditingMealId(null); }}
        onSaved={() => loadAll(selectedDate)}
        shortcuts={shortcuts}
        recipes={recipes}
        initialMeal={repeatMeal}
        editingMealId={editingMealId}
        date={selectedDate}
      />

      <Modal visible={!!modalMeal} transparent animationType="fade" onRequestClose={closeMealModal} accessibilityViewIsModal>
        <View style={styles.modalOverlay}>
          {modalMeal && (
            <View style={[styles.modalBox, { backgroundColor: cardColor, borderColor }]}>
              {deleteCandidate?.id === modalMeal.id ? (
                <View style={styles.confirmDelete} accessibilityLiveRegion="polite">
                  <View style={[styles.confirmIcon, { backgroundColor: isDarkMode ? '#3A211F' : '#FCEDEA' }]}>
                    <Text style={styles.confirmIconText}>🗑️</Text>
                  </View>
                  <Text style={[styles.confirmTitle, { color: textColor }]}>{t('delete_meal_title')}</Text>
                  <Text style={[styles.confirmBody, { color: mutedColor }]}>{t('delete_meal_body')}</Text>
                  <TouchableOpacity accessibilityRole="button" style={styles.confirmDeleteButton} onPress={() => void deleteMeal(modalMeal)}>
                    <Text style={styles.confirmDeleteText}>{t('delete')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" style={[styles.confirmCancelButton, { borderColor }]} onPress={() => setDeleteCandidate(null)}>
                    <Text style={[styles.confirmCancelText, { color: textColor }]}>{t('cancel')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>{modalMeal.name}</Text>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('favorite')} style={[styles.favoriteButton, { backgroundColor: softSurface }]} onPress={() => toggleFavorite(modalMeal)}>
                    <Text style={styles.favoriteText}>{modalMeal.isFavorite ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalTotals, { color: mutedColor }]}>{Math.round(modalMeal.calories)} kcal · {t('protein').charAt(0)} {modalMeal.protein.toFixed(1)} · {t('carbs').charAt(0)} {modalMeal.carbs.toFixed(1)} · {t('fats').charAt(0)} {modalMeal.fat.toFixed(1)}</Text>

                <Text style={[styles.modalSubtitle, { color: textColor }]}>{t('foods')}</Text>
                {modalMeal.items.length > 0 ? modalMeal.items.map((item) => (
                  <View key={item.id} style={[styles.itemRow, { borderBottomColor: borderColor }]}>
                    <View style={styles.itemCopy}>
                      <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
                      <Text style={[styles.itemAmount, { color: mutedColor }]}>{item.quantity} {item.unit === 'tbsp' ? t('tbsp_short') : item.unit}</Text>
                    </View>
                    <Text style={[styles.itemCalories, { color: textColor }]}>{Math.round(item.calories)} kcal</Text>
                  </View>
                )) : <Text style={[styles.legacyNotice, { color: mutedColor, backgroundColor: softSurface }]}>{t('legacy_meal_notice')}</Text>}

                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.editButton, modalMeal.items.length === 0 && styles.disabledButton]}
                  disabled={modalMeal.items.length === 0}
                  onPress={() => editSelectedMeal(modalMeal)}>
                  <Text style={styles.editText}>{t('edit_this_meal')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.repeatButton, modalMeal.items.length === 0 && styles.disabledButton]}
                  disabled={modalMeal.items.length === 0}
                  onPress={() => repeatSelectedMeal(modalMeal)}>
                  <Text style={styles.repeatText}>{t('repeat_adjust')}</Text>
                </TouchableOpacity>

                {modalMeal.items.length > 0 && (!showRecipeForm ? (
                  <TouchableOpacity accessibilityRole="button" style={[styles.recipeButton, { backgroundColor: softSurface }]} onPress={() => openRecipeForm(modalMeal)}>
                    <Text style={[styles.recipeButtonText, { color: textColor }]}>{t('save_as_personal_recipe')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.recipeForm, { backgroundColor: inputSurface, borderColor }]}>
                    <Text style={[styles.modalSubtitle, { color: textColor }]}>{t('new_recipe')}</Text>
                    <Text style={[styles.fieldLabel, { color: mutedColor }]}>{t('name')}</Text>
                    <TextInput style={[styles.fieldInput, { backgroundColor: cardColor, borderColor, color: textColor }]} value={recipeName} onChangeText={setRecipeName} maxLength={100} placeholder={t('recipe_name_example')} placeholderTextColor={mutedColor} />
                    <Text style={[styles.fieldLabel, { color: mutedColor }]}>{t('total_yield')}</Text>
                    <View style={styles.recipeYieldRow}>
                      <TextInput style={[styles.fieldInput, styles.yieldNumber, { backgroundColor: cardColor, borderColor, color: textColor }]} value={recipeYield} onChangeText={setRecipeYield} keyboardType="decimal-pad" selectTextOnFocus />
                      <TextInput style={[styles.fieldInput, styles.yieldLabel, { backgroundColor: cardColor, borderColor, color: textColor }]} value={recipeYieldLabel} onChangeText={setRecipeYieldLabel} maxLength={30} placeholder={t('servings').toLowerCase()} placeholderTextColor={mutedColor} />
                    </View>
                    <TouchableOpacity style={styles.saveRecipeButton} onPress={() => saveRecipe(modalMeal)} disabled={savingRecipe}>
                      {savingRecipe ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveRecipeText}>{t('save_recipe')}</Text>}
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.modalSubtitle, { color: textColor }]}>{t('change_meal_time')}</Text>
                <View style={styles.categoryRow}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: modalMeal.category === cat }}
                      style={[styles.categoryChip, { backgroundColor: cardColor, borderColor }, modalMeal.category === cat && styles.categoryChipSelected]}
                      onPress={() => updateMealCategory(modalMeal, cat)}>
                      <Text style={[styles.categoryChipText, { color: mutedColor }, modalMeal.category === cat && styles.categoryChipTextSelected]}>{t(cat)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity accessibilityRole="button" style={styles.deleteButton} onPress={() => confirmDeleteMeal(modalMeal)}>
                  <Text style={styles.deleteText}>🗑️ {t('delete')}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" style={styles.modalClose} onPress={() => setModalMeal(null)}>
                  <Text style={{ color: textColor }}>{t('cancel')}</Text>
                </TouchableOpacity>
              </ScrollView>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { padding: 20, flexGrow: 0.1 },
  macros: { flexDirection: 'row', justifyContent: 'space-between' },
  mcol: { alignItems: 'center', flex: 1 },
  rem: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  sub: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8, textTransform: 'capitalize' },
  card: { flexDirection: 'row', gap: 12, padding: 12, marginBottom: 10, borderRadius: 8 },
  mealName: { fontSize: 16, fontWeight: 'bold' },
  mealDetail: { fontSize: 14, color: '#666' },
  timestamp: { fontSize: 12, color: '#999' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#00C896', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 32 },
  image: { width: 60, height: 60, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { padding: 22, borderRadius: 22, width: '90%', maxWidth: 560, maxHeight: '86%', elevation: 6, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalTitle: { flex: 1, color: '#173C32', fontSize: 20, fontWeight: '900' },
  favoriteButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4EFEB' },
  favoriteText: { color: '#00A77D', fontSize: 25 },
  modalTotals: { color: '#557068', marginTop: 8, marginBottom: 18 },
  modalSubtitle: { color: '#173C32', fontWeight: '900', marginTop: 14, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#DDEAE5' },
  itemCopy: { flex: 1 },
  itemName: { color: '#173C32', fontWeight: '700' },
  itemAmount: { color: '#6A7F78', fontSize: 12, marginTop: 3 },
  itemCalories: { color: '#35584E', fontWeight: '800' },
  legacyNotice: { color: '#6A7F78', backgroundColor: '#E8F6F1', borderRadius: 12, padding: 12 },
  editButton: { height: 48, borderRadius: 24, marginTop: 18, borderWidth: 2, borderColor: '#00A77D', backgroundColor: '#E7F7F2', alignItems: 'center', justifyContent: 'center' },
  editText: { color: '#008F6D', fontSize: 15, fontWeight: '900' },
  repeatButton: { height: 50, borderRadius: 25, marginTop: 9, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center' },
  repeatText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  recipeButton: { minHeight: 46, borderRadius: 23, marginTop: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E4EFEB' },
  recipeButtonText: { color: '#245044', fontWeight: '900' },
  recipeForm: { marginTop: 12, borderRadius: 16, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDEAE5' },
  fieldLabel: { color: '#557068', fontSize: 12, fontWeight: '800', marginBottom: 5, marginTop: 7 },
  fieldInput: { minHeight: 44, borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#F9FCFB', color: '#173C32' },
  recipeYieldRow: { flexDirection: 'row', gap: 8 },
  yieldNumber: { width: 82 },
  yieldLabel: { flex: 1 },
  saveRecipeButton: { height: 46, borderRadius: 23, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  saveRecipeText: { color: '#fff', fontWeight: '900' },
  disabledButton: { opacity: 0.45 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryChip: { borderRadius: 18, borderWidth: 1, borderColor: '#C9DDD6', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#fff' },
  categoryChipSelected: { borderColor: '#00A77D', backgroundColor: '#E2F7F0' },
  categoryChipText: { color: '#557068', fontWeight: '700' },
  categoryChipTextSelected: { color: '#008F6D' },
  deleteButton: { paddingVertical: 13, alignItems: 'center', marginTop: 15 },
  deleteText: { color: '#C23B32', fontWeight: '800' },
  modalClose: { paddingVertical: 12, alignItems: 'center' },
  confirmDelete: { alignItems: 'center', paddingVertical: 10 },
  confirmIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmIconText: { fontSize: 27 },
  confirmTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center' },
  confirmBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 9, marginBottom: 20, maxWidth: 380 },
  confirmDeleteButton: { width: '100%', minHeight: 50, borderRadius: 25, backgroundColor: '#C23B32', alignItems: 'center', justifyContent: 'center' },
  confirmDeleteText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  confirmCancelButton: { width: '100%', minHeight: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  confirmCancelText: { fontSize: 15, fontWeight: '800' },
});
