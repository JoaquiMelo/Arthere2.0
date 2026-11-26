import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { createThemeTokens } from '@/shared/theme/tokens';
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
  ...inputProps
}: TextFieldProps) {
  const { palette } = useTheme();
  const tokens = createThemeTokens(palette);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant="label" weight="semibold">{label}</AppText>
      <TextInput
        {...inputProps}
        accessibilityLabel={accessibilityLabel ?? label}
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
            borderColor: error ? tokens.color.danger : focused ? tokens.color.accent : tokens.color.border,
            borderRadius: tokens.radius.control,
          },
        ]}
      />
      {error ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert">{error}</AppText>
      ) : helperText ? (
        <AppText variant="caption" color="textSecondary">{helperText}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
});
