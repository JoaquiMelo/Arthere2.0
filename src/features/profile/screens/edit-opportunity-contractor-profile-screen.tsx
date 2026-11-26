import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { AppText, Avatar, Button, FeedbackState, IconButton, MediaImage, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { buscarCidades, ESTADOS_BR, municipioCadastrado, nomeMunicipio, type CidadeBR } from '@/shared/config/brazil-location';
import { realImageUri } from '@/shared/config/image-uri';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser, type LocalUser } from '@/providers/user-provider';
import { uploadImage } from '@/services/api';
import type { RootStackParamList } from '@/navigation/app-navigator';

export default function EditOpportunityContractorProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditOpportunityContractorProfile'>>();
  const presentationOnly = route.params?.mode === 'presentation';
  const { user, updateProfile } = useUser();
  const { color, spacing, radius, dimensions } = useThemeTokens();
  const [avatar, setAvatar] = useState(realImageUri(user?.avatarUrl));
  const [banner, setBanner] = useState(realImageUri(user?.bannerUrl));
  const [nome, setNome] = useState(user?.nome ?? '');
  const [nomeSocial, setNomeSocial] = useState(user?.nomeSocial ?? '');
  const [pronomes, setPronomes] = useState(user?.pronomes ?? '');
  const [categoria, setCategoria] = useState(user?.categoria ?? '');
  const [descricao, setDescricao] = useState(user?.descricao ?? '');
  const [site, setSite] = useState(user?.site ?? '');
  const [telefone, setTelefone] = useState(user?.telefone ?? '');
  const [estado, setEstado] = useState(user?.estado ?? '');
  const [cidade, setCidade] = useState(nomeMunicipio(user?.cidade));
  const [modal, setModal] = useState<'estado' | 'cidade' | null>(null);
  const [cidades, setCidades] = useState<CidadeBR[]>([]);
  const [busca, setBusca] = useState('');
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);
  const cityRequest = useRef(0);

  const escolherImagem = async (kind: 'avatar' | 'banner') => {
    if (pending.current) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para selecionar a imagem.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: kind === 'avatar' ? [1, 1] : [16, 9], quality: 0.85 });
      if (!result.canceled && result.assets?.[0]) {
        if (kind === 'avatar') setAvatar(result.assets[0].uri);
        else setBanner(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Não foi possível selecionar a imagem', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const abrirCidades = async (uf: string) => {
    if (!uf) return;
    const version = ++cityRequest.current;
    setCidades([]);
    setBusca('');
    setCityError(false);
    setCityLoading(true);
    setModal('cidade');
    try {
      const list = await buscarCidades(uf);
      if (version === cityRequest.current) setCidades(list);
    } catch {
      if (version === cityRequest.current) setCityError(true);
    } finally {
      if (version === cityRequest.current) setCityLoading(false);
    }
  };

  const closeModal = () => {
    cityRequest.current += 1;
    setModal(null);
    setCityLoading(false);
  };

  const salvar = async () => {
    if (user?.tipo !== 'CONTRATANTE_OPORTUNIDADES' || pending.current) return;
    setAttempted(true);
    if (!presentationOnly && (!nome.trim() || !estado || !cidade.trim())) return;
    if (descricao.length > 500) return;
    pending.current = true;
    setBusy(true);
    try {
      const data: Partial<LocalUser> = {
        categoria: categoria.trim(),
        descricao: descricao.trim(),
        site: site.trim(),
      };
      if (!presentationOnly) {
        const list = await buscarCidades(estado);
        const municipio = municipioCadastrado(list, cidade);
        if (!municipio) {
          Alert.alert('Cidade inválida', 'Selecione um município válido do estado informado.');
          return;
        }
        const persist = async (uri: string) => /^(file|content):/i.test(uri) ? uploadImage(uri) : uri;
        if (avatar !== realImageUri(user.avatarUrl)) {
          data.avatarUrl = (await persist(avatar)) || null;
          setAvatar(data.avatarUrl || '');
        }
        if (banner !== realImageUri(user.bannerUrl)) {
          data.bannerUrl = (await persist(banner)) || null;
          setBanner(data.bannerUrl || '');
        }
        Object.assign(data, { nome: nome.trim(), nomeSocial: nomeSocial.trim(), pronomes: pronomes.trim(), telefone: telefone.trim(), estado, cidade: municipio.nome });
      }
      await updateProfile(data);
      navigation.goBack();
      Alert.alert('Perfil atualizado', 'Suas informações foram salvas.');
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (user?.tipo !== 'CONTRATANTE_OPORTUNIDADES') return <ScreenContainer><FeedbackState kind="error" title="Acesso indisponível" description="Este editor é exclusivo de contratantes de oportunidades." /><Button variant="ghost" onPress={() => navigation.goBack()}>Voltar</Button></ScreenContainer>;

  const normalizar = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const cities = cidades.filter((item) => normalizar(item.nome).includes(normalizar(busca)));
  const rowStyle = { minHeight: dimensions.touchTarget, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border };
  return (
    <ScreenContainer>
      <ScreenHeader kicker="ARTHERE / CONTRATANTE DE OPORTUNIDADES" title={presentationOnly ? 'Minha apresentação' : 'Editar meu perfil'} onBack={busy ? undefined : () => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] }}>
          {!presentationOnly ? <>
            <View style={{ width: '100%', aspectRatio: 16 / 9, minHeight: 156, alignItems: 'center', justifyContent: 'center', backgroundColor: color.accentSoft, borderRadius: radius.cardCompact, position: 'relative' }}>
              {banner ? <MediaImage uri={banner} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: radius.cardCompact }} /> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Trocar foto de perfil" onPress={() => void escolherImagem('avatar')} disabled={busy} style={{ borderWidth: 4, borderColor: color.background, borderRadius: radius.sheetCompact, backgroundColor: color.background }}>
                <Avatar uri={avatar} style={{ width: 100, height: 100, borderRadius: radius.card }} />
              </Pressable>
              <View style={{ position: 'absolute', right: spacing.sm, bottom: spacing.sm, backgroundColor: color.surface, borderRadius: radius.control }}><IconButton icon="image-outline" accessibilityLabel="Trocar capa" variant="outline" disabled={busy} onPress={() => void escolherImagem('banner')} /></View>
            </View>
            <SectionHeader title="Identidade pessoal" description="Apresente-se como pessoa física, sem necessidade de empresa." />
            <TextField label="Nome completo *" value={nome} onChangeText={setNome} editable={!busy} error={attempted && !nome.trim() ? 'Informe seu nome.' : undefined} />
            <TextField label="Nome social" value={nomeSocial} onChangeText={setNomeSocial} editable={!busy} />
            <TextField label="Pronomes" value={pronomes} onChangeText={setPronomes} editable={!busy} />
            <SectionHeader title="Localização" description="Escolha seu estado e município." />
            <View style={{ gap: spacing.xs }}>
              <AppText variant="label" weight="semibold">Estado *</AppText>
              <Button variant="outline" fullWidth onPress={() => { setBusca(''); setModal('estado'); }} disabled={busy}>{ESTADOS_BR.find((item) => item.sigla === estado)?.nome || 'Selecionar estado'}</Button>
              {attempted && !estado ? <AppText variant="caption" color="dangerText">Selecione o estado.</AppText> : null}
              <AppText variant="label" weight="semibold">Cidade *</AppText>
              <Button variant="outline" fullWidth onPress={() => void abrirCidades(estado)} disabled={!estado || busy}>{cidade || 'Selecionar cidade'}</Button>
              {attempted && !cidade ? <AppText variant="caption" color="dangerText">Selecione a cidade.</AppText> : null}
            </View>
            <TextField label="Telefone (opcional)" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" editable={!busy} />
          </> : null}
          <SectionHeader title="Como você contrata" description="Conte aos agentes criativos quem você é e que tipo de trabalho costuma procurar." />
          <TextField label="Área de interesse" value={categoria} onChangeText={setCategoria} placeholder="Ex.: Design, fotografia, música" editable={!busy} />
          <TextField label="Apresentação profissional" value={descricao} onChangeText={setDescricao} placeholder="Conte um pouco sobre você, seus projetos e o que busca em uma colaboração." multiline maxLength={500} numberOfLines={6} textAlignVertical="top" helperText={descricao.length + '/500 caracteres'} editable={!busy} />
          <TextField label="Site ou rede social (opcional)" value={site} onChangeText={setSite} autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!busy} />
          <Button fullWidth loading={busy} onPress={salvar}>Salvar alterações</Button>
          <Button fullWidth variant="outline" disabled={busy} onPress={() => navigation.goBack()}>Cancelar</Button>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={modal !== null} onRequestClose={closeModal} animationType="none">
        <ScreenContainer>
          <ScreenHeader title={modal === 'estado' ? 'Selecione o estado' : 'Selecione a cidade'} onBack={closeModal} />
          {modal === 'estado' ? (
            <FlatList data={ESTADOS_BR} keyExtractor={(item) => item.sigla} contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => <Pressable accessibilityRole="button" style={rowStyle} onPress={() => { if (item.sigla !== estado) setCidade(''); setEstado(item.sigla); void abrirCidades(item.sigla); }}><AppText>{item.nome} · {item.sigla}</AppText></Pressable>} />
          ) : (
            <View style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
              <TextField label="Buscar cidade" value={busca} onChangeText={setBusca} autoCorrect={false} />
              {cityLoading ? <FeedbackState kind="loading" title="Carregando cidades…" /> : cityError ? <FeedbackState kind="error" title="Cidades indisponíveis" onRetry={() => void abrirCidades(estado)} /> :
                <FlatList data={cities} keyboardShouldPersistTaps="handled" keyExtractor={(item) => String(item.id)} ListEmptyComponent={<FeedbackState kind="empty" title="Nenhuma cidade encontrada" />} renderItem={({ item }) => <Pressable accessibilityRole="button" style={rowStyle} onPress={() => { setCidade(item.nome); closeModal(); }}><AppText>{item.nome}</AppText></Pressable>} />}
            </View>
          )}
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
