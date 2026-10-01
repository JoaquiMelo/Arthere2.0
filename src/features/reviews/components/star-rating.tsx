import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

interface Props {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
}

export function StarRating({ value, size = 16, onChange }: Props) {
  const estrelas = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      {estrelas.map((estrela) => {
        const preenchida = estrela <= Math.round(value);
        const icone = <Ionicons key={estrela} name={preenchida ? 'star' : 'star-outline'} size={size} color={colors.accent} />;
        return onChange ? (
          <TouchableOpacity key={estrela} onPress={() => onChange(estrela)} accessibilityLabel={`Dar nota ${estrela}`} hitSlop={6}>
            {icone}
          </TouchableOpacity>
        ) : icone;
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 2 } });
