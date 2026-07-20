import { View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Image } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { Colors } from '@/constants/Colors';
import { useThemeContext } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeContext();

  const [calories, setCalories] = useState('3000');
  const [protein, setProtein] = useState('30');
  const [carbs, setCarbs] = useState('50');
  const [fats, setFats] = useState('20');
  const [notificationHour, setNotificationHour] = useState('13:00');

  useEffect(() => {
    (async () => {
      try {
        const savedCalories = await AsyncStorage.getItem('calorieGoal');
        const savedProtein = await AsyncStorage.getItem('proteinGoal');
        const savedCarbs = await AsyncStorage.getItem('carbsGoal');
        const savedFats = await AsyncStorage.getItem('fatGoal');
        const savedHour = await AsyncStorage.getItem('notificationHour');

        if (savedCalories) setCalories(savedCalories);
        if (savedProtein) setProtein(savedProtein);
        if (savedCarbs) setCarbs(savedCarbs);
        if (savedFats) setFats(savedFats);
        if (savedHour) setNotificationHour(savedHour);
      } catch (error) {
        console.error('Error loading settings:', error);
        Alert.alert(t('error') || 'Error', t('error_loading_settings') || 'There was a problem loading the settings.');
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      if (isNaN(Number(calories)) || isNaN(Number(protein)) || isNaN(Number(carbs)) || isNaN(Number(fats))) {
        Alert.alert(t('error') || 'Error', t('please_enter_valid_numbers') || 'Please enter valid numeric values.');
        return;
      }

      await AsyncStorage.setItem('calorieGoal', calories);
      await AsyncStorage.setItem('proteinGoal', protein);
      await AsyncStorage.setItem('carbsGoal', carbs);
      await AsyncStorage.setItem('fatGoal', fats);
      await AsyncStorage.setItem('notificationHour', notificationHour);
      
      Alert.alert(t('saved') || 'Saved', t('settings_saved') || 'Settings have been saved successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(t('error') || 'Error', t('error_saving_settings') || 'There was a problem saving the settings.');
    }
  };

  const changeLanguage = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      Alert.alert(t('language_changed') || 'Language Changed', `${t('language_set_to') || 'Language set to'} ${lang.toUpperCase()}`);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('error') || 'Error', t('error_changing_language') || 'Could not change language.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[theme].background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: Colors[theme].text }]}>{t('personalize_goals')}</Text>

      <Text style={[styles.label, { color: Colors[theme].text }]}>🎯 {t('daily_calorie_goal')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: Colors[theme].card, color: Colors[theme].text, borderColor: Colors[theme].border }]}
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
        placeholder="e.g. 2500"
        placeholderTextColor={Colors[theme].icon}
      />

      <Text style={[styles.label, { color: Colors[theme].text }]}>⚖️ {t('macros')}</Text>
      <TextInput
        style={[styles.input, styles.macroInput, { backgroundColor: Colors[theme].card, color: Colors[theme].text, borderColor: Colors[theme].border }]}
        keyboardType="numeric"
        value={protein}
        onChangeText={setProtein}
        placeholder={t('protein')}
        placeholderTextColor={Colors[theme].icon}
      />
      <TextInput
        style={[styles.input, styles.macroInput, { backgroundColor: Colors[theme].card, color: Colors[theme].text, borderColor: Colors[theme].border }]}
        keyboardType="numeric"
        value={carbs}
        onChangeText={setCarbs}
        placeholder={t('carbs')}
        placeholderTextColor={Colors[theme].icon}
      />
      <TextInput
        style={[styles.input, styles.macroInput, { backgroundColor: Colors[theme].card, color: Colors[theme].text, borderColor: Colors[theme].border }]}
        keyboardType="numeric"
        value={fats}
        onChangeText={setFats}
        placeholder={t('fats')}
        placeholderTextColor={Colors[theme].icon}
      />

      <Text style={[styles.label, { color: Colors[theme].text }]}>🕒 {t('preferred_reminder_hour')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: Colors[theme].card, color: Colors[theme].text, borderColor: Colors[theme].border }]}
        keyboardType="default"
        value={notificationHour}
        onChangeText={setNotificationHour}
        placeholder="e.g. 13:00"
        placeholderTextColor={Colors[theme].icon}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: Colors[theme].text }]}>🌗 {t('dark_mode')}</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
          thumbColor={theme === 'dark' ? '#00C896' : '#f4f3f4'}
          trackColor={{ false: '#767577', true: '#00C896' }}
        />
      </View>

      <Text style={[styles.label, { color: Colors[theme].text }]}>{t('choose_language')}</Text>
      <View style={styles.languageButtons}>
        <TouchableOpacity onPress={() => changeLanguage('en')}>
          <Image source={require('../../assets/flags/gb.png')} style={styles.flagIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeLanguage('es')}>
          <Image source={require('../../assets/flags/es.png')} style={styles.flagIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeLanguage('pt')}>
          <Image source={require('../../assets/flags/pt.png')} style={styles.flagIcon} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{t('save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  macroInput: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  flagIcon: {
    width: 40,
    height: 30,
    marginHorizontal: 10,
  },
  saveButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#00C896',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
