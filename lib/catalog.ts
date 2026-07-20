import { supabase } from '@/lib/supabase';

export type Country = {
  code: string;
  name_es: string;
  default_locale: string;
};

export type FoodSearchResult = {
  id: string;
  canonical_name: string;
  display_name: string;
  food_type: string;
  group_code: string;
  origin_country_code: string | null;
  default_portion_g: number | null;
  energy_kcal: number | null;
  protein_g: number | null;
  carbohydrate_g: number | null;
  fat_g: number | null;
  rank: number;
};

export type MealCategory = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export async function listCountries() {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('countries')
    .select('code,name_es,default_locale')
    .order('sort_order');
  if (error) throw error;
  return data as Country[];
}

export async function searchFoods(searchTerm: string, marketCode: string | null) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.rpc('search_foods_with_macros', {
    search_term: searchTerm,
    market_code: marketCode,
    result_limit: 30,
  });
  if (error) throw error;
  return data as FoodSearchResult[];
}

export async function addFoodToDiary(
  userId: string,
  food: FoodSearchResult,
  grams: number,
  category: MealCategory,
) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const factor = grams / 100;
  const meal = {
    user_id: userId,
    name: food.display_name,
    category,
    calories: Number(food.energy_kcal ?? 0) * factor,
    protein_g: Number(food.protein_g ?? 0) * factor,
    carbs_g: Number(food.carbohydrate_g ?? 0) * factor,
    fat_g: Number(food.fat_g ?? 0) * factor,
  };
  const { data, error } = await supabase.from('meals').insert(meal).select('id,eaten_at').single();
  if (error) throw error;
  return { ...meal, ...data, grams };
}
