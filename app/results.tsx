import { View, Text, StyleSheet } from 'react-native';

const dummyResult = {
  name: 'Banana',
  calories: 105,
  protein: '1.3g',
  carbs: '27g',
  fat: '0.3g',
};

export default function ResultsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estimated Nutritional Breakdown</Text>
      <View style={styles.item}>
        <Text style={styles.itemName}>{dummyResult.name}</Text>
        <Text style={styles.itemInfo}>
          {dummyResult.calories} kcal | {dummyResult.protein} P | {dummyResult.carbs} C | {dummyResult.fat} F
        </Text>
      </View>
      <Text style={styles.total}>Total: {dummyResult.calories} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  total: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
