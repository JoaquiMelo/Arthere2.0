import { realImageUri } from '@/shared/config/image-uri';
import { Avatar, MediaImage } from '@/shared/components/media-image';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useUser } from "@/providers/user-provider";
import { uploadImage } from "@/services/api";
import type { ThemeTokens } from '@/shared/theme/tokens';
import { useThemeTokens } from "@/shared/theme/use-theme-tokens";
import { buscarCidades, CidadeBR, ESTADOS_BR, municipioCadastrado, nomeMunicipio } from "@/shared/config/brazil-location";


import { Button, ScreenContainer, ScreenHeader } from '@/shared/components';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

export default function EditContractorProfileScreen() {
  const { color, keyboardAppearance } = useThemeTokens();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(color), [color]);
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useUser();

  const [avatarUri, setAvatarUri] = useState<string>(
    realImageUri(user?.avatarUrl || (user as { avatar?: string } | null)?.avatar),
  );
  const [bannerUri, setBannerUri] = useState<string>(realImageUri(user?.bannerUrl));
  const [documento, setDocumento] = useState(user?.documento || "");
  const [nome, setNome] = useState(user?.nome || "");
  const [nomeSocial, setNomeSocial] = useState(user?.nomeSocial || "");
  const [pronomes, setPronomes] = useState(user?.pronomes || "");
  const [empresa, setEmpresa] = useState(user?.empresa || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [categoria, setCategoria] = useState(user?.categoria || "");
  const [estado, setEstado] = useState(user?.estado || "");
  const [cidade, setCidade] = useState(nomeMunicipio(user?.cidade));
  const [cidades, setCidades] = useState<CidadeBR[]>([]);
  const [modalLocal, setModalLocal] = useState<"estado" | "cidade" | null>(null);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [buscaCidade, setBuscaCidade] = useState('');
  const [endereco, setEndereco] = useState(user?.endereco || "");
  const [site, setSite] = useState(user?.site || "");
  const [descricao, setDescricao] = useState(user?.descricao || "");
  const [salvando, setSalvando] = useState(false);
  const savePending = useRef(false);

  const escolherFoto = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Autorize o acesso à galeria para trocar a foto de perfil.",
      );
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!resultado.canceled && resultado.assets?.[0]) {
      setAvatarUri(resultado.assets[0].uri);
    }
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
    if (!nome.trim() || !empresa.trim()) {
      Alert.alert("Campos obrigatórios", "Informe seu nome e sua empresa.");
      return;
    }
    if (!estado || !cidade.trim()) {
      Alert.alert("Localização obrigatória", "Selecione seu estado e sua cidade.");
      return;
    }

    savePending.current = true;
    setSalvando(true);
    try {
      const municipios = cidades.length ? cidades : await buscarCidades(estado);
      const municipio = municipioCadastrado(municipios, cidade);
      if (!municipio) { Alert.alert('Cidade inválida', 'Selecione um município válido do estado informado.'); return; }
      const avatarPersistido = avatarUri.startsWith('file:') || avatarUri.startsWith('content:') ? await uploadImage(avatarUri) : avatarUri;
      const bannerPersistido = bannerUri.startsWith('file:') || bannerUri.startsWith('content:') ? await uploadImage(bannerUri) : bannerUri;
      const dados = {
        avatarUrl: avatarPersistido || null,
        bannerUrl: bannerPersistido || null,
        documento: documento.trim(),
        nome: nome.trim(),
        nomeSocial: nomeSocial.trim(),
        pronomes: pronomes.trim(),
        empresa: empresa.trim(),
        telefone: telefone.trim(),
        categoria: categoria.trim(),
        estado: estado.trim(),
        cidade: municipio.nome,
        endereco: endereco.trim(),
        site: site.trim(),
        descricao: descricao.trim(),
      };

      await updateProfile(dados);
      Alert.alert(
        "Perfil atualizado",
        "Suas informações foram salvas com sucesso.",
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível salvar o perfil.",
      );
    } finally {
      savePending.current = false;
      setSalvando(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Editar perfil do contratante" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Alterar capa do perfil" onPress={escolherBanner} style={{ height: 116, borderRadius: 14, overflow: 'hidden', marginBottom: 12, backgroundColor: color.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }}>
            {bannerUri ? <MediaImage uri={bannerUri} style={{ width: '100%', height: '100%' }} /> : <><Ionicons name="image-outline" size={24} color={color.accentText} /><Text style={styles.changePhoto}>Adicionar banner do perfil</Text></>}
          </TouchableOpacity>
          {/* Foto de Perfil */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={escolherFoto}
              activeOpacity={0.8}
              accessibilityRole="button" accessibilityLabel="Trocar foto de perfil"
            >
              <Avatar uri={avatarUri} style={styles.avatar} iconSize={36} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={15} color={color.textInverse} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={escolherFoto}>
              <Text style={styles.changePhoto}>Alterar foto de perfil</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.intro}>
            Complete os dados da empresa para transmitir mais confiança aos
            profissionais.
          </Text>

          {/* Formulário */}
          <Modal visible={modalLocal !== null} transparent animationType={reducedMotion ? 'fade' : 'slide'} onRequestClose={() => setModalLocal(null)}><View style={styles.modalOverlay}><View accessibilityViewIsModal style={styles.modalCard}><View style={styles.modalHeader}><Text accessibilityRole="header" style={styles.modalTitle}>{modalLocal === "estado" ? "Selecione seu estado" : "Selecione sua cidade"}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar seleção" hitSlop={10} onPress={() => setModalLocal(null)}><Ionicons name="close" size={24} color={color.textPrimary} /></TouchableOpacity></View>{modalLocal === "estado" ? <FlatList data={ESTADOS_BR} keyExtractor={(item) => item.sigla} renderItem={({item}) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.nome} style={styles.option} onPress={() => selecionarEstado(item.sigla)}><Text style={styles.optionText}>{item.nome}</Text><Text style={styles.optionUf}>{item.sigla}</Text></TouchableOpacity>} /> : <><View style={styles.citySearchWrap}><Ionicons name="search-outline" size={19} color={color.textSecondary} /><TextInput style={styles.citySearchInput} value={buscaCidade} onChangeText={setBuscaCidade} placeholder="Pesquisar cidade..." accessibilityLabel="Pesquisar cidade" placeholderTextColor={color.textSecondary} keyboardAppearance={keyboardAppearance} selectionColor={color.selection} cursorColor={color.focus} autoCapitalize="words" autoCorrect={false} /></View><FlatList data={cidades.filter((item) => item.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(buscaCidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()))} keyExtractor={(item) => String(item.id)} renderItem={({item}) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={item.nome} style={styles.option} onPress={() => {setCidade(item.nome); setBuscaCidade(''); setModalLocal(null);}}><Text style={styles.optionText}>{item.nome}</Text></TouchableOpacity>} ListEmptyComponent={<Text style={styles.emptyText}>{carregandoCidades ? 'Carregando...' : 'Nenhuma cidade encontrada.'}</Text>} /></>}</View></View></Modal>
          <View style={styles.form}>
            <Field
              label="CPF ou CNPJ"
              value={documento}
              onChangeText={setDocumento}
              placeholder="CPF ou CNPJ"
              keyboardType="numeric"
            />
            <Field
              label="Nome completo"
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome completo"
            />
            <Field
              label="Nome social (opcional)"
              value={nomeSocial}
              onChangeText={setNomeSocial}
              placeholder="Nome social"
            />
            <Field
              label="Pronomes (opcional)"
              value={pronomes}
              onChangeText={setPronomes}
              placeholder="Ex.: ela/dela, ele/dele"
            />
            <Field
              label="Empresa / organização"
              value={empresa}
              onChangeText={setEmpresa}
              placeholder="Nome da empresa"
              icon="business-outline"
            />
            <Field
              label="Categoria principal"
              value={categoria}
              onChangeText={setCategoria}
              placeholder="Ex.: Eventos, cultura, publicidade"
            />
            <Field
              label="Telefone de contato"
              value={telefone}
              onChangeText={setTelefone}
              placeholder="(13) 99999-9999"
              keyboardType="phone-pad"
              icon="call-outline"
            />
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Estado: ${ESTADOS_BR.find((item) => item.sigla === estado)?.nome || 'Selecione seu estado'}`} style={styles.locationSelect} onPress={() => setModalLocal("estado")}><Ionicons name="map-outline" size={18} color={color.accentText} /><Text style={styles.locationSelectText}>{ESTADOS_BR.find((item) => item.sigla === estado)?.nome || "Selecione seu estado"}</Text><Ionicons name="chevron-down" size={18} color={color.textSecondary} /></TouchableOpacity>
            <Text style={styles.label}>Cidade</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Cidade: ${cidade || 'Selecione sua cidade'}`} style={[styles.locationSelect, !estado && styles.locationDisabled]} disabled={!estado || carregandoCidades} onPress={() => void abrirCidades(estado)}><Ionicons name="location-outline" size={18} color={color.accentText} /><Text style={styles.locationSelectText}>{carregandoCidades ? "Carregando cidades..." : cidade || "Selecione sua cidade"}</Text><Ionicons name="chevron-down" size={18} color={color.textSecondary} /></TouchableOpacity>
            <Field
              label="Endereço"
              value={endereco}
              onChangeText={setEndereco}
              placeholder="Rua, número, bairro"
            />
            <Field
              label="Site / Rede social"
              value={site}
              onChangeText={setSite}
              placeholder="https://..."
              icon="globe-outline"
            />

            {/* Descrição / Sobre */}
            <View style={styles.field}>
              <Text style={styles.label}>Sobre a empresa</Text>
              <TextInput
                style={styles.multiline}
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Conte sobre a empresa, tipos de eventos e serviços..."
                placeholderTextColor={color.textSecondary} keyboardAppearance={keyboardAppearance} selectionColor={color.selection} cursorColor={color.focus}
                accessibilityLabel="Sobre a empresa"
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{descricao.length}/500</Text>
            </View>
          </View>

          {/* Botão Salvar */}
          <Button fullWidth loading={salvando} accessibilityLabel={salvando ? 'Salvando alterações' : undefined}
            onPress={() => void salvar()} style={{ marginTop: 24 }}>Salvar alterações</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field({
  label,
  icon,
  ...props
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
} & React.ComponentProps<typeof TextInput>) {
  const { color, keyboardAppearance } = useThemeTokens();
  const styles = useMemo(() => createStyles(color), [color]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={icon ? styles.inputWithIcon : styles.singleInputWrapper}>
        {icon && <Ionicons name={icon} size={18} color={color.accentText} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={color.textSecondary} keyboardAppearance={keyboardAppearance} selectionColor={color.selection} cursorColor={color.focus}
          accessibilityLabel={label}
          {...props}
        />
      </View>
    </View>
  );
}

const createStyles = (color: ThemeTokens['color']) => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 45 },
  photoSection: { alignItems: "center", paddingVertical: 16 },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: color.border,
  },
  cameraBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.brandInk,
    borderWidth: 2,
    borderColor: color.surface,
  },
  changePhoto: {
    marginTop: 10,
    color: color.accentText,
    fontSize: 13,
    fontWeight: "800",
  },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    color: color.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  form: { gap: 15 },
  locationSelect: { minHeight: 49, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 10, backgroundColor: color.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9 },
  locationSelectText: { flex: 1, color: color.textPrimary, fontSize: 14 },
  locationDisabled: { opacity: 0.55 },
  modalOverlay: { flex: 1, backgroundColor: color.overlay, justifyContent: "flex-end" },
  modalCard: { maxHeight: "78%", backgroundColor: color.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { color: color.textPrimary, fontSize: 20, fontWeight: "900" },
  option: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: color.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { color: color.textPrimary, fontSize: 15, fontWeight: "700" },
  citySearchWrap: { minHeight: 48, borderWidth: 1, borderColor: color.controlBorder, borderRadius: 12, backgroundColor: color.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, marginBottom: 10 },
  citySearchInput: { flex: 1, color: color.textPrimary, fontSize: 15, marginLeft: 9, paddingVertical: 9 },
  emptyText: { textAlign: "center", color: color.textSecondary, paddingVertical: 30 },
  optionUf: { color: color.accentText, fontSize: 12, fontWeight: "900" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "800", color: color.textPrimary },
  singleInputWrapper: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: color.controlBorder,
    borderRadius: 10,
    backgroundColor: color.surface,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  inputWithIcon: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: color.controlBorder,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 10,
    backgroundColor: color.surface,
  },
  input: { flex: 1, color: color.textPrimary, fontSize: 14, paddingVertical: 10 },
  multiline: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: color.controlBorder,
    borderRadius: 10,
    backgroundColor: color.surface,
    padding: 13,
    color: color.textPrimary,
    fontSize: 14,
  },
  counter: {
    fontSize: 11,
    color: color.textSecondary,
    textAlign: "right",
    marginTop: 2,
  },
});
