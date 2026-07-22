import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { type FoodSearchResult, searchFoods } from '@/lib/catalog';
import {
  createDiaryClientEventId,
  createDiaryMeal,
  diaryTimestampForDate,
  diaryMealToInputs,
  type DiaryFoodInput,
  type DiaryMeal,
  type MealCategory,
  updateDiaryMeal,
} from '@/lib/diary';
import { inferPortionUnit, type PortionUnit } from '@/lib/portions';
import {
  deletePersonalRecipe,
  personalRecipeToInputs,
  type PersonalRecipe,
  updatePersonalRecipe,
} from '@/lib/recipes';

type DraftFood = DiaryFoodInput & { draftId: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  shortcuts?: DiaryMeal[];
  initialMeal?: DiaryMeal | null;
  editingMealId?: string | null;
  recipes?: PersonalRecipe[];
  date?: string;
};

const categories: MealCategory[] = ['breakfast', 'lunch', 'snack', 'dinner'];

const units: Array<{ value: PortionUnit; translationKey: 'grams' | 'milliliters' | 'tablespoons' }> = [
  { value: 'g', translationKey: 'grams' },
  { value: 'ml', translationKey: 'milliliters' },
  { value: 'tbsp', translationKey: 'tablespoons' },
];

function defaultQuantity(food: FoodSearchResult, unit: PortionUnit) {
  if (unit === 'ml') return 250;
  if (unit === 'tbsp') return 1;
  return Number(food.default_portion_g ?? 100);
}

function equivalentGrams(quantity: number, unit: PortionUnit) {
  return unit === 'tbsp' ? quantity * 15 : quantity;
}

function calculateDraft(food: FoodSearchResult, quantity: number, unit: PortionUnit, draftId: string): DraftFood {
  const grams = equivalentGrams(quantity, unit);
  const factor = grams / 100;
  return {
    draftId,
    food,
    quantity,
    unit,
    grams,
    calories: Number(food.energy_kcal ?? 0) * factor,
    protein: Number(food.protein_g ?? 0) * factor,
    carbs: Number(food.carbohydrate_g ?? 0) * factor,
    fat: Number(food.fat_g ?? 0) * factor,
  };
}

function formattedQuantity(quantity: number) {
  return Number.isInteger(quantity) ? quantity.toFixed(0) : quantity.toFixed(1);
}

function parseDecimal(value: string) {
  return Number(value.replace(',', '.'));
}

function mealDrafts(meal: DiaryMeal): DraftFood[] {
  return diaryMealToInputs(meal).map((item, index) => ({
    ...item,
    draftId: `repeat-${meal.id}-${meal.items[index]?.id || index}`,
  }));
}

export default function AddFoodModal({
  visible,
  onClose,
  onSaved,
  shortcuts = [],
  initialMeal = null,
  editingMealId = null,
  recipes = [],
  date,
}: Props) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isDarkMode, textColor, borderColor } = useAppTheme();
  const sheetColor = isDarkMode ? '#0B1F18' : '#F6FAF8';
  const surfaceColor = isDarkMode ? '#153128' : '#FFFFFF';
  const softColor = isDarkMode ? '#203C33' : '#E4EFEB';
  const mutedColor = isDarkMode ? '#A7BBB4' : '#5B746C';
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<PersonalRecipe | null>(null);
  const [recipeQuantity, setRecipeQuantity] = useState('1');
  const [editingRecipe, setEditingRecipe] = useState<PersonalRecipe | null>(null);
  const [recipeDeleteCandidate, setRecipeDeleteCandidate] = useState<PersonalRecipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState(false);
  const [recipeEditName, setRecipeEditName] = useState('');
  const [recipeEditYield, setRecipeEditYield] = useState('1');
  const [recipeEditLabel, setRecipeEditLabel] = useState(() => t('servings').toLowerCase());
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [unit, setUnit] = useState<PortionUnit>('g');
  const [quantity, setQuantity] = useState('100');
  const [category, setCategory] = useState<MealCategory>('lunch');
  const [drafts, setDrafts] = useState<DraftFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveEventId, setSaveEventId] = useState(createDiaryClientEventId);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSavedMeal = (meal: DiaryMeal) => {
    setDrafts(mealDrafts(meal));
    setCategory(meal.category);
    setSelectedFood(null);
    setSelectedRecipe(null);
    setRecipeQuantity('1');
    setEditingRecipe(null);
    setRecipeEditName('');
    setRecipeEditYield('1');
    setRecipeEditLabel(t('servings').toLowerCase());
    setEditingDraftId(null);
    setQuery('');
    setResults([]);
    setSearched(false);
    setError(null);
  };

  useEffect(() => {
    if (visible && initialMeal?.items.length) loadSavedMeal(initialMeal);
  }, [initialMeal?.id, visible]);

  useEffect(() => {
    if (!visible || selectedFood) return;
    const term = query.trim();
    if (term.length < 3) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const foods = await searchFoods(term);
        if (!cancelled) {
          setResults(foods);
          setSearched(true);
        }
      } catch {
        if (!cancelled) setError(t('food_search_unavailable'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, selectedFood, t, visible]);

  const numericQuantity = Math.max(Number(quantity.replace(',', '.')) || 0, 0);
  const numericRecipeQuantity = Math.max(parseDecimal(recipeQuantity) || 0, 0);
  const currentDraft = selectedFood
    ? calculateDraft(selectedFood, numericQuantity, unit, editingDraftId ?? 'preview')
    : null;

  const totals = useMemo(() => drafts.reduce((sum, item) => ({
    calories: sum.calories + item.calories,
    protein: sum.protein + item.protein,
    carbs: sum.carbs + item.carbs,
    fat: sum.fat + item.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [drafts]);
  const selectedDateLabel = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  const reset = () => {
    setQuery('');
    setResults([]);
    setSelectedFood(null);
    setSelectedRecipe(null);
    setRecipeQuantity('1');
    setEditingRecipe(null);
    setRecipeDeleteCandidate(null);
    setDeletingRecipe(false);
    setRecipeEditName('');
    setRecipeEditYield('1');
    setRecipeEditLabel(t('servings').toLowerCase());
    setEditingDraftId(null);
    setUnit('g');
    setQuantity('100');
    setDrafts([]);
    setCategory('lunch');
    setSaveEventId(createDiaryClientEventId());
    setSearched(false);
    setError(null);
  };

  const close = () => {
    if (saving || deletingRecipe) return;
    reset();
    onClose();
  };

  const chooseFood = (food: FoodSearchResult) => {
    const inferredUnit = inferPortionUnit(food);
    setSelectedFood(food);
    setEditingDraftId(null);
    setUnit(inferredUnit);
    setQuantity(String(defaultQuantity(food, inferredUnit)));
    setError(null);
  };

  const chooseRecipe = (recipe: PersonalRecipe) => {
    setSelectedRecipe(recipe);
    setRecipeQuantity('1');
    setError(null);
  };

  const beginRecipeEdit = (recipe: PersonalRecipe) => {
    const fullRecipe = personalRecipeToInputs(recipe, recipe.yieldQuantity).map((item, index) => ({
      ...item,
      draftId: `edit-recipe-${recipe.id}-${recipe.items[index]?.id || index}`,
    }));
    setEditingRecipe(recipe);
    setSelectedRecipe(null);
    setSelectedFood(null);
    setEditingDraftId(null);
    setRecipeEditName(recipe.name);
    setRecipeEditYield(String(recipe.yieldQuantity));
    setRecipeEditLabel(recipe.yieldLabel);
    setDrafts(fullRecipe);
    setCategory(recipe.category);
    setQuery('');
    setResults([]);
    setError(null);
  };

  const confirmDeleteRecipe = (recipe: PersonalRecipe) => {
    if (user) setRecipeDeleteCandidate(recipe);
  };

  const deleteRecipe = async () => {
    if (!user || !recipeDeleteCandidate || deletingRecipe) return;
    setDeletingRecipe(true);
    setError(null);
    try {
      await deletePersonalRecipe(user.id, recipeDeleteCandidate.id);
      setRecipeDeleteCandidate(null);
      await onSaved();
    } catch {
      setError(t('delete_recipe_error'));
    } finally {
      setDeletingRecipe(false);
    }
  };

  const stageRecipe = () => {
    if (!selectedRecipe) return;
    const consumed = parseDecimal(recipeQuantity);
    if (!Number.isFinite(consumed) || consumed <= 0 || consumed > selectedRecipe.yieldQuantity) {
      return setError(t('recipe_quantity_range', { max: selectedRecipe.yieldQuantity }));
    }
    const recipeDrafts = personalRecipeToInputs(selectedRecipe, consumed).map((item, index) => ({
      ...item,
      draftId: `recipe-${selectedRecipe.id}-${Date.now()}-${index}`,
    }));
    setDrafts((current) => [...current, ...recipeDrafts]);
    setCategory(selectedRecipe.category);
    setSelectedRecipe(null);
    setRecipeQuantity('1');
    setError(null);
  };

  const editDraft = (draft: DraftFood) => {
    setSelectedFood(draft.food);
    setEditingDraftId(draft.draftId);
    setUnit(draft.unit as PortionUnit);
    setQuantity(String(draft.quantity));
    setError(null);
  };

  const changeUnit = (nextUnit: PortionUnit) => {
    if (!selectedFood) return;
    setUnit(nextUnit);
    setQuantity(String(defaultQuantity(selectedFood, nextUnit)));
  };

  const adjustQuantity = (delta: number) => {
    const minimum = unit === 'tbsp' ? 0.5 : 1;
    setQuantity(String(Number(Math.max(minimum, numericQuantity + delta).toFixed(1))));
  };

  const stageFood = () => {
    if (!selectedFood || !currentDraft) return;
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0 || currentDraft.grams > 5000) {
      return setError(t('portion_quantity_invalid'));
    }

    const staged = calculateDraft(
      selectedFood,
      numericQuantity,
      unit,
      editingDraftId ?? `${Date.now()}-${Math.random()}`,
    );
    setDrafts((current) => editingDraftId
      ? current.map((item) => item.draftId === editingDraftId ? staged : item)
      : [...current, staged]);
    setSelectedFood(null);
    setEditingDraftId(null);
    setQuery('');
    setResults([]);
    setError(null);
  };

  const adjustDraft = (draft: DraftFood, direction: -1 | 1) => {
    const step = draft.unit === 'tbsp' ? 0.5 : 50;
    const minimum = draft.unit === 'tbsp' ? 0.5 : 1;
    const nextQuantity = Math.max(minimum, draft.quantity + step * direction);
    setDrafts((current) => current.map((item) => item.draftId === draft.draftId
      ? calculateDraft(item.food, nextQuantity, item.unit as PortionUnit, item.draftId)
      : item));
  };

  const saveMeal = async () => {
    if (!user) return setError(t('meal_login_required'));
    if (drafts.length === 0) return setError(t('preliminary_list_empty'));

    setSaving(true);
    setError(null);
    try {
      if (editingRecipe) {
        const parsedYield = Number(recipeEditYield.replace(',', '.'));
        if (!recipeEditName.trim() || !recipeEditLabel.trim() || !Number.isFinite(parsedYield) || parsedYield <= 0 || parsedYield > 1000) {
          setSaving(false);
          return setError(t('recipe_details_invalid'));
        }
        await updatePersonalRecipe(
          user.id,
          editingRecipe.id,
          recipeEditName.trim(),
          category,
          parsedYield,
          recipeEditLabel.trim(),
          drafts,
        );
      } else if (editingMealId) {
        await updateDiaryMeal(user.id, editingMealId, drafts, category);
      } else {
        await createDiaryMeal(
          user.id,
          drafts,
          category,
          saveEventId,
          date ? diaryTimestampForDate(date) : undefined,
        );
      }
      reset();
      onClose();
      await onSaved();
    } catch {
      setError(t(editingRecipe ? 'update_recipe_error' : editingMealId ? 'update_meal_error' : 'save_meal_error'));
    } finally {
      setSaving(false);
    }
  };

  const quickSteps = unit === 'tbsp' ? [-1, -0.5, 0.5, 1] : [-50, -1, 1, 50];
  const unitSuffix = unit === 'tbsp' ? t('tbsp_short') : unit;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} accessibilityViewIsModal>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: sheetColor }]}>
          <View style={[styles.handle, { backgroundColor: borderColor }]} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={[styles.title, { color: textColor }]}>{t(selectedFood ? 'define_portion' : editingRecipe ? 'edit_recipe' : editingMealId ? 'edit_meal' : 'build_meal')}</Text>
                <Text style={[styles.subtitle, { color: mutedColor }]}>{t(selectedFood ? 'define_portion_hint' : editingRecipe ? 'edit_recipe_hint' : editingMealId ? 'edit_meal_hint' : 'build_meal_hint')}</Text>
                {selectedDateLabel && !editingMealId && !editingRecipe && (
                  <Text style={[styles.dateContext, { color: textColor }]}>{t('saving_for_date', { date: selectedDateLabel })}</Text>
                )}
              </View>
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: softColor }]} onPress={close} accessibilityRole="button" accessibilityLabel={t('cancel')} hitSlop={8}>
                <Text style={[styles.closeText, { color: textColor }]}>×</Text>
              </TouchableOpacity>
            </View>

            {recipeDeleteCandidate ? (
              <View style={styles.recipeDeleteConfirm} accessibilityLiveRegion="polite">
                <View style={[styles.recipeDeleteIcon, { backgroundColor: isDarkMode ? '#3A211F' : '#FCEDEA' }]}><Text style={styles.recipeDeleteIconText}>🗑️</Text></View>
                <Text style={[styles.recipeDeleteTitle, { color: textColor }]}>{t('delete_recipe_title')}</Text>
                <Text style={[styles.recipeDeleteBody, { color: mutedColor }]}>{t('delete_recipe_body', { name: recipeDeleteCandidate.name })}</Text>
                {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
                <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: deletingRecipe, busy: deletingRecipe }} style={[styles.recipeDeleteButton, deletingRecipe && styles.disabled]} onPress={() => void deleteRecipe()} disabled={deletingRecipe}>
                  {deletingRecipe ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.recipeDeleteButtonText}>{t('delete')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" style={[styles.recipeDeleteCancel, { borderColor }]} onPress={() => { setRecipeDeleteCandidate(null); setError(null); }} disabled={deletingRecipe}>
                  <Text style={[styles.recipeDeleteCancelText, { color: textColor }]}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            ) : selectedFood && currentDraft ? (
              <>
                <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={() => { setSelectedFood(null); setEditingDraftId(null); }}>
                  <Text style={styles.back}>‹ {t('back_to_meal')}</Text>
                </TouchableOpacity>
                <Text style={[styles.foodTitle, { color: textColor }]}>{selectedFood.display_name}</Text>

                <Text style={[styles.label, { color: mutedColor }]}>{t('unit')}</Text>
                <View style={styles.selectorRow}>
                  {units.map((item) => (
                    <TouchableOpacity key={item.value} accessibilityRole="radio" accessibilityState={{ selected: unit === item.value }} style={[styles.unitButton, { backgroundColor: surfaceColor, borderColor }, unit === item.value && styles.selected]} onPress={() => changeUnit(item.value)}>
                      <Text style={[styles.selectorText, { color: mutedColor }, unit === item.value && styles.selectedText]}>{t(item.translationKey)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: mutedColor }]}>{t('amount')}</Text>
                <View style={[styles.quantityRow, { backgroundColor: surfaceColor, borderColor }]}>
                  <TextInput accessibilityLabel={t('amount')} style={[styles.quantityInput, { color: textColor }]} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" selectTextOnFocus />
                  <Text style={[styles.quantityUnit, { color: mutedColor }]}>{unitSuffix}</Text>
                </View>
                <View style={styles.steps}>
                  {quickSteps.map((step) => (
                    <TouchableOpacity key={step} accessibilityRole="button" accessibilityLabel={`${step > 0 ? '+' : ''}${step} ${unitSuffix}`} style={[styles.stepButton, { backgroundColor: softColor }]} onPress={() => adjustQuantity(step)}>
                      <Text style={[styles.stepText, { color: textColor }]}>{step > 0 ? '+' : ''}{step} {unitSuffix}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {unit !== 'g' && <Text style={[styles.equivalence, { color: mutedColor }]}>{t('equivalence_used')}: {currentDraft.grams.toFixed(1)} g</Text>}

                <View style={styles.macroCard}>
                  <Text style={styles.calories}>{Math.round(currentDraft.calories)} kcal</Text>
                  <Text style={styles.macroText}>P {currentDraft.protein.toFixed(1)} g · C {currentDraft.carbs.toFixed(1)} g · G {currentDraft.fat.toFixed(1)} g</Text>
                </View>
                {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
                <TouchableOpacity accessibilityRole="button" style={styles.stageButton} onPress={stageFood}>
                  <Text style={styles.stageText}>{editingDraftId ? t('update_food') : `+ ${t('add_to_meal')}`}</Text>
                </TouchableOpacity>
              </>
            ) : selectedRecipe ? (
              <>
                <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={() => setSelectedRecipe(null)}>
                  <Text style={styles.back}>‹ {t('back_to_meal')}</Text>
                </TouchableOpacity>
                <Text style={[styles.foodTitle, { color: textColor }]}>{selectedRecipe.name}</Text>
                <Text style={[styles.recipeYield, { color: mutedColor }]}>{t('recipe_yield_message', { amount: selectedRecipe.yieldQuantity, unit: selectedRecipe.yieldLabel })}</Text>

                <Text style={[styles.label, { color: mutedColor }]}>{t('consumed_amount')}</Text>
                <View style={[styles.quantityRow, { backgroundColor: surfaceColor, borderColor }]}>
                  <TextInput accessibilityLabel={t('consumed_amount')} style={[styles.quantityInput, { color: textColor }]} value={recipeQuantity} onChangeText={setRecipeQuantity} keyboardType="decimal-pad" selectTextOnFocus />
                  <Text style={[styles.quantityUnit, { color: mutedColor }]}>{selectedRecipe.yieldLabel}</Text>
                </View>
                <View style={styles.steps}>
                  <TouchableOpacity accessibilityRole="button" style={[styles.stepButton, { backgroundColor: softColor }]} onPress={() => setRecipeQuantity(String(Math.max(0.1, (numericRecipeQuantity || 1) - 1)))}><Text style={[styles.stepText, { color: textColor }]}>−1</Text></TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" style={[styles.stepButton, { backgroundColor: softColor }]} onPress={() => setRecipeQuantity('1')}><Text style={[styles.stepText, { color: textColor }]}>1</Text></TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" style={[styles.stepButton, { backgroundColor: softColor }]} onPress={() => setRecipeQuantity(String(Math.min(selectedRecipe.yieldQuantity, numericRecipeQuantity + 1)))}><Text style={[styles.stepText, { color: textColor }]}>+1</Text></TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" style={[styles.stepButton, { backgroundColor: softColor }]} onPress={() => setRecipeQuantity(String(selectedRecipe.yieldQuantity))}><Text style={[styles.stepText, { color: textColor }]}>{t('all')}</Text></TouchableOpacity>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.calories}>{Math.round(selectedRecipe.calories * (numericRecipeQuantity / selectedRecipe.yieldQuantity))} kcal</Text>
                  <Text style={styles.macroText}>P {(selectedRecipe.protein * (numericRecipeQuantity / selectedRecipe.yieldQuantity)).toFixed(1)} g · C {(selectedRecipe.carbs * (numericRecipeQuantity / selectedRecipe.yieldQuantity)).toFixed(1)} g · G {(selectedRecipe.fat * (numericRecipeQuantity / selectedRecipe.yieldQuantity)).toFixed(1)} g</Text>
                </View>
                {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
                <TouchableOpacity accessibilityRole="button" style={styles.stageButton} onPress={stageRecipe}>
                  <Text style={styles.stageText}>+ {t('add_recipe_to_meal')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {editingRecipe && (
                  <View style={styles.recipeEditor}>
                    <Text style={[styles.label, { color: mutedColor }]}>{t('recipe_details')}</Text>
                    <TextInput style={[styles.recipeInput, { backgroundColor: surfaceColor, borderColor, color: textColor }]} placeholderTextColor={mutedColor} value={recipeEditName} onChangeText={setRecipeEditName} maxLength={100} placeholder={t('name')} />
                    <View style={styles.recipeEditorRow}>
                      <TextInput style={[styles.recipeInput, styles.recipeYieldInput, { backgroundColor: surfaceColor, borderColor, color: textColor }]} value={recipeEditYield} onChangeText={setRecipeEditYield} keyboardType="decimal-pad" selectTextOnFocus />
                      <TextInput style={[styles.recipeInput, styles.recipeLabelInput, { backgroundColor: surfaceColor, borderColor, color: textColor }]} placeholderTextColor={mutedColor} value={recipeEditLabel} onChangeText={setRecipeEditLabel} maxLength={30} placeholder={t('servings').toLowerCase()} />
                    </View>
                  </View>
                )}
                {drafts.length > 0 && (
                  <View style={styles.draftSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: textColor }]}>{t('preliminary_list')}</Text>
                      <View style={styles.countBadge}><Text style={styles.countText}>{drafts.length}</Text></View>
                    </View>
                    {drafts.map((draft) => {
                      const suffix = draft.unit === 'tbsp' ? t('tbsp_short') : draft.unit;
                      return (
                        <View key={draft.draftId} style={[styles.draftCard, { backgroundColor: surfaceColor, borderColor }]}>
                          <TouchableOpacity accessibilityRole="button" style={styles.draftInfo} onPress={() => editDraft(draft)}>
                            <Text style={[styles.draftName, { color: textColor }]}>{draft.food.display_name}</Text>
                            <Text style={[styles.draftMacros, { color: mutedColor }]}>{Math.round(draft.calories)} kcal · P {draft.protein.toFixed(1)} · C {draft.carbs.toFixed(1)} · G {draft.fat.toFixed(1)}</Text>
                          </TouchableOpacity>
                          <View style={styles.draftControls}>
                            <TouchableOpacity accessibilityRole="button" style={[styles.roundButton, { backgroundColor: softColor }]} onPress={() => adjustDraft(draft, -1)}><Text style={[styles.roundText, { color: textColor }]}>−</Text></TouchableOpacity>
                            <Text style={[styles.draftQuantity, { color: textColor }]}>{formattedQuantity(draft.quantity)} {suffix}</Text>
                            <TouchableOpacity accessibilityRole="button" style={[styles.roundButton, { backgroundColor: softColor }]} onPress={() => adjustDraft(draft, 1)}><Text style={[styles.roundText, { color: textColor }]}>+</Text></TouchableOpacity>
                            <TouchableOpacity accessibilityRole="button" onPress={() => setDrafts((current) => current.filter((item) => item.draftId !== draft.draftId))}>
                              <Text style={styles.removeText}>{t('remove')}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                    <View style={styles.totalCard}>
                      <View><Text style={styles.totalLabel}>{t('preliminary_total').toUpperCase()}</Text><Text style={styles.totalCalories}>{Math.round(totals.calories)} kcal</Text></View>
                      <Text style={styles.totalMacros}>P {totals.protein.toFixed(1)} · C {totals.carbs.toFixed(1)} · G {totals.fat.toFixed(1)}</Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.label, { color: mutedColor }]}>{t(drafts.length ? 'add_another_food' : 'search_food')}</Text>
                <View style={[styles.searchBox, { backgroundColor: surfaceColor, borderColor }]}>
                  <TextInput
                    style={[styles.searchInput, { color: textColor }]}
                    value={query}
                    onChangeText={(text) => { setQuery(text); setError(null); }}
                    placeholder={t('search_three_letters')}
                    placeholderTextColor={mutedColor}
                    accessibilityLabel={t('search_food')}
                    returnKeyType="search"
                    autoFocus={drafts.length === 0 && shortcuts.length === 0 && recipes.length === 0}
                  />
                  {loading ? <ActivityIndicator color="#00A77D" /> : <Text style={styles.searchHint}>{query.trim().length}/3</Text>}
                </View>
                {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
                {drafts.length === 0 && query.trim().length < 3 && (recipes.length > 0 || shortcuts.length > 0) && (
                  <View style={styles.memorySection}>
                    {recipes.length > 0 && (
                      <>
                        <Text style={[styles.memoryTitle, { color: textColor }]}>{t('personal_recipes')}</Text>
                        <Text style={[styles.memorySubtitle, { color: mutedColor }]}>{t('recipe_consumption_hint')}</Text>
                        {recipes.map((recipe) => (
                          <View key={recipe.id} style={[styles.memoryCard, { backgroundColor: surfaceColor, borderColor }]}>
                            <TouchableOpacity accessibilityRole="button" style={styles.memoryCopy} onPress={() => chooseRecipe(recipe)}>
                              <Text style={[styles.memoryName, { color: textColor }]} numberOfLines={2}>{recipe.name}</Text>
                              <Text style={[styles.memoryMeta, { color: mutedColor }]}>{t('yields')} {recipe.yieldQuantity} {recipe.yieldLabel} · {Math.round(recipe.calories / recipe.yieldQuantity)} kcal {t('per_unit')}</Text>
                            </TouchableOpacity>
                            <View style={styles.recipeActions}>
                              <TouchableOpacity accessibilityRole="button" onPress={() => chooseRecipe(recipe)}><Text style={styles.memoryAction}>{t('use')}</Text></TouchableOpacity>
                              <TouchableOpacity accessibilityRole="button" onPress={() => beginRecipeEdit(recipe)}><Text style={[styles.recipeEditAction, { color: mutedColor }]}>{t('edit')}</Text></TouchableOpacity>
                              <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('delete')} onPress={() => confirmDeleteRecipe(recipe)}><Text style={styles.recipeDeleteAction}>×</Text></TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                    {shortcuts.length > 0 && <Text style={[styles.memoryTitle, { color: textColor }, recipes.length > 0 && styles.memoryTitleSpaced]}>{t('favorites_recent')}</Text>}
                    {shortcuts.length > 0 && <Text style={[styles.memorySubtitle, { color: mutedColor }]}>{t('reuse_complete_meal')}</Text>}
                    {shortcuts.map((meal) => (
                      <TouchableOpacity key={meal.id} style={[styles.memoryCard, { backgroundColor: surfaceColor, borderColor }]} onPress={() => loadSavedMeal(meal)}>
                        <View style={styles.memoryCopy}>
                          <Text style={[styles.memoryName, { color: textColor }]} numberOfLines={2}>{meal.isFavorite ? '★ ' : ''}{meal.name}</Text>
                          <Text style={[styles.memoryMeta, { color: mutedColor }]}>{meal.items.length} {t(meal.items.length === 1 ? 'food_item' : 'food_items')} · {Math.round(meal.calories)} kcal</Text>
                        </View>
                        <Text style={styles.memoryAction}>{t('use')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {!loading && searched && !error && results.length === 0 && <Text style={[styles.empty, { color: mutedColor, backgroundColor: softColor }]}>{t('food_not_found_search')}</Text>}
                <View style={styles.results}>
                  {results.map((food) => (
                    <TouchableOpacity key={food.id} style={[styles.foodCard, { backgroundColor: surfaceColor, borderColor }]} onPress={() => chooseFood(food)}>
                      <View style={styles.foodHeader}>
                        <Text style={[styles.foodName, { color: textColor }]}>{food.display_name}</Text>
                        <Text style={styles.addText}>{t('add')}</Text>
                      </View>
                      <Text style={[styles.foodMeta, { color: mutedColor }]}>{food.default_portion_g ?? 100} g {t('suggested').toLowerCase()}</Text>
                      <Text style={[styles.foodMacros, { color: mutedColor }]}>{Math.round(Number(food.energy_kcal ?? 0))} kcal · P {Number(food.protein_g ?? 0).toFixed(1)} · C {Number(food.carbohydrate_g ?? 0).toFixed(1)} · G {Number(food.fat_g ?? 0).toFixed(1)} {t('per_100g')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {drafts.length > 0 && (
                  <>
                    <Text style={[styles.label, { color: mutedColor }]}>{t('meal_time')}</Text>
                    <View style={styles.selectorRow}>
                      {categories.map((item) => (
                        <TouchableOpacity key={item} accessibilityRole="radio" accessibilityState={{ selected: category === item }} style={[styles.categoryButton, { backgroundColor: surfaceColor, borderColor }, category === item && styles.selected]} onPress={() => setCategory(item)}>
                          <Text style={[styles.selectorText, { color: mutedColor }, category === item && styles.selectedText]}>{t(item)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} style={[styles.saveButton, saving && styles.disabled]} onPress={saveMeal} disabled={saving}>
                      {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{t(editingRecipe ? 'update_recipe' : editingMealId ? 'update_meal' : 'save_complete_meal')}</Text>}
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.scanButton, { backgroundColor: softColor }]}
                  onPress={() => {
                    close();
                    router.push({ pathname: '/scan', params: { category } } as never);
                  }}
                >
                  <Text style={[styles.scanTitle, { color: textColor }]}>{t('scan_with_ai')}</Text>
                  <Text style={[styles.scanDescription, { color: mutedColor }]}>{t('scan_continue')}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10, 35, 29, 0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 720, maxHeight: '94%', backgroundColor: '#F6FAF8', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#C5D7D1', alignSelf: 'center', marginTop: 10 },
  content: { padding: 22, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: '#173C32', fontSize: 25, fontWeight: '900' },
  subtitle: { color: '#5B746C', marginTop: 4, lineHeight: 19 },
  dateContext: { fontSize: 12, fontWeight: '800', marginTop: 7, textTransform: 'capitalize' },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E4EFEB', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#173C32', fontSize: 25, lineHeight: 27 },
  back: { color: '#008F6D', fontWeight: '800', marginTop: 18 },
  foodTitle: { color: '#173C32', fontSize: 24, fontWeight: '900', marginTop: 12 },
  label: { color: '#557068', fontSize: 13, fontWeight: '800', marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitButton: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', backgroundColor: '#fff' },
  categoryButton: { borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 18, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: '#fff' },
  selectorText: { color: '#43635A', fontWeight: '700' },
  selected: { backgroundColor: '#00A77D', borderColor: '#00A77D' },
  selectedText: { color: '#fff' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 15, backgroundColor: '#fff' },
  quantityInput: { flex: 1, height: 54, paddingHorizontal: 16, fontSize: 22, fontWeight: '800', color: '#173C32' },
  quantityUnit: { color: '#557068', fontWeight: '800', fontSize: 16, paddingRight: 16 },
  steps: { flexDirection: 'row', gap: 7, marginTop: 9 },
  stepButton: { flex: 1, minWidth: 0, minHeight: 40, borderRadius: 12, backgroundColor: '#E4EFEB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  stepText: { color: '#245044', fontSize: 12, fontWeight: '800' },
  equivalence: { color: '#6A7F78', fontSize: 12, marginTop: 8 },
  macroCard: { backgroundColor: '#173C32', borderRadius: 18, padding: 17, marginTop: 18 },
  calories: { color: '#fff', fontSize: 23, fontWeight: '900' },
  macroText: { color: '#D6E8E2', fontSize: 13, lineHeight: 19, marginTop: 4 },
  stageButton: { height: 54, borderRadius: 27, borderWidth: 2, borderColor: '#00A77D', alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#E7F7F2' },
  stageText: { color: '#008F6D', fontSize: 16, fontWeight: '900' },
  draftSection: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { color: '#173C32', fontSize: 18, fontWeight: '900' },
  countBadge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  draftCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDEAE5', borderRadius: 16, padding: 14, marginBottom: 9 },
  draftInfo: { marginBottom: 11 },
  draftName: { color: '#173C32', fontSize: 16, fontWeight: '800' },
  draftMacros: { color: '#6A7F78', fontSize: 12, marginTop: 4 },
  draftControls: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  roundButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E4EFEB', alignItems: 'center', justifyContent: 'center' },
  roundText: { color: '#173C32', fontSize: 21, fontWeight: '800' },
  draftQuantity: { minWidth: 72, color: '#173C32', textAlign: 'center', fontWeight: '800' },
  removeText: { color: '#B42318', fontSize: 12, fontWeight: '800', marginLeft: 'auto' },
  totalCard: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, backgroundColor: '#173C32', borderRadius: 18, padding: 16, marginTop: 3 },
  totalLabel: { color: '#9FC2B8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  totalCalories: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 3 },
  totalMacros: { color: '#D6E8E2', fontSize: 12, paddingBottom: 3 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 52, borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 16, backgroundColor: '#fff', paddingRight: 14 },
  searchInput: { flex: 1, height: 50, paddingHorizontal: 15, fontSize: 15 },
  searchHint: { color: '#8AA098', fontSize: 12, fontWeight: '800' },
  memorySection: { marginTop: 18 },
  memoryTitle: { color: '#173C32', fontSize: 18, fontWeight: '900' },
  memoryTitleSpaced: { marginTop: 17 },
  memorySubtitle: { color: '#6A7F78', fontSize: 12, marginTop: 3, marginBottom: 9 },
  memoryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 15, padding: 13, marginBottom: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDEAE5' },
  memoryCopy: { flex: 1 },
  memoryName: { color: '#173C32', fontSize: 15, fontWeight: '800' },
  memoryMeta: { color: '#6A7F78', fontSize: 12, marginTop: 4 },
  memoryAction: { color: '#008F6D', fontWeight: '900' },
  recipeActions: { alignItems: 'flex-end', gap: 7 },
  recipeEditAction: { color: '#557068', fontSize: 12, fontWeight: '800' },
  recipeDeleteAction: { color: '#B42318', fontSize: 20, fontWeight: '800', lineHeight: 18 },
  recipeDeleteConfirm: { alignItems: 'center', paddingVertical: 18 },
  recipeDeleteIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  recipeDeleteIconText: { fontSize: 27 },
  recipeDeleteTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center' },
  recipeDeleteBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 9, marginBottom: 20, maxWidth: 390 },
  recipeDeleteButton: { width: '100%', minHeight: 50, borderRadius: 25, backgroundColor: '#C23B32', alignItems: 'center', justifyContent: 'center' },
  recipeDeleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  recipeDeleteCancel: { width: '100%', minHeight: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  recipeDeleteCancelText: { fontSize: 15, fontWeight: '800' },
  error: { color: '#B42318', textAlign: 'center', marginTop: 12 },
  empty: { color: '#557068', backgroundColor: '#E8F6F1', borderRadius: 14, padding: 14, marginTop: 14, lineHeight: 20 },
  results: { gap: 9, marginTop: 14 },
  foodCard: { borderRadius: 15, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDEAE5' },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  foodName: { flex: 1, color: '#173C32', fontSize: 16, fontWeight: '800' },
  addText: { color: '#008F6D', fontWeight: '800' },
  foodMeta: { color: '#6A7F78', marginTop: 4 },
  foodMacros: { color: '#35584E', fontSize: 12, lineHeight: 18, marginTop: 5 },
  saveButton: { height: 56, borderRadius: 28, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  scanButton: { borderRadius: 15, padding: 15, backgroundColor: '#E5F4EF', marginTop: 18 },
  scanTitle: { color: '#173C32', fontSize: 16, fontWeight: '800' },
  scanDescription: { color: '#5B746C', marginTop: 3 },
  disabled: { opacity: 0.6 },
  recipeYield: { color: '#6A7F78', marginTop: 7, lineHeight: 19 },
  recipeEditor: { marginTop: 4 },
  recipeEditorRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  recipeInput: { minHeight: 46, borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fff', color: '#173C32' },
  recipeYieldInput: { width: 88 },
  recipeLabelInput: { flex: 1 },
});
