import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!supabase || !isSupabaseConfigured) {
      Alert.alert('Configuración pendiente', 'Faltan las variables públicas de Supabase.');
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Ingresá tu email y contraseña.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('No pudimos iniciar sesión', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido de nuevo</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
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
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 24, padding: 14, fontSize: 16, marginBottom: 16, backgroundColor: '#f2f2f2' },
  button: { backgroundColor: '#00C896', minHeight: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  text: { textAlign: 'center', marginTop: 20, color: '#555', fontSize: 15 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#00C896' },
  secondaryButtonText: { color: '#00C896' },
});
