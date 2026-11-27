import { useRef, useState } from 'react';
import { View } from 'react-native';

import { useUser } from '@/providers/user-provider';
import { SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { OnboardingProfileLayout } from '../components/onboarding-profile-layout';
import { OnboardingPhotoActions } from '../components/onboarding-photo-actions';
import { useOnboardingPhoto } from '../hooks/use-onboarding-photo';

export default function CustomizeProfileScreen() {
  const { user, updateProfile, finishOnboarding } = useUser();
  const { spacing } = useThemeTokens();
  const photo = useOnboardingPhoto();
  const isEventOrganizer = user?.tipo === 'CONTRATANTE_EVENTOS';
  const [publicName, setPublicName] = useState(user?.nomeSocial ?? '');
  const [organization, setOrganization] = useState(user?.empresa ?? '');
  const [phone, setPhone] = useState(user?.telefone ?? '');
  const [category, setCategory] = useState(user?.categoria ?? '');
  const [description, setDescription] = useState(user?.descricao ?? '');
  const [site, setSite] = useState(user?.site ?? '');
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  if (!user || (user.tipo !== 'CONTRATANTE_EVENTOS' && user.tipo !== 'CONTRATANTE_OPORTUNIDADES')) return null;

  const newName = publicName.trim();
  const newOrganization = organization.trim();
  const newPhone = phone.trim();
  const newCategory = category.trim();
  const newDescription = description.trim();
  const newSite = site.trim();
  const missingOrganization = isEventOrganizer && Boolean(user.empresa?.trim()) && !newOrganization;
  const changes = {
    ...(newName !== (user.nomeSocial?.trim() ?? '') ? { nomeSocial: newName } : {}),
    ...(isEventOrganizer && newOrganization !== (user.empresa?.trim() ?? '') ? { empresa: newOrganization || null } : {}),
    ...(newPhone !== (user.telefone?.trim() ?? '') ? { telefone: newPhone || null } : {}),
    ...(newCategory !== (user.categoria?.trim() ?? '') ? { categoria: newCategory || null } : {}),
    ...(newDescription !== (user.descricao?.trim() ?? '') ? { descricao: newDescription || null } : {}),
    ...(isEventOrganizer && newSite !== (user.site?.trim() ?? '') ? { site: newSite || null } : {}),
  };
  const changed = Boolean(photo.uri) || Object.keys(changes).length > 0;
  const disabled = busy || photo.picking;

  const save = async () => {
    if (pending.current || photo.active.current) return;
    setAttempted(true);
    setError('');
    if (missingOrganization) return;
    pending.current = true;
    setBusy(true);
    try {
      if (changed) {
        const avatarUrl = await photo.upload();
        await updateProfile({ ...changes, ...(avatarUrl ? { avatarUrl } : {}) });
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
    <OnboardingProfileLayout user={user} role={isEventOrganizer ? 'Contratante de eventos' : 'Contratante de oportunidades'}
      title={isEventOrganizer ? 'Apresente sua organização' : 'Prepare seu perfil de contratante'}
      description={isEventOrganizer ? 'Mostre quem está por trás dos seus eventos.' : 'Mostre aos agentes criativos em quais áreas você contrata.'}
      previewName={newName} previewDetail={[isEventOrganizer ? newOrganization : '', newCategory].filter(Boolean).join(' · ')}
      photo={photo.uri || user.avatarUrl}
      photoActions={<OnboardingPhotoActions photo={photo} disabled={busy}
        onPick={() => { if (!pending.current) void photo.pick(); }} />}
      busy={busy} changed={changed} disabled={photo.picking} error={error} onSave={() => void save()}
      onSkip={() => { if (!pending.current && !photo.active.current) finishOnboarding(); }}>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title={isEventOrganizer ? 'Sobre a organização' : 'Sua apresentação'} />
        <TextField label="Nome social (opcional)" value={publicName} onChangeText={setPublicName} editable={!disabled}
          helperText="Se ficar em branco, será usado o nome do cadastro." />
        {isEventOrganizer ? (
          <TextField label="Nome da organização" value={organization} onChangeText={setOrganization} editable={!disabled}
            error={attempted && missingOrganization ? 'Informe o nome da organização.' : undefined} />
        ) : null}
        <TextField label={isEventOrganizer ? 'Segmento da organização' : 'Área das oportunidades (opcional)'}
          value={category} onChangeText={setCategory} editable={!disabled}
          placeholder={isEventOrganizer ? 'Ex.: Cultura e eventos' : 'Ex.: Design e produção cultural'} />
        <TextField label="Apresentação (opcional)" value={description} onChangeText={setDescription}
          editable={!disabled} multiline numberOfLines={4} textAlignVertical="top" />
      </View>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Contato" />
        <TextField label="Telefone de contato (opcional)" value={phone} onChangeText={setPhone}
          editable={!disabled} keyboardType="phone-pad" autoComplete="tel" />
        {isEventOrganizer ? <TextField label="Site da organização (opcional)" value={site} onChangeText={setSite}
          editable={!disabled} keyboardType="url" autoCapitalize="none" autoCorrect={false} /> : null}
      </View>
    </OnboardingProfileLayout>
  );
}
