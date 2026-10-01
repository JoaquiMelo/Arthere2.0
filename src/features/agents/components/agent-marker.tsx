import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

import { CATEGORIAS } from '../../../shared/config/categories';
import type { AgenteCriativo } from '@/features/agents/types/agent';
import { colors } from '@/shared/theme/colors';

interface Props {
  agente: AgenteCriativo;
  onPress: (agente: AgenteCriativo) => void;
}

export function AgentMarker({ agente, onPress }: Props) {
  const categoria = CATEGORIAS[agente.categoria] ?? CATEGORIAS.design;

  return (
    <Marker
      coordinate={{ latitude: agente.latitude, longitude: agente.longitude }}
      onPress={() => onPress(agente)}
      tracksViewChanges={false}>
      <View style={styles.wrapper}>
        <MaterialCommunityIcons name="map-marker" size={44} color={categoria.cor} />
        <View style={styles.iconOverlay}>
          <MaterialCommunityIcons name={categoria.icone as never} size={14} color={colors.white} />
        </View>
        {agente.disponivel && <View style={styles.statusDot} />}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 44, height: 44, alignItems: 'center', justifyContent: 'flex-start' },
  iconOverlay: { position: 'absolute', top: 6 },
  statusDot: { position: 'absolute', top: 0, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, borderWidth: 1.5, borderColor: colors.white },
});
