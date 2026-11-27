import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { AgenteCriativo } from '@/features/agents/types/agent';
import { MAP_CATEGORIES } from '@/features/map/utils/map-agents';
import { realImageUri } from '@/shared/config/image-uri';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { API_URL } from '@/services/api';

interface Props {
  agente: AgenteCriativo;
  onPress: (agente: AgenteCriativo) => void;
}

const MARKER_SIZE = 48;
const LOAD_TRACKING_LIMIT = 5000;
const SNAPSHOT_SETTLE_TIME = 300;

export function AgentMarker({ agente, onPress }: Props) {
  const { color } = useThemeTokens();
  const clean = realImageUri(agente.avatarUrl);
  const uri = clean.startsWith('/uploads/')
    ? `${API_URL}${clean}`
    : clean.replace(/^http:\/\/arthere-api\.onrender\.com\//i, 'https://arthere-api.onrender.com/');
  const category = MAP_CATEGORIES[agente.categoria] ?? MAP_CATEGORIES.outros;

  // Reinicia a captura apenas quando a imagem, categoria ou tema realmente muda.
  return <AvatarMarker key={JSON.stringify([uri, category.cor, color.surface, color.textSecondary])} agente={agente} onPress={onPress} uri={uri} frameColor={category.cor} surfaceColor={color.surface} fallbackColor={color.textSecondary} />;
}

type AvatarMarkerProps = Props & {
  uri: string;
  frameColor: string;
  surfaceColor: string;
  fallbackColor: string;
};

function AvatarMarker({ agente, onPress, uri, frameColor, surfaceColor, fallbackColor }: AvatarMarkerProps) {
  const marker = useRef<Marker>(null);
  const [phase, setPhase] = useState<'loading' | 'loaded' | 'fallback'>(uri ? 'loading' : 'fallback');
  const [tracking, setTracking] = useState(true);

  useEffect(() => {
    // Google Maps rasteriza as views customizadas no Android. Não mantenha
    // todos os marcadores sendo recapturados continuamente.
    const timer = setTimeout(() => {
      if (Platform.OS === 'android') marker.current?.redraw();
      setTracking(false);
    }, phase === 'loading' ? LOAD_TRACKING_LIMIT : SNAPSHOT_SETTLE_TIME);
    return () => clearTimeout(timer);
  }, [phase]);

  const finishImage = (result: 'loaded' | 'fallback') => {
    // Uma imagem lenta ainda pode chegar depois do limite inicial.
    setTracking(true);
    setPhase(result);
  };

  return (
    <Marker
      ref={marker}
      identifier={agente.id}
      coordinate={{ latitude: agente.latitude, longitude: agente.longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      title={agente.nome}
      description={agente.especialidades[0]}
      onPress={() => onPress(agente)}
      tracksViewChanges={tracking}
    >
      <View collapsable={false} style={[styles.wrapper, { backgroundColor: surfaceColor }]}>
        <View style={[styles.frame, { borderColor: frameColor, backgroundColor: surfaceColor }]}>
          <View style={[styles.photo, { backgroundColor: surfaceColor }]}>
            {phase !== 'loaded' ? <Ionicons name="person" size={22} color={fallbackColor} /> : null}
            {uri && phase !== 'fallback' ? (
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                fadeDuration={0}
                onLoad={() => finishImage('loaded')}
                onError={() => finishImage('fallback')}
                accessible={false}
              />
            ) : null}
          </View>
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    padding: 2,
  },
  frame: {
    flex: 1,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
  },
  photo: {
    flex: 1,
    borderRadius: MARKER_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
