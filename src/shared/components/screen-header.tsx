import type { ComponentRef, ReactNode, Ref } from 'react';
import { useWindowDimensions, View, type StyleProp, type Text, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AppText } from './app-text';
import { IconButton } from './icon-button';

type Props = {
  title: string;
  titleRef?: Ref<ComponentRef<typeof Text>>;
  titleAccessibilityLabel?: string;
  kicker?: string;
  description?: string;
  onBack?: () => void;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Cabeçalho de página; não conhece rotas ou regras de navegação. */
export function ScreenHeader({ title, titleRef, titleAccessibilityLabel, kicker, description, onBack, action, style }: Props) {
  const { color, dimensions, spacing } = useThemeTokens();
  const { width, fontScale } = useWindowDimensions();
  const wrapsAction = width / fontScale < 6 * dimensions.control.large;
  return (
    <View style={[{ paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: color.border }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {onBack ? <IconButton icon="arrow-back" accessibilityLabel="Voltar" variant="ghost" onPress={onBack} /> : null}
        <View style={{ flex: 1, gap: spacing.xs }}>
          {kicker ? <AppText variant="overline" color="accentText" weight="bold">{kicker}</AppText> : null}
          <AppText ref={titleRef} variant="h2" weight="heavy" accessibilityRole="header"
            accessibilityLabel={titleAccessibilityLabel}>{title}</AppText>
        </View>
        {wrapsAction ? null : action}
      </View>
      {description ? <AppText variant="bodySmall" color="textSecondary">{description}</AppText> : null}
      {wrapsAction && action ? <View style={{ alignItems: 'flex-end' }}>{action}</View> : null}
    </View>
  );
}
