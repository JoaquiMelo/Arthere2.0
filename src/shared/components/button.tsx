import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/providers/theme-provider';
import { createThemeTokens } from '@/shared/theme/tokens';
import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const { palette } = useTheme();
  const tokens = createThemeTokens(palette);
  const isDisabled = disabled || loading;

  const backgrounds: Record<ButtonVariant, string> = {
    primary: tokens.color.accent,
    secondary: tokens.color.accentSecondary,
    outline: 'transparent',
    ghost: 'transparent',
    danger: tokens.color.danger,
  };
  const borders: Record<ButtonVariant, string> = {
    primary: 'transparent',
    secondary: 'transparent',
    outline: tokens.color.border,
    ghost: 'transparent',
    danger: 'transparent',
  };
  const heights: Record<ButtonSize, number> = { small: 40, medium: 48, large: 54 };

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: heights[size],
          paddingHorizontal: size === 'small' ? 14 : 18,
          borderRadius: tokens.radius.button,
          backgroundColor: backgrounds[variant],
          borderColor: borders[variant],
          opacity: isDisabled ? 0.48 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'outline' || variant === 'ghost' ? tokens.color.textPrimary : '#FFFFFF'} />
      ) : (
        <View style={styles.content}>
          <AppText variant="label" weight="bold" color={variant === 'secondary' || variant === 'outline' ? 'textPrimary' : variant === 'ghost' ? 'accent' : 'textInverse'}>
            {children}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
