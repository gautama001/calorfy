import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export default function LevelScreen() {
  const { t } = useTranslation();
  const [steps, setSteps] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(8000);
  const [waterDrank, setWaterDrank] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [reminderOn, setReminderOn] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const storedSteps = await AsyncStorage.getItem('dailySteps');
      const storedWater = await AsyncStorage.getItem('dailyWater');
      const storedReminder = await AsyncStorage.getItem('reminderOn');
      if (storedSteps) setSteps(parseInt(storedSteps));
      if (storedWater) setWaterDrank(parseInt(storedWater));
      if (storedReminder !== null) setReminderOn(storedReminder === 'true');
    };
    loadData();
  }, []);

  const incrementWater = () => {
    const newTotal = waterDrank + 250;
    setWaterDrank(newTotal);
    AsyncStorage.setItem('dailyWater', newTotal.toString());
  };

  const resetDay = () => {
    Alert.alert(t('reset'), t('reset_confirmation'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        onPress: async () => {
          setSteps(0);
          setWaterDrank(0);
          await AsyncStorage.setItem('dailySteps', '0');
          await AsyncStorage.setItem('dailyWater', '0');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏆 Level</Text>

      <View style={styles.card}>
        <Text style={styles.metric}>🚶‍♂️ {t('steps_today')}: {steps} / {dailyGoal}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.min(100, (steps / dailyGoal) * 100)}%` }]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.metric}>💧 {t('water_today')}: {waterDrank}ml / {waterGoal}ml</Text>
        <TouchableOpacity style={styles.waterButton} onPress={incrementWater}>
          <Text style={styles.waterButtonText}>+250ml</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.metric}>{t('reminders')}</Text>
        <Switch value={reminderOn} onValueChange={(value) => {
          setReminderOn(value);
          AsyncStorage.setItem('reminderOn', value.toString());
        }} />
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetDay}>
        <Text style={styles.resetButtonText}>{t('reset_day')}</Text>
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  cardRow: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metric: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00C896',
    borderRadius: 5,
  },
  waterButton: {
    backgroundColor: '#00C896',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
  },
  waterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#333',
    fontSize: 14,
  },
});
