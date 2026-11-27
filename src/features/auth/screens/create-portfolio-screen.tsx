import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { useUser } from '@/providers/user-provider';
import { addPortfolio, uploadImage } from '@/services/api';
import { AppText, Button, FilterChip, MediaImage, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { OnboardingProfileLayout } from '../components/onboarding-profile-layout';
import { OnboardingPhotoActions } from '../components/onboarding-photo-actions';
import { useOnboardingPhoto } from '../hooks/use-onboarding-photo';

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
  const photo = useOnboardingPhoto();
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
  const [imageError, setImageError] = useState('');
  const pending = useRef(false);
  const [savedProfile, setSavedProfile] = useState(() => ({ specialty: specialty.trim(), bio: bio.trim() }));
  const uploaded = useRef<{ local: string; remote: string } | null>(null);
  const profileChanged = specialty.trim() !== savedProfile.specialty || bio.trim() !== savedProfile.bio;
  const selected = source === 'link' ? link.trim() : image;
  const isLink = source === 'link' && selected !== '';
  const linkError = isLink && !isPublicImageLink(selected) ? 'Use um endereço completo com http:// ou https://.' : undefined;
  const missingImage = !selected && Boolean(title.trim());
  const changed = profileChanged || Boolean(photo.uri || selected || title.trim());

  const chooseImage = async () => {
    if (pending.current || photo.active.current) return;
    pending.current = true;
    setPicking(true);
    setImageError('');
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setImageError('Autorize o acesso à galeria ou use um link público para adicionar a amostra.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85 });
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
        setSource('gallery');
      }
    } catch {
      setImageError('Não foi possível abrir a galeria. Tente novamente.');
    } finally {
      pending.current = false;
      setPicking(false);
    }
  };

  const save = async () => {
    if (pending.current || photo.active.current || user?.tipo !== 'AGENTE') return;
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
      if (profileChanged || photo.uri) {
        const avatarUrl = await photo.upload();
        await updateProfile({
          ...(specialty.trim() !== savedProfile.specialty ? { especialidade: specialty.trim() } : {}),
          ...(bio.trim() !== savedProfile.bio ? { bio: bio.trim() || null } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        });
        setSavedProfile({ specialty: specialty.trim(), bio: bio.trim() });
        photo.clear();
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
  const disabled = busy || picking || photo.picking;
  const preview = source === 'gallery' ? selected : (!linkError && linkPreview === selected ? linkPreview : '');
  return (
    <OnboardingProfileLayout user={user} role="Agente criativo"
      title="Apresente seu trabalho" description="Revise seu perfil e, se quiser, adicione sua primeira amostra ao portfólio."
      previewDetail={specialty.trim()} photo={photo.uri || user.avatarUrl}
      photoActions={<OnboardingPhotoActions photo={photo} disabled={busy || picking}
        onPick={() => { if (!pending.current) void photo.pick(); }} />}
      busy={busy} changed={changed} disabled={picking || photo.picking} error={error} onSave={() => void save()}
      onSkip={() => { if (!pending.current && !photo.active.current) finishOnboarding(); }}>
      <View style={{ gap: spacing.md }}>
        <SectionHeader title="Sua apresentação" />
        <TextField label="Área de atuação" value={specialty} onChangeText={setSpecialty}
          placeholder="Ex.: Fotografia, design ou música" editable={!disabled}
          error={attempted && profileChanged && !specialty.trim() ? 'Informe sua área de atuação.' : undefined} />
        <TextField label="Sobre você (opcional)" value={bio} onChangeText={setBio} multiline numberOfLines={4}
          textAlignVertical="top" placeholder="Conte o que você faz e como gosta de trabalhar." editable={!disabled} />
      </View>
      <View style={{ gap: spacing.md, borderTopWidth: 1, borderColor: color.border, paddingTop: spacing.lg }}>
        <SectionHeader title="Primeira amostra" description="A publicação no portfólio é opcional." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <FilterChip label="Galeria" icon="images-outline" selected={source === 'gallery'} disabled={disabled}
            onPress={() => { setSource('gallery'); setImageError(''); }} />
          <FilterChip label="Link público" icon="link-outline" selected={source === 'link'} disabled={disabled}
            onPress={() => { setSource('link'); setImageError(''); }} />
        </View>
        {preview ? (
          <View accessible accessibilityRole="image" accessibilityLabel="Prévia da imagem da primeira amostra">
            <MediaImage uri={preview} icon="image-outline" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.cardCompact }} />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {source === 'gallery' ? <Button variant="outline" loading={picking} disabled={busy || photo.picking} onPress={() => void chooseImage()}>{image ? 'Trocar imagem' : 'Escolher imagem'}</Button> : null}
          {image || link || title ? (
            <Button variant="ghost" disabled={disabled} onPress={() => {
              setImage(''); setLink(''); setLinkPreview(''); setTitle(''); setImageError('');
            }}>Remover amostra</Button>
          ) : null}
        </View>
        {source === 'link' ? (
          <TextField label="Link público da imagem" value={link} onChangeText={setLink} editable={!disabled}
            keyboardType="url" autoCapitalize="none" autoCorrect={false} placeholder="https://..."
            onEndEditing={() => { if (!linkError) setLinkPreview(selected); }}
            error={attempted ? linkError : undefined} />
        ) : null}
        {imageError ? <AppText variant="bodySmall" color="dangerText" accessibilityRole="alert">{imageError}</AppText> : null}
        {selected ? <TextField label="Título da amostra (opcional)" value={title} onChangeText={setTitle} editable={!disabled} /> : null}
        {attempted && missingImage ? (
          <AppText variant="bodySmall" color="dangerText" accessibilityRole="alert">Adicione uma imagem ou remova a amostra para continuar.</AppText>
        ) : null}
      </View>
    </OnboardingProfileLayout>
  );
}
