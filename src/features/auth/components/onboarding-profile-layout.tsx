import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import type { LocalUser } from '@/providers/user-provider';
import { AppText, Button, ScreenContainer, ScreenHeader } from '@/shared/components';
import { formatarLocalizacao } from '@/shared/config/brazil-location';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

type Props = {
  user: LocalUser;
  role: string;
  description: string;
  busy: boolean;
  changed: boolean;
  error?: string;
  disabled?: boolean;
  onSave: () => void;
  onSkip: () => void;
  children: ReactNode;
};

export function OnboardingProfileLayout({ user, role, description, busy, changed, error, disabled, onSave, onSkip, children }: Props) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  return (
    <ScreenContainer>
      <ScreenHeader kicker="CONTA CRIADA" title="Prepare seu perfil" description={description} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center',
            padding: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing['2xl'],
          }}
        >
          <View style={{
            padding: spacing.lg, backgroundColor: color.accentSoft, borderRadius: radius.card,
            borderTopWidth: spacing.xs, borderColor: color.accent, gap: spacing.xs,
          }}>
            <AppText variant="label" weight="bold">{role}</AppText>
            <AppText variant="h2" weight="heavy">{user.nomeSocial || user.nome}</AppText>
            <AppText variant="bodySmall">{formatarLocalizacao(user.cidade, user.estado)}</AppText>
          </View>
          {children}
          {error ? <AppText variant="bodySmall" color="dangerText" accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</AppText> : null}
          <View style={{ gap: spacing.sm }}>
            <Button fullWidth loading={busy} disabled={disabled} onPress={onSave}>
              {changed ? 'Salvar e ir para o mapa' : 'Ir para o mapa'}
            </Button>
            {changed ? <Button variant="ghost" disabled={busy || disabled} onPress={onSkip}>Continuar sem salvar as alterações</Button> : null}
            <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>Você pode completar seus dados na aba Perfil.</AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
