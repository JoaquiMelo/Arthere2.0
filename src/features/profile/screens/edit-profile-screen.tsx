import { realImageUri } from '@/shared/config/image-uri';
import { Avatar, MediaImage } from '@/shared/components/media-image';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import type { AgentePerfil } from './profile-screen';
import type { ThemeTokens } from '@/shared/theme/tokens';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';
import { uploadImage } from '@/services/api';
import { buscarCidades, CidadeBR, ESTADOS_BR, municipioCadastrado, nomeMunicipio } from '@/shared/config/brazil-location';

import { Button, ScreenContainer, ScreenHeader } from '@/shared/components';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

export default function EditProfileScreen() {
  const { color, keyboardAppearance } = useThemeTokens();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(color), [color]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, updateProfile } = useUser();
  const agenteAtual: AgentePerfil = route.params?.agente ?? {
    id: user?.id ?? '',
    nome: user?.nome ?? '',
    especialidade: user?.especialidade ?? '',
    bio: user?.bio ?? '',
    cidade: user?.cidade ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    notaMedia: Number(user?.notaMedia ?? 0),
    totalAvaliacoes: Number(user?.totalAvaliacoes ?? 0),
    totalProjetos: Number(user?.totalProjetos ?? 0),
    portfolio: user?.portfolio ?? [],
  } as AgentePerfil;
  const [avatarUri, setAvatarUri] = useState(realImageUri(agenteAtual.avatarUrl));
  const [bannerUri, setBannerUri] = useState<string>(realImageUri(user?.bannerUrl));
  const [nome, setNome] = useState(agenteAtual.nome);
  const [especialidade, setEspecialidade] = useState(agenteAtual.especialidade);
  const [estado, setEstado] = useState(user?.estado ?? '');
  const [cidade, setCidade] = useState(nomeMunicipio(agenteAtual.cidade));
  const [cidades, setCidades] = useState<CidadeBR[]>([]);
  const [modalLocal, setModalLocal] = useState<'estado' | 'cidade' | null>(null);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [buscaCidade, setBuscaCidade] = useState('');
  const [bio, setBio] = useState(agenteAtual.bio);
  const [visivelMapa, setVisivelMapa] = useState(Boolean(user?.visivelMapa));
  const [local, setLocal] = useState<{ latitude: number | null; longitude: number | null; endereco: string }>({
    latitude: user?.latitude != null ? Number(user.latitude) : null,
    longitude: user?.longitude != null ? Number(user.longitude) : null,
    endereco: user?.endereco ?? '',
  });

  useFocusEffect(React.useCallback(() => {
    const escolhido = route.params?.localSelecionado;
    if (!escolhido) return;
    setLocal({ latitude: escolhido.latitude, longitude: escolhido.longitude, endereco: escolhido.endereco });
    // A cidade do perfil é escolhida na lista oficial do estado, não pelo geocoder.
  }, [route.params?.localSelecionado]));
  const [salvando, setSalvando] = useState(false);
  const savePending = useRef(false);

  const escolherFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para trocar a foto de perfil.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!resultado.canceled && resultado.assets?.[0]) setAvatarUri(resultado.assets[0].uri);
  };

  const escolherBanner = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) { Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para escolher o banner.'); return; }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.85 });
    if (!resultado.canceled && resultado.assets?.[0]) setBannerUri(resultado.assets[0].uri);
  };

  const abrirCidades = async (uf: string) => {
    if (!uf || carregandoCidades) return;
    setCidades([]);
    setBuscaCidade('');
    setModalLocal('cidade');
    setCarregandoCidades(true);
    try {
      setCidades(await buscarCidades(uf));
    } catch {
      Alert.alert('Cidades indisponíveis', 'Não foi possível carregar as cidades deste estado. Tente novamente.');
      setModalLocal(null);
    } finally {
      setCarregandoCidades(false);
    }
  };

  const selecionarEstado = async (uf: string) => {
    if (uf !== estado) setCidade('');
    setEstado(uf);
    await abrirCidades(uf);
  };

  const salvar = async () => {
    if (savePending.current) return;
    if (!nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe seu nome para continuar.');
      return;
    }
    if (!estado || !cidade.trim()) { Alert.alert('Localização obrigatória', 'Selecione seu estado e sua cidade.'); return; }
    if (visivelMapa && (local.latitude == null || local.longitude == null)) {
      Alert.alert('Escolha seu local', 'Para aparecer no mapa, indique no mapa onde você atende.');
      return;
    }
    savePending.current = true;
    setSalvando(true);
    try {
      const municipios = cidades.length ? cidades : await buscarCidades(estado);
      const municipio = municipioCadastrado(municipios, cidade);
      if (!municipio) { Alert.alert('Cidade inválida', 'Selecione um município válido do estado informado.'); return; }
      const dados: Record<string, unknown> = { nome: nome.trim(), especialidade: especialidade.trim(), estado, cidade: municipio.nome, bio: bio.trim(), visivelNoMapa: visivelMapa, latitude: local.latitude, longitude: local.longitude, endereco: local.endereco };
      if (avatarUri.startsWith('file:') || avatarUri.startsWith('content:')) dados.avatarUrl = await uploadImage(avatarUri);
      else if (/^https?:\/\//i.test(avatarUri)) dados.avatarUrl = avatarUri;
      if (bannerUri.startsWith('file:') || bannerUri.startsWith('content:')) dados.bannerUrl = await uploadImage(bannerUri);
      else if (/^https?:\/\//i.test(bannerUri)) dados.bannerUrl = bannerUri;
      await updateProfile(dados);
      Alert.alert('Perfil atualizado', 'Suas alterações foram salvas no banco de dados.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      savePending.current = false;
      setSalvando(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Editar perfil" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Alterar capa do perfil" onPress={escolherBanner} style={{ height: 116, borderRadius: 14, overflow: 'hidden', marginBottom: 12, backgroundColor: color.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }}>
            {bannerUri ? <MediaImage uri={bannerUri} style={{ width: '100%', height: '100%' }} /> : <><Ionicons name="image-outline" size={24} color={color.accentText} /><Text style={styles.changePhoto}>Adicionar banner do perfil</Text></>}
          </TouchableOpacity>
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={escolherFoto} accessibilityRole="button" accessibilityLabel="Trocar foto de perfil">
              <Avatar uri={avatarUri} style={styles.avatar} iconSize={36} />
              <View style={styles.cameraBadge}><Ionicons name="camera" size={15} color={color.textInverse} /></View>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={escolherFoto}><Text style={styles.changePhoto}>Alterar foto</Text></TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome completo" />
            <Field label="Especialidade" value={especialidade} onChangeText={setEspecialidade} placeholder="Ex.: Fotógrafa e videomaker" />
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Estado: ${ESTADOS_BR.find((item) => item.sigla === estado)?.nome || 'Selecione seu estado'}`} style={styles.locationSelect} onPress={() => setModalLocal('estado')}><Ionicons name="map-outline" size={18} color={color.accentText} /><Text style={styles.locationSelectText}>{ESTADOS_BR.find((item) => item.sigla === estado)?.nome || 'Selecione seu estado'}</Text><Ionicons name="chevron-down" size={18} color={color.textSecondary} /></TouchableOpacity>
            <Text style={styles.label}>Cidade</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Cidade: ${cidade || 'Selecione sua cidade'}`} style={[styles.locationSelect, !estado && styles.locationDisabled]} disabled={!estado || carregandoCidades} onPress={() => void abrirCidades(estado)}><Ionicons name="location-outline" size={18} color={color.accentText} /><Text style={styles.locationSelectText}>{carregandoCidades ? 'Carregando cidades...' : cidade || 'Selecione sua cidade'}</Text><Ionicons name="chevron-down" size={18} color={color.textSecondary} /></TouchableOpacity>
            <Modal visible={modalLocal !== null} transparent animationType={reducedMotion ? 'fade' : 'slide'} onRequestClose={() => setModalLocal(null)}><View style={styles.modalOverlay}><View accessibilityViewIsModal style={styles.modalCard}><View style={styles.modalHeader}><Text accessibilityRole="header" style={styles.modalTitle}>{modalLocal === 'estado' ? 'Selecione seu estado' : 'Selecione sua cidade'}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar seleção" hitSlop={10} onPress={() => setModalLocal(null)}><Ionicons name="close" size={24} color={color.textPrimary} /></TouchableOpacity></View>{modalLocal === 'estado' ? <FlatList data={ESTADOS_BR} keyExtractor={(item) => item.sigla} renderItem={({item}) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.nome} style={styles.option} onPress={() => selecionarEstado(item.sigla)}><Text style={styles.optionText}>{item.nome}</Text><Text style={styles.optionUf}>{item.sigla}</Text></TouchableOpacity>} /> : <><View style={styles.citySearchWrap}><Ionicons name="search-outline" size={19} color={color.textSecondary} /><TextInput style={styles.citySearchInput} value={buscaCidade} onChangeText={setBuscaCidade} placeholder="Pesquisar cidade..." accessibilityLabel="Pesquisar cidade" placeholderTextColor={color.textSecondary} keyboardAppearance={keyboardAppearance} selectionColor={color.selection} cursorColor={color.focus} autoCapitalize="words" autoCorrect={false} /></View><FlatList data={cidades.filter((item) => item.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(buscaCidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()))} keyExtractor={(item) => String(item.id)} renderItem={({item}) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.nome} style={styles.option} onPress={() => {setCidade(item.nome); setBuscaCidade(''); setModalLocal(null);}}><Text style={styles.optionText}>{item.nome}</Text></TouchableOpacity>} ListEmptyComponent={<Text style={styles.emptyText}>{carregandoCidades ? 'Carregando...' : 'Nenhuma cidade encontrada.'}</Text>} /></>}</View></View></Modal>
            <View style={styles.mapCard}>
              <View style={styles.mapCopy}>
                <Text style={styles.label}>Aparecer no Início e no mapa</Text>
                <Text style={styles.mapHint}>Mostra seu perfil na tela inicial e publica no mapa o local onde você atende.</Text>
              </View>
              <Switch trackColor={{ false: color.controlBorder, true: color.accentText }}
                ios_backgroundColor={color.controlBorder} value={visivelMapa} onValueChange={setVisivelMapa} accessibilityLabel="Aparecer no Início e no mapa" />
            </View>
            {visivelMapa ? (
              <>
                <TouchableOpacity style={styles.localCard} onPress={() => navigation.navigate('SelectLocation', { latitude: local.latitude, longitude: local.longitude })} accessibilityRole="button" accessibilityLabel="Escolher local no mapa">
                  <Ionicons name="location" size={22} color={color.accentText} />
                  <View style={styles.mapCopy}>
                    <Text style={styles.label}>Local no mapa</Text>
                    <Text style={styles.mapHint} numberOfLines={2}>
                      {local.latitude != null ? local.endereco || 'Local marcado no mapa' : 'Toque para indicar onde você atende'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={color.textSecondary} />
                </TouchableOpacity>
              </>
            ) : null}
            <View style={styles.field}>
              <Text style={styles.label}>Sobre você</Text>
              <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="Conte um pouco sobre seu trabalho" accessibilityLabel="Sobre você" placeholderTextColor={color.textSecondary} keyboardAppearance={keyboardAppearance} selectionColor={color.selection} cursorColor={color.focus} multiline maxLength={280} textAlignVertical="top" />
              <Text style={styles.counter}>{bio.length}/280</Text>
            </View>
          </View>

          <Button fullWidth loading={salvando} accessibilityLabel={salvando ? 'Salvando alterações' : undefined}
            onPress={() => void salvar()} style={{ marginTop: 24 }}>Salvar alterações</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({ label, icon, ...inputProps }: { label: string; icon?: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  const { color, keyboardAppearance } = useThemeTokens();
  const styles = useMemo(() => createStyles(color), [color]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWithIcon}>
        {icon && <Ionicons name={icon} size={18} color={color.accentText} />}
        <TextInput style={styles.input} placeholderTextColor={color.textSecondary} keyboardAppearance={keyboardAppearance} selectionColor={color.selection} cursorColor={color.focus} accessibilityLabel={label} editable={true} autoComplete="off" importantForAutofill="no" {...inputProps} />
      </View>
    </View>
  );
}

const createStyles = (color: ThemeTokens['color']) => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 38 }, photoSection: { alignItems: 'center', paddingVertical: 18 }, avatarWrapper: { position: 'relative' }, avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: color.border }, cameraBadge: { position: 'absolute', right: 0, bottom: 1, width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: color.brandInk, borderWidth: 2, borderColor: color.surface }, changePhoto: { marginTop: 10, color: color.accentText, fontSize: 13, fontWeight: '800' },
  form: { gap: 15 },
  locationSelect: { minHeight: 49, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 9, backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  locationSelectText: { flex: 1, color: color.textPrimary, fontSize: 14 },
  locationDisabled: { opacity: 0.55 },
  modalOverlay: { flex: 1, backgroundColor: color.overlay, justifyContent: 'flex-end' },
  modalCard: { maxHeight: '78%', backgroundColor: color.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: color.textPrimary, fontSize: 20, fontWeight: '900' },
  option: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: color.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { color: color.textPrimary, fontSize: 15, fontWeight: '700' },
  citySearchWrap: { minHeight: 48, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 12, backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginBottom: 10 },
  citySearchInput: { flex: 1, color: color.textPrimary, fontSize: 15, marginLeft: 9, paddingVertical: 9 },
  emptyText: { textAlign: 'center', color: color.textSecondary, paddingVertical: 30 },
  optionUf: { color: color.accentText, fontSize: 12, fontWeight: '900' }, mapCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 14, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 10, backgroundColor: color.surface }, mapCopy: { flex: 1 }, mapHint: { color: color.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 3 }, localCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 10, backgroundColor: color.surface }, field: { gap: 7 }, label: { color: color.textPrimary, fontSize: 13, fontWeight: '800' }, inputWithIcon: { minHeight: 49, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8, backgroundColor: color.surface }, input: { flex: 1, paddingVertical: 12, color: color.textPrimary, fontSize: 14 }, multiline: { minHeight: 108, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 9, paddingHorizontal: 13, backgroundColor: color.surface }, counter: { alignSelf: 'flex-end', color: color.textSecondary, fontSize: 11 },
});
