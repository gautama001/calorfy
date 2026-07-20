import { useMemo } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Nutrients {
  ENERC_KCAL?: { quantity: number; unit: string };
  PROCNT?: { quantity: number; unit: string };
  FAT?: { quantity: number; unit: string };
  CHOCDF?: { quantity: number; unit: string };
}

export default function ResultsScreen() {
  const router = useRouter();
  const { name, image, category, nutrients: serializedNutrients } = useLocalSearchParams<{
    name: string;
    image?: string;
    category?: string;
    nutrients?: string;
  }>();

  const nutrients = useMemo<Nutrients | null>(() => {
    if (!serializedNutrients) return null;
    try {
      return JSON.parse(serializedNutrients) as Nutrients;
    } catch {
      return null;
    }
  }, [serializedNutrients]);

  const saveMealToLocal = async () => {
    if (!nutrients) return;
    try {
      const newMeal = {
        name,
        image,
        category,
        calories: Math.round(nutrients.ENERC_KCAL?.quantity || 0),
        protein: nutrients.PROCNT?.quantity || 0,
        carbs: nutrients.CHOCDF?.quantity || 0,
        fat: nutrients.FAT?.quantity || 0,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
      };
      const existing = await AsyncStorage.getItem('meals');
      const meals = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem('meals', JSON.stringify([newMeal, ...meals]));
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Local meal save error:', error);
      Alert.alert('Error', 'No se pudo guardar la comida.');
    }
  };

  if (!nutrients) {
    return (
      <View style={styles.center}>
        <Text>No se pudo obtener información nutricional.</Text>
        <TouchableOpacity onPress={() => router.replace('/upload')} style={styles.outlineButton}><Text style={styles.outlineText}>Escanear otra vez</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{name}</Text>
      {image && <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />}
      <View style={styles.card}>
        <Text style={styles.detail}>{Math.round(nutrients.ENERC_KCAL?.quantity || 0)} kcal</Text>
        <Text style={styles.detail}>{(nutrients.PROCNT?.quantity || 0).toFixed(2)} g proteína</Text>
        <Text style={styles.detail}>{(nutrients.CHOCDF?.quantity || 0).toFixed(1)} g carbohidratos</Text>
        <Text style={styles.detail}>{(nutrients.FAT?.quantity || 0).toFixed(2)} g grasa</Text>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={saveMealToLocal}><Text style={styles.saveText}>Guardar comida</Text></TouchableOpacity>
      <TouchableOpacity style={styles.outlineButton} onPress={() => router.replace('/upload')}><Text style={styles.outlineText}>Escanear otra vez</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center', backgroundColor: '#f7f7f7', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12, textTransform: 'capitalize' },
  image: { width: '100%', height: 240, borderRadius: 18, marginBottom: 24 },
  card: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 24 },
  detail: { fontSize: 16, marginBottom: 6 },
  saveButton: { backgroundColor: '#00C896', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 32, marginBottom: 16 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  outlineButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 32, paddingVertical: 14, paddingHorizontal: 40 },
  outlineText: { fontSize: 15, color: '#444' },
});
