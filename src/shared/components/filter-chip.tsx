import { Ionicons } from '@expo/vector-icons';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AppText } from './app-text';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  selected: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

/** Controle de seleção; a lógica dos filtros permanece na tela que o utiliza. */
export function FilterChip({ label, selected, icon, disabled = false, style, accessibilityState, accessibilityLabel, ...props }: Props) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const foreground = selected ? 'onAccent' : 'textPrimary';
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, selected, disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          gap: spacing.xs, minHeight: dimensions.touchTarget, paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1,
          borderColor: selected ? color.accent : color.border,
          backgroundColor: selected ? color.accent : color.surface,
          opacity: disabled ? 0.48 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={dimensions.icon.small} color={color[foreground]} /> : null}
      {selected ? <Ionicons name="checkmark" size={dimensions.icon.small} color={color[foreground]} /> : null}
      <AppText variant="bodySmall" color={foreground} weight="semibold" style={{ flexShrink: 1 }}>{label}</AppText>
    </Pressable>
  );
}
