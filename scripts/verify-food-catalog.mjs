import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries((await readFile('.env', 'utf8'))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .map((line) => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')];
  }));

const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Supabase public configuration is missing.');

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { count: total, error: totalError } = await supabase
  .from('foods')
  .select('id', { count: 'exact', head: true })
  .eq('verification_status', 'verified');
if (totalError) throw totalError;

const { count: testCount, error: testError } = await supabase
  .from('foods')
  .select('id', { count: 'exact', head: true })
  .contains('tags', ['latinfoods', 'test-only']);
if (testError) throw testError;

const terms = ['algarroba', 'marraqueta', 'abacate', 'sopa paraguaya'];
const searches = {};
for (const term of terms) {
  const { data, error } = await supabase.rpc('search_foods_with_macros', {
    search_term: term,
    market_code: null,
    result_limit: 3,
  });
  if (error) throw error;
  searches[term] = data.map((food) => ({
    name: food.display_name,
    calories: food.energy_kcal,
    protein: food.protein_g,
    carbs: food.carbohydrate_g,
    fat: food.fat_g,
  }));
}

console.log(JSON.stringify({ totalVerified: total, latinfoodsTest: testCount, searches }, null, 2));
