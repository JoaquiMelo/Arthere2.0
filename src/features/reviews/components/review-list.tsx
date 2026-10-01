import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import type { Avaliacao } from '../types/review';
import { StarRating } from './star-rating';

export function ReviewList({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  if (!avaliacoes.length) return <Text style={styles.empty}>Ainda não há avaliações.</Text>;
  return (
    <View style={styles.list}>
      {avaliacoes.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.autor}>{item.autorNome}</Text>
            <StarRating value={item.nota} size={13} />
          </View>
          {item.comentario && <Text style={styles.comentario}>{item.comentario}</Text>}
          <Text style={styles.data}>{item.criadoEm.toLocaleDateString('pt-BR')}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 }, empty: { color: colors.muted, fontSize: 13 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  autor: { color: colors.text, fontWeight: '700', fontSize: 13 },
  comentario: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 6 },
  data: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
