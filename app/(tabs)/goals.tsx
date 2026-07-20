import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';

export default function GoalsScreen() {
  const { t } = useTranslation();

  type DietKey = 'balanced' | 'keto' | 'paleo' | 'vegan' | 'mediterranean' | 'raw' | 'macrobiotic';
  type WeightEntry = { date: string; weight: number };

  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [goal, setGoal] = useState('maintain');
  const [diet, setDiet] = useState<DietKey>('balanced');
  const [bmi, setBmi] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [suggestedCalories, setSuggestedCalories] = useState<number | null>(null);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const savedWeight = await AsyncStorage.getItem('currentWeight');
      const savedTarget = await AsyncStorage.getItem('targetWeight');
      const savedHeight = await AsyncStorage.getItem('height');
      const savedAge = await AsyncStorage.getItem('age');
      const savedSex = await AsyncStorage.getItem('sex');
      const savedGoal = await AsyncStorage.getItem('goal');
      const savedDiet = await AsyncStorage.getItem('diet');
      const savedHistory = await AsyncStorage.getItem('weightHistory');
      if (savedWeight) setWeight(savedWeight);
      if (savedTarget) setTargetWeight(savedTarget);
      if (savedHeight) setHeight(savedHeight);
      if (savedAge) setAge(savedAge);
      if (savedSex) setSex(savedSex);
      if (savedGoal) setGoal(savedGoal);
      if (savedDiet) setDiet(savedDiet as DietKey);
      if (savedHistory) setWeightHistory(JSON.parse(savedHistory) as WeightEntry[]);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (weight && height) {
      const h = parseFloat(height) / 100;
      const w = parseFloat(weight);
      const bmiVal = w / (h * h);
      setBmi(bmiVal.toFixed(1));

      if (bmiVal < 18.5) setStatus('underweight');
      else if (bmiVal < 25) setStatus('healthy');
      else if (bmiVal < 30) setStatus('overweight');
      else setStatus('obese');
    }
  }, [weight, height]);

  useEffect(() => {
    if (weight && height && age && sex) {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const a = parseInt(age);
      let bmr = 0;
      if (sex.toLowerCase() === 'm') {
        bmr = 10 * w + 6.25 * h - 5 * a + 5;
      } else {
        bmr = 10 * w + 6.25 * h - 5 * a - 161;
      }

      let factor = 1.2;
      switch (goal) {
        case 'lose':
          factor = 0.85;
          break;
        case 'gain':
          factor = 1.15;
          break;
        case 'muscle':
          factor = 1.25;
          break;
        default:
          factor = 1.0;
      }

      const calories = Math.round(bmr * factor);
      setSuggestedCalories(calories);

      const macroDist = {
        balanced: { protein: 0.3, carbs: 0.4, fats: 0.3 },
        keto: { protein: 0.25, carbs: 0.05, fats: 0.7 },
        paleo: { protein: 0.35, carbs: 0.3, fats: 0.35 },
        vegan: { protein: 0.2, carbs: 0.6, fats: 0.2 },
        mediterranean: { protein: 0.25, carbs: 0.5, fats: 0.25 },
        raw: { protein: 0.1, carbs: 0.7, fats: 0.2 },
        macrobiotic: { protein: 0.15, carbs: 0.6, fats: 0.25 },
      };

      const dist = macroDist[diet] || macroDist.balanced;
      setMacros({
        protein: Math.round((calories * dist.protein) / 4),
        carbs: Math.round((calories * dist.carbs) / 4),
        fats: Math.round((calories * dist.fats) / 9),
      });
    }
  }, [weight, height, age, sex, goal, diet]);

  const handleSave = async () => {
    if (suggestedCalories === null) {
      Alert.alert(t('error'), t('please_enter_valid_numbers'));
      return;
    }
    await AsyncStorage.setItem('currentWeight', weight);
    await AsyncStorage.setItem('targetWeight', targetWeight);
    await AsyncStorage.setItem('height', height);
    await AsyncStorage.setItem('age', age);
    await AsyncStorage.setItem('sex', sex);
    await AsyncStorage.setItem('goal', goal);
    await AsyncStorage.setItem('diet', diet);
    await AsyncStorage.setItem('calorieGoal', suggestedCalories.toString());
    await AsyncStorage.setItem('proteinGoal', macros.protein.toString());
    await AsyncStorage.setItem('carbsGoal', macros.carbs.toString());
    await AsyncStorage.setItem('fatGoal', macros.fats.toString());
    Alert.alert(t('saved'), t('goals_saved'));
  };

  const handleSaveWeight = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const newEntry = { date: timestamp, weight: parseFloat(weight) };
    const updatedHistory = [...weightHistory, newEntry].slice(-30);
    setWeightHistory(updatedHistory);
    await AsyncStorage.setItem('weightHistory', JSON.stringify(updatedHistory));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('goals')}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>🎯 {t('target_weight')} (kg)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={targetWeight} onChangeText={setTargetWeight} />

        <Text style={styles.label}>⚖️ {t('current_weight')} (kg)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />

        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <TouchableOpacity style={styles.saveWeightButton} onPress={handleSaveWeight}>
            <Text style={styles.saveWeightButtonText}>{t('save')} {t('current_weight')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>📏 {t('height')}</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />

        <Text style={styles.label}>🎂 {t('age')}</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />

        <Text style={styles.label}>⚧️ {t('sex')}</Text>
        <TextInput style={styles.input} value={sex} onChangeText={setSex} />

        <Text style={styles.label}>{t('goal')}</Text>
        <View style={styles.pickerBox}>
          <Picker selectedValue={goal} onValueChange={setGoal}>
            <Picker.Item label={t('maintain_weight')} value="maintain" />
            <Picker.Item label={t('lose_weight')} value="lose" />
            <Picker.Item label={t('gain_weight')} value="gain" />
            <Picker.Item label={t('gain_muscle')} value="muscle" />
          </Picker>
        </View>

        <Text style={styles.label}>{t('diet')}</Text>
        <View style={styles.pickerBox}>
          <Picker selectedValue={diet} onValueChange={(value) => setDiet(value as DietKey)}>
            <Picker.Item label={t('keto')} value="keto" />
            <Picker.Item label={t('paleo')} value="paleo" />
            <Picker.Item label={t('vegan')} value="vegan" />
            <Picker.Item label={t('mediterranean')} value="mediterranean" />
            <Picker.Item label={t('raw_food')} value="raw" />
            <Picker.Item label={t('macrobiotic')} value="macrobiotic" />
          </Picker>
        </View>
      </View>

      {(bmi || suggestedCalories) && (
        <View style={styles.bmiBox}>
          {bmi && <Text style={styles.bmiText}>{t('bmiResult')}: {bmi} ({t(status)})</Text>}
          {suggestedCalories && (
            <Text style={styles.bmiText}>{t('suggested_calories')}: {suggestedCalories} kcal</Text>
          )}
          <Text style={styles.bmiText}>{t('protein')}: {macros.protein}g / {t('carbs')}: {macros.carbs}g / {t('fats')}: {macros.fats}g</Text>
        </View>
      )}

      {weightHistory.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: weightHistory.map(entry => entry.date.slice(5).replace('-', '/')),
              datasets: [{ data: weightHistory.map(entry => entry.weight) }],
            }}
            width={Math.max(Dimensions.get('window').width, weightHistory.length * 50)}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(0, 200, 150, ${opacity})`,
              strokeWidth: 2,
            }}
            bezier
            style={{ marginVertical: 20, borderRadius: 16 }}
          />
        </ScrollView>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{t('save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  bmiBox: {
    marginTop: 10,
    backgroundColor: '#e0f7fa',
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  bmiText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#00C896',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 28,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveWeightButton: {
    backgroundColor: '#00C896',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  saveWeightButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
