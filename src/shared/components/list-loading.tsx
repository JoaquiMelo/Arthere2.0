import { View } from 'react-native';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AppText } from './app-text';

export function ListLoading({ label, avatar = false }: { label: string; avatar?: boolean }) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  return (
    <View style={{ gap: spacing.md }}>
      <AppText color="textSecondary" accessibilityLiveRegion="polite">{label}</AppText>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ gap: spacing.md }}>
        {[0, 1].map((item) => (
          <View key={item} style={{
            flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg,
            borderRadius: radius.card, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface,
          }}>
            {avatar ? <View style={{ width: dimensions.control.large, height: dimensions.control.large,
              borderRadius: radius.control, backgroundColor: color.surfaceSubtle }} /> : null}
            <View style={{ gap: spacing.sm, flex: 1 }}>
              <View style={{ width: '45%', height: spacing.sm, borderRadius: radius.xs, backgroundColor: color.surfaceSubtle }} />
              <View style={{ width: '70%', height: spacing.md, borderRadius: radius.xs, backgroundColor: color.surfaceSubtle }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
