import { Ionicons } from '@expo/vector-icons';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AppText } from './app-text';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  selected: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'compact' | 'segment';
};

/** Controle de seleção; a lógica dos filtros permanece na tela que o utiliza. */
export function FilterChip({ label, selected, icon, disabled = false, variant = 'default', style, accessibilityState, accessibilityLabel, ...props }: Props) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const isSegment = variant === 'segment';
  const selectedBackground = isSegment ? color.accentSecondary : color.accent;
  const foreground = selected ? (isSegment ? 'onAccentSecondary' : 'onAccent') : 'textPrimary';
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
          paddingVertical: spacing.sm, borderRadius: variant === 'default' ? radius.pill : radius.sm, borderWidth: 1,
          borderColor: selected ? (isSegment ? color.textPrimary : selectedBackground) : color.border,
          backgroundColor: selected ? selectedBackground : color.surface,
          opacity: disabled ? 0.48 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={dimensions.icon.small} color={color[foreground]} /> : null}
      {selected && !isSegment ? <Ionicons name="checkmark" size={dimensions.icon.small} color={color[foreground]} /> : null}
      <AppText variant="bodySmall" color={foreground} weight={selected && isSegment ? 'bold' : 'semibold'} style={{ flexShrink: 1 }}>{label}</AppText>
    </Pressable>
  );
}
