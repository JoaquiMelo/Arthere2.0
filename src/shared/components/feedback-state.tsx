import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from './app-text';
import { Button } from './button';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useStatusAnnouncement } from '@/shared/hooks/use-status-announcement';

type Props = {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onRetry?: () => void;
};

export function FeedbackState({ kind, title, description, icon, onRetry }: Props) {
  const tokens = useThemeTokens();
  useStatusAnnouncement(kind === 'error' ? [title, description].filter(Boolean).join('. ') : undefined);
  return (
    <View accessibilityState={{ busy: kind === 'loading' }} style={{ alignItems: 'center', padding: tokens.spacing['2xl'], gap: tokens.spacing.md }}>
      {kind === 'loading' ? <ActivityIndicator color={tokens.color.accentText} /> :
        <Ionicons name={icon ?? (kind === 'error' ? 'alert-circle-outline' : 'folder-open-outline')} size={tokens.dimensions.icon.extraLarge} color={kind === 'error' ? tokens.color.dangerText : tokens.color.textSecondary} />}
      <AppText variant="title" weight="bold" accessibilityLiveRegion="polite" style={{ textAlign: 'center' }}>{title}</AppText>
      {description ? <AppText color="textSecondary" accessibilityLiveRegion="polite" style={{ textAlign: 'center' }}>{description}</AppText> : null}
      {kind === 'error' && onRetry ? <Button variant="outline" onPress={onRetry}>Tentar novamente</Button> : null}
    </View>
  );
}
