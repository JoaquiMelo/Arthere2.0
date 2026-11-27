import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { ScreenContainer, ScreenHeader } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

export function ProfileFormLayout({ title, kicker, description, onBack, step, children }: {
  title: string;
  kicker?: string;
  description: string;
  onBack?: () => void;
  step?: number;
  children: ReactNode;
}) {
  const { color, dimensions, spacing, radius } = useThemeTokens();
  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView key={step} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          contentContainerStyle={{ width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center', paddingBottom: spacing['3xl'] }}>
          <ScreenHeader kicker={kicker} title={title} description={description} onBack={onBack} />
          <View style={{ padding: spacing.xl, gap: spacing.lg }}>
            {step !== undefined ? (
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', gap: spacing.sm }}>
                {[0, 1, 2].map((index) => (
                  <View key={index} style={{
                    flex: 1, height: spacing.xs, borderRadius: radius.control,
                    backgroundColor: index <= step ? color.accentText : color.border,
                  }} />
                ))}
              </View>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
