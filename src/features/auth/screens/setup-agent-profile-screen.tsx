import { useRef, useState } from 'react';
import { View } from 'react-native';

import { useUser } from '@/providers/user-provider';
import { SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { OnboardingProfileLayout } from '../components/onboarding-profile-layout';
import { useOnboardingImages } from '../hooks/use-onboarding-photo';

export default function SetupAgentProfileScreen() {
  const { user, updateProfile, finishOnboarding } = useUser();
  const { spacing } = useThemeTokens();
  const images = useOnboardingImages();
  const [specialty, setSpecialty] = useState(user?.especialidade ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  if (user?.tipo !== 'AGENTE') return null;

  const newSpecialty = specialty.trim();
  const newBio = bio.trim();
  const specialtyChanged = newSpecialty !== (user.especialidade?.trim() ?? '');
  const bioChanged = newBio !== (user.bio?.trim() ?? '');
  const missingSpecialty = specialtyChanged && !newSpecialty;
  const changed = specialtyChanged || bioChanged || images.changed;
  const disabled = busy || images.picking;

  const save = async () => {
    if (pending.current || images.isPicking()) return;
    setAttempted(true);
    setError('');
    if (missingSpecialty) return;
    pending.current = true;
    setBusy(true);
    try {
      if (changed) {
        await updateProfile({
          ...(specialtyChanged ? { especialidade: newSpecialty } : {}),
          ...(bioChanged ? { bio: newBio || null } : {}),
          ...await images.upload(),
        });
      }
      finishOnboarding();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <OnboardingProfileLayout user={user} role="Agente criativo"
      title="Prepare seu perfil" description="Escolha uma foto de perfil e uma capa. As duas são opcionais."
      previewDetail={newSpecialty} images={images}
      onPickImage={(kind) => { if (!pending.current) images.pick(kind); }}
      busy={busy} changed={changed} error={error} onSave={() => void save()}
      onSkip={() => { if (!pending.current && !images.isPicking()) finishOnboarding(); }}>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Sua apresentação" />
        <TextField label="Área de atuação" value={specialty} onChangeText={setSpecialty}
          placeholder="Ex.: Fotografia, design ou música" editable={!disabled}
          error={attempted && missingSpecialty ? 'Informe sua área de atuação.' : undefined} />
        <TextField label="Sobre você (opcional)" value={bio} onChangeText={setBio} multiline numberOfLines={4}
          textAlignVertical="top" placeholder="Conte o que você faz e como gosta de trabalhar." editable={!disabled} />
      </View>
    </OnboardingProfileLayout>
  );
}
