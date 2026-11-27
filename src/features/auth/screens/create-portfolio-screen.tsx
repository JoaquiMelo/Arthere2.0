import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { useUser } from '@/providers/user-provider';
import { addPortfolio, uploadImage } from '@/services/api';
import { AppText, Button, MediaImage, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { OnboardingProfileLayout } from '../components/onboarding-profile-layout';

function isPublicImageLink(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export default function CreatePortfolioScreen() {
  const { user, updateProfile, finishOnboarding } = useUser();
  const { color, radius, spacing } = useThemeTokens();
  const [specialty, setSpecialty] = useState(user?.especialidade ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [linkPreview, setLinkPreview] = useState('');
  const [source, setSource] = useState<'gallery' | 'link'>('gallery');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const [savedProfile, setSavedProfile] = useState(() => ({ specialty: specialty.trim(), bio: bio.trim() }));
  const uploaded = useRef<{ local: string; remote: string } | null>(null);
  const profileChanged = specialty.trim() !== savedProfile.specialty || bio.trim() !== savedProfile.bio;
  const selected = source === 'link' ? link.trim() : image;
  const isLink = source === 'link' && selected !== '';
  const linkError = isLink && !isPublicImageLink(selected) ? 'Use um endereço completo com http:// ou https://.' : undefined;
  const missingImage = !selected && Boolean(title.trim());
  const changed = profileChanged || Boolean(selected || title.trim());

  const chooseImage = async () => {
    if (pending.current) return;
    pending.current = true;
    setPicking(true);
    setError('');
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setError('Autorize o acesso à galeria ou use um link público para adicionar a amostra.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85 });
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setSource('gallery');
      }
    } catch {
      setError('Não foi possível abrir a galeria. Tente novamente.');
    } finally {
      pending.current = false;
      setPicking(false);
    }
  };

  const save = async () => {
    if (pending.current || user?.tipo !== 'AGENTE') return;
    setAttempted(true);
    setError('');
    if ((profileChanged && !specialty.trim()) || linkError || missingImage) return;
    pending.current = true;
    setBusy(true);
    try {
      let imageUrl = selected;
      if (selected && !isLink) {
        if (uploaded.current?.local === selected) imageUrl = uploaded.current.remote;
        else {
          imageUrl = await uploadImage(selected);
          uploaded.current = { local: selected, remote: imageUrl };
        }
      }
      if (profileChanged) {
        await updateProfile({
          ...(specialty.trim() !== savedProfile.specialty ? { especialidade: specialty.trim() } : {}),
          ...(bio.trim() !== savedProfile.bio ? { bio: bio.trim() || null } : {}),
        });
        setSavedProfile({ specialty: specialty.trim(), bio: bio.trim() });
      }
      if (imageUrl) {
        await addPortfolio({ agenteId: user.id, imageUrl, titulo: title.trim() || undefined });
      }
      finishOnboarding();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (user?.tipo !== 'AGENTE') return null;
  const preview = source === 'gallery' ? selected : (!linkError && linkPreview === selected ? linkPreview : '');
  return (
    <OnboardingProfileLayout user={user} role="Agente criativo"
      description="Revise sua apresentação e, se quiser, publique a primeira amostra do seu trabalho."
      busy={busy} changed={changed} disabled={picking} error={error} onSave={() => void save()}
      onSkip={() => { if (!pending.current) finishOnboarding(); }}>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Sua apresentação" />
        <TextField label="Área de atuação" value={specialty} onChangeText={setSpecialty}
          placeholder="Ex.: Fotografia, design ou música" editable={!busy && !picking}
          error={attempted && profileChanged && !specialty.trim() ? 'Informe sua área de atuação.' : undefined} />
        <TextField label="Sobre você (opcional)" value={bio} onChangeText={setBio} multiline numberOfLines={4}
          textAlignVertical="top" placeholder="Conte o que você faz e como gosta de trabalhar." editable={!busy && !picking} />
      </View>
      <View style={{ gap: spacing.md, borderTopWidth: 1, borderColor: color.border, paddingTop: spacing.lg }}>
        <SectionHeader title="Primeira amostra" description="Opcional. A imagem ficará visível no seu portfólio." />
        {preview ? (
          <View accessible accessibilityRole="image" accessibilityLabel="Prévia da imagem da primeira amostra">
            <MediaImage uri={preview} icon="image-outline" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.cardCompact }} />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button variant="outline" loading={picking} disabled={busy} onPress={() => void chooseImage()}>{source === 'gallery' && image ? 'Trocar imagem' : 'Escolher na galeria'}</Button>
          <Button variant="ghost" disabled={busy || picking} onPress={() => setSource('link')}>Usar um link</Button>
          {selected || title ? (
            <Button variant="ghost" disabled={busy || picking} onPress={() => {
              setImage(''); setLink(''); setLinkPreview(''); setTitle(''); setSource('gallery');
            }}>Remover amostra</Button>
          ) : null}
        </View>
        {source === 'link' ? (
          <TextField label="Link público da imagem" value={link} onChangeText={setLink} editable={!busy && !picking}
            keyboardType="url" autoCapitalize="none" autoCorrect={false} placeholder="https://..."
            onEndEditing={() => { if (!linkError) setLinkPreview(selected); }}
            error={attempted ? linkError : undefined} />
        ) : null}
        {selected ? <TextField label="Título da amostra (opcional)" value={title} onChangeText={setTitle} editable={!busy && !picking} /> : null}
        {attempted && missingImage ? (
          <AppText variant="bodySmall" color="dangerText" accessibilityRole="alert">Adicione uma imagem ou remova a amostra para continuar.</AppText>
        ) : null}
      </View>
    </OnboardingProfileLayout>
  );
}
