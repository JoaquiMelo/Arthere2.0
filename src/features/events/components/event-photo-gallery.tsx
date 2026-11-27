import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { eventPhotos } from '@/services/api';
import { AppText, FeedbackState, MediaImage, SectionHeader } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

export function EventPhotoGallery({ eventId, cover }: { eventId: string; cover?: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const request = useRef<symbol | null>(null);
  const { spacing, radius } = useThemeTokens();
  const load = useCallback(async () => {
    const id = Symbol();
    request.current = id;
    setStatus('loading');
    try {
      const result = await eventPhotos(eventId);
      if (!Array.isArray(result)) throw new Error('Resposta inválida');
      if (request.current === id) {
        setPhotos(result);
        setStatus('ready');
      }
    } catch {
      if (request.current === id) setStatus('error');
    }
  }, [eventId]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current = null; };
  }, [load]));

  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title="Fotos do evento" />
      {status === 'loading' ? <AppText color="textSecondary" accessibilityLiveRegion="polite">Carregando fotos…</AppText> : null}
      {status === 'error' ? <FeedbackState kind="error" title="Não foi possível carregar o álbum" onRetry={() => void load()} /> : null}
      {photos.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {photos.map((photo, index) => (
            <View key={photo} accessible accessibilityRole="image" accessibilityLabel={`Foto ${index + 1} de ${photos.length}`}
              style={{ flexBasis: '45%', flexGrow: 1 }}>
              <MediaImage uri={photo} style={{ aspectRatio: 4 / 3, width: '100%', borderRadius: radius.sm }} />
            </View>
          ))}
        </View>
      ) : status === 'ready' ? (
        <AppText variant="bodySmall" color="textSecondary">
          {cover ? 'O álbum ainda está vazio. A foto de capa aparece no início da página.' : 'O organizador ainda não publicou fotos deste evento.'}
        </AppText>
      ) : null}
    </View>
  );
}
