import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { createSessionFromUrl, getAuthErrorMessage } from '@/lib/auth';

export default function AuthCallbackScreen() {
  const url = Linking.useURL();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let active = true;
    createSessionFromUrl(url)
      .then((session) => {
        if (!active) return;
        if (!session) throw new Error('No se pudo iniciar la sesión.');
        router.replace('/(tabs)');
      })
      .catch((callbackError) => {
        if (active) setError(getAuthErrorMessage(callbackError));
      });
    return () => { active = false; };
  }, [router, url]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.title}>No pudimos confirmar el email</Text>
          <Text style={styles.description}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
            <Text style={styles.buttonText}>Volver al ingreso</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#00A77D" />
          <Text style={styles.title}>Confirmando tu cuenta…</Text>
          <Text style={styles.description}>En unos segundos vas a entrar a Calorfy.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FBF9' },
  title: { color: '#173C32', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 22 },
  description: { color: '#557068', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  button: { backgroundColor: '#00A77D', borderRadius: 24, minHeight: 50, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
