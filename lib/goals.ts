import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

export type GoalType = 'maintain' | 'lose' | 'gain' | 'gain_muscle';
export type DietType = 'balanced' | 'high_protein' | 'vegetarian' | 'vegan' | 'keto' | 'low_carb' | 'gluten_free' | 'paleo' | 'mediterranean' | 'macrobiotic' | 'raw';
export type SexType = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export type GoalProfile = {
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  startingWeightKg: number | null;
  goalStartedOn: string | null;
  heightCm: number | null;
  birthYear: number | null;
  sex: SexType | null;
  goal: GoalType | null;
  diet: DietType | null;
  calorieGoal: number | null;
  proteinGoalG: number | null;
  carbsGoalG: number | null;
  fatGoalG: number | null;
};

export type WeightEntry = { date: string; weight: number };

export function isGoalProfileComplete(profile: GoalProfile | null) {
  return Boolean(
    profile
    && profile.currentWeightKg
    && profile.targetWeightKg
    && profile.heightCm
    && profile.birthYear
    && profile.sex
    && profile.goal
    && profile.diet
    && profile.calorieGoal
    && profile.proteinGoalG
    && profile.carbsGoalG
    && profile.fatGoalG,
  );
}

export type MacroRecommendation = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
};

export type EnergyRecommendation = { restingCalories: number; sedentaryCalories: number; targetCalories: number; adjustmentCalories: number; bmi: number };

export function calculateEnergyRecommendation({ weightKg, heightCm, age, sex, goal }: {
  weightKg: number; heightCm: number; age: number; sex: SexType; goal: GoalType;
}): EnergyRecommendation {
  const sexAdjustment = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  const restingCalories = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + sexAdjustment);
  const sedentaryCalories = Math.round(restingCalories * 1.2);
  const bmi = weightKg / ((heightCm / 100) ** 2);
  const rate = goal === 'lose' ? (bmi < 25 ? -0.1 : bmi < 30 ? -0.15 : -0.2) : goal === 'maintain' ? 0 : 0.08;
  const rawAdjustment = Math.round(sedentaryCalories * rate);
  const adjustmentCalories = rate < 0 ? Math.max(-500, rawAdjustment) : rawAdjustment;
  const targetCalories = Math.max(1200, sedentaryCalories + adjustmentCalories);
  return { restingCalories, sedentaryCalories, targetCalories, adjustmentCalories: targetCalories - sedentaryCalories, bmi };
}

export function calculateMacroRecommendation({ calories, weightKg, heightCm = null, goal, diet }: {
  calories: number;
  weightKg: number | null;
  heightCm?: number | null;
  goal: GoalType | null;
  diet: DietType | null;
}): MacroRecommendation {
  const safeCalories = Math.max(1200, Math.round(calories));
  const proteinPerKg: Record<GoalType, number> = { maintain: 1.2, lose: 1.6, gain: 1.4, gain_muscle: 1.8 };
  const bmi = weightKg && heightCm ? weightKg / ((heightCm / 100) ** 2) : null;
  const referenceWeight = weightKg && bmi && bmi > 30 && heightCm
    ? (27.5 * ((heightCm / 100) ** 2)) + 0.25 * (weightKg - 27.5 * ((heightCm / 100) ** 2))
    : weightKg;
  const proteinFactor = diet === 'high_protein' ? Math.max(1.8, proteinPerKg[goal ?? 'maintain']) : proteinPerKg[goal ?? 'maintain'];
  let protein = referenceWeight && referenceWeight > 0
    ? Math.round(referenceWeight * proteinFactor)
    : Math.round((safeCalories * 0.25) / 4);
  protein = Math.min(protein, Math.round((safeCalories * 0.4) / 4));

  const fatShare: Partial<Record<DietType, number>> = { paleo: 0.4, vegan: 0.28, vegetarian: 0.3, mediterranean: 0.35, raw: 0.25, macrobiotic: 0.25, gluten_free: 0.3, balanced: 0.3, high_protein: 0.28 };
  let carbs: number;
  let fats: number;
  if (diet === 'keto' || diet === 'low_carb') {
    const share = diet === 'keto' ? 0.08 : 0.2;
    const maximum = diet === 'keto' ? 50 : 129;
    carbs = Math.min(maximum, Math.round((safeCalories * share) / 4));
    fats = Math.max(35, Math.round((safeCalories - protein * 4 - carbs * 4) / 9));
  } else {
    fats = Math.round((safeCalories * (fatShare[diet ?? 'balanced'] ?? 0.3)) / 9);
    carbs = Math.max(40, Math.round((safeCalories - protein * 4 - fats * 9) / 4));
  }
  const total = protein * 4 + carbs * 4 + fats * 9;
  return {
    calories: safeCalories,
    protein,
    carbs,
    fats,
    proteinPercent: Math.round((protein * 4 / total) * 100),
    carbsPercent: Math.round((carbs * 4 / total) * 100),
    fatsPercent: Math.round((fats * 9 / total) * 100),
  };
}

export type WeightProgress = {
  startWeight: number | null;
  currentWeight: number | null;
  totalChange: number | null;
  weeklyChange: number | null;
  remaining: number | null;
  progress: number;
};

export function calculateWeightProgress(
  history: WeightEntry[],
  targetWeight: number | null,
  fallbackCurrentWeight: number | null = null,
  persistedStartWeight: number | null = null,
  goalStartedOn: string | null = null,
): WeightProgress {
  const ordered = [...history]
    .filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0 && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && (!goalStartedOn || entry.date >= goalStartedOn))
    .sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = persistedStartWeight ?? ordered[0]?.weight ?? fallbackCurrentWeight;
  // The profile's current weight is updated transactionally with each weigh-in and
  // is the authoritative value even while an older cached history is refreshing.
  const currentWeight = fallbackCurrentWeight ?? ordered.at(-1)?.weight ?? null;
  const totalChange = startWeight !== null && currentWeight !== null ? currentWeight - startWeight : null;
  const remaining = currentWeight !== null && targetWeight !== null ? Math.abs(targetWeight - currentWeight) : null;

  let progress = 0;
  if (startWeight !== null && currentWeight !== null && targetWeight !== null) {
    const journey = targetWeight - startWeight;
    if (Math.abs(journey) < 0.01) progress = 1;
    else progress = Math.min(1, Math.max(0, (currentWeight - startWeight) / journey));
  }

  let weeklyChange: number | null = null;
  const latest = ordered.at(-1);
  if (latest && ordered.length > 1) {
    const cutoff = new Date(`${latest.date}T12:00:00`);
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffDate = cutoff.toISOString().slice(0, 10);
    const baseline = [...ordered].reverse().find((entry) => entry.date <= cutoffDate);
    if (baseline) weeklyChange = latest.weight - baseline.weight;
  }

  return { startWeight, currentWeight, totalChange, weeklyChange, remaining, progress };
}

type GoalRow = {
  current_weight_kg: number | string | null;
  target_weight_kg: number | string | null;
  starting_weight_kg: number | string | null;
  goal_started_on: string | null;
  height_cm: number | string | null;
  birth_year: number | null;
  sex: SexType | null;
  goal: GoalType | null;
  diet: DietType | null;
  calorie_goal: number | null;
  protein_goal_g: number | string | null;
  carbs_goal_g: number | string | null;
  fat_goal_g: number | string | null;
};

const goalColumns = 'current_weight_kg,target_weight_kg,starting_weight_kg,goal_started_on,height_cm,birth_year,sex,goal,diet,calorie_goal,protein_goal_g,carbs_goal_g,fat_goal_g';

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapGoal(row: GoalRow): GoalProfile {
  return {
    currentWeightKg: numberOrNull(row.current_weight_kg),
    targetWeightKg: numberOrNull(row.target_weight_kg),
    startingWeightKg: numberOrNull(row.starting_weight_kg),
    goalStartedOn: row.goal_started_on,
    heightCm: numberOrNull(row.height_cm),
    birthYear: row.birth_year,
    sex: row.sex,
    goal: row.goal,
    diet: row.diet,
    calorieGoal: numberOrNull(row.calorie_goal),
    proteinGoalG: numberOrNull(row.protein_goal_g),
    carbsGoalG: numberOrNull(row.carbs_goal_g),
    fatGoalG: numberOrNull(row.fat_goal_g),
  };
}

function goalPayload(userId: string, goal: GoalProfile) {
  return {
    user_id: userId,
    current_weight_kg: goal.currentWeightKg,
    target_weight_kg: goal.targetWeightKg,
    starting_weight_kg: goal.startingWeightKg,
    goal_started_on: goal.goalStartedOn,
    height_cm: goal.heightCm,
    birth_year: goal.birthYear,
    sex: goal.sex,
    goal: goal.goal,
    diet: goal.diet,
    calorie_goal: goal.calorieGoal,
    protein_goal_g: goal.proteinGoalG,
    carbs_goal_g: goal.carbsGoalG,
    fat_goal_g: goal.fatGoalG,
    updated_at: new Date().toISOString(),
  };
}

function goalCacheKey(userId: string) {
  return `goals:v2:${userId}`;
}

function historyCacheKey(userId: string) {
  return `weight-history:v2:${userId}`;
}

export async function readCachedGoalProfile(userId: string) {
  const value = await AsyncStorage.getItem(goalCacheKey(userId));
  if (!value) return null;
  try {
    return JSON.parse(value) as GoalProfile;
  } catch {
    await AsyncStorage.removeItem(goalCacheKey(userId));
    return null;
  }
}

export async function readCachedWeightHistory(userId: string) {
  const value = await AsyncStorage.getItem(historyCacheKey(userId));
  if (!value) return [];
  try {
    return JSON.parse(value) as WeightEntry[];
  } catch {
    await AsyncStorage.removeItem(historyCacheKey(userId));
    return [];
  }
}

export async function syncGoalProfile(userId: string, { migrateLegacy = true }: { migrateLegacy?: boolean } = {}) {
  if (!supabase) throw new Error('Supabase no está configurado');
  if (migrateLegacy) await migrateLegacyGoals(userId);
  const { data, error } = await supabase
    .from('user_goals')
    .select(goalColumns)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  const goal = data ? mapGoal(data as GoalRow) : null;
  if (goal) await AsyncStorage.setItem(goalCacheKey(userId), JSON.stringify(goal));
  return goal;
}

export async function saveGoalProfile(userId: string, goal: GoalProfile) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.rpc('save_goal_plan', {
    p_current_weight_kg: goal.currentWeightKg,
    p_target_weight_kg: goal.targetWeightKg,
    p_starting_weight_kg: goal.startingWeightKg,
    p_height_cm: goal.heightCm,
    p_birth_year: goal.birthYear,
    p_sex: goal.sex,
    p_goal: goal.goal,
    p_diet: goal.diet,
    p_calorie_goal: goal.calorieGoal,
    p_protein_goal_g: goal.proteinGoalG,
    p_carbs_goal_g: goal.carbsGoalG,
    p_fat_goal_g: goal.fatGoalG,
  }).single();
  if (error) throw error;
  const saved = mapGoal(data as GoalRow);
  await AsyncStorage.setItem(goalCacheKey(userId), JSON.stringify(saved));
  return saved;
}

export async function updateNutritionTargets(
  userId: string,
  targets: Pick<GoalProfile, 'calorieGoal' | 'proteinGoalG' | 'carbsGoalG' | 'fatGoalG'>,
) {
  const current = (await syncGoalProfile(userId)) ?? {
    currentWeightKg: null,
    targetWeightKg: null,
    startingWeightKg: null,
    goalStartedOn: null,
    heightCm: null,
    birthYear: null,
    sex: null,
    goal: null,
    diet: null,
    calorieGoal: null,
    proteinGoalG: null,
    carbsGoalG: null,
    fatGoalG: null,
  };
  return saveGoalProfile(userId, { ...current, ...targets });
}

export async function syncWeightHistory(userId: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  await migrateLegacyGoals(userId);
  const { data, error } = await supabase
    .from('weight_entries')
    .select('measured_on,weight_kg')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
    .limit(400);
  if (error) throw error;
  const history = data
    .map((entry) => ({ date: entry.measured_on, weight: Number(entry.weight_kg) }))
    .reverse();
  await AsyncStorage.setItem(historyCacheKey(userId), JSON.stringify(history));
  return history;
}

export async function saveWeightEntry(userId: string, weight: number, date: string) {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase.rpc('save_current_weight', {
    measured_weight: weight,
    measurement_date: date,
  });
  if (error) throw error;
  const result = data as { entry: { user_id: string }; goal: GoalRow };
  const savedEntry = result.entry;
  if (savedEntry.user_id !== userId) throw new Error('La sesión cambió durante el guardado');
  const profile = mapGoal(result.goal);
  await AsyncStorage.setItem(goalCacheKey(userId), JSON.stringify(profile));
  const history = await syncWeightHistory(userId);
  return { history, profile };
}

export function normalizeLegacyGoal(value: string | null): GoalType | null {
  if (value === 'muscle') return 'gain_muscle';
  return value === 'maintain' || value === 'lose' || value === 'gain' || value === 'gain_muscle' ? value : null;
}

export function normalizeLegacySex(value: string | null): SexType | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'm' || normalized === 'male' || normalized === 'masculino') return 'male';
  if (normalized === 'f' || normalized === 'female' || normalized === 'femenino') return 'female';
  if (normalized === 'other' || normalized === 'otro') return 'other';
  if (normalized === 'prefer_not_to_say') return 'prefer_not_to_say';
  return null;
}

async function migrateLegacyGoals(userId: string) {
  if (!supabase) return;
  const marker = `goals:migrated:${userId}`;
  if (await AsyncStorage.getItem(marker)) return;

  const { data: remote, error } = await supabase
    .from('user_goals')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  const keys = ['currentWeight', 'targetWeight', 'height', 'age', 'sex', 'goal', 'diet', 'calorieGoal', 'proteinGoal', 'carbsGoal', 'fatGoal', 'weightHistory'];
  const values = Object.fromEntries(await Promise.all(keys.map(async (key) => [key, await AsyncStorage.getItem(key)])));

  if (!remote && Object.values(values).some(Boolean)) {
    const age = numberOrNull(values.age);
    const legacy: GoalProfile = {
      currentWeightKg: numberOrNull(values.currentWeight),
      targetWeightKg: numberOrNull(values.targetWeight),
      startingWeightKg: numberOrNull(values.currentWeight),
      goalStartedOn: null,
      heightCm: numberOrNull(values.height),
      birthYear: age ? new Date().getFullYear() - age : null,
      sex: normalizeLegacySex(values.sex),
      goal: normalizeLegacyGoal(values.goal),
      diet: values.diet as DietType | null,
      calorieGoal: numberOrNull(values.calorieGoal),
      proteinGoalG: numberOrNull(values.proteinGoal),
      carbsGoalG: numberOrNull(values.carbsGoal),
      fatGoalG: numberOrNull(values.fatGoal),
    };
    const { error: goalError } = await supabase.from('user_goals').upsert(goalPayload(userId, legacy), { onConflict: 'user_id' });
    if (goalError) throw goalError;
  }

  if (values.weightHistory) {
    try {
      const entries = (JSON.parse(values.weightHistory) as WeightEntry[])
        .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && Number(entry.weight) > 0)
        .map((entry) => ({ user_id: userId, measured_on: entry.date, weight_kg: Number(entry.weight) }));
      if (entries.length) {
        const { error: historyError } = await supabase.from('weight_entries').upsert(entries, { onConflict: 'user_id,measured_on' });
        if (historyError) throw historyError;
      }
    } catch (historyError) {
      if (historyError instanceof SyntaxError) await AsyncStorage.removeItem('weightHistory');
      else throw historyError;
    }
  }

  await AsyncStorage.setItem(marker, new Date().toISOString());
}
