import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { calculateMacroRecommendation, readCachedGoalProfile, syncGoalProfile, updateNutritionTargets, type GoalProfile } from '@/lib/goals';
import i18n from '@/i18n';
import { clearUserLocalData } from '@/lib/localData';
import { PreferenceConflictError, readCachedUserPreferences, reloadRemoteUserPreferences, saveUserPreferences, syncUserPreferences, type NutritionTargetsMode, type UserPreferences } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';

const modeStorageKey = 'nutritionTargetsMode';

function numberValue(value: string) {
  return Number(value.replace(',', '.'));
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useThemeContext();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#61776F';
  const softColor = isDarkMode ? '#193229' : '#E9F7F2';
  const inputColor = isDarkMode ? '#1B2C26' : '#F7FAF9';

  const [profile, setProfile] = useState<GoalProfile | null>(null);
  const [mode, setMode] = useState<NutritionTargetsMode>('auto');
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('100');
  const [carbs, setCarbs] = useState('250');
  const [fats, setFats] = useState('67');
  const [notificationHour, setNotificationHour] = useState('13:00');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [accountAction, setAccountAction] = useState<'signout' | 'delete' | null>(null);
  const [accountActionError, setAccountActionError] = useState<string | null>(null);

  const recommendation = useMemo(() => calculateMacroRecommendation({
    calories: profile?.calorieGoal ?? (numberValue(calories) || 2000),
    weightKg: profile?.currentWeightKg ?? null,
    heightCm: profile?.heightCm ?? null,
    goal: profile?.goal ?? null,
    diet: profile?.diet ?? null,
  }), [calories, profile]);

  const applyTargets = (values: { calories: number; protein: number; carbs: number; fats: number }) => {
    setCalories(String(values.calories));
    setProtein(String(values.protein));
    setCarbs(String(values.carbs));
    setFats(String(values.fats));
  };

  useEffect(() => {
    let active = true;
    (async () => {
      let cached: GoalProfile | null = null;
      let targetMode: NutritionTargetsMode = 'auto';
      let localPreferences: UserPreferences | null = null;
      try {
        const [savedHour, savedMode, cachedProfile, cachedPreferences] = await Promise.all([
          AsyncStorage.getItem('notificationHour'),
          AsyncStorage.getItem(modeStorageKey),
          user ? readCachedGoalProfile(user.id) : Promise.resolve(null),
          user ? readCachedUserPreferences(user.id) : Promise.resolve(null),
        ]);
        cached = cachedProfile;
        localPreferences = cachedPreferences ?? {
          language: i18n.resolvedLanguage?.startsWith('en') ? 'en' : i18n.resolvedLanguage?.startsWith('pt') ? 'pt' : 'es',
          theme,
          reminderTime: savedHour ?? '13:00',
          nutritionTargetsMode: savedMode === 'manual' ? 'manual' : 'auto',
        };
        targetMode = localPreferences.nutritionTargetsMode;
        if (active) {
          setMode(targetMode);
          setNotificationHour(localPreferences.reminderTime);
          if (localPreferences.theme !== theme) setTheme(localPreferences.theme);
          if (!i18n.resolvedLanguage?.startsWith(localPreferences.language)) await i18n.changeLanguage(localPreferences.language);
          if (cached) {
            setProfile(cached);
            const suggested = calculateMacroRecommendation({ calories: cached.calorieGoal ?? 2000, weightKg: cached.currentWeightKg, heightCm: cached.heightCm, goal: cached.goal, diet: cached.diet });
            applyTargets(targetMode === 'auto' ? suggested : { calories: cached.calorieGoal ?? suggested.calories, protein: cached.proteinGoalG ?? suggested.protein, carbs: cached.carbsGoalG ?? suggested.carbs, fats: cached.fatGoalG ?? suggested.fats });
          }
        }
      } catch {
        if (active) Alert.alert(t('error'), t('error_loading_settings'));
      } finally {
        if (active) setLoading(false);
      }

      if (!user || !active) return;
      setSyncing(true);
      try {
        const [remote, remotePreferences] = await Promise.all([
          syncGoalProfile(user.id),
          syncUserPreferences(user.id, localPreferences ?? undefined),
        ]);
        targetMode = remotePreferences.nutritionTargetsMode;
        if (active && remote) {
          setProfile(remote);
          const suggested = calculateMacroRecommendation({ calories: remote.calorieGoal ?? 2000, weightKg: remote.currentWeightKg, heightCm: remote.heightCm, goal: remote.goal, diet: remote.diet });
          applyTargets(targetMode === 'auto' ? suggested : { calories: remote.calorieGoal ?? suggested.calories, protein: remote.proteinGoalG ?? suggested.protein, carbs: remote.carbsGoalG ?? suggested.carbs, fats: remote.fatGoalG ?? suggested.fats });
        }
        if (active) {
          setMode(remotePreferences.nutritionTargetsMode);
          setNotificationHour(remotePreferences.reminderTime);
          if (remotePreferences.theme !== theme) setTheme(remotePreferences.theme);
          if (!i18n.resolvedLanguage?.startsWith(remotePreferences.language)) await i18n.changeLanguage(remotePreferences.language);
        }
      } catch (error) {
        if (error instanceof PreferenceConflictError && active) {
          try {
            const remotePreferences = await reloadRemoteUserPreferences(user.id);
            setMode(remotePreferences.nutritionTargetsMode);
            setNotificationHour(remotePreferences.reminderTime);
            if (remotePreferences.theme !== theme) setTheme(remotePreferences.theme);
            if (!i18n.resolvedLanguage?.startsWith(remotePreferences.language)) await i18n.changeLanguage(remotePreferences.language);
            Alert.alert(t('preferences_conflict_title'), t('preferences_conflict_message'));
          } catch {
            // Cached values remain available until the next online sync.
          }
        }
        // Cached values remain available while the network is unavailable.
      } finally {
        if (active) setSyncing(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id]);

  const selectAutomatic = () => {
    setMode('auto');
    applyTargets(recommendation);
  };

  const currentTotal = Math.max(1, numberValue(protein) * 4 + numberValue(carbs) * 4 + numberValue(fats) * 9);
  const macroCards = [
    { key: 'protein', label: t('protein'), value: protein, setter: setProtein, color: '#25B58B', percent: Math.round(numberValue(protein) * 4 / currentTotal * 100) },
    { key: 'carbs', label: t('carbs'), value: carbs, setter: setCarbs, color: '#E6A13A', percent: Math.round(numberValue(carbs) * 4 / currentTotal * 100) },
    { key: 'fats', label: t('fats'), value: fats, setter: setFats, color: '#7D72D8', percent: Math.round(numberValue(fats) * 9 / currentTotal * 100) },
  ];

  const goalLabel = profile?.goal ? t(profile.goal === 'maintain' ? 'maintain_weight' : profile.goal === 'lose' ? 'lose_weight' : profile.goal === 'gain' ? 'gain_weight' : 'gain_muscle') : null;
  const dietLabel = profile?.diet ? t(profile.diet === 'raw' ? 'raw_food' : profile.diet) : null;

  const handleSave = async () => {
    const values = [calories, protein, carbs, fats].map(numberValue);
    if (!user || values.some((value) => !Number.isFinite(value) || value <= 0)) return Alert.alert(t('error'), t('please_enter_valid_numbers'));
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(notificationHour)) return Alert.alert(t('error'), t('invalid_reminder_time'));
    setSaving(true);
    try {
      const language = i18n.resolvedLanguage?.startsWith('en') ? 'en' : i18n.resolvedLanguage?.startsWith('pt') ? 'pt' : 'es';
      const savedPreferences = await saveUserPreferences(user.id, { language, theme, reminderTime: notificationHour, nutritionTargetsMode: mode });
      await updateNutritionTargets(user.id, { calorieGoal: values[0], proteinGoalG: values[1], carbsGoalG: values[2], fatGoalG: values[3] });
      await Promise.all([AsyncStorage.setItem('notificationHour', notificationHour), AsyncStorage.setItem(modeStorageKey, mode)]);
      Alert.alert(t('saved'), t(savedPreferences.syncStatus === 'pending' ? 'settings_saved_offline' : 'settings_saved'));
    } catch (error) {
      if (error instanceof PreferenceConflictError) {
        try {
          const remotePreferences = await reloadRemoteUserPreferences(user.id);
          setMode(remotePreferences.nutritionTargetsMode);
          setNotificationHour(remotePreferences.reminderTime);
          if (remotePreferences.theme !== theme) setTheme(remotePreferences.theme);
          if (!i18n.resolvedLanguage?.startsWith(remotePreferences.language)) await i18n.changeLanguage(remotePreferences.language);
        } catch { /* The next sync will retry loading the remote value. */ }
        Alert.alert(t('preferences_conflict_title'), t('preferences_conflict_message'));
      } else Alert.alert(t('error'), t('error_saving_settings'));
    }
    finally { setSaving(false); }
  };

  const changeLanguage = async (language: 'en' | 'es' | 'pt') => {
    try { await i18n.changeLanguage(language); }
    catch { Alert.alert(t('error'), t('error_changing_language')); }
  };

  const signOut = async () => {
    if (signingOut || !supabase || !user) return;
    setSigningOut(true);
    setAccountActionError(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      await clearUserLocalData(user.id);
      setAccountAction(null);
      router.replace('/login');
    } catch {
      setAccountActionError(t('auth_network_error'));
    } finally {
      setSigningOut(false);
    }
  };

  const deleteAccount = async () => {
    if (!supabase || !user) return;
    setDeleting(true);
    setAccountActionError(null);
    try {
      const { error } = await supabase.functions.invoke('delete-account', { body: { confirmation: 'DELETE' } });
      if (error) throw error;
      await clearUserLocalData(user.id);
      await supabase.auth.signOut({ scope: 'local' });
      setAccountAction(null);
      router.replace({ pathname: '/login', params: { deleted: '1' } });
    } catch {
      setAccountActionError(t('account_delete_error'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <View style={[styles.loading, { backgroundColor }]}><ActivityIndicator size="large" color="#00A77D" /></View>;

  return (
    <>
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>{t('settings_eyebrow').toUpperCase()}</Text>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: textColor }]}>{t('settings_title')}</Text>
        {syncing ? <ActivityIndicator size="small" color="#00A77D" /> : null}
      </View>
      <Text style={[styles.intro, { color: mutedColor }]}>{t('settings_intro')}</Text>

      <View style={[styles.hero, { backgroundColor: isDarkMode ? '#153D32' : '#153F34' }]}>
        <View style={styles.heroTop}><View style={styles.heroIcon}><Ionicons name="sparkles" size={21} color="#0FC99A" /></View><View style={{ flex: 1 }}><Text style={styles.heroEyebrow}>{t('automatic_recommendation').toUpperCase()}</Text><Text style={styles.heroTitle}>{recommendation.calories} kcal</Text></View><View style={styles.autoBadge}><Text style={styles.autoBadgeText}>{mode === 'auto' ? 'AUTO' : t('manual_targets').toUpperCase()}</Text></View></View>
        <Text style={styles.heroBody}>{t('based_on_your_profile')}</Text>
        {goalLabel || dietLabel ? <Text style={styles.heroContext}>{t('configured_for')}: {[goalLabel, dietLabel].filter(Boolean).join(' · ')}</Text> : <Text style={styles.heroContext}>{t('profile_incomplete')}</Text>}
        <View style={styles.recommendationMacros}><Text style={styles.recommendationMacro}>P {recommendation.protein} g</Text><Text style={styles.recommendationMacro}>C {recommendation.carbs} g</Text><Text style={styles.recommendationMacro}>{t('fats').charAt(0)} {recommendation.fats} g</Text></View>
        {mode === 'manual' ? <TouchableOpacity style={styles.useRecommendation} onPress={selectAutomatic}><Ionicons name="refresh" size={17} color="#FFFFFF" /><Text style={styles.useRecommendationText}>{t('use_recommendation')}</Text></TouchableOpacity> : null}
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, { color: textColor }]}>{t('nutrition_targets')}</Text><Text style={[styles.sectionSubtitle, { color: mutedColor }]}>{mode === 'auto' ? t('automatic_recommendation') : t('manual_targets')}</Text></View><TouchableOpacity style={[styles.modeButton, { backgroundColor: softColor }]} onPress={() => mode === 'auto' ? setMode('manual') : selectAutomatic()}><Ionicons name={mode === 'auto' ? 'create-outline' : 'sparkles-outline'} size={16} color="#00A77D" /><Text style={styles.modeButtonText}>{mode === 'auto' ? t('edit_manually') : t('use_recommendation')}</Text></TouchableOpacity></View>

        <Text style={[styles.fieldLabel, { color: mutedColor }]}>{t('calorie_target')}</Text>
        <View style={[styles.calorieInput, { backgroundColor: inputColor, borderColor }]}><Ionicons name="flame-outline" size={21} color="#E58535" /><TextInput editable={mode === 'manual'} style={[styles.calorieText, { color: textColor }]} keyboardType="numeric" value={calories} onChangeText={setCalories} /><Text style={[styles.unit, { color: mutedColor }]}>kcal</Text></View>

        <Text style={[styles.fieldLabel, { color: mutedColor }]}>{t('macro_distribution')}</Text>
        <View style={styles.macroGrid}>{macroCards.map((macro) => <View key={macro.key} style={[styles.macroCard, { backgroundColor: inputColor, borderColor }]}><View style={[styles.macroDot, { backgroundColor: macro.color }]} /><Text style={[styles.macroLabel, { color: mutedColor }]}>{macro.label}</Text><View style={styles.macroValueRow}><TextInput editable={mode === 'manual'} style={[styles.macroInput, { color: textColor }]} keyboardType="numeric" value={macro.value} onChangeText={macro.setter} /><Text style={[styles.macroUnit, { color: mutedColor }]}>g</Text></View><Text style={[styles.percent, { color: macro.color }]}>{macro.percent}%</Text></View>)}</View>
        <Text style={[styles.note, { color: mutedColor }]}>{t('recommendation_note')}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('preferences')}</Text>
        <View style={[styles.preferenceRow, { borderBottomColor: borderColor }]}><View style={[styles.preferenceIcon, { backgroundColor: softColor }]}><Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={19} color="#00A77D" /></View><View style={{ flex: 1 }}><Text style={[styles.preferenceTitle, { color: textColor }]}>{t('appearance')}</Text><Text style={[styles.preferenceBody, { color: mutedColor }]}>{t('dark_mode')}</Text></View><Switch value={theme === 'dark'} onValueChange={(value) => setTheme(value ? 'dark' : 'light')} trackColor={{ false: '#B7C7C1', true: '#00A77D' }} thumbColor="#FFFFFF" /></View>
        <View style={[styles.preferenceRow, { borderBottomColor: borderColor }]}><View style={[styles.preferenceIcon, { backgroundColor: softColor }]}><Ionicons name="notifications-outline" size={19} color="#00A77D" /></View><View style={{ flex: 1 }}><Text style={[styles.preferenceTitle, { color: textColor }]}>{t('reminders')}</Text><Text style={[styles.preferenceBody, { color: mutedColor }]}>{t('reminder_hint')}</Text></View><TextInput style={[styles.timeInput, { color: textColor, backgroundColor: inputColor, borderColor }]} value={notificationHour} onChangeText={setNotificationHour} maxLength={5} keyboardType="numbers-and-punctuation" /></View>
        <View style={styles.languageSection}><View style={styles.preferenceTitleRow}><View style={[styles.preferenceIcon, { backgroundColor: softColor }]}><Ionicons name="language-outline" size={19} color="#00A77D" /></View><Text style={[styles.preferenceTitle, { color: textColor }]}>{t('language')}</Text></View><View style={styles.languages}>{([['en', require('../../../assets/flags/gb.png'), 'English'], ['es', require('../../../assets/flags/es.png'), 'Español'], ['pt', require('../../../assets/flags/pt.png'), 'Português']] as const).map(([code, flag, label]) => { const selected = i18n.resolvedLanguage?.startsWith(code); return <TouchableOpacity key={code} style={[styles.languageButton, { borderColor }, selected && styles.languageSelected]} onPress={() => changeLanguage(code)}><Image source={flag} style={styles.flag} /><Text style={[styles.languageLabel, { color: textColor }]}>{label}</Text>{selected ? <Ionicons name="checkmark-circle" size={17} color="#00A77D" /> : null}</TouchableOpacity>; })}</View></View>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('account')}</Text>
        <Text style={[styles.accountEmail, { color: mutedColor }]}>{t('signed_in_as')} {user?.email ?? ''}</Text>
        <TouchableOpacity style={[styles.accountRow, { borderColor }]} onPress={() => router.push('/settings/professionals' as Href)}><Ionicons name="people-outline" size={20} color="#00A77D" /><View style={{ flex: 1 }}><Text style={[styles.accountRowText, { color: textColor }]}>{t('professional_connections')}</Text><Text style={[styles.preferenceBody, { color: mutedColor }]}>{t('professional_connections_hint')}</Text></View><Ionicons name="chevron-forward" size={18} color={mutedColor} /></TouchableOpacity>
        <TouchableOpacity style={[styles.accountRow, { borderColor }]} onPress={() => router.push('/settings/support' as Href)}><Ionicons name="help-circle-outline" size={20} color="#00A77D" /><Text style={[styles.accountRowText, { color: textColor }]}>{t('support')}</Text><Ionicons name="chevron-forward" size={18} color={mutedColor} /></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('sign_out')} style={[styles.accountRow, { borderColor }]} onPress={() => { setAccountActionError(null); setAccountAction('signout'); }}><Ionicons name="log-out-outline" size={20} color="#D47B32" /><Text style={[styles.accountRowText, { color: textColor }]}>{t('sign_out')}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('delete_account')} style={styles.deleteButton} onPress={() => { setAccountActionError(null); setAccountAction('delete'); }} disabled={deleting}>{deleting ? <ActivityIndicator color="#B42318" /> : <><Ionicons name="trash-outline" size={19} color="#B42318" /><Text style={styles.deleteText}>{t('delete_account')}</Text></>}</TouchableOpacity>
        {deleting ? <Text style={styles.deletingText}>{t('deleting_account')}</Text> : null}
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.65 }]} onPress={handleSave} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" /><Text style={styles.saveText}>{t('save')}</Text></>}</TouchableOpacity>
    </ScrollView>

    <Modal transparent visible={accountAction !== null} animationType="fade" onRequestClose={() => { if (!deleting && !signingOut) setAccountAction(null); }}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: cardColor, borderColor }]}>
          <View style={[styles.modalIcon, { backgroundColor: accountAction === 'delete' ? (isDarkMode ? '#3B201F' : '#FDECEA') : softColor }]}>
            <Ionicons name={accountAction === 'delete' ? 'trash-outline' : 'log-out-outline'} size={26} color={accountAction === 'delete' ? '#B42318' : '#D47B32'} />
          </View>
          <Text style={[styles.modalTitle, { color: textColor }]}>{t(accountAction === 'delete' ? 'delete_account_title' : 'sign_out_title')}</Text>
          <Text style={[styles.modalBody, { color: mutedColor }]}>{t(accountAction === 'delete' ? 'delete_account_body' : 'sign_out_body')}</Text>
          {accountActionError ? <Text style={styles.modalError} accessibilityLiveRegion="polite">{accountActionError}</Text> : null}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: deleting || signingOut, busy: deleting || signingOut }} style={[styles.modalPrimary, accountAction === 'delete' && styles.modalDanger, (deleting || signingOut) && styles.modalDisabled]} onPress={() => accountAction === 'delete' ? void deleteAccount() : void signOut()} disabled={deleting || signingOut}>
            {deleting || signingOut ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>{t(accountAction === 'delete' ? 'delete_account_confirm' : 'sign_out')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={[styles.modalCancel, { borderColor }]} onPress={() => setAccountAction(null)} disabled={deleting || signingOut}>
            <Text style={[styles.modalCancelText, { color: textColor }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingTop: 24, paddingBottom: 120 },
  eyebrow: { color: '#00A77D', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  title: { fontSize: 30, fontWeight: '900', marginTop: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  intro: { fontSize: 13, lineHeight: 20, marginTop: 5, marginBottom: 17 },
  hero: { borderRadius: 22, padding: 17, marginBottom: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#24584A', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  heroEyebrow: { color: '#8FC8B8', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 1 },
  autoBadge: { backgroundColor: '#24584A', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  autoBadgeText: { color: '#41D6AE', fontSize: 8, fontWeight: '900' },
  heroBody: { color: '#CEE3DC', fontSize: 12, lineHeight: 17, marginTop: 12 },
  heroContext: { color: '#8FC8B8', fontSize: 10, marginTop: 4 },
  recommendationMacros: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2B5C4F' },
  recommendationMacro: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  useRecommendation: { minHeight: 42, borderRadius: 12, backgroundColor: '#00A77D', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  useRecommendationText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  card: { borderWidth: 1, borderRadius: 21, padding: 16, marginBottom: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  sectionSubtitle: { fontSize: 10, marginTop: 3 },
  modeButton: { minHeight: 38, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', gap: 5, alignItems: 'center' },
  modeButtonText: { color: '#008F6D', fontSize: 9, fontWeight: '900' },
  fieldLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 17, marginBottom: 7 },
  calorieInput: { height: 52, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  calorieText: { flex: 1, fontSize: 19, fontWeight: '900', marginLeft: 9 },
  unit: { fontSize: 11, fontWeight: '800' },
  macroGrid: { flexDirection: 'row', gap: 7 },
  macroCard: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 15, padding: 10 },
  macroDot: { width: 22, height: 4, borderRadius: 2, marginBottom: 8 },
  macroLabel: { fontSize: 9, fontWeight: '800' },
  macroValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  macroInput: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: '900', padding: 0 },
  macroUnit: { fontSize: 10 },
  percent: { fontSize: 9, fontWeight: '900', marginTop: 4 },
  note: { fontSize: 9, lineHeight: 14, marginTop: 12 },
  preferenceRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  preferenceIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  preferenceTitle: { fontSize: 13, fontWeight: '900' },
  preferenceBody: { fontSize: 10, marginTop: 3 },
  timeInput: { width: 70, height: 40, borderWidth: 1, borderRadius: 11, textAlign: 'center', fontSize: 13, fontWeight: '900' },
  languageSection: { paddingTop: 14 },
  preferenceTitleRow: { flexDirection: 'row', alignItems: 'center' },
  languages: { gap: 7, marginTop: 10 },
  languageButton: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' },
  languageSelected: { borderColor: '#00A77D', borderWidth: 2 },
  flag: { width: 27, height: 19, borderRadius: 3, marginRight: 10 },
  languageLabel: { flex: 1, fontSize: 12, fontWeight: '800' },
  accountEmail: { fontSize: 11, marginTop: 5, marginBottom: 9 },
  accountRow: { minHeight: 50, borderTopWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  accountRowText: { flex: 1, fontSize: 12, fontWeight: '800' },
  deleteButton: { minHeight: 48, borderRadius: 13, backgroundColor: '#FDECEA', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  deleteText: { color: '#B42318', fontSize: 12, fontWeight: '900' },
  deletingText: { color: '#B42318', fontSize: 10, textAlign: 'center', marginTop: 7 },
  saveButton: { minHeight: 56, borderRadius: 17, backgroundColor: '#00A77D', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', padding: 22, alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '100%', maxWidth: 430, borderWidth: 1, borderRadius: 24, padding: 21, alignItems: 'center' },
  modalIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center' },
  modalBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  modalError: { color: '#B42318', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 13 },
  modalPrimary: { width: '100%', minHeight: 50, borderRadius: 25, backgroundColor: '#D47B32', alignItems: 'center', justifyContent: 'center' },
  modalDanger: { backgroundColor: '#B42318' },
  modalPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  modalCancel: { width: '100%', minHeight: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  modalCancelText: { fontSize: 14, fontWeight: '800' },
  modalDisabled: { opacity: 0.6 },
});
