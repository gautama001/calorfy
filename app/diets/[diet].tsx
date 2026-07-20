import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function DietDetail() {
  const { diet } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diet Detail</Text>
      <Text style={styles.subtitle}>You selected: {diet}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});
