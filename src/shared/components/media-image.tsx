import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import { type ImageProps, type ImageStyle, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { realImageUri } from '@/shared/config/image-uri';
import { API_URL } from '@/services/api';

type Props = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  resizeMode?: ImageProps['resizeMode'];
};

const MAX_RETRIES = 2;

/** Preserve URLs absolutas válidas, inclusive fotos de produção durante testes locais. */
export function MediaImage({ uri, ...props }: Props) {
  const clean = realImageUri(uri);
  const source = clean.startsWith('/uploads/')
    ? `${API_URL}${clean}`
    : clean.replace(/^http:\/\/arthere-api\.onrender\.com\//i, 'https://arthere-api.onrender.com/');
  return <MediaContent key={source || 'empty'} uri={source} {...props} />;
}

function MediaContent({ uri, style, icon = 'image-outline', iconSize = 32, resizeMode = 'cover' }: Props) {
  const { color } = useThemeTokens();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const remote = Boolean(uri && /^https?:\/\//i.test(uri));

  useEffect(() => {
    if (!remote || !failed || attempt >= MAX_RETRIES) return;
    const timer = setTimeout(() => {
      setAttempt((value) => value + 1);
      setFailed(false);
    }, 800 * 2 ** attempt);
    return () => clearTimeout(timer);
  }, [remote, failed, attempt]);

  const fit = resizeMode === 'stretch' ? 'fill' : resizeMode === 'contain' ? 'contain' : resizeMode === 'center' ? 'none' : 'cover';
  const ownUpload = Boolean(uri && /^https:\/\/arthere-api\.onrender\.com\/uploads\//i.test(uri));
  // Um novo endereço apenas nas tentativas do próprio servidor evita reutilizar
  // uma resposta de erro armazenada pelo cache HTTP, sem quebrar URLs assinadas.
  const requestUri = uri && ownUpload && attempt > 0
    ? `${uri}${uri.includes('?') ? '&' : '?'}retry=${attempt}`
    : uri;
  return (
    <View style={[style as StyleProp<ViewStyle>, { backgroundColor: color.surfaceSubtle, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
      {!loaded ? <Ionicons name={icon} size={iconSize} color={color.textSecondary} /> : null}
      {requestUri && !failed ? (
        <ExpoImage
          key={attempt}
          source={{ uri: requestUri }}
          style={StyleSheet.absoluteFill}
          contentFit={fit}
          cachePolicy={remote && attempt === 0 ? 'memory-disk' : 'none'}
          recyclingKey={requestUri}
          onLoad={() => setLoaded(true)}
          onError={({ error }) => {
            if (__DEV__) {
              const detail = String(error ?? '').replace(/https?:\/\/\S+/gi, '[url]').slice(0, 180);
              console.log(`[Arthere imagens] Falha de carregamento (${attempt + 1}/${MAX_RETRIES + 1}): ${detail}`);
            }
            setLoaded(false);
            setFailed(true);
          }}
        />
      ) : null}
    </View>
  );
}

export function Avatar({ icon = 'person-outline', ...props }: Props) {
  return <MediaImage icon={icon} {...props} />;
}
