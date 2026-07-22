import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, type ColorValue, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import AuthScreen from '@/components/AuthScreen';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  calculateEnergyRecommendation,
  calculateMacroRecommendation,
  saveGoalProfile,
  type DietType,
  type GoalType,
  type SexType,
} from '@/lib/goals';
import { supabase } from '@/lib/supabase';

const sexOptions: SexType[] = ['female', 'male', 'prefer_not_to_say'];
const goalOptions: GoalType[] = ['lose', 'maintain', 'gain', 'gain_muscle'];
const dietOptions: DietType[] = ['balanced', 'high_protein', 'vegetarian', 'vegan', 'mediterranean', 'low_carb', 'keto'];

function numberValue(value: string) {
  return Number(value.replace(',', '.'));
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const softColor = isDarkMode ? '#203C33' : '#E5F4EF';
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<SexType>('prefer_not_to_say');
  const [goal, setGoal] = useState<GoalType>('lose');
  const [diet, setDiet] = useState<DietType>('balanced');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && !user) return <Redirect href="/login" />;

  const inputStyle = [styles.input, { backgroundColor: cardColor, borderColor, color: textColor }];

  const chooseGoal = (nextGoal: GoalType) => {
    setGoal(nextGoal);
    if (nextGoal === 'maintain' && !targetWeight.trim()) setTargetWeight(weight);
  };

  const saveProfile = async () => {
    if (!user || saving) return;
    const currentWeight = numberValue(weight);
    const target = goal === 'maintain' ? currentWeight : numberValue(targetWeight);
    const heightCm = numberValue(height);
    const ageYears = numberValue(age);
    if (
      !Number.isFinite(currentWeight) || currentWeight < 30 || currentWeight > 350
      || !Number.isFinite(target) || target < 30 || target > 350
      || !Number.isFinite(heightCm) || heightCm < 120 || heightCm > 230
      || !Number.isInteger(ageYears) || ageYears < 18 || ageYears > 100
    ) {
      return setError(t('onboarding_invalid'));
    }

    setSaving(true);
    setError(null);
    try {
      const energy = calculateEnergyRecommendation({ weightKg: currentWeight, heightCm, age: ageYears, sex, goal });
      const macros = calculateMacroRecommendation({ calories: energy.targetCalories, weightKg: currentWeight, heightCm, goal, diet });
      const today = new Date().toISOString().slice(0, 10);
      await saveGoalProfile(user.id, {
        currentWeightKg: currentWeight,
        targetWeightKg: target,
        startingWeightKg: currentWeight,
        goalStartedOn: today,
        heightCm,
        birthYear: new Date().getFullYear() - ageYears,
        sex,
        goal,
        diet,
        calorieGoal: macros.calories,
        proteinGoalG: macros.protein,
        carbsGoalG: macros.carbs,
        fatGoalG: macros.fats,
      });
      router.replace('/(tabs)');
    } catch {
      setError(t('onboarding_save_error'));
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase?.auth.signOut({ scope: 'local' });
    router.replace('/login');
  };

  if (loading) return <AuthScreen><ActivityIndicator size="large" color="#00A77D" /></AuthScreen>;

  return (
    <AuthScreen>
      <Text style={styles.eyebrow}>CALORFY · 1/1</Text>
      <Text style={[styles.title, { color: textColor }]}>{t('onboarding_title')}</Text>
      <Text style={[styles.intro, { color: mutedColor }]}>{t('onboarding_intro')}</Text>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('onboarding_measurements')}</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputColumn}>
            <Text style={[styles.label, { color: mutedColor }]}>{t('current_weight')}</Text>
            <TextInput accessibilityLabel={t('current_weight')} style={inputStyle} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="70 kg" placeholderTextColor={mutedColor} />
          </View>
          <View style={styles.inputColumn}>
            <Text style={[styles.label, { color: mutedColor }]}>{t('target_weight')}</Text>
            <TextInput accessibilityLabel={t('target_weight')} style={inputStyle} value={goal === 'maintain' ? weight : targetWeight} onChangeText={setTargetWeight} editable={goal !== 'maintain'} keyboardType="decimal-pad" placeholder="65 kg" placeholderTextColor={mutedColor} />
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputColumn}>
            <Text style={[styles.label, { color: mutedColor }]}>{t('height')}</Text>
            <TextInput accessibilityLabel={t('height')} style={inputStyle} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="170 cm" placeholderTextColor={mutedColor} />
          </View>
          <View style={styles.inputColumn}>
            <Text style={[styles.label, { color: mutedColor }]}>{t('age')}</Text>
            <TextInput accessibilityLabel={t('age')} style={inputStyle} value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="30" placeholderTextColor={mutedColor} />
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('onboarding_preferences')}</Text>
        <Text style={[styles.label, { color: mutedColor }]}>{t('sex')}</Text>
        <View style={styles.options}>{sexOptions.map((option) => <Option key={option} label={t(option)} selected={sex === option} onPress={() => setSex(option)} softColor={softColor} textColor={textColor} />)}</View>
        <Text style={[styles.label, styles.spacedLabel, { color: mutedColor }]}>{t('goal')}</Text>
        <View style={styles.options}>{goalOptions.map((option) => <Option key={option} label={t(option === 'lose' ? 'lose_weight' : option === 'maintain' ? 'maintain_weight' : option === 'gain' ? 'gain_weight' : 'gain_muscle')} selected={goal === option} onPress={() => chooseGoal(option)} softColor={softColor} textColor={textColor} />)}</View>
        <Text style={[styles.label, styles.spacedLabel, { color: mutedColor }]}>{t('diet')}</Text>
        <View style={styles.options}>{dietOptions.map((option) => <Option key={option} label={t(option)} selected={diet === option} onPress={() => setDiet(option)} softColor={softColor} textColor={textColor} />)}</View>
      </View>

      <Text style={[styles.note, { color: mutedColor }]}>{t('onboarding_calculation_note')}</Text>
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} style={[styles.primaryButton, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t('finish_setup')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.signOutButton} onPress={signOut} disabled={saving}>
        <Text style={[styles.signOutText, { color: mutedColor }]}>{t('sign_out')}</Text>
      </TouchableOpacity>
    </AuthScreen>
  );
}

function Option({ label, selected, onPress, softColor, textColor }: { label: string; selected: boolean; onPress: () => void; softColor: ColorValue; textColor: ColorValue }) {
  return (
    <TouchableOpacity accessibilityRole="radio" accessibilityState={{ selected }} style={[styles.option, { backgroundColor: softColor }, selected && styles.optionSelected]} onPress={onPress}>
      <Text style={[styles.optionText, { color: selected ? '#FFFFFF' : textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: '#008F6D', fontWeight: '900', fontSize: 12, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  intro: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 9, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 14 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 11 },
  inputColumn: { flex: 1 },
  label: { fontSize: 12, fontWeight: '800', marginBottom: 7 },
  spacedLabel: { marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 49, paddingHorizontal: 12, fontSize: 16, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 40, borderRadius: 20, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  optionSelected: { backgroundColor: '#00A77D' },
  optionText: { fontSize: 13, fontWeight: '800' },
  note: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginVertical: 6 },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginTop: 9 },
  primaryButton: { minHeight: 54, borderRadius: 27, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  signOutButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  signOutText: { fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
