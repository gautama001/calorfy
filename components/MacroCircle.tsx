import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '@/hooks/useAppTheme';

interface Props {
  label: string;
  value: number;
  goal: number;
  color: string;
}

export default function MacroCircle({ label, value, goal, color }: Props) {
  const { textColor, isDarkMode } = useAppTheme();
  const size = 100;
  const strokeWidth = 10;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / goal, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          stroke={isDarkMode ? '#294039' : '#e6e6e6'}
          fill="none"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.centerText}>
        <Text style={[styles.value, { color: textColor }]}>{value}g</Text>
        <Text style={[styles.label, { color: isDarkMode ? '#A7BBB4' : '#666' }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
});
