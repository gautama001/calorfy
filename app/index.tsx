import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import CalorfyBrand from '@/components/CalorfyBrand';
import { useAuth } from '@/context/AuthContext';
import { getPostAuthPath } from '@/lib/auth';

const FEATURES = [
  { icon: 'restaurant-outline' as const, key: 'landing_feature_foods' },
  { icon: 'analytics-outline' as const, key: 'landing_feature_goals' },
  { icon: 'people-outline' as const, key: 'landing_feature_pros' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, user, loading } = useAuth();
  const [postAuthPath, setPostAuthPath] = useState<'/(tabs)' | '/onboarding' | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setPostAuthPath(null);
      return;
    }
    getPostAuthPath(user.id).then((path) => {
      if (active) setPostAuthPath(path);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || (session && !postAuthPath)) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#42DFB6" /></View>;
  }

  if (session && postAuthPath) return <Redirect href={postAuthPath} />;

  return (
    <View style={styles.screen}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.header}>
        <CalorfyBrand inverse size="medium" />
        <View style={styles.latamBadge}><Text style={styles.latamBadgeText}>LATAM</Text></View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t('landing_eyebrow')}</Text>
        <Text style={styles.title}>{t('landing_title')}</Text>
        <Text style={styles.subtitle}>{t('landing_subtitle')}</Text>

        <View style={styles.insightCard}>
          <View style={styles.insightTop}>
            <View>
              <Text style={styles.insightLabel}>{t('landing_today')}</Text>
              <Text style={styles.insightValue}>1.426 <Text style={styles.insightUnit}>kcal</Text></Text>
            </View>
            <View style={styles.progressRing}>
              <Text style={styles.progressText}>72%</Text>
            </View>
          </View>
          <View style={styles.track}><View style={styles.trackFill} /></View>
          <Text style={styles.insightHint}>{t('landing_on_track')}</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.key} style={styles.feature}>
              <Ionicons name={feature.icon} size={18} color="#42DFB6" />
              <Text style={styles.featureText}>{t(feature.key)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={() => router.push('/signup')}>
          <Text style={styles.primaryButtonText}>{t('landing_start')}</Text>
          <Ionicons name="arrow-forward" size={19} color="#073D31" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.secondaryButtonText}>{t('sign_in')}</Text>
        </TouchableOpacity>
        <Text style={styles.privacy}>{t('landing_privacy')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 620, backgroundColor: '#062A22', paddingHorizontal: 24, paddingTop: 34, paddingBottom: 24, overflow: 'hidden' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#062A22' },
  glowOne: { position: 'absolute', width: 360, height: 360, borderRadius: 999, backgroundColor: '#0C4A3B', right: -190, top: 70, opacity: 0.65 },
  glowTwo: { position: 'absolute', width: 280, height: 280, borderRadius: 999, borderWidth: 1, borderColor: '#1B6654', left: -150, bottom: 80, opacity: 0.55 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 },
  latamBadge: { borderWidth: 1, borderColor: '#28715E', backgroundColor: '#0A3A2F', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  latamBadgeText: { color: '#8AE9CF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  hero: { flex: 1, justifyContent: 'center', paddingVertical: 22, zIndex: 1 },
  eyebrow: { color: '#42DFB6', fontSize: 11, fontWeight: '900', letterSpacing: 1.7, marginBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 43, lineHeight: 45, fontWeight: '900', letterSpacing: -1.8, maxWidth: 440 },
  subtitle: { color: '#B9D3CB', fontSize: 16, lineHeight: 24, marginTop: 16, maxWidth: 430 },
  insightCard: { backgroundColor: '#0B4638', borderWidth: 1, borderColor: '#17604E', borderRadius: 22, padding: 18, marginTop: 24 },
  insightTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightLabel: { color: '#A9CEC3', fontSize: 12, fontWeight: '700' },
  insightValue: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  insightUnit: { color: '#A9CEC3', fontSize: 14, fontWeight: '700' },
  progressRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 7, borderColor: '#42DFB6', alignItems: 'center', justifyContent: 'center', backgroundColor: '#103D33' },
  progressText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  track: { height: 6, borderRadius: 6, backgroundColor: '#245E50', marginTop: 15, overflow: 'hidden' },
  trackFill: { width: '72%', height: '100%', backgroundColor: '#42DFB6', borderRadius: 6 },
  insightHint: { color: '#C5DED7', fontSize: 12, marginTop: 9 },
  features: { flexDirection: 'row', gap: 8, marginTop: 14 },
  feature: { flex: 1, minHeight: 64, borderRadius: 16, borderWidth: 1, borderColor: '#1B5446', backgroundColor: '#0A352B', padding: 10, justifyContent: 'space-between' },
  featureText: { color: '#DCECE7', fontSize: 10, lineHeight: 13, fontWeight: '700', marginTop: 8 },
  actions: { gap: 10, zIndex: 1 },
  primaryButton: { minHeight: 54, borderRadius: 17, backgroundColor: '#42DFB6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: '#073D31', fontSize: 16, fontWeight: '900' },
  secondaryButton: { minHeight: 52, borderRadius: 17, borderWidth: 1, borderColor: '#397667', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A352B' },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  privacy: { color: '#779D92', fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 2 },
});
