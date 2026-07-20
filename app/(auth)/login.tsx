import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getAuthErrorMessage } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!supabase || !isSupabaseConfigured) return setError('Faltan las variables públicas de Supabase.');
    if (!email.trim() || !password) return setError('Ingresá tu email y contraseña.');

    setSubmitting(true);
    setError(null);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (loginError) throw loginError;
      router.replace('/(tabs)');
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CALORFY</Text>
      <Text style={styles.title}>Bienvenido de nuevo</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" onSubmitEditing={handleLogin} />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={[styles.button, submitting && styles.disabled]} onPress={handleLogin} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ingresar</Text>}
      </TouchableOpacity>
      <Text style={styles.text}>¿Todavía no tenés una cuenta?</Text>
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/signup')}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F7FBF9' },
  eyebrow: { color: '#008F6D', fontWeight: '800', fontSize: 12, letterSpacing: 1.3, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '900', marginTop: 6, marginBottom: 28, textAlign: 'center', color: '#173C32' },
  input: { borderWidth: 1, borderColor: '#C9DDD6', borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16, marginBottom: 12, backgroundColor: '#fff' },
  button: { backgroundColor: '#00A77D', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  text: { textAlign: 'center', marginTop: 22, color: '#557068', fontSize: 15 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#00A77D' },
  secondaryButtonText: { color: '#00A77D' },
  error: { color: '#B42318', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
});
