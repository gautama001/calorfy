import { View, Text, StyleSheet } from 'react-native';

type Props = {
  current: number;
  limit: number;
};

export default function CalorieBar({ current, limit }: Props) {
  const percentage = Math.min((current / limit) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Calories</Text>
        <Text style={styles.value}>{current} / {limit} kcal</Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  barBackground: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: 16,
    backgroundColor: '#00C896',
  },
});
