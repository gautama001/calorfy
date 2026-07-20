import { View, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  value: number;
  unit: string;
  status: 'left' | 'over';
  color: string;
};

export default function MacroCard({ label, value, unit, status, color }: Props) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Text style={styles.value}>{value} {unit}</Text>
      <Text style={styles.status}>{status === 'left' ? 'left' : 'over'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  status: {
    fontSize: 12,
    marginTop: 2,
    color: '#888',
  },
});
