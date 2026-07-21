import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  calculateWeightProgress,
  calculateMacroRecommendation,
  calculateEnergyRecommendation,
  type DietType,
  type GoalProfile,
  type GoalType,
  readCachedGoalProfile,
  readCachedWeightHistory,
  saveGoalProfile,
  saveWeightEntry,
  type SexType,
  syncGoalProfile,
  syncWeightHistory,
  type WeightEntry,
} from '@/lib/goals';

const GREEN = '#00A77D';
const DARK_GREEN = '#173C32';
type ChartRange = '7d' | '1m' | '12m';

function rangeStartDate(range: ChartRange) {
  const date = new Date(`${localDateString()}T12:00:00`);
  if (range === '7d') date.setDate(date.getDate() - 6);
  else if (range === '1m') date.setMonth(date.getMonth() - 1);
  else date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

function downsample<T>(values: T[], maximum: number) {
  if (values.length <= maximum) return values;
  return Array.from({ length: maximum }, (_, index) => values[Math.round(index * (values.length - 1) / (maximum - 1))]);
}

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function Field({ label, value, onChangeText, suffix, keyboardType = 'decimal-pad' }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix?: string;
  keyboardType?: 'decimal-pad' | 'number-pad';
}) {
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: isDarkMode ? '#AFC1BB' : '#557068' }]}>{label}</Text>
      <View style={[styles.inputShell, { backgroundColor: cardColor, borderColor }]}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          placeholder="—"
          placeholderTextColor="#9AAFA8"
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function Metric({ label, value, light = false }: { label: string; value: string; light?: boolean }) {
  const { textColor, isDarkMode } = useAppTheme();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: textColor }, light && styles.metricValueLight]}>{value}</Text>
      <Text style={[styles.metricLabel, isDarkMode && { color: '#9DB1AA' }, light && styles.metricLabelLight]}>{label}</Text>
    </View>
  );
}

function SelectField<T extends string>({ label, value, onChange, options }: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const { textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const selected = options.find((option) => option.value === value);
  return (
    <View>
      <Text style={[styles.label, { color: isDarkMode ? '#AFC1BB' : '#557068' }]}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.selectControl, { backgroundColor: cardColor, borderColor }, open && styles.selectControlOpen]}
        onPress={() => setOpen((current) => !current)}
      >
        <Text style={[styles.selectValue, { color: textColor }]}>{selected?.label ?? '—'}</Text>
        <View style={styles.selectChevron}><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={GREEN} /></View>
      </TouchableOpacity>
      {open ? (
        <View style={[styles.selectMenu, { backgroundColor: cardColor, borderColor }]}>
          {options.map((option, index) => {
            const active = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.selectOption, { borderBottomColor: borderColor }, index === options.length - 1 && styles.selectOptionLast, active && styles.selectOptionActive, active && isDarkMode && { backgroundColor: '#203C33' }]}
                onPress={() => { onChange(option.value); setOpen(false); }}
              >
                <Text style={[styles.selectOptionText, { color: textColor }, active && styles.selectOptionTextActive]}>{option.label}</Text>
                {active ? <Ionicons name="checkmark-circle" size={19} color={GREEN} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default function GoalsScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const { width } = useWindowDimensions();
  const [weight, setWeight] = useState('');
  const [weighInInput, setWeighInInput] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<SexType>('prefer_not_to_say');
  const [goal, setGoal] = useState<GoalType>('maintain');
  const [diet, setDiet] = useState<DietType>('balanced');
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [startingWeight, setStartingWeight] = useState<number | null>(null);
  const [startingWeightInput, setStartingWeightInput] = useState('');
  const [persistedCurrentWeight, setPersistedCurrentWeight] = useState<number | null>(null);
  const [goalStartedOn, setGoalStartedOn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>('7d');

  const applyProfile = (profile: GoalProfile | null) => {
    if (!profile) return;
    setWeight(profile.currentWeightKg?.toString() ?? '');
    setWeighInInput(profile.currentWeightKg?.toString() ?? '');
    setPersistedCurrentWeight(profile.currentWeightKg);
    setTargetWeight(profile.targetWeightKg?.toString() ?? '');
    setStartingWeight(profile.startingWeightKg);
    setStartingWeightInput(profile.startingWeightKg?.toString() ?? profile.currentWeightKg?.toString() ?? '');
    setGoalStartedOn(profile.goalStartedOn);
    setHeight(profile.heightCm?.toString() ?? '');
    setAge(profile.birthYear ? String(new Date().getFullYear() - profile.birthYear) : '');
    setSex(profile.sex ?? 'prefer_not_to_say');
    setGoal(profile.goal ?? 'maintain');
    setDiet(profile.diet === 'raw' ? 'vegan' : profile.diet ?? 'balanced');
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [cachedGoal, cachedHistory] = await Promise.all([
          readCachedGoalProfile(user.id),
          readCachedWeightHistory(user.id),
        ]);
        if (active) {
          applyProfile(cachedGoal);
          setWeightHistory(cachedHistory);
        }
        const [remoteGoal, remoteHistory] = await Promise.all([
          syncGoalProfile(user.id),
          syncWeightHistory(user.id),
        ]);
        if (active) {
          applyProfile(remoteGoal);
          setWeightHistory(remoteHistory);
        }
      } catch {
        if (active) Alert.alert(t('sync_pending_title'), t('sync_pending_body'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id, t]);

  const currentNumber = parseNumber(weight);
  const weighInNumber = parseNumber(weighInInput);
  const targetNumber = parseNumber(targetWeight);
  const startingNumber = parseNumber(startingWeightInput);
  const heightNumber = parseNumber(height);
  const ageNumber = parseNumber(age);

  const bmi = currentNumber && heightNumber && currentNumber > 0 && heightNumber > 0
    ? currentNumber / ((heightNumber / 100) ** 2)
    : null;
  const bmiStatus = bmi === null ? null : bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy' : bmi < 30 ? 'overweight' : 'obese';

  const nutrition = useMemo(() => {
    if (!(currentNumber && heightNumber && ageNumber && currentNumber > 0 && heightNumber > 0 && ageNumber >= 18 && ageNumber <= 100)) return null;
    const energy = calculateEnergyRecommendation({ weightKg: currentNumber, heightCm: heightNumber, age: ageNumber, sex, goal });
    return { ...calculateMacroRecommendation({ calories: energy.targetCalories, weightKg: currentNumber, heightCm: heightNumber, goal, diet }), ...energy };
  }, [ageNumber, currentNumber, diet, goal, heightNumber, sex]);

  const progress = useMemo(
    () => calculateWeightProgress(weightHistory, targetNumber, persistedCurrentWeight, startingWeight, goalStartedOn),
    [goalStartedOn, persistedCurrentWeight, startingWeight, targetNumber, weightHistory],
  );
  const progressPercent = Math.round(progress.progress * 100);
  const allTrendEntries = useMemo(() => {
    const points: Array<WeightEntry & { kind?: 'start' | 'current' }> = [];
    if (startingWeight && goalStartedOn) points.push({ date: goalStartedOn, weight: startingWeight, kind: 'start' });
    for (const entry of weightHistory) {
      const last = points.at(-1);
      if (!last || last.date !== entry.date || Math.abs(last.weight - entry.weight) >= 0.01) points.push(entry);
    }
    points.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'start' ? -1 : b.kind === 'start' ? 1 : 0));
    const last = points.at(-1);
    if (persistedCurrentWeight && (!last || Math.abs(last.weight - persistedCurrentWeight) >= 0.01)) {
      points.push({ date: localDateString(), weight: persistedCurrentWeight, kind: 'current' });
    }
    return points;
  }, [goalStartedOn, persistedCurrentWeight, startingWeight, weightHistory]);
  const chartCutoff = rangeStartDate(chartRange);
  const chartEntries = useMemo(() => {
    const filtered = allTrendEntries.filter((entry) => entry.date >= chartCutoff);
    return downsample(filtered, chartRange === '7d' ? 8 : chartRange === '1m' ? 16 : 24);
  }, [allTrendEntries, chartCutoff, chartRange]);
  const rangeRecordCount = Math.max(weightHistory.filter((entry) => entry.date >= chartCutoff).length, persistedCurrentWeight ? 1 : 0);
  const locale = i18n.resolvedLanguage ?? 'es';
  const formatWeight = (value: number | null, signed = false) => {
    if (value === null) return '—';
    const prefix = signed && value > 0 ? '+' : '';
    return `${prefix}${value.toLocaleString(locale, { maximumFractionDigits: 1 })} kg`;
  };
  const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: '2-digit', month: 'short' });

  const handleSave = async () => {
    if (!user || !nutrition || !(currentNumber && targetNumber && heightNumber && ageNumber)) {
      return Alert.alert(t('error'), t('please_enter_valid_numbers'));
    }
    setSaving(true);
    try {
      const saved = await saveGoalProfile(user.id, {
        currentWeightKg: currentNumber,
        targetWeightKg: targetNumber,
        startingWeightKg: startingNumber ?? currentNumber,
        goalStartedOn,
        heightCm: heightNumber,
        birthYear: new Date().getFullYear() - ageNumber,
        sex,
        goal,
        diet,
        calorieGoal: nutrition.calories,
        proteinGoalG: nutrition.protein,
        carbsGoalG: nutrition.carbs,
        fatGoalG: nutrition.fats,
      });
      applyProfile(saved);
      setWeightHistory(await syncWeightHistory(user.id));
      Alert.alert(t('saved'), t('goals_saved'));
    } catch {
      Alert.alert(t('goals_save_error_title'), t('connection_retry'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!user || !(weighInNumber && weighInNumber > 0 && weighInNumber < 500)) {
      return Alert.alert(t('error'), t('please_enter_valid_numbers'));
    }
    const measurementDate = localDateString();
    setSavingWeight(true);
    try {
      const saved = await saveWeightEntry(user.id, weighInNumber, measurementDate);
      if (saved.profile.currentWeightKg !== weighInNumber) {
        throw new Error('Supabase did not confirm the requested weight');
      }
      setWeightHistory(saved.history);
      applyProfile(saved.profile);
      Alert.alert(t('saved'), `${t('current_weight')}: ${formatWeight(weighInNumber)}`);
    } catch {
      Alert.alert(t('weight_save_error_title'), t('connection_retry'));
    } finally {
      setSavingWeight(false);
    }
  };

  if (loading) return <View style={[styles.loading, { backgroundColor }]}><ActivityIndicator color={GREEN} size="large" /></View>;

  const chartWidth = Math.min(Math.max(width - 72, 280), 624);
  const mutedColor = isDarkMode ? '#9DB1AA' : '#71877F';
  const softSurface = isDarkMode ? '#1C312A' : '#F0F6F4';
  const inputSurface = isDarkMode ? '#10201B' : '#FAFCFB';
  const chartSurface = isDarkMode ? '#14251F' : '#FFFFFF';
  const gridColor = isDarkMode ? '#2A4039' : '#E8F0ED';

  return (
    <ScrollView style={[styles.screen, { backgroundColor }]} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{t('progress').toUpperCase()}</Text>
          <Text style={[styles.title, { color: textColor }]}>{t('goals')}</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: softSurface }]}><Ionicons name="flag" size={22} color={GREEN} /></View>
      </View>

      <View style={[styles.card, styles.progressCard]}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.cardEyebrow}>{t('weight_progress')}</Text>
            <Text style={styles.heroValue}>{formatWeight(progress.currentWeight)}</Text>
            <Text style={styles.heroCaption}>{t('target_weight')}: {formatWeight(targetNumber)}</Text>
          </View>
          <View style={styles.percentBadge}><Text style={styles.percentText}>{progressPercent}%</Text></View>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPercent}%` }]} /></View>
        <Text style={styles.progressCaption}>{progressPercent}% {t('completed')}</Text>
        <View style={styles.metricsRow}>
          <Metric light label={t('start_weight')} value={formatWeight(progress.startWeight)} />
          <Metric light label={t('total_change')} value={formatWeight(progress.totalChange, true)} />
          <Metric light label={t('remaining')} value={formatWeight(progress.remaining)} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t('weight_trend')}</Text>
            <Text style={[styles.sectionSubtitle, { color: mutedColor }]}>{rangeRecordCount} {t('measurements')} · {t('weekly_change')}: {formatWeight(progress.weeklyChange, true)}</Text>
          </View>
          <Ionicons name="trending-down" size={22} color={GREEN} />
        </View>
        <View style={[styles.rangeSelector, { backgroundColor: softSurface }]}>
          {(['7d', '1m', '12m'] as ChartRange[]).map((range) => (
            <TouchableOpacity key={range} style={[styles.rangeButton, chartRange === range && styles.rangeButtonActive, chartRange === range && { backgroundColor: cardColor }]} onPress={() => setChartRange(range)}>
              <Text style={[styles.rangeButtonText, { color: mutedColor }, chartRange === range && styles.rangeButtonTextActive]}>{t(`range_${range}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {chartEntries.length >= 2 && targetNumber ? (
          <>
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: GREEN }]} /><Text style={[styles.legendText, { color: mutedColor }]}>{t('current_weight')}</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F0A43A' }]} /><Text style={[styles.legendText, { color: mutedColor }]}>{t('goal_line')}</Text></View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: chartEntries.map((entry) => entry.kind === 'start' ? t('start_label') : entry.kind === 'current' ? t('today_label') : entry.date.slice(5).replace('-', '/')),
                  datasets: [
                    { data: chartEntries.map((entry) => entry.weight), color: (opacity = 1) => `rgba(0, 167, 125, ${opacity})`, strokeWidth: 3 },
                    { data: chartEntries.map(() => targetNumber), color: (opacity = 1) => `rgba(240, 164, 58, ${opacity})`, strokeWidth: 2 },
                  ],
                }}
                width={Math.max(chartWidth, chartEntries.length * 54)}
                height={230}
                yAxisSuffix=" kg"
                formatYLabel={(value) => Math.round(Number(value)).toString()}
                withShadow={false}
                withInnerLines
                chartConfig={{
                  backgroundGradientFrom: chartSurface, backgroundGradientTo: chartSurface, decimalPlaces: 0,
                  color: (opacity = 1) => isDarkMode ? `rgba(224, 241, 235, ${opacity})` : `rgba(23, 60, 50, ${opacity})`, labelColor: () => mutedColor,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: chartSurface },
                  propsForBackgroundLines: { stroke: gridColor, strokeDasharray: '4 5' },
                }}
                bezier
                style={styles.chart}
              />
            </ScrollView>
          </>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="analytics-outline" size={34} color="#8CB4A8" />
            <Text style={[styles.emptyText, { color: mutedColor }]}>{chartEntries.length ? t('add_more_weights') : t('add_first_weight')}</Text>
          </View>
        )}

        <View style={styles.quickWeightRow}>
          <View style={[styles.quickWeightInput, { backgroundColor: inputSurface, borderColor }]}><TextInput style={[styles.input, { color: textColor }]} keyboardType="decimal-pad" value={weighInInput} onChangeText={setWeighInInput} /><Text style={[styles.suffix, { color: mutedColor }]}>kg</Text></View>
          <TouchableOpacity style={[styles.primaryButton, styles.quickWeightButton, savingWeight && styles.disabled]} onPress={handleSaveWeight} disabled={savingWeight}>
            {savingWeight ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('save_today_weight')}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {weightHistory.length > 0 ? (
        <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('latest_records')}</Text>
          {[...weightHistory].slice(-5).reverse().map((entry, index, recent) => {
            const older = recent[index + 1];
            const change = older ? entry.weight - older.weight : null;
            const desiredDirection = targetNumber && progress.startWeight && targetNumber > progress.startWeight ? 1 : -1;
            const isPositiveChange = change !== null && change * desiredDirection > 0;
            return (
              <View key={entry.date} style={[styles.historyRow, { borderBottomColor: borderColor }, index === Math.min(4, weightHistory.length - 1) && styles.historyRowLast]}>
                <View><Text style={[styles.historyDate, { color: textColor }]}>{formatDate(entry.date)}</Text><Text style={[styles.historyMeta, { color: mutedColor }]}>{entry.date === localDateString() ? t('today_label') : entry.date}</Text></View>
                <View style={styles.historyValues}><Text style={[styles.historyWeight, { color: textColor }]}>{formatWeight(entry.weight)}</Text><Text style={[styles.historyChange, isPositiveChange && styles.positiveChange]}>{change === null ? t('no_change') : formatWeight(change, true)}</Text></View>
              </View>
            );
          })}
        </View>
      ) : null}

      {nutrition ? (
        <View style={[styles.card, styles.planCard, { backgroundColor: isDarkMode ? '#163229' : '#E9F8F3', borderColor: isDarkMode ? '#285044' : '#CDEBE1' }]}>
          <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: textColor }]}>{t('plan_summary')}</Text><Text style={styles.calorieValue}>{nutrition.calories} kcal</Text></View>
          <View style={styles.macroRow}>
            <Metric label={t('protein')} value={`${nutrition.protein} g`} />
            <Metric label={t('carbs')} value={`${nutrition.carbs} g`} />
            <Metric label={t('fats')} value={`${nutrition.fats} g`} />
          </View>
          <View style={[styles.energyBreakdown, { borderTopColor: borderColor }]}>
            <Metric label={t('resting_energy')} value={`${nutrition.restingCalories} kcal`} />
            <Metric label={t('sedentary_maintenance')} value={`${nutrition.sedentaryCalories} kcal`} />
            <Metric label={t('goal_adjustment')} value={`${nutrition.adjustmentCalories > 0 ? '+' : ''}${nutrition.adjustmentCalories} kcal`} />
          </View>
          {bmi && bmiStatus ? <Text style={[styles.bmiText, { color: isDarkMode ? '#C4DED5' : '#325D51' }]}>{t('bmiResult')}: {bmi.toFixed(1)} · {t(bmiStatus)}</Text> : null}
          <Text style={[styles.note, { color: mutedColor }]}>{t('estimated_plan_note')}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('personal_details')}</Text>
        <View style={styles.formGrid}>
          <Field label={t('start_weight')} value={startingWeightInput} onChangeText={setStartingWeightInput} suffix="kg" />
          <Field label={t('current_weight')} value={weight} onChangeText={setWeight} suffix="kg" />
          <Field label={t('target_weight')} value={targetWeight} onChangeText={setTargetWeight} suffix="kg" />
          <Field label={t('height')} value={height} onChangeText={setHeight} suffix="cm" />
          <Field label={t('age')} value={age} onChangeText={setAge} keyboardType="number-pad" />
        </View>
        <SelectField label={t('sex')} value={sex} onChange={setSex} options={[
          { value: 'female', label: t('female') }, { value: 'male', label: t('male') },
          { value: 'other', label: t('other') }, { value: 'prefer_not_to_say', label: t('prefer_not_to_say') },
        ]} />
      </View>

      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('goal_preferences')}</Text>
        <SelectField label={t('goal')} value={goal} onChange={setGoal} options={[
          { value: 'maintain', label: t('maintain_weight') }, { value: 'lose', label: t('lose_weight') },
          { value: 'gain', label: t('gain_weight') }, { value: 'gain_muscle', label: t('gain_muscle') },
        ]} />
        <SelectField label={t('diet')} value={diet} onChange={setDiet} options={[
          { value: 'balanced', label: t('balanced') }, { value: 'high_protein', label: t('high_protein') },
          { value: 'vegetarian', label: t('vegetarian') }, { value: 'vegan', label: t('vegan') },
          { value: 'keto', label: t('keto') }, { value: 'low_carb', label: t('low_carb') },
          { value: 'gluten_free', label: t('gluten_free') }, { value: 'paleo', label: t('paleo') },
          { value: 'mediterranean', label: t('mediterranean') }, { value: 'macrobiotic', label: t('macrobiotic') },
        ]} />
      </View>

      <TouchableOpacity style={[styles.primaryButton, styles.savePlanButton, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t('save')} {t('goals').toLowerCase()}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F7F5' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F7F5' },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, paddingTop: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.8, color: GREEN },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', color: DARK_GREEN },
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2F7F0' },
  card: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E1ECE8' },
  progressCard: { backgroundColor: DARK_GREEN, borderColor: DARK_GREEN },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardEyebrow: { color: '#A8D7C9', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { color: '#FFFFFF', fontSize: 34, lineHeight: 42, fontWeight: '900', marginTop: 5 },
  heroCaption: { color: '#C8DED7', fontSize: 13, fontWeight: '700' },
  percentBadge: { minWidth: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#27594B', borderWidth: 2, borderColor: '#42D4AA' },
  percentText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  progressTrack: { height: 9, borderRadius: 5, backgroundColor: '#315B50', overflow: 'hidden', marginTop: 20 },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#3ED5AA' },
  progressCaption: { color: '#A8D7C9', fontSize: 11, marginTop: 6, textAlign: 'right' },
  metricsRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  metric: { flex: 1, minWidth: 78 },
  metricValue: { color: DARK_GREEN, fontSize: 16, fontWeight: '900' },
  metricLabel: { color: '#71877F', fontSize: 11, lineHeight: 15, marginTop: 3 },
  metricValueLight: { color: '#FFFFFF' },
  metricLabelLight: { color: '#A8D7C9' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  sectionTitle: { color: DARK_GREEN, fontSize: 18, fontWeight: '900' },
  sectionSubtitle: { color: '#71877F', fontSize: 12, marginTop: 3 },
  legend: { flexDirection: 'row', gap: 18, marginTop: 16, marginBottom: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#71877F', fontWeight: '700' },
  rangeSelector: { flexDirection: 'row', backgroundColor: '#F0F6F4', borderRadius: 12, padding: 4, marginTop: 15 },
  rangeButton: { flex: 1, minHeight: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rangeButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#173C32', shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  rangeButtonText: { color: '#71877F', fontSize: 12, fontWeight: '800' },
  rangeButtonTextActive: { color: GREEN },
  chart: { marginTop: 6, borderRadius: 16 },
  emptyChart: { minHeight: 150, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  emptyText: { color: '#71877F', textAlign: 'center', lineHeight: 20 },
  quickWeightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  quickWeightInput: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 14, backgroundColor: '#FAFCFB', paddingHorizontal: 12 },
  quickWeightButton: { flex: 1.55, marginTop: 0, minHeight: 48, paddingHorizontal: 10 },
  primaryButton: { minHeight: 52, borderRadius: 16, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#EDF3F1' },
  historyRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  historyDate: { color: DARK_GREEN, fontSize: 14, fontWeight: '800', textTransform: 'capitalize' },
  historyMeta: { color: '#8A9E97', fontSize: 11, marginTop: 2 },
  historyValues: { alignItems: 'flex-end' },
  historyWeight: { color: DARK_GREEN, fontSize: 14, fontWeight: '900' },
  historyChange: { color: '#C36B53', fontSize: 11, fontWeight: '700', marginTop: 2 },
  positiveChange: { color: GREEN },
  planCard: { backgroundColor: '#E9F8F3', borderColor: '#CDEBE1' },
  calorieValue: { color: GREEN, fontSize: 19, fontWeight: '900' },
  macroRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  energyBreakdown: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  bmiText: { color: '#325D51', fontSize: 13, fontWeight: '800', marginTop: 16 },
  note: { color: '#71877F', fontSize: 11, lineHeight: 16, marginTop: 8 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  field: { flexGrow: 1, flexBasis: '46%', minWidth: 130 },
  label: { color: '#557068', fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  inputShell: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 14, backgroundColor: '#FAFCFB', paddingHorizontal: 12 },
  input: { flex: 1, minHeight: 46, color: DARK_GREEN, fontSize: 16, fontWeight: '700' },
  suffix: { color: '#71877F', fontSize: 12, fontWeight: '800' },
  selectControl: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 14, backgroundColor: '#FAFCFB', paddingLeft: 14, paddingRight: 8 },
  selectControlOpen: { borderColor: GREEN, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  selectValue: { flex: 1, color: DARK_GREEN, fontSize: 15, fontWeight: '800' },
  selectChevron: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5F7F1' },
  selectMenu: { marginTop: 6, borderWidth: 1, borderColor: '#D8E8E3', borderRadius: 14, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  selectOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EDF3F1' },
  selectOptionLast: { borderBottomWidth: 0 },
  selectOptionActive: { backgroundColor: '#EAF8F3' },
  selectOptionText: { color: '#49655D', fontSize: 14, fontWeight: '700' },
  selectOptionTextActive: { color: '#008F6D', fontWeight: '900' },
  savePlanButton: { width: '100%', maxWidth: 420, alignSelf: 'center', marginTop: 4 },
  disabled: { opacity: 0.6 },
});
