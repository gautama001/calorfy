import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { createSessionFromUrl, getAuthErrorMessage } from '@/lib/auth';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const { backgroundColor, textColor, isDarkMode } = useAppTheme();
  const mutedColor = isDarkMode ? '#A7BBB4' : '#557068';
  const url = Linking.useURL();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const recovery = /(?:[?#&])type=recovery(?:&|$)/.test(url);
    let active = true;
    createSessionFromUrl(url)
      .then((session) => {
        if (!active) return;
        if (!session) throw new Error('No se pudo iniciar la sesión.');
        router.replace(recovery ? '/reset-password' as Href : '/(tabs)');
      })
      .catch((callbackError) => {
        if (active) setError(getAuthErrorMessage(callbackError, t));
      });
    return () => { active = false; };
  }, [router, url]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {error ? (
        <>
          <Text style={[styles.title, { color: textColor }]}>{t('confirm_email_error')}</Text>
          <Text style={[styles.description, { color: mutedColor }]}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
            <Text style={styles.buttonText}>{t('back_to_sign_in')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#00A77D" />
          <Text style={[styles.title, { color: textColor }]}>{t('confirming_account')}</Text>
          <Text style={[styles.description, { color: mutedColor }]}>{t('confirming_account_intro')}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#173C32', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 22 },
  description: { color: '#557068', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  button: { backgroundColor: '#00A77D', borderRadius: 24, minHeight: 50, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
