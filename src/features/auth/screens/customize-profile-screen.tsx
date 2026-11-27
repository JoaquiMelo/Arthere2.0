import { useRef, useState } from 'react';
import { View } from 'react-native';

import { useUser } from '@/providers/user-provider';
import { SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { OnboardingProfileLayout } from '../components/onboarding-profile-layout';

export default function CustomizeProfileScreen() {
  const { user, updateProfile, finishOnboarding } = useUser();
  const { spacing } = useThemeTokens();
  const isEventOrganizer = user?.tipo === 'CONTRATANTE_EVENTOS';
  const [publicName, setPublicName] = useState(user?.nomeSocial ?? '');
  const [organization, setOrganization] = useState(user?.empresa ?? '');
  const [phone, setPhone] = useState(user?.telefone ?? '');
  const [category, setCategory] = useState(user?.categoria ?? '');
  const [description, setDescription] = useState(user?.descricao ?? '');
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
  const missingOrganization = isEventOrganizer && Boolean(user.empresa?.trim()) && !newOrganization;
  const changes = {
    ...(newName !== (user.nomeSocial?.trim() ?? '') ? { nomeSocial: newName } : {}),
    ...(isEventOrganizer && newOrganization !== (user.empresa?.trim() ?? '') ? { empresa: newOrganization || null } : {}),
    ...(newPhone !== (user.telefone?.trim() ?? '') ? { telefone: newPhone || null } : {}),
    ...(newCategory !== (user.categoria?.trim() ?? '') ? { categoria: newCategory || null } : {}),
    ...(newDescription !== (user.descricao?.trim() ?? '') ? { descricao: newDescription || null } : {}),
  };
  const changed = Object.keys(changes).length > 0;

  const save = async () => {
    if (pending.current) return;
    setAttempted(true);
    setError('');
    if (missingOrganization) return;
    pending.current = true;
    setBusy(true);
    try {
      if (changed) await updateProfile(changes);
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
      description={isEventOrganizer ? 'Apresente quem organiza os eventos na Arthere.' : 'Apresente seu trabalho e as áreas em que você contrata.'}
      busy={busy} changed={changed} error={error} onSave={() => void save()}
      onSkip={() => { if (!pending.current) finishOnboarding(); }}>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title={isEventOrganizer ? 'Sobre a organização' : 'Sua apresentação'} />
        <TextField label="Nome social (opcional)" value={publicName} onChangeText={setPublicName} editable={!busy}
          helperText="Se ficar em branco, será usado o nome do cadastro." />
        {isEventOrganizer ? (
          <TextField label="Nome da organização" value={organization} onChangeText={setOrganization} editable={!busy}
            error={attempted && missingOrganization ? 'Informe o nome da organização.' : undefined} />
        ) : null}
        <TextField label={isEventOrganizer ? 'Segmento da organização' : 'Área das oportunidades'}
          value={category} onChangeText={setCategory} editable={!busy}
          placeholder={isEventOrganizer ? 'Ex.: Cultura e eventos' : 'Ex.: Design e produção cultural'} />
        <TextField label="Apresentação (opcional)" value={description} onChangeText={setDescription}
          editable={!busy} multiline numberOfLines={4} textAlignVertical="top" />
        <TextField label="Telefone de contato (opcional)" value={phone} onChangeText={setPhone}
          editable={!busy} keyboardType="phone-pad" autoComplete="tel" />
      </View>
    </OnboardingProfileLayout>
  );
}
