import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AgentePerfil, MOCK_AGENT_PROFILE } from './profile-screen';
import { colors } from '@/shared/theme/colors';
import { useUser } from '@/providers/user-provider';
import { buscarCidades, CidadeBR, ESTADOS_BR } from '@/shared/config/brazil-location';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, updateProfile } = useUser();
  const agenteAtual: AgentePerfil = route.params?.agente ?? {
    id: user?.id ?? '',
    nome: user?.nome ?? '',
    especialidade: user?.especialidade ?? '',
    bio: user?.bio ?? '',
    cidade: user?.cidade ?? '',
    avatarUrl: user?.avatarUrl ?? 'https://i.pravatar.cc/300?img=12',
    notaMedia: Number(user?.notaMedia ?? 0),
    totalAvaliacoes: Number(user?.totalAvaliacoes ?? 0),
    totalProjetos: Number(user?.totalProjetos ?? 0),
    portfolio: user?.portfolio ?? [],
  } as AgentePerfil;
  const [avatarUri, setAvatarUri] = useState(agenteAtual.avatarUrl);
  const [nome, setNome] = useState(agenteAtual.nome);
  const [especialidade, setEspecialidade] = useState(agenteAtual.especialidade);
  const [estado, setEstado] = useState(user?.estado ?? '');
  const [cidade, setCidade] = useState(agenteAtual.cidade);
  const [cidades, setCidades] = useState<CidadeBR[]>([]);
  const [modalLocal, setModalLocal] = useState<'estado' | 'cidade' | null>(null);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [bio, setBio] = useState(agenteAtual.bio);
  const [visivelMapa, setVisivelMapa] = useState(Boolean(user?.visivelMapa));
  const [local, setLocal] = useState<{ latitude: number | null; longitude: number | null; endereco: string }>({
    latitude: user?.latitude != null ? Number(user.latitude) : null,
    longitude: user?.longitude != null ? Number(user.longitude) : null,
    endereco: user?.endereco ?? '',
  });

  useEffect(() => {
    const escolhido = route.params?.localSelecionado;
    if (!escolhido) return;
    setLocal({ latitude: escolhido.latitude, longitude: escolhido.longitude, endereco: escolhido.endereco });
    if (escolhido.cidade) setCidade(escolhido.cidade);
  }, [route.params?.localSelecionado]);
  const [salvando, setSalvando] = useState(false);

  const escolherFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para trocar a foto de perfil.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!resultado.canceled && resultado.assets?.[0]) setAvatarUri(resultado.assets[0].uri);
  };

  const selecionarEstado = async (uf: string) => {
    setEstado(uf); setCidade(''); setModalLocal(null); setCarregandoCidades(true);
    try { setCidades(await buscarCidades(uf)); setModalLocal('cidade'); } catch { Alert.alert('Cidades indisponíveis', 'Não foi possível carregar as cidades deste estado.'); } finally { setCarregandoCidades(false); }
  };

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe seu nome para continuar.');
      return;
    }
    if (!estado || !cidade.trim()) { Alert.alert('Localização obrigatória', 'Selecione seu estado e sua cidade.'); return; }
    if (visivelMapa && (local.latitude == null || local.longitude == null)) {
      Alert.alert('Escolha seu local', 'Para aparecer no mapa, indique no mapa onde você atende.');
      return;
    }
    setSalvando(true);
    try {
      const dados: Record<string, unknown> = { nome: nome.trim(), especialidade: especialidade.trim(), estado, cidade: cidade.trim(), bio: bio.trim(), visivelNoMapa: visivelMapa, latitude: local.latitude, longitude: local.longitude, endereco: local.endereco };
      if (/^(https?:\/\/|data:)/i.test(avatarUri)) dados.avatarUrl = avatarUri;
      await updateProfile(dados);
      Alert.alert('Perfil atualizado', 'Suas alterações foram salvas no banco de dados.');
      navigation.goBack();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Voltar"><Ionicons name="chevron-back" size={25} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={escolherFoto} accessibilityLabel="Trocar foto de perfil">
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={styles.cameraBadge}><Ionicons name="camera" size={15} color={colors.white} /></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={escolherFoto}><Text style={styles.changePhoto}>Alterar foto</Text></TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome completo" />
            <Field label="Especialidade" value={especialidade} onChangeText={setEspecialidade} placeholder="Ex.: Fotógrafa e videomaker" />
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity style={styles.locationSelect} onPress={() => setModalLocal('estado')}><Ionicons name="map-outline" size={18} color={colors.primaryDark} /><Text style={styles.locationSelectText}>{ESTADOS_BR.find((item) => item.sigla === estado)?.nome || 'Selecione seu estado'}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} /></TouchableOpacity>
            <Text style={styles.label}>Cidade</Text>
            <TouchableOpacity style={[styles.locationSelect, !estado && styles.locationDisabled]} disabled={!estado} onPress={() => setModalLocal('cidade')}><Ionicons name="location-outline" size={18} color={colors.primaryDark} /><Text style={styles.locationSelectText}>{carregandoCidades ? 'Carregando cidades...' : cidade || 'Selecione sua cidade'}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} /></TouchableOpacity>
            <Modal visible={modalLocal !== null} transparent animationType="slide" onRequestClose={() => setModalLocal(null)}><View style={styles.modalOverlay}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{modalLocal === 'estado' ? 'Selecione seu estado' : 'Selecione sua cidade'}</Text><TouchableOpacity onPress={() => setModalLocal(null)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity></View>{modalLocal === 'estado' ? <FlatList data={ESTADOS_BR} keyExtractor={(item) => item.sigla} renderItem={({item}) => <TouchableOpacity style={styles.option} onPress={() => selecionarEstado(item.sigla)}><Text style={styles.optionText}>{item.nome}</Text><Text style={styles.optionUf}>{item.sigla}</Text></TouchableOpacity>} /> : <FlatList data={cidades} keyExtractor={(item) => String(item.id)} renderItem={({item}) => <TouchableOpacity style={styles.option} onPress={() => {setCidade(item.nome); setModalLocal(null);}}><Text style={styles.optionText}>{item.nome}</Text></TouchableOpacity>} />}</View></View></Modal>
          <View style={styles.mapCard}>
              <View style={styles.mapCopy}>
                <Text style={styles.label}>APARECER NO MAPA</Text>
                <Text style={styles.mapHint}>Permite que contratantes encontrem seu perfil pela localização cadastrada.</Text>
              </View>
              <Switch value={visivelMapa} onValueChange={setVisivelMapa} />
            </View>
            {visivelMapa ? (
              <>
                <TouchableOpacity style={styles.localCard} onPress={() => navigation.navigate('SelectLocation', { latitude: local.latitude, longitude: local.longitude })} accessibilityLabel="Escolher local no mapa">
                  <Ionicons name="location" size={22} color={colors.primary} />
                  <View style={styles.mapCopy}>
                    <Text style={styles.label}>Local no mapa</Text>
                    <Text style={styles.mapHint} numberOfLines={2}>
                      {local.latitude != null ? local.endereco || 'Local marcado no mapa' : 'Toque para indicar onde você atende'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </TouchableOpacity>
              </>
            ) : null}
            <View style={styles.field}>
              <Text style={styles.label}>Sobre você</Text>
              <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="Conte um pouco sobre seu trabalho" placeholderTextColor={colors.muted} multiline maxLength={280} textAlignVertical="top" />
              <Text style={styles.counter}>{bio.length}/280</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, salvando && styles.saveButtonDisabled]} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color={colors.white} /> : <><Text style={styles.saveText}>Salvar alterações</Text><Ionicons name="checkmark" size={19} color={colors.white} /></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, ...inputProps }: { label: string; icon?: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWithIcon}>
        {icon && <Ionicons name={icon} size={18} color={colors.primaryDark} />}
        <TextInput style={styles.input} placeholderTextColor={colors.muted} editable={true} autoComplete="off" importantForAutofill="no" {...inputProps} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' }, headerSpacer: { width: 38 },
  content: { paddingHorizontal: 20, paddingBottom: 38 }, photoSection: { alignItems: 'center', paddingVertical: 18 }, avatarWrapper: { position: 'relative' }, avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: colors.secondary }, cameraBadge: { position: 'absolute', right: 0, bottom: 1, width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, borderWidth: 2, borderColor: colors.white }, changePhoto: { marginTop: 10, color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  form: { gap: 15 },
  locationSelect: { minHeight: 49, borderWidth: 1, borderColor: colors.border, borderRadius: 9, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  locationSelectText: { flex: 1, color: colors.text, fontSize: 14 },
  locationDisabled: { opacity: 0.55 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(41,36,43,0.45)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '78%', backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  option: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  optionUf: { color: colors.primary, fontSize: 12, fontWeight: '900' }, mapCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.white }, mapCopy: { flex: 1 }, mapHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, localCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.white }, field: { gap: 7 }, label: { color: colors.text, fontSize: 13, fontWeight: '800' }, inputWithIcon: { minHeight: 49, borderWidth: 1, borderColor: colors.border, borderRadius: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8, backgroundColor: colors.white }, input: { flex: 1, paddingVertical: 12, color: colors.text, fontSize: 14 }, multiline: { minHeight: 108, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 13, backgroundColor: colors.white }, counter: { alignSelf: 'flex-end', color: colors.muted, fontSize: 11 },
  saveButton: { height: 50, marginTop: 27, borderRadius: 9, backgroundColor: colors.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, saveButtonDisabled: { opacity: 0.7 }, saveText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});
