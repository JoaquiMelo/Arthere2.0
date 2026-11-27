import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

interface Props {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
}

export function StarRating({ value, size = 16, onChange }: Props) {
  const { color, dimensions } = useThemeTokens();
  const estrelas = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row} accessible={!onChange} accessibilityRole={onChange ? 'radiogroup' : undefined}
      accessibilityLabel={onChange ? 'Nota de 1 a 5' : `Nota ${value} de 5`}>
      {estrelas.map((estrela) => {
        const preenchida = estrela <= Math.round(value);
        const icone = <Ionicons key={estrela} name={preenchida ? 'star' : 'star-outline'} size={size}
          color={preenchida ? color.warningText : color.textSecondary} />;
        return onChange ? (
          <TouchableOpacity key={estrela} accessibilityRole="radio" accessibilityLabel={`Nota ${estrela} de 5`}
            accessibilityState={{ checked: estrela === value }} onPress={() => onChange(estrela)}
            style={[styles.target, { minWidth: dimensions.touchTarget, minHeight: dimensions.touchTarget }]}>
            {icone}
          </TouchableOpacity>
        ) : icone;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  target: { alignItems: 'center', justifyContent: 'center' },
});
