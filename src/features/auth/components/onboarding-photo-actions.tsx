import { View } from 'react-native';
import { AppText, Button } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { useOnboardingPhoto } from '../hooks/use-onboarding-photo';

export function OnboardingPhotoActions({ photo, disabled, onPick }: {
  photo: ReturnType<typeof useOnboardingPhoto>; disabled: boolean; onPick: () => void;
}) {
  const { spacing } = useThemeTokens();
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button variant="outline" size="small" disabled={disabled} loading={photo.picking} onPress={onPick}>
          {photo.uri ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
        </Button>
        {photo.uri ? <Button variant="ghost" size="small" disabled={disabled || photo.picking} onPress={photo.clear}>Remover foto escolhida</Button> : null}
      </View>
      {photo.error ? <AppText variant="caption" color="dangerText" accessibilityRole="alert">{photo.error}</AppText> : null}
    </View>
  );
}
