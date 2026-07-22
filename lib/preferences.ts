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

export type PreferenceSyncStatus = 'synced' | 'pending';
export type SavedUserPreferences = UserPreferences & { syncStatus: PreferenceSyncStatus };

type PreferenceColumn = 'preferred_language' | 'theme' | 'reminder_time' | 'nutrition_targets_mode';
type PreferencePatch = Partial<Record<PreferenceColumn, string>>;
type FieldVersions = Record<PreferenceColumn, number>;

type PreferencesRow = {
  id: string;
  preferred_language: AppLanguage;
  theme: AppThemePreference;
  reminder_time: string;
  nutrition_targets_mode: NutritionTargetsMode;
  preferences_initialized: boolean;
  preferences_revision: number | string;
  preferences_field_versions: Partial<Record<PreferenceColumn, number | string>> | null;
};

type CachedPreferenceState = {
  values: UserPreferences;
  revision: number;
  fieldVersions: FieldVersions;
  pending: PreferencePatch;
};

const emptyVersions: FieldVersions = { preferred_language: 0, theme: 0, reminder_time: 0, nutrition_targets_mode: 0 };

export class PreferenceConflictError extends Error {
  field: keyof UserPreferences;
  constructor(field: keyof UserPreferences) {
    super(`Preference conflict: ${field}`);
    this.name = 'PreferenceConflictError';
    this.field = field;
  }
}

function cacheKey(userId: string) {
  return `preferences:v2:${userId}`;
}

function legacyCacheKey(userId: string) {
  return `preferences:v1:${userId}`;
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function mapPreferences(row: PreferencesRow): UserPreferences {
  return { language: row.preferred_language, theme: row.theme, reminderTime: normalizeTime(row.reminder_time), nutritionTargetsMode: row.nutrition_targets_mode };
}

function mapState(row: PreferencesRow): CachedPreferenceState {
  return {
    values: mapPreferences(row),
    revision: Number(row.preferences_revision || 0),
    fieldVersions: Object.fromEntries(Object.keys(emptyVersions).map((key) => [key, Number(row.preferences_field_versions?.[key as PreferenceColumn] || 0)])) as FieldVersions,
    pending: {},
  };
}

async function readCachedState(userId: string): Promise<CachedPreferenceState | null> {
  const value = await AsyncStorage.getItem(cacheKey(userId));
  if (value) {
    try { return JSON.parse(value) as CachedPreferenceState; }
    catch { await AsyncStorage.removeItem(cacheKey(userId)); }
  }
  const legacy = await AsyncStorage.getItem(legacyCacheKey(userId));
  if (!legacy) return null;
  try {
    const values = JSON.parse(legacy) as UserPreferences;
    return { values, revision: 0, fieldVersions: { ...emptyVersions }, pending: {} };
  } catch {
    await AsyncStorage.removeItem(legacyCacheKey(userId));
    return null;
  }
}

async function cacheState(userId: string, state: CachedPreferenceState) {
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(state));
}

function preferencePatch(previous: UserPreferences | null, next: UserPreferences): PreferencePatch {
  const patch: PreferencePatch = {};
  if (!previous || previous.language !== next.language) patch.preferred_language = next.language;
  if (!previous || previous.theme !== next.theme) patch.theme = next.theme;
  if (!previous || previous.reminderTime !== next.reminderTime) patch.reminder_time = next.reminderTime;
  if (!previous || previous.nutritionTargetsMode !== next.nutritionTargetsMode) patch.nutrition_targets_mode = next.nutritionTargetsMode;
  return patch;
}

function applyPatch(values: UserPreferences, patch: PreferencePatch): UserPreferences {
  return {
    language: (patch.preferred_language as AppLanguage | undefined) ?? values.language,
    theme: (patch.theme as AppThemePreference | undefined) ?? values.theme,
    reminderTime: patch.reminder_time ?? values.reminderTime,
    nutritionTargetsMode: (patch.nutrition_targets_mode as NutritionTargetsMode | undefined) ?? values.nutritionTargetsMode,
  };
}

function isOfflineError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error ? String((error as { message?: string }).message ?? '') : '';
  return /network|fetch|offline|failed to connect/i.test(message);
}

function preferenceConflict(error: unknown) {
  const message = typeof error === 'object' && error ? String((error as { message?: string }).message ?? '') : String(error ?? '');
  return message.includes('PREFERENCE_CONFLICT:nutritionTargetsMode');
}

async function pushPatch(userId: string, patch: PreferencePatch, fieldVersions: FieldVersions) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.rpc('patch_user_preferences', { p_patch: patch, p_expected_versions: fieldVersions }).single();
  if (error) {
    if (preferenceConflict(error)) throw new PreferenceConflictError('nutritionTargetsMode');
    throw error;
  }
  const row = data as PreferencesRow;
  if (row.id !== userId) throw new Error('La sesión cambió durante el guardado');
  const state = mapState(row);
  await cacheState(userId, state);
  return state;
}

export async function readCachedUserPreferences(userId: string) {
  return (await readCachedState(userId))?.values ?? null;
}

export async function syncUserPreferences(userId: string, legacyFallback?: UserPreferences) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const cached = await readCachedState(userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('id,preferred_language,theme,reminder_time,nutrition_targets_mode,preferences_initialized,preferences_revision,preferences_field_versions')
    .eq('id', userId)
    .single();
  if (error) throw error;
  const row = data as PreferencesRow;
  if (row.id !== userId) throw new Error('La sesión cambió durante la sincronización');
  if (!row.preferences_initialized && legacyFallback) return saveUserPreferences(userId, legacyFallback);
  if (cached && Object.keys(cached.pending).length) {
    const pushed = await pushPatch(userId, cached.pending, cached.fieldVersions);
    return pushed.values;
  }
  const state = mapState(row);
  await cacheState(userId, state);
  return state.values;
}

export async function reloadRemoteUserPreferences(userId: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('profiles')
    .select('id,preferred_language,theme,reminder_time,nutrition_targets_mode,preferences_initialized,preferences_revision,preferences_field_versions')
    .eq('id', userId)
    .single();
  if (error) throw error;
  const row = data as PreferencesRow;
  if (row.id !== userId) throw new Error('La sesión cambió durante la sincronización');
  const state = mapState(row);
  await cacheState(userId, state);
  return state.values;
}

export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<SavedUserPreferences> {
  if (!supabase) throw new Error('Supabase no está configurado');
  const cached = await readCachedState(userId);
  const patch = preferencePatch(cached?.values ?? null, preferences);
  if (!Object.keys(patch).length) return { ...preferences, syncStatus: cached && Object.keys(cached.pending).length ? 'pending' : 'synced' };

  const optimistic: CachedPreferenceState = {
    values: applyPatch(cached?.values ?? preferences, patch),
    revision: cached?.revision ?? 0,
    fieldVersions: cached?.fieldVersions ?? { ...emptyVersions },
    pending: { ...(cached?.pending ?? {}), ...patch },
  };
  await cacheState(userId, optimistic);
  try {
    const saved = await pushPatch(userId, optimistic.pending, optimistic.fieldVersions);
    return { ...saved.values, syncStatus: 'synced' };
  } catch (error) {
    if (isOfflineError(error)) return { ...optimistic.values, syncStatus: 'pending' };
    throw error;
  }
}
