import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AppText } from './app-text';
import { IconButton } from './icon-button';

type Props = {
  title: string;
  kicker?: string;
  description?: string;
  onBack?: () => void;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Cabeçalho de página; não conhece rotas ou regras de navegação. */
export function ScreenHeader({ title, kicker, description, onBack, action, style }: Props) {
  const { color, spacing } = useThemeTokens();
  return (
    <View style={[{ paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: color.border }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {onBack ? <IconButton icon="arrow-back" accessibilityLabel="Voltar" variant="ghost" onPress={onBack} /> : null}
        <View style={{ flex: 1, gap: spacing.xs }}>
          {kicker ? <AppText variant="overline" color="accentText" weight="bold">{kicker}</AppText> : null}
          <AppText variant="h2" weight="heavy" accessibilityRole="header">{title}</AppText>
        </View>
        {action}
      </View>
      {description ? <AppText variant="bodySmall" color="textSecondary">{description}</AppText> : null}
    </View>
  );
}
