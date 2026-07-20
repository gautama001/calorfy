import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!supabase || !isSupabaseConfigured) {
      Alert.alert('Configuración pendiente', 'Faltan las variables públicas de Supabase.');
      return;
    }

    if (!email.trim() || password.length < 8) {
      Alert.alert('Revisá tus datos', 'Usá un email válido y una contraseña de al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    const emailRedirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { emailRedirectTo },
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('No pudimos crear la cuenta', error.message);
      return;
    }

    if (!data.session) {
      Alert.alert('Revisá tu email', 'Te enviamos un enlace para confirmar la cuenta.');
      router.replace('/login');
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <TextInput style={styles.input} placeholder="Contraseña (mínimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <TouchableOpacity style={[styles.button, submitting && styles.disabled]} onPress={handleSignup} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.link}>Ya tengo una cuenta</Text>
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
  link: { color: '#008f6d', textAlign: 'center', marginTop: 24, fontWeight: '600' },
});
