import { StyleSheet, Text, View } from 'react-native';

type CalorfyBrandProps = {
  compact?: boolean;
  inverse?: boolean;
  size?: 'small' | 'medium' | 'large';
};

export function CalorfyMark({ size = 34, inverse = false }: { size?: number; inverse?: boolean }) {
  const scale = size / 34;
  const markColor = inverse ? '#42DFB6' : '#12C99A';
  const cutColor = inverse ? '#063126' : '#073D31';

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: 10 * scale,
          backgroundColor: markColor,
          transform: [{ rotate: '-7deg' }],
        },
      ]}>
      <View
        style={[
          styles.pill,
          {
            width: 7 * scale,
            height: 18 * scale,
            borderRadius: 7 * scale,
            left: 8 * scale,
            top: 7 * scale,
            backgroundColor: cutColor,
          },
        ]}
      />
      <View
        style={[
          styles.pill,
          {
            width: 7 * scale,
            height: 12 * scale,
            borderRadius: 7 * scale,
            right: 7 * scale,
            bottom: 6 * scale,
            backgroundColor: cutColor,
          },
        ]}
      />
    </View>
  );
}

export default function CalorfyBrand({ compact = false, inverse = false, size = 'medium' }: CalorfyBrandProps) {
  const markSize = size === 'large' ? 44 : size === 'small' ? 28 : 34;
  const fontSize = size === 'large' ? 30 : size === 'small' ? 20 : 24;

  return (
    <View style={styles.brand} accessibilityRole="header" accessibilityLabel="Calorfy">
      <CalorfyMark size={markSize} inverse={inverse} />
      {!compact ? (
        <Text style={[styles.wordmark, { color: inverse ? '#FFFFFF' : '#092F27', fontSize }]}>Calorfy</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { position: 'relative', overflow: 'hidden' },
  pill: { position: 'absolute' },
  wordmark: { fontWeight: '900', letterSpacing: -1 },
});
