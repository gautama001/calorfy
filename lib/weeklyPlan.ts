import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDietRecipe, getDietRecipes, type DietKey, type DietRecipe } from '@/lib/dietCatalog';
import type { DietType } from '@/lib/goals';
import type { DiaryFoodInput, MealCategory } from '@/lib/diary';
import { supabase } from '@/lib/supabase';

export type WeeklyPlanItem = {
  id: string;
  date: string;
  category: MealCategory;
  recipeId: string;
  servings: number;
  status: 'planned' | 'added' | 'completed';
};

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  dietKey: DietKey;
  calorieTarget: number;
  items: WeeklyPlanItem[];
};

type PlanRow = {
  id: string;
  week_start: string;
  diet_key: DietKey;
  calorie_target: number;
  weekly_plan_items: Array<{ id: string; plan_date: string; category: MealCategory; recipe_id: string; servings: number | string; status: WeeklyPlanItem['status'] }>;
};

const categories: MealCategory[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentWeekStart(date = new Date()) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return localDateString(result);
}

function addDays(date: string, amount: number) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + amount);
  return localDateString(result);
}

export function goalDietToCatalogDiet(diet: DietType | null): DietKey {
  const mapping: Partial<Record<DietType, DietKey>> = {
    balanced: 'latam_balanced', high_protein: 'high_protein', vegetarian: 'vegetarian', vegan: 'vegan', keto: 'keto', low_carb: 'low_carb', gluten_free: 'gluten_free', paleo: 'paleo', mediterranean: 'mediterranean', macrobiotic: 'macrobiotic', raw: 'vegan',
  };
  return mapping[diet ?? 'balanced'] ?? 'latam_balanced';
}

function roundServings(value: number) {
  return Math.min(3, Math.max(0.5, Math.round(value * 4) / 4));
}

export function generateWeeklyPlanItems(weekStart: string, dietKey: DietKey, calorieTarget: number) {
  const recipes = getDietRecipes(dietKey);
  return Array.from({ length: 7 }).flatMap((_, dayIndex) => {
    const selected = categories.map((category, categoryIndex) => {
      const pool = recipes.filter((recipe) => recipe.category === category);
      return pool[(dayIndex + categoryIndex) % pool.length];
    });
    const baseCalories = selected.reduce((sum, recipe) => sum + recipe.calories, 0);
    const servings = roundServings(calorieTarget / baseCalories);
    return selected.map((recipe) => ({ plan_date: addDays(weekStart, dayIndex), category: recipe.category, recipe_id: recipe.id, servings }));
  });
}

function cacheKey(userId: string, weekStart: string) {
  return `weekly-plan:v1:${userId}:${weekStart}`;
}

export async function writeCachedWeeklyPlan(userId: string, plan: WeeklyPlan) {
  await AsyncStorage.setItem(cacheKey(userId, plan.weekStart), JSON.stringify(plan));
}

function mapPlan(row: PlanRow): WeeklyPlan {
  return {
    id: row.id,
    weekStart: row.week_start,
    dietKey: row.diet_key,
    calorieTarget: row.calorie_target,
    items: row.weekly_plan_items.map((item) => ({ id: item.id, date: item.plan_date, category: item.category, recipeId: item.recipe_id, servings: Number(item.servings), status: item.status })),
  };
}

export async function readCachedWeeklyPlan(userId: string, weekStart: string) {
  const value = await AsyncStorage.getItem(cacheKey(userId, weekStart));
  if (!value) return null;
  try { return JSON.parse(value) as WeeklyPlan; } catch { await AsyncStorage.removeItem(cacheKey(userId, weekStart)); return null; }
}

export async function syncWeeklyPlan(userId: string, weekStart: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('weekly_plans').select('id,week_start,diet_key,calorie_target,weekly_plan_items(id,plan_date,category,recipe_id,servings,status)').eq('user_id', userId).eq('week_start', weekStart).maybeSingle();
  if (error) throw error;
  const plan = data ? mapPlan(data as PlanRow) : null;
  if (plan) await writeCachedWeeklyPlan(userId, plan);
  return plan;
}

export async function createWeeklyPlan(userId: string, weekStart: string, dietKey: DietKey, calorieTarget: number) {
  if (!supabase) throw new Error('Supabase is not configured');
  const items = generateWeeklyPlanItems(weekStart, dietKey, calorieTarget);
  const { data, error } = await supabase.rpc('replace_weekly_plan', { p_week_start: weekStart, p_diet_key: dietKey, p_calorie_target: calorieTarget, p_items: items }).single();
  if (error) throw error;
  const saved = data as { user_id: string };
  if (saved.user_id !== userId) throw new Error('Session changed while saving the plan');
  const plan = await syncWeeklyPlan(userId, weekStart);
  if (!plan) throw new Error('The saved plan could not be loaded');
  return plan;
}

export async function updateWeeklyPlanItem(userId: string, itemId: string, changes: Partial<Pick<WeeklyPlanItem, 'recipeId' | 'servings' | 'status'>>) {
  if (!supabase) throw new Error('Supabase is not configured');
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (changes.recipeId) payload.recipe_id = changes.recipeId;
  if (changes.servings) payload.servings = roundServings(changes.servings);
  if (changes.status) payload.status = changes.status;
  const { error } = await supabase.from('weekly_plan_items').update(payload).eq('id', itemId).eq('user_id', userId);
  if (error) throw error;
}

export function recipeServingToDiaryInput(recipe: DietRecipe, servings: number): DiaryFoodInput {
  const scale = (value: number) => Math.round(value * servings * 10) / 10;
  const grams = scale(recipe.servingGrams);
  return {
    food: {
      id: '', canonical_name: recipe.name, display_name: recipe.name, food_type: 'diet_recipe', group_code: 'RECIPE', origin_country_code: null,
      default_portion_g: recipe.servingGrams, energy_kcal: recipe.calories * 100 / recipe.servingGrams,
      protein_g: recipe.protein * 100 / recipe.servingGrams, carbohydrate_g: recipe.carbs * 100 / recipe.servingGrams,
      fat_g: recipe.fat * 100 / recipe.servingGrams, rank: 0,
    },
    quantity: grams, unit: 'g', grams, calories: scale(recipe.calories), protein: scale(recipe.protein), carbs: scale(recipe.carbs), fat: scale(recipe.fat),
  };
}

export function getPlanItemRecipe(item: WeeklyPlanItem) {
  return getDietRecipe(item.recipeId);
}
