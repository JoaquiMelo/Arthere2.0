import { useState, type ReactNode, type ComponentRef, type Ref } from 'react';
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
  ref?: Ref<ComponentRef<typeof TextInput>>;
  label: string;
  error?: string;
  helperText?: string;
  trailingAction?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  ref,
  label,
  error,
  helperText,
  trailingAction,
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

  const input = (
    <TextInput
      ref={ref}
      keyboardAppearance={tokens.keyboardAppearance}
      selectionColor={tokens.color.selection}
      cursorColor={tokens.color.focus}
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
          borderColor: error ? tokens.color.dangerText : focused ? tokens.color.focus : tokens.color.controlBorder,
          borderRadius: tokens.radius.control,
          minHeight: tokens.dimensions.control.medium,
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          fontSize: tokens.typography.size.body,
        },
        trailingAction ? styles.flexInput : undefined,
      ]}
    />
  );
  return (
    <View style={[{ gap: tokens.spacing.sm }, containerStyle]}>
      <AppText variant="label" weight="semibold">{label}</AppText>
      {trailingAction ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm }}>
          {input}
          {trailingAction}
        </View>
      ) : input}
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
  flexInput: { flex: 1, minWidth: 0 },
});
