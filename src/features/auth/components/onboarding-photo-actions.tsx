import { View } from 'react-native';
import { AppText, Button } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { useOnboardingImages } from '../hooks/use-onboarding-photo';

export function OnboardingPhotoActions({ photo, label, savedUri, disabled, onPick }: {
  photo: ReturnType<typeof useOnboardingImages>['avatar'];
  label: string;
  savedUri?: string | null;
  disabled: boolean;
  onPick: () => void;
}) {
  const { spacing } = useThemeTokens();
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button variant="outline" size="small" disabled={disabled} loading={photo.picking} onPress={onPick}
          accessibilityLabel={photo.picking ? `Abrindo galeria para ${label}` : undefined}>
          {`${photo.uri || savedUri ? 'Trocar' : 'Adicionar'} ${label}`}
        </Button>
        {photo.uri ? <Button variant="ghost" size="small" disabled={disabled} onPress={photo.clear}>{`Desfazer escolha da ${label}`}</Button> : null}
      </View>
      {photo.error ? <AppText variant="caption" color="dangerText" accessibilityRole="alert">{photo.error}</AppText> : null}
    </View>
  );
}
