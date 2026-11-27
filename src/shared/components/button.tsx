import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { useState, type ReactNode } from 'react';

import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AppText } from './app-text';
import type { ColorToken } from '@/shared/theme/tokens';

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
  accessibilityState,
  onFocus,
  onBlur,
  ...props
}: ButtonProps) {
  const tokens = useThemeTokens();
  const [focused, setFocused] = useState(false);
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
  const foregrounds: Record<ButtonVariant, ColorToken> = {
    primary: 'onAccent',
    secondary: 'onAccentSecondary',
    outline: 'textPrimary',
    ghost: 'accentText',
    danger: 'onDanger',
  };
  const foreground = foregrounds[variant];

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: tokens.dimensions.control[size],
          paddingHorizontal: size === 'small' ? tokens.spacing.md : tokens.spacing.xl,
          paddingVertical: tokens.spacing.sm,
          borderRadius: tokens.radius.button,
          backgroundColor: backgrounds[variant],
          borderColor: focused && !isDisabled ? tokens.color.focus : borders[variant],
          opacity: disabled && !loading ? 0.48 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      <View style={[styles.content, { gap: tokens.spacing.sm }]}>
        {loading ? <ActivityIndicator color={tokens.color[foreground]} accessibilityElementsHidden importantForAccessibility="no" /> : null}
        <AppText variant="label" weight="bold" color={foreground} style={{ flexShrink: 1, textAlign: 'center' }}>
          {children}
        </AppText>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
