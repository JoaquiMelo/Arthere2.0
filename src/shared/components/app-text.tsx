import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { createThemeTokens } from '@/shared/theme/tokens';
import type { TypographyVariant } from '@/shared/theme/typography';

type ColorToken = keyof ReturnType<typeof createThemeTokens>['color'];

type AppTextProps = TextProps & {
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
  const { palette } = useTheme();
  const tokens = createThemeTokens(palette);

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
