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

export async function listCountries() {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('countries')
    .select('code,name_es,default_locale')
    .order('sort_order');
  if (error) throw error;
  return data as Country[];
}

export async function searchFoods(searchTerm: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.rpc('search_foods_with_macros', {
    search_term: searchTerm,
    market_code: null,
    result_limit: 30,
  });
  if (error) throw error;
  return data as FoodSearchResult[];
}
