import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, type ImageProps, type ImageStyle, type StyleProp, View, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { realImageUri } from '@/shared/config/image-uri';

type Props = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  resizeMode?: ImageProps['resizeMode'];
};

/** Never fetch legacy demonstration images. Failed or missing media stays local. */
export function MediaImage({ uri, ...props }: Props) {
  const source = realImageUri(uri);
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
