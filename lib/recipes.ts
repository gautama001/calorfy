import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FoodSearchResult } from '@/lib/catalog';
import type { DiaryFoodInput, DiaryMeal, DiaryMealItem, MealCategory } from '@/lib/diary';
import { supabase } from '@/lib/supabase';

export type PersonalRecipe = {
  id: string;
  name: string;
  category: MealCategory;
  yieldQuantity: number;
  yieldLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: DiaryMealItem[];
  updatedAt: string;
};

type RecipeRow = {
  id: string;
  name: string;
  category: MealCategory;
  yield_quantity: number | string;
  yield_label: string;
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  updated_at: string;
  meal_template_items?: Array<{
    id: string;
    food_id: string | null;
    food_name: string;
    quantity: number | string;
    unit: DiaryFoodInput['unit'];
    grams: number | string;
    calories: number | string;
    protein_g: number | string;
    carbs_g: number | string;
    fat_g: number | string;
    sort_order: number;
  }>;
};

const recipeSelect = 'id,name,category,yield_quantity,yield_label,calories,protein_g,carbs_g,fat_g,updated_at,meal_template_items(id,food_id,food_name,quantity,unit,grams,calories,protein_g,carbs_g,fat_g,sort_order)';

function mapRecipe(row: RecipeRow): PersonalRecipe {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    yieldQuantity: Number(row.yield_quantity),
    yieldLabel: row.yield_label,
    calories: Number(row.calories),
    protein: Number(row.protein_g),
    carbs: Number(row.carbs_g),
    fat: Number(row.fat_g),
    updatedAt: row.updated_at,
    items: [...(row.meal_template_items ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((item) => ({
      id: item.id,
      foodId: item.food_id,
      name: item.food_name,
      quantity: Number(item.quantity),
      unit: item.unit,
      grams: Number(item.grams),
      calories: Number(item.calories),
      protein: Number(item.protein_g),
      carbs: Number(item.carbs_g),
      fat: Number(item.fat_g),
    })),
  };
}

function cacheKey(userId: string) {
  return `personal-recipes:v1:${userId}`;
}

export async function readCachedPersonalRecipes(userId: string) {
  const value = await AsyncStorage.getItem(cacheKey(userId));
  if (!value) return [];
  try {
    return JSON.parse(value) as PersonalRecipe[];
  } catch {
    await AsyncStorage.removeItem(cacheKey(userId));
    return [];
  }
}

function itemPayload(item: DiaryMealItem) {
  return {
    food_id: item.foodId ?? '',
    food_name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    grams: item.grams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  };
}

function inputPayload(item: DiaryFoodInput) {
  return {
    food_id: item.food.id,
    food_name: item.food.display_name,
    quantity: item.quantity,
    unit: item.unit,
    grams: item.grams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  };
}

export async function listPersonalRecipes(userId: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('meal_templates')
    .select(recipeSelect)
    .eq('user_id', userId)
    .order('sort_order', { referencedTable: 'meal_template_items', ascending: true })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  const recipes = (data as RecipeRow[]).map(mapRecipe);
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(recipes));
  return recipes;
}

export async function createPersonalRecipeFromMeal(
  userId: string,
  meal: DiaryMeal,
  name: string,
  yieldQuantity: number,
  yieldLabel: string,
) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.rpc('create_meal_template', {
    template_name: name,
    template_category: meal.category,
    template_yield: yieldQuantity,
    template_yield_label: yieldLabel,
    source_meal: meal.id,
    items: meal.items.map(itemPayload),
  }).single();
  if (error) throw error;
  const savedRecipe = data as { user_id: string };
  if (savedRecipe.user_id !== userId) throw new Error('La sesión cambió durante el guardado');
  return data;
}

export function personalRecipeToInputs(recipe: PersonalRecipe, consumedQuantity: number): DiaryFoodInput[] {
  if (!Number.isFinite(recipe.yieldQuantity) || recipe.yieldQuantity <= 0) throw new Error('Invalid recipe yield');
  if (!Number.isFinite(consumedQuantity) || consumedQuantity <= 0) throw new Error('Invalid consumed quantity');
  const scale = consumedQuantity / recipe.yieldQuantity;
  return recipe.items.map((item) => {
    const grams = item.grams * scale;
    const calories = item.calories * scale;
    const protein = item.protein * scale;
    const carbs = item.carbs * scale;
    const fat = item.fat * scale;
    const perHundred = grams > 0 ? 100 / grams : 0;
    const food: FoodSearchResult = {
      id: item.foodId ?? '',
      canonical_name: item.name,
      display_name: item.name,
      food_type: 'saved',
      group_code: 'OTHER',
      origin_country_code: null,
      default_portion_g: grams,
      energy_kcal: calories * perHundred,
      protein_g: protein * perHundred,
      carbohydrate_g: carbs * perHundred,
      fat_g: fat * perHundred,
      rank: 0,
    };
    return {
      food,
      quantity: item.quantity * scale,
      unit: item.unit,
      grams,
      calories,
      protein,
      carbs,
      fat,
    };
  });
}

export async function updatePersonalRecipe(
  userId: string,
  recipeId: string,
  name: string,
  category: MealCategory,
  yieldQuantity: number,
  yieldLabel: string,
  items: DiaryFoodInput[],
) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.rpc('update_meal_template', {
    target_template_id: recipeId,
    template_name: name,
    template_category: category,
    template_yield: yieldQuantity,
    template_yield_label: yieldLabel,
    items: items.map(inputPayload),
  }).single();
  if (error) throw error;
  const savedRecipe = data as { user_id: string };
  if (savedRecipe.user_id !== userId) throw new Error('La sesión cambió durante el guardado');
  return data;
}

export async function deletePersonalRecipe(userId: string, recipeId: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase
    .from('meal_templates')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', userId);
  if (error) throw error;
}
