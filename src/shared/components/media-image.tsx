import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, type ImageProps, type ImageStyle, type StyleProp, View, type ViewStyle } from 'react-native';
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

/** Never fetch legacy demonstration images. Failed or missing media stays local. */
export function MediaImage({ uri, ...props }: Props) {
  const clean = realImageUri(uri);
  // URLs antigas do próprio serviço podem ter sido salvas com HTTP ou sem origem.
  const ownUpload = clean.match(/^(?:https?:\/\/arthere-api\.onrender\.com)?\/uploads\/([a-f0-9-]{36}\.(?:jpg|png|webp|gif))$/i);
  const source = ownUpload ? `${API_URL}/uploads/${ownUpload[1]}` : clean;
  return <MediaContent key={source || 'empty'} uri={source} {...props} />;
}

function MediaContent({ uri, style, icon = 'image-outline', iconSize = 32, resizeMode = 'cover' }: Props) {
  const [failed, setFailed] = useState(false);
  const { color } = useThemeTokens();
  if (uri && !failed) {
    return <Image source={{ uri }} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
  }
  return (
    <View accessible={false} style={[style as StyleProp<ViewStyle>, { backgroundColor: color.surfaceSubtle, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
      <Ionicons name={icon} size={iconSize} color={color.textSecondary} />
    </View>
  );
}

export function Avatar({ icon = 'person-outline', ...props }: Props) {
  return <MediaImage icon={icon} {...props} />;
}
