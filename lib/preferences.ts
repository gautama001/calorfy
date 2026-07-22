import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

export type AppLanguage = 'es' | 'en' | 'pt';
export type AppThemePreference = 'light' | 'dark';
export type NutritionTargetsMode = 'auto' | 'manual';

export type UserPreferences = {
  language: AppLanguage;
  theme: AppThemePreference;
  reminderTime: string;
  nutritionTargetsMode: NutritionTargetsMode;
};

type PreferencesRow = {
  id: string;
  preferred_language: AppLanguage;
  theme: AppThemePreference;
  reminder_time: string;
  nutrition_targets_mode: NutritionTargetsMode;
  preferences_initialized: boolean;
};

function cacheKey(userId: string) {
  return `preferences:v1:${userId}`;
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function mapPreferences(row: PreferencesRow): UserPreferences {
  return {
    language: row.preferred_language,
    theme: row.theme,
    reminderTime: normalizeTime(row.reminder_time),
    nutritionTargetsMode: row.nutrition_targets_mode,
  };
}

export async function readCachedUserPreferences(userId: string) {
  const value = await AsyncStorage.getItem(cacheKey(userId));
  if (!value) return null;
  try {
    return JSON.parse(value) as UserPreferences;
  } catch {
    await AsyncStorage.removeItem(cacheKey(userId));
    return null;
  }
}

async function cachePreferences(userId: string, preferences: UserPreferences) {
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(preferences));
}

export async function syncUserPreferences(userId: string, legacyFallback?: UserPreferences) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('profiles')
    .select('id,preferred_language,theme,reminder_time,nutrition_targets_mode,preferences_initialized')
    .eq('id', userId)
    .single();
  if (error) throw error;
  const row = data as PreferencesRow;
  if (row.id !== userId) throw new Error('La sesión cambió durante la sincronización');
  if (!row.preferences_initialized && legacyFallback) {
    return saveUserPreferences(userId, legacyFallback);
  }
  const preferences = mapPreferences(row);
  await cachePreferences(userId, preferences);
  return preferences;
}

export async function saveUserPreferences(userId: string, preferences: UserPreferences) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('profiles')
    .update({
      preferred_language: preferences.language,
      theme: preferences.theme,
      reminder_time: preferences.reminderTime,
      nutrition_targets_mode: preferences.nutritionTargetsMode,
      preferences_initialized: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id,preferred_language,theme,reminder_time,nutrition_targets_mode,preferences_initialized')
    .single();
  if (error) throw error;
  const row = data as PreferencesRow;
  if (row.id !== userId) throw new Error('La sesión cambió durante el guardado');
  const saved = mapPreferences(row);
  await cachePreferences(userId, saved);
  return saved;
}
