import { useNavigation, usePreventRemove, useRoute, type RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser } from '@/providers/user-provider';
import { event as getEvent, eventPhotos, saveEventPhotos, uploadImage } from '@/services/api';
import { AppText, Button, FeedbackState, MediaImage, ScreenContainer, ScreenHeader, SectionHeader } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { eventDayKey, isEventConcluded } from '../utils/event-agenda';
import type { EventData } from '../utils/event-form';

const MAX_PHOTOS = 8;
const uploadedPath = /\/uploads\/[a-f0-9-]{36}\.(?:jpg|png|webp|gif)$/i;

export default function EventAlbumScreen() {
  const navigation = useNavigation();
  const { params: { eventId } } = useRoute<RouteProp<RootStackParamList, 'EventAlbum'>>();
  const { user } = useUser();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [title, setTitle] = useState('');
  const [original, setOriginal] = useState<string[] | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState<'pick' | 'save' | null>(null);
  const [done, setDone] = useState(false);
  const pending = useRef(false);
  const uploaded = useRef(new Map<string, string>());
  const allowed = user?.tipo === 'CONTRATANTE_EVENTOS';
  const ownerId = user?.id;
  const dirty = original !== null && JSON.stringify(original) !== JSON.stringify(photos);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void (async () => {
      try {
        const event: EventData = await getEvent(eventId);
        if (event?.id !== eventId || event.contratanteId !== ownerId) throw new Error('Este evento não pertence à sua conta.');
        if (!isEventConcluded(eventDayKey(new Date(event.dataEvento)))) throw new Error('O álbum fica disponível depois da data do evento.');
        const stored = await eventPhotos(eventId);
        if (!Array.isArray(stored)) throw new Error('Não foi possível carregar as fotos.');
        if (active) {
          setTitle(event.titulo);
          setOriginal(stored);
          setPhotos(stored);
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Tente novamente.');
      }
    })();
    return () => { active = false; };
  }, [allowed, eventId, ownerId, retry]);

  usePreventRemove(!done && (dirty || busy !== null), ({ data }) => {
    if (pending.current) return;
    Alert.alert('Descartar alterações no álbum?', 'As fotos publicadas continuarão como estão.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  useEffect(() => {
    if (done) navigation.goBack();
  }, [done, navigation]);

  const pick = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (!allowed || pending.current || remaining <= 0) return;
    pending.current = true;
    setBusy('pick');
    setActionError('');
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Autorize o acesso à galeria para adicionar fotos.');
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: 0.85,
      });
      if (!result.canceled) {
        setPhotos((current) => [...new Set([...current, ...result.assets.map((asset) => asset.uri)])].slice(0, MAX_PHOTOS));
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível abrir a galeria.');
    } finally {
      pending.current = false;
      setBusy(null);
    }
  };

  const save = async () => {
    if (!allowed || original === null || !dirty || pending.current || done) return;
    pending.current = true;
    setBusy('save');
    setActionError('');
    try {
      const published: string[] = [];
      for (const photo of photos) {
        if (photo.startsWith('/uploads/') && uploadedPath.test(photo)) {
          published.push(photo);
          continue;
        }
        let path = uploaded.current.get(photo);
        if (!path) {
          path = (await uploadImage(photo)).match(uploadedPath)?.[0];
          if (!path) throw new Error('O servidor não retornou uma foto válida.');
          uploaded.current.set(photo, path);
        }
        published.push(path);
      }
      await saveEventPhotos(eventId, published);
      setDone(true);
    } catch (error) {
      pending.current = false;
      setBusy(null);
      setActionError(error instanceof Error ? error.message : 'Não foi possível publicar as fotos.');
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Álbum do evento" onBack={() => navigation.goBack()} />
      {!allowed ? <FeedbackState kind="error" title="Acesso indisponível" description="Somente o organizador pode editar o álbum." />
        : loadError ? <FeedbackState kind="error" title="Álbum indisponível" description={loadError}
          onRetry={() => { setLoadError(''); setRetry((value) => value + 1); }} />
          : original === null ? <FeedbackState kind="loading" title="Carregando álbum…" />
            : (
              <ScrollView contentContainerStyle={{ width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center', padding: spacing.xl, gap: spacing.lg }}>
                <SectionHeader title={title} description={`Até ${MAX_PHOTOS} fotos. A primeira aparece na aba Concluídos.`} />
                {photos.map((photo, index) => (
                  <View key={photo} style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.cardCompact, backgroundColor: color.surfaceSubtle }}>
                    <AppText variant="label" weight="bold">Foto {index + 1}</AppText>
                    <MediaImage uri={photo} style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.sm }} />
                    <Button variant="ghost" size="small" disabled={busy !== null} accessibilityLabel={`Remover foto ${index + 1}`}
                      onPress={() => setPhotos((current) => current.filter((uri) => uri !== photo))}>Remover foto</Button>
                  </View>
                ))}
                <Button variant="outline" loading={busy === 'pick'} disabled={busy !== null || photos.length >= MAX_PHOTOS} onPress={() => void pick()}>Adicionar fotos</Button>
                {actionError ? <AppText color="dangerText" accessibilityRole="alert">{actionError}</AppText> : null}
                <Button fullWidth loading={busy === 'save'} disabled={!dirty || busy !== null} onPress={() => void save()}>Salvar álbum</Button>
              </ScrollView>
            )}
    </ScreenContainer>
  );
}
