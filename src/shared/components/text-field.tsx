import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AppText } from './app-text';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  error,
  helperText,
  containerStyle,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  ...inputProps
}: TextFieldProps) {
  const tokens = useThemeTokens();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: tokens.spacing.sm }, containerStyle]}>
      <AppText variant="label" weight="semibold">{label}</AppText>
      <TextInput
        {...inputProps}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={error ?? accessibilityHint ?? helperText}
        accessibilityState={{ ...accessibilityState, disabled: inputProps.editable === false || accessibilityState?.disabled }}
        placeholderTextColor={tokens.color.textSecondary}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            color: tokens.color.textPrimary,
            backgroundColor: tokens.color.surface,
            borderColor: error ? tokens.color.dangerText : focused ? tokens.color.focus : tokens.color.border,
            borderRadius: tokens.radius.control,
            minHeight: tokens.dimensions.control.medium,
            paddingHorizontal: tokens.spacing.lg,
            paddingVertical: tokens.spacing.md,
            fontSize: tokens.typography.size.body,
          },
        ]}
      />
      {error ? (
        <AppText variant="caption" color="dangerText" accessibilityRole="alert">{error}</AppText>
      ) : helperText ? (
        <AppText variant="caption" color="textSecondary">{helperText}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
  },
});
