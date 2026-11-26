import { Ionicons } from '@expo/vector-icons';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { ColorToken } from '@/shared/theme/tokens';
import { AppText } from './app-text';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
type Props = {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

const foregrounds: Record<Tone, ColorToken> = {
  neutral: 'textSecondary', accent: 'accentText', success: 'successText',
  warning: 'warningText', danger: 'dangerText',
};

/** Status informativo, sem ação de toque. O texto comunica o estado além da cor. */
export function Badge({ label, tone = 'neutral', icon, style }: Props) {
  const { color, radius, spacing, dimensions } = useThemeTokens();
  const foreground = foregrounds[tone];
  return (
    <View style={[{
      alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row',
      alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs, borderRadius: radius.sm,
      backgroundColor: color.surfaceSubtle,
    }, style]}>
      {icon ? <Ionicons name={icon} size={dimensions.icon.small} color={color[foreground]} /> : null}
      <AppText color={foreground} variant="label" weight="semibold" style={{ flexShrink: 1 }}>{label}</AppText>
    </View>
  );
}
