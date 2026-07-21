import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FoodSearchResult } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';

export type MealCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type DiaryFoodInput = {
  food: FoodSearchResult;
  quantity: number;
  unit: 'g' | 'ml' | 'tbsp';
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DiaryMealItem = {
  id: string;
  foodId: string | null;
  name: string;
  quantity: number;
  unit: DiaryFoodInput['unit'];
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DiaryMeal = {
  id: string;
  name: string;
  category: MealCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string | null;
  date: string;
  timestamp: string;
  items: DiaryMealItem[];
  isFavorite: boolean;
  synced: true;
};

type MealRow = {
  id: string;
  name: string;
  category: MealCategory;
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  image_path: string | null;
  eaten_at: string;
  is_favorite: boolean;
  meal_items?: Array<{
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
  }>;
};

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayBounds(date: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function cacheKey(userId: string, date: string) {
  return `diary:v2:${userId}:${date}`;
}

function mapMeal(row: MealRow): DiaryMeal {
  const eatenAt = new Date(row.eaten_at);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    calories: Number(row.calories),
    protein: Number(row.protein_g),
    carbs: Number(row.carbs_g),
    fat: Number(row.fat_g),
    image: row.image_path,
    date: localDateString(eatenAt),
    timestamp: eatenAt.toISOString(),
    items: (row.meal_items ?? []).map((item) => ({
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
    isFavorite: row.is_favorite,
    synced: true,
  };
}

const mealSelect = 'id,name,category,calories,protein_g,carbs_g,fat_g,image_path,eaten_at,is_favorite,meal_items(id,food_id,food_name,quantity,unit,grams,calories,protein_g,carbs_g,fat_g,sort_order)';

export function createDiaryClientEventId() {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (randomUUID) return randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function diaryTimestampForDate(date: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error('Invalid diary date');

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const timestamp = new Date(
    year,
    month,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
  if (
    timestamp.getFullYear() !== year
    || timestamp.getMonth() !== month
    || timestamp.getDate() !== day
  ) {
    throw new Error('Invalid diary date');
  }
  return timestamp.toISOString();
}

export function diaryMealToInputs(meal: DiaryMeal): DiaryFoodInput[] {
  return meal.items.map((item) => {
    const perHundred = item.grams > 0 ? 100 / item.grams : 0;
    return {
      food: {
        id: item.foodId ?? '',
        canonical_name: item.name,
        display_name: item.name,
        food_type: 'saved',
        group_code: 'OTHER',
        origin_country_code: null,
        default_portion_g: item.grams,
        energy_kcal: item.calories * perHundred,
        protein_g: item.protein * perHundred,
        carbohydrate_g: item.carbs * perHundred,
        fat_g: item.fat * perHundred,
        rank: 0,
      },
      quantity: item.quantity,
      unit: item.unit,
      grams: item.grams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    };
  });
}

export async function readCachedDiaryDay(userId: string, date: string) {
  const cached = await AsyncStorage.getItem(cacheKey(userId, date));
  if (!cached) return [];
  try {
    return JSON.parse(cached) as DiaryMeal[];
  } catch {
    await AsyncStorage.removeItem(cacheKey(userId, date));
    return [];
  }
}

export async function syncDiaryDay(userId: string, date: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const bounds = dayBounds(date);
  const { data, error } = await supabase
    .from('meals')
    .select(mealSelect)
    .eq('user_id', userId)
    .gte('eaten_at', bounds.start)
    .lt('eaten_at', bounds.end)
    .order('eaten_at', { ascending: false });
  if (error) throw error;
  const meals = (data as MealRow[]).map(mapMeal);
  await AsyncStorage.setItem(cacheKey(userId, date), JSON.stringify(meals));
  return meals;
}

export async function listDiaryShortcuts(userId: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('meals')
    .select(mealSelect)
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('eaten_at', { ascending: false })
    .limit(30);
  if (error) throw error;

  const seen = new Set<string>();
  return (data as MealRow[])
    .map(mapMeal)
    .filter((meal) => meal.items.length > 0)
    .filter((meal) => {
      const signature = meal.items
        .map((item) => `${item.foodId ?? item.name}:${item.quantity}:${item.unit}`)
        .sort()
        .join('|');
      if (!meal.isFavorite && seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .slice(0, 8);
}

export async function createDiaryMeal(
  userId: string,
  foods: DiaryFoodInput[],
  category: MealCategory,
  clientEventId = createDiaryClientEventId(),
  eatenAt = new Date().toISOString(),
) {
  if (!supabase) throw new Error('Supabase no está configurado');
  if (foods.length === 0) throw new Error('La comida no tiene alimentos');

  const fullName = foods
    .map((item) => `${item.food.display_name} (${item.quantity} ${item.unit === 'tbsp' ? 'cda' : item.unit})`)
    .join(', ');
  const items = foods.map((item) => ({
    food_id: item.food.id,
    food_name: item.food.display_name,
    quantity: item.quantity,
    unit: item.unit,
    grams: item.grams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  }));
  const { data, error } = await supabase.rpc('create_meal_with_items', {
    meal_name: fullName.length <= 200 ? fullName : `${fullName.slice(0, 197)}...`,
    meal_category: category,
    client_event_id: clientEventId,
    items,
    meal_eaten_at: eatenAt,
  }).single();
  if (error) throw error;
  const savedMeal = data as { user_id: string };
  if (savedMeal.user_id !== userId) throw new Error('La sesión cambió durante el guardado');
  return data;
}

export async function updateDiaryMeal(
  userId: string,
  mealId: string,
  foods: DiaryFoodInput[],
  category: MealCategory,
) {
  if (!supabase) throw new Error('Supabase no está configurado');
  if (foods.length === 0) throw new Error('La comida no tiene alimentos');

  const fullName = foods
    .map((item) => `${item.food.display_name} (${item.quantity} ${item.unit === 'tbsp' ? 'cda' : item.unit})`)
    .join(', ');
  const { data, error } = await supabase.rpc('update_meal_with_items', {
    target_meal_id: mealId,
    meal_name: fullName.length <= 200 ? fullName : `${fullName.slice(0, 197)}...`,
    meal_category: category,
    items: foods.map((item) => ({
      food_id: item.food.id,
      food_name: item.food.display_name,
      quantity: item.quantity,
      unit: item.unit,
      grams: item.grams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    })),
  }).single();
  if (error) throw error;
  const savedMeal = data as { user_id: string };
  if (savedMeal.user_id !== userId) throw new Error('La sesión cambió durante el guardado');
  return data;
}

export async function updateDiaryMealCategory(userId: string, mealId: string, category: MealCategory) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase
    .from('meals')
    .update({ category, updated_at: new Date().toISOString() })
    .eq('id', mealId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateDiaryMealFavorite(userId: string, mealId: string, isFavorite: boolean) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase
    .from('meals')
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq('id', mealId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteDiaryMeal(userId: string, mealId: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase.from('meals').delete().eq('id', mealId).eq('user_id', userId);
  if (error) throw error;
}
