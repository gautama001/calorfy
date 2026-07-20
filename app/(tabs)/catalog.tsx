import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import {
  addFoodToDiary,
  type Country,
  type FoodSearchResult,
  type MealCategory,
  listCountries,
  searchFoods,
} from '@/lib/catalog';

const categories: Array<{ value: MealCategory; label: string }> = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'snack', label: 'Merienda' },
  { value: 'dinner', label: 'Cena' },
];

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CatalogScreen() {
  const { user } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [market, setMarket] = useState<string | null>('AR');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [grams, setGrams] = useState('100');
  const [category, setCategory] = useState<MealCategory>('lunch');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCountries()
      .then(setCountries)
      .catch(() => setError('No pudimos conectar con el catálogo.'))
      .finally(() => setLoading(false));
  }, []);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    setSearched(true);
    try {
      setResults(await searchFoods(query.trim(), market));
    } catch {
      setError('La búsqueda no está disponible en este momento.');
    } finally {
      setLoading(false);
    }
  };

  const factor = Math.max(Number(grams) || 0, 0) / 100;
  const selectedMacros = useMemo(() => ({
    calories: Number(selectedFood?.energy_kcal ?? 0) * factor,
    protein: Number(selectedFood?.protein_g ?? 0) * factor,
    carbs: Number(selectedFood?.carbohydrate_g ?? 0) * factor,
    fat: Number(selectedFood?.fat_g ?? 0) * factor,
  }), [factor, selectedFood]);

  const openComposer = (food: FoodSearchResult) => {
    setSelectedFood(food);
    setGrams(String(food.default_portion_g ?? 100));
    setError(null);
  };

  const saveFood = async () => {
    const portionGrams = Number(grams);
    if (!selectedFood || !user) return setError('Necesitás iniciar sesión para guardar comidas.');
    if (!Number.isFinite(portionGrams) || portionGrams <= 0 || portionGrams > 5000) {
      return setError('Ingresá una cantidad válida entre 1 y 5000 gramos.');
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await addFoodToDiary(user.id, selectedFood, portionGrams, category);
      const cached = await AsyncStorage.getItem('meals');
      const meals = cached ? JSON.parse(cached) : [];
      const eatenAt = new Date(saved.eaten_at);
      await AsyncStorage.setItem('meals', JSON.stringify([{
        id: saved.id,
        name: saved.name,
        calories: saved.calories,
        protein: saved.protein_g,
        carbs: saved.carbs_g,
        fat: saved.fat_g,
        grams: saved.grams,
        category: saved.category,
        date: localDateString(eatenAt),
        timestamp: eatenAt.toISOString(),
        synced: true,
      }, ...meals]));
      setSelectedFood(null);
      setNotice(`${saved.name} se agregó a tu día.`);
    } catch {
      setError('No pudimos guardar la comida. Revisá la conexión e intentá otra vez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CATÁLOGO REGIONAL</Text>
      <Text style={styles.title}>Buscar alimentos</Text>
      <Text style={styles.description}>Datos por 100 g, con nombres locales de Latinoamérica.</Text>

      <FlatList
        horizontal
        data={countries}
        keyExtractor={(item) => item.code}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.markets}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.market, market === item.code && styles.marketSelected]} onPress={() => setMarket(item.code)}>
            <Text style={[styles.marketText, market === item.code && styles.marketTextSelected]}>{item.code}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          placeholder="Ej: arepa, locro, pollo..."
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#00A77D" style={styles.state} />}
      {notice && <Text style={styles.notice}>{notice}</Text>}
      {error && !selectedFood && <Text style={[styles.state, styles.error]}>{error}</Text>}
      {!loading && searched && !error && results.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No encontramos ese alimento</Text>
          <Text style={styles.emptyText}>Probá otro nombre regional o cambiá el país seleccionado.</Text>
        </View>
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.results}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultCard} onPress={() => openComposer(item)}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultName}>{item.display_name}</Text>
              <Text style={styles.addLabel}>Agregar</Text>
            </View>
            <Text style={styles.resultMeta}>{item.origin_country_code ?? 'LATAM'} · {item.default_portion_g ?? 100} g</Text>
            <Text style={styles.macros}>{Math.round(Number(item.energy_kcal ?? 0))} kcal · P {Number(item.protein_g ?? 0).toFixed(1)} g · C {Number(item.carbohydrate_g ?? 0).toFixed(1)} g · G {Number(item.fat_g ?? 0).toFixed(1)} g</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selectedFood} transparent animationType="slide" onRequestClose={() => setSelectedFood(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedFood?.display_name}</Text>
            <Text style={styles.modalLabel}>Cantidad en gramos</Text>
            <TextInput style={styles.gramsInput} value={grams} onChangeText={setGrams} keyboardType="decimal-pad" selectTextOnFocus />
            <Text style={styles.calculatedMacros}>{Math.round(selectedMacros.calories)} kcal · P {selectedMacros.protein.toFixed(1)} · C {selectedMacros.carbs.toFixed(1)} · G {selectedMacros.fat.toFixed(1)}</Text>
            <Text style={styles.modalLabel}>Momento del día</Text>
            <View style={styles.categories}>
              {categories.map((item) => (
                <TouchableOpacity key={item.value} style={[styles.category, category === item.value && styles.categorySelected]} onPress={() => setCategory(item.value)}>
                  <Text style={[styles.categoryText, category === item.value && styles.categoryTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={saveFood} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Agregar a mi día</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedFood(null)} disabled={saving}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 22, backgroundColor: '#F7FBF9' },
  eyebrow: { color: '#008F6D', fontWeight: '800', fontSize: 12, letterSpacing: 1.4, marginTop: 12 },
  title: { color: '#173C32', fontWeight: '900', fontSize: 28, marginTop: 6 },
  description: { color: '#557068', fontSize: 15, lineHeight: 21, marginTop: 8 },
  markets: { gap: 8, paddingVertical: 18 },
  market: { height: 38, minWidth: 48, paddingHorizontal: 12, borderRadius: 19, borderWidth: 1, borderColor: '#C9DDD6', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  marketSelected: { backgroundColor: '#00A77D', borderColor: '#00A77D' },
  marketText: { color: '#43635A', fontWeight: '700' },
  marketTextSelected: { color: '#fff' },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, height: 48, borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 15 },
  searchButton: { height: 48, borderRadius: 14, backgroundColor: '#173C32', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontWeight: '800' },
  state: { marginTop: 22, alignSelf: 'center' },
  notice: { color: '#087A5E', backgroundColor: '#E2F4ED', borderRadius: 12, padding: 12, textAlign: 'center', marginTop: 14 },
  error: { color: '#B42318', textAlign: 'center', marginTop: 12 },
  emptyCard: { backgroundColor: '#E8F6F1', borderRadius: 16, padding: 18, marginTop: 22 },
  emptyTitle: { color: '#173C32', fontSize: 17, fontWeight: '800' },
  emptyText: { color: '#557068', lineHeight: 20, marginTop: 5 },
  results: { gap: 10, paddingTop: 20, paddingBottom: 90 },
  resultCard: { borderRadius: 14, padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDEAE5' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  resultName: { flex: 1, color: '#173C32', fontSize: 17, fontWeight: '800' },
  addLabel: { color: '#008F6D', fontWeight: '800' },
  resultMeta: { color: '#6A7F78', marginTop: 4 },
  macros: { color: '#35584E', marginTop: 8, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 34 },
  modalTitle: { color: '#173C32', fontSize: 24, fontWeight: '900', marginBottom: 18 },
  modalLabel: { color: '#557068', fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 7 },
  gramsInput: { height: 50, borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 14, paddingHorizontal: 14, fontSize: 18 },
  calculatedMacros: { color: '#173C32', fontWeight: '700', marginTop: 10 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: { borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12 },
  categorySelected: { backgroundColor: '#00A77D', borderColor: '#00A77D' },
  categoryText: { color: '#43635A', fontWeight: '700' },
  categoryTextSelected: { color: '#fff' },
  saveButton: { height: 52, borderRadius: 26, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelButton: { alignItems: 'center', paddingTop: 16 },
  cancelText: { color: '#557068', fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
