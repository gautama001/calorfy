import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { type Country, type FoodSearchResult, listCountries, searchFoods } from '@/lib/catalog';

export default function CatalogScreen() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [market, setMarket] = useState<string | null>('AR');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSearched(true);
    try {
      setResults(await searchFoods(query.trim(), market));
    } catch {
      setError('La búsqueda no está disponible en este momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CATÁLOGO REGIONAL</Text>
      <Text style={styles.title}>Alimentos de Latinoamérica</Text>
      <Text style={styles.description}>Probá nombres locales y variantes de cada país. El catálogo solo muestra datos verificados.</Text>

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
          placeholder="Ej: arepa, locro, feijoada..."
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={runSearch}><Text style={styles.searchButtonText}>Buscar</Text></TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#00A77D" style={styles.state} />}
      {error && <Text style={[styles.state, styles.error]}>{error}</Text>}
      {!loading && searched && !error && results.length === 0 && (
        <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Todavía no está verificado</Text><Text style={styles.emptyText}>La infraestructura ya funciona. Este alimento entrará cuando su fuente y composición hayan pasado curación.</Text></View>
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.results}
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <Text style={styles.resultName}>{item.display_name}</Text>
            <Text style={styles.resultMeta}>{item.group_code} · {item.origin_country_code ?? 'LATAM'}{item.default_portion_g ? ` · ${item.default_portion_g} g` : ''}</Text>
          </View>
        )}
      />
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
  state: { marginTop: 28, alignSelf: 'center' },
  error: { color: '#B42318' },
  emptyCard: { backgroundColor: '#E8F6F1', borderRadius: 16, padding: 18, marginTop: 22 },
  emptyTitle: { color: '#173C32', fontSize: 17, fontWeight: '800' },
  emptyText: { color: '#557068', lineHeight: 20, marginTop: 5 },
  results: { gap: 10, paddingTop: 20, paddingBottom: 80 },
  resultCard: { borderRadius: 14, padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDEAE5' },
  resultName: { color: '#173C32', fontSize: 17, fontWeight: '800' },
  resultMeta: { color: '#6A7F78', marginTop: 4 },
});
