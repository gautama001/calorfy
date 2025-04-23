import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Calorfy</Text>
      <Text style={styles.subtitle}>Track your meals with just one photo</Text>
      <Button
        title="Start Tracking"
        onPress={() => router.push('/upload')}
        color="#00C896"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
  },
});
