// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import CalendarWeek from '@/components/CalendarWeek';
import CalorieBar from '@/components/CalorieBar';
import MacroCircle from '@/components/MacroCircle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function TodayScreen() {
  const { t } = useTranslation();
  const { backgroundColor, textColor, cardColor, isDarkMode } = useAppTheme();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<any[]>([]);
  const [calories, setCalories] = useState(0);
  const [macrosTotal, setMacrosTotal] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [macrosTarget, setMacrosTarget] = useState({ protein: 100, carbs: 100, fat: 100 });
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [expanded, setExpanded] = useState<string | null>('meals');
  const [modalMeal, setModalMeal] = useState<any | null>(null);

  const categories = ['meals', 'breakfast', 'lunch', 'snack', 'dinner'];

  const loadAll = async (date: string) => {
    const cg = await AsyncStorage.getItem('calorieGoal');
    const p = await AsyncStorage.getItem('proteinGoal');
    const c = await AsyncStorage.getItem('carbsGoal');
    const f = await AsyncStorage.getItem('fatGoal');
    setDailyLimit(parseFloat(cg || '2000'));
    setMacrosTarget({
      protein: parseFloat(p || '100'),
      carbs: parseFloat(c || '100'),
      fat: parseFloat(f || '100'),
    });

    const stored = await AsyncStorage.getItem('meals');
    const all = stored ? JSON.parse(stored) : [];
    const today = all.filter((m: any) => m.date === date);
    setMeals(today);

    const totCal = today.reduce((s: any, m: any) => s + (m.calories || m.kcal || 0), 0);
    const totP = today.reduce((s: any, m: any) => s + (m.protein || 0), 0);
    const totC = today.reduce((s: any, m: any) => s + (m.carbs || 0), 0);
    const totF = today.reduce((s: any, m: any) => s + (m.fat || 0), 0);
    setCalories(totCal);
    setMacrosTotal({
      protein: parseFloat(totP.toFixed(1)),
      carbs: parseFloat(totC.toFixed(1)),
      fat: parseFloat(totF.toFixed(1)),
    });
  };

  useEffect(() => {
    loadAll(selectedDate);
  }, [selectedDate]);

  const updateMealCategory = async (meal: any, newCategory: string) => {
    const stored = await AsyncStorage.getItem('meals');
    const all = stored ? JSON.parse(stored) : [];
    const updated = all.map((m: any) => (m.timestamp === meal.timestamp ? { ...m, category: newCategory } : m));
    await AsyncStorage.setItem('meals', JSON.stringify(updated));
    setModalMeal(null);
    loadAll(selectedDate);
  };

  const deleteMeal = async (meal: any) => {
    const stored = await AsyncStorage.getItem('meals');
    const all = stored ? JSON.parse(stored) : [];
    const filtered = all.filter((m: any) => m.timestamp !== meal.timestamp);
    await AsyncStorage.setItem('meals', JSON.stringify(filtered));
    setModalMeal(null);
    loadAll(selectedDate);
  };

  const remStyle = (rem: number) => ({
    color: rem < 0 ? '#FF6B6B' : '#00C896'
  });

  return (
    <View style={[styles.wrap, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CalendarWeek onSelectDate={setSelectedDate} />
        <CalorieBar current={calories} limit={dailyLimit} />
        <View style={styles.macros}>
          {(['protein', 'carbs', 'fat'] as const).map((m) => {
            const rem = macrosTarget[m] - macrosTotal[m];
            return (
              <View key={m} style={styles.mcol}>
                <MacroCircle
                  label={t(m)}
                  value={macrosTotal[m]}
                  goal={macrosTarget[m]}
                  color={m === 'protein' ? '#7C5CFC' : m === 'carbs' ? '#FFB020' : '#00C896'}
                />
                <Text style={[styles.rem, remStyle(rem)]}>
                  {rem < 0 ? t('over') : t('left')}: {Math.abs(rem).toFixed(1)} g
                </Text>
              </View>
            );
          })}
        </View>

        {categories.map((cat) => (
          <View key={cat}>
            <TouchableOpacity onPress={() => setExpanded(expanded === cat ? null : cat)}>
              <Text style={[styles.sub, { color: textColor }]}>{t(cat)}</Text>
            </TouchableOpacity>

            {expanded === cat && meals
              .filter(m => (m.category || 'meals').toLowerCase() === cat)
              .map((meal, i) => (
                <TouchableOpacity key={i} onPress={() => setModalMeal(meal)}>
                  <View style={[styles.card, { backgroundColor: isDarkMode ? '#333' : cardColor }]}>
                    {meal.image && (
                      <Image source={{ uri: meal.image }} style={styles.image} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mealName, { color: textColor }]}>{meal.name}</Text>
                      <Text style={styles.mealDetail}>
                        {(meal.calories || meal.kcal)} kcal • {(meal.protein || 0).toFixed(1)}g {t('protein')} • {(meal.fat || 0).toFixed(1)}g {t('fat')}
                      </Text>
                      <Text style={styles.timestamp}>
                        {meal.timestamp ? `Logged at ${new Date(meal.timestamp).toLocaleTimeString()}` : ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/upload')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={!!modalMeal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalMeal?.name}</Text>
            <Text style={styles.modalSubtitle}>📂 {t('change_category')}:</Text>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.modalOption}
                onPress={() => updateMealCategory(modalMeal, cat)}>
                <Text>{t(cat)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.modalOption, { marginTop: 16 }]} onPress={() => deleteMeal(modalMeal)}>
              <Text style={{ color: '#FF6B6B' }}>🗑️ {t('delete')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalMeal(null)}>
              <Text>❌ {t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { padding: 20, flexGrow: 0.1 },
  macros: { flexDirection: 'row', justifyContent: 'space-between' },
  mcol: { alignItems: 'center', flex: 1 },
  rem: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  sub: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8, textTransform: 'capitalize' },
  card: { flexDirection: 'row', gap: 12, padding: 12, marginBottom: 10, borderRadius: 8 },
  mealName: { fontSize: 16, fontWeight: 'bold' },
  mealDetail: { fontSize: 14, color: '#666' },
  timestamp: { fontSize: 12, color: '#999' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#00C896', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 32 },
  image: { width: 60, height: 60, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: 'white', padding: 24, borderRadius: 16, width: '80%', elevation: 6 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modalSubtitle: { fontWeight: '600', marginBottom: 8 },
  modalOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalClose: { paddingVertical: 12, alignItems: 'center' }
});
