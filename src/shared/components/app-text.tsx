import type { ComponentRef, ReactNode, Ref } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { TypographyVariant } from '@/shared/theme/typography';

import type { ColorToken } from '@/shared/theme/tokens';

type AppTextProps = TextProps & {
  ref?: Ref<ComponentRef<typeof Text>>;
  children: ReactNode;
  variant?: TypographyVariant;
  color?: ColorToken;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
  style?: StyleProp<TextStyle>;
};

export function AppText({
  children,
  variant = 'body',
  color = 'textPrimary',
  weight = 'regular',
  style,
  ...props
}: AppTextProps) {
  const tokens = useThemeTokens();

  return (
    <Text
      {...props}
      style={[
        {
          color: tokens.color[color],
          fontSize: tokens.typography.size[variant],
          lineHeight: tokens.typography.lineHeight[variant],
          fontWeight: tokens.typography.weight[weight],
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
