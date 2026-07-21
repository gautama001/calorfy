import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/useAppTheme';
import { DIET_GUIDES, DIET_RECIPES } from '@/lib/dietCatalog';
import { localizeDietGuides } from '@/lib/dietCatalogLocale';

export default function DietsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { backgroundColor, textColor, cardColor, borderColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#60766F';
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase();
  const localizedGuides = useMemo(() => localizeDietGuides(DIET_GUIDES, i18n.resolvedLanguage), [i18n.resolvedLanguage]);
  const diets = useMemo(() => localizedGuides.filter((diet) => !normalized || `${diet.name} ${diet.description} ${diet.tags.join(' ')}`.toLocaleLowerCase().includes(normalized)), [localizedGuides, normalized]);

  return (
    <ScrollView style={{ backgroundColor }} contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{t('discover').toUpperCase()}</Text>
      <Text style={[styles.title, { color: textColor }]}>{t('explore_diets')}</Text>
      <Text style={[styles.intro, { color: mutedColor }]}>{t('diet_explorer_intro')}</Text>

      <TouchableOpacity activeOpacity={0.82} style={[styles.planCta, { backgroundColor: isDarkMode ? '#163A30' : '#E5F7F0', borderColor: isDarkMode ? '#2B5A4C' : '#BFE7D9' }]} onPress={() => router.push('/plans/week' as never)}>
        <View style={styles.planIcon}><Ionicons name="calendar-outline" size={23} color="#FFFFFF" /></View>
        <View style={styles.planCopy}>
          <Text style={[styles.planTitle, { color: textColor }]}>{t('plan_cta_title')}</Text>
          <Text style={[styles.planBody, { color: mutedColor }]}>{t('plan_cta_body')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={21} color="#00A77D" />
      </TouchableOpacity>

      <View style={[styles.search, { backgroundColor: cardColor, borderColor }]}>
        <Ionicons name="search" size={19} color="#6D837C" />
        <TextInput style={[styles.searchInput, { color: textColor }]} value={query} onChangeText={setQuery} placeholder={t('search_diets')} placeholderTextColor="#82958F" />
      </View>

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { color: mutedColor }]}>{localizedGuides.length} {t('diet_types')}</Text>
        <Text style={[styles.summaryText, { color: mutedColor }]}>{DIET_RECIPES.length} {t('recipes')}</Text>
      </View>

      {diets.map((diet) => {
        const count = DIET_RECIPES.filter((recipe) => recipe.diet === diet.key).length;
        return (
          <TouchableOpacity key={diet.key} activeOpacity={0.78} style={[styles.card, { backgroundColor: cardColor, borderColor }]} onPress={() => router.push(`/diets/${diet.key}` as never)}>
            <View style={[styles.accent, { backgroundColor: diet.accent }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={[styles.letterBadge, { backgroundColor: `${diet.accent}18` }]}><Text style={[styles.letter, { color: diet.accent }]}>{diet.shortName.slice(0, 1)}</Text></View>
                <View style={styles.cardHeading}><Text style={[styles.cardTitle, { color: textColor }]}>{diet.name}</Text><Text style={[styles.recipeCount, { color: mutedColor }]}>{count} {t('recipes')}</Text></View>
                <Ionicons name="chevron-forward" size={21} color={diet.accent} />
              </View>
              <Text style={[styles.description, { color: mutedColor }]}>{diet.description}</Text>
              <View style={styles.tags}>{diet.tags.map((tag) => <View key={tag} style={[styles.tag, isDarkMode && { backgroundColor: '#20372F' }]}><Text style={[styles.tagText, { color: isDarkMode ? '#B9CDC6' : '#506A62' }]}>{tag}</Text></View>)}</View>
            </View>
          </TouchableOpacity>
        );
      })}
      {!diets.length ? <View style={styles.empty}><Ionicons name="leaf-outline" size={32} color="#82A399" /><Text style={styles.emptyText}>{t('no_diets_found')}</Text></View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 18, paddingTop: 26, paddingBottom: 120 },
  eyebrow: { color: '#00A77D', fontSize: 11, fontWeight: '900', letterSpacing: 1.7 },
  title: { fontSize: 30, lineHeight: 37, fontWeight: '900', marginTop: 2 },
  intro: { color: '#60766F', fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 18 },
  planCta: { minHeight: 88, borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  planIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#00A77D', alignItems: 'center', justifyContent: 'center' },
  planCopy: { flex: 1, marginHorizontal: 12 },
  planTitle: { fontSize: 16, fontWeight: '900' },
  planBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  search: { minHeight: 50, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, minHeight: 48, fontSize: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15, paddingHorizontal: 3 },
  summaryText: { color: '#6D837C', fontSize: 12, fontWeight: '800' },
  card: { flexDirection: 'row', borderWidth: 1, borderRadius: 20, marginBottom: 12, overflow: 'hidden' },
  accent: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  letterBadge: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 19, fontWeight: '900' },
  cardHeading: { flex: 1, marginLeft: 11 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  recipeCount: { color: '#71877F', fontSize: 11, marginTop: 2 },
  description: { color: '#60766F', fontSize: 13, lineHeight: 19, marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { backgroundColor: '#EDF5F2', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  tagText: { color: '#506A62', fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 54, gap: 10 },
  emptyText: { color: '#71877F', fontSize: 14 },
});
