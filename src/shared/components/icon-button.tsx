import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

type Props = Omit<PressableProps, 'children' | 'style' | 'accessibilityLabel'> & {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  variant?: 'subtle' | 'outline' | 'ghost' | 'primary';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, accessibilityLabel, variant = 'subtle', size = 'small', loading = false, disabled = false, style, accessibilityState, onFocus, onBlur, ...props }: Props) {
  const { color, dimensions, radius } = useThemeTokens();
  const blocked = disabled || loading;
  const [focused, setFocused] = useState(false);
  const foreground = variant === 'primary' ? color.onAccent : color.textPrimary;
  const background = variant === 'primary' ? color.accent : variant === 'subtle' ? color.surfaceSubtle : 'transparent';
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled: blocked, busy: loading }}
      disabled={blocked}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={({ pressed }) => [
        {
          minWidth: dimensions.control[size],
          minHeight: dimensions.control[size],
          borderRadius: radius.control,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          borderWidth: 1,
          borderColor: variant === 'outline' ? color.controlBorder : 'transparent',
          opacity: disabled && !loading ? 0.48 : pressed ? 0.76 : 1,
        },
        style,
        focused && !blocked ? { borderColor: variant === 'primary' ? foreground : color.focus } : undefined,
      ]}
    >
      {loading ? <ActivityIndicator color={foreground} /> :
        <Ionicons name={icon} size={size === 'large' ? dimensions.icon.large : dimensions.icon.medium} color={foreground} />}
    </Pressable>
  );
}
