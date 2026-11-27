import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LocalUser } from '@/providers/user-provider';
import { AppText, Avatar, Button, MediaImage } from '@/shared/components';
import { formatarLocalizacao } from '@/shared/config/brazil-location';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { ProfileFormLayout } from './profile-form-layout';
import { OnboardingPhotoActions } from './onboarding-photo-actions';
import type { useOnboardingImages } from '../hooks/use-onboarding-photo';

type Props = {
  user: LocalUser;
  role: string;
  title: string;
  description: string;
  previewName?: string;
  previewDetail?: string;
  images: ReturnType<typeof useOnboardingImages>;
  onPickImage: (kind: 'avatar' | 'cover') => void;
  busy: boolean;
  changed: boolean;
  error?: string;
  onSave: () => void;
  onSkip: () => void;
  children: ReactNode;
};

export function OnboardingProfileLayout({
  user, role, title, description, previewName, previewDetail, images, onPickImage,
  busy, changed, error, onSave, onSkip, children,
}: Props) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const avatar = images.avatar.uri || user.avatarUrl;
  const cover = images.cover.uri || user.bannerUrl;
  const disabled = busy || images.picking;
  return (
    <ProfileFormLayout kicker="Conta criada" title={title} description={description}>
      <View style={{
        backgroundColor: color.accentSoft, borderRadius: radius.card, borderStartWidth: spacing.xs,
        borderStartColor: color.accentText, padding: spacing.lg, gap: spacing.md,
      }}>
        <AppText variant="overline" color="accentText" weight="bold">Prévia do perfil</AppText>
        <View accessible accessibilityRole="image" accessibilityLabel={`${avatar ? 'Foto de perfil escolhida.' : 'Sem foto de perfil.'} ${cover ? 'Capa escolhida.' : 'Sem capa.'}`}
          style={{
            width: '100%', aspectRatio: 16 / 9, borderRadius: radius.cardCompact, overflow: 'hidden',
            backgroundColor: color.accentSecondary, alignItems: 'center', justifyContent: 'center',
          }}>
          {cover ? <MediaImage uri={cover} style={{ ...StyleSheet.absoluteFill, width: '100%', height: '100%' }} /> : null}
          <View style={{ padding: spacing.xs, borderRadius: radius.pill, backgroundColor: color.surface }}>
            <Avatar uri={avatar} style={{ width: dimensions.control.large, height: dimensions.control.large, borderRadius: radius.pill }} />
          </View>
        </View>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="h3" weight="heavy">{previewName || user.nome}</AppText>
          <AppText variant="bodySmall" weight="semibold">{role}</AppText>
          {previewDetail ? <AppText variant="bodySmall">{previewDetail}</AppText> : null}
          <AppText variant="caption" color="textSecondary">{formatarLocalizacao(user.cidade, user.estado)}</AppText>
        </View>
        <View style={{ gap: spacing.sm }}>
          <OnboardingPhotoActions photo={images.avatar} label="foto de perfil" savedUri={user.avatarUrl}
            disabled={disabled} onPick={() => onPickImage('avatar')} />
          <OnboardingPhotoActions photo={images.cover} label="capa" savedUri={user.bannerUrl}
            disabled={disabled} onPick={() => onPickImage('cover')} />
        </View>
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
