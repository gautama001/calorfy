import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_PERSONAL_STORAGE_KEYS = new Set([
  'meals',
  'currentWeight',
  'targetWeight',
  'height',
  'age',
  'sex',
  'goal',
  'diet',
  'calorieGoal',
  'proteinGoal',
  'carbsGoal',
  'fatGoal',
  'weightHistory',
  'dailySteps',
  'dailyWater',
  'reminderOn',
  'notificationHour',
  'nutritionTargetsMode',
]);

export function isUserOwnedStorageKey(key: string, userId: string) {
  return key.includes(userId) || LEGACY_PERSONAL_STORAGE_KEYS.has(key);
}

export async function clearUserLocalData(userId: string) {
  const keys = await AsyncStorage.getAllKeys();
  const personalKeys = keys.filter((key) => isUserOwnedStorageKey(key, userId));
  if (personalKeys.length > 0) await AsyncStorage.multiRemove(personalKeys);
  return personalKeys;
}
