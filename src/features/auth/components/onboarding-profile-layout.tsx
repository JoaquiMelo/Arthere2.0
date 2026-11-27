import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { LocalUser } from '@/providers/user-provider';
import { AppText, Avatar, Button } from '@/shared/components';
import { formatarLocalizacao } from '@/shared/config/brazil-location';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { ProfileFormLayout } from './profile-form-layout';

type Props = {
  user: LocalUser;
  role: string;
  title: string;
  description: string;
  previewName?: string;
  previewDetail?: string;
  photo?: string | null;
  photoActions: ReactNode;
  busy: boolean;
  changed: boolean;
  error?: string;
  disabled?: boolean;
  onSave: () => void;
  onSkip: () => void;
  children: ReactNode;
};

export function OnboardingProfileLayout({
  user, role, title, description, previewName, previewDetail, photo, photoActions,
  busy, changed, error, disabled, onSave, onSkip, children,
}: Props) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  return (
    <ProfileFormLayout kicker="Conta criada" title={title} description={description}>
      <View style={{
        backgroundColor: color.accentSoft, borderRadius: radius.card, borderStartWidth: spacing.xs,
        borderStartColor: color.accentText, padding: spacing.lg, gap: spacing.md,
      }}>
        <AppText variant="overline" color="accentText" weight="bold">Prévia do perfil</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar uri={photo} style={{ width: dimensions.control.large, height: dimensions.control.large, borderRadius: radius.pill }} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="h3" weight="heavy">{previewName || user.nome}</AppText>
            <AppText variant="bodySmall" weight="semibold">{role}</AppText>
            {previewDetail ? <AppText variant="bodySmall">{previewDetail}</AppText> : null}
            <AppText variant="caption" color="textSecondary">{formatarLocalizacao(user.cidade, user.estado)}</AppText>
          </View>
        </View>
        {photoActions}
      </View>
      {children}
      <View style={{ gap: spacing.sm }}>
        {error ? <AppText variant="bodySmall" color="dangerText" accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</AppText> : null}
        <Button fullWidth loading={busy} disabled={disabled} accessibilityLabel={busy ? 'Salvando perfil' : undefined} onPress={onSave}>
          {changed ? 'Salvar e ir para o mapa' : 'Ir para o mapa'}
        </Button>
        {changed ? <Button variant="ghost" disabled={busy || disabled} onPress={onSkip}>Continuar sem salvar as alterações</Button> : null}
        <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>Você pode editar esses dados mais tarde na aba Perfil.</AppText>
      </View>
    </ProfileFormLayout>
  );
}
