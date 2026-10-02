import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useUser } from "@/providers/user-provider";
import { colors } from "@/shared/theme/colors";
import { buscarCidades, CidadeBR, ESTADOS_BR } from "@/shared/config/brazil-location";

const AVATAR_PADRAO = "https://i.pravatar.cc/300?img=68";

export default function EditContractorProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useUser();

  const [avatarUri, setAvatarUri] = useState<string>(
    (user as (typeof user & { avatarUrl?: string; avatar?: string }) | null)
      ?.avatarUrl ||
      (user as (typeof user & { avatar?: string }) | null)?.avatar ||
      AVATAR_PADRAO,
  );
  const [documento, setDocumento] = useState(user?.documento || "");
  const [nome, setNome] = useState(user?.nome || "");
  const [nomeSocial, setNomeSocial] = useState(user?.nomeSocial || "");
  const [pronomes, setPronomes] = useState(user?.pronomes || "");
  const [empresa, setEmpresa] = useState(user?.empresa || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [categoria, setCategoria] = useState(user?.categoria || "");
  const [estado, setEstado] = useState(user?.estado || "");
  const [cidade, setCidade] = useState(user?.cidade || "");
  const [cidades, setCidades] = useState<CidadeBR[]>([]);
  const [modalLocal, setModalLocal] = useState<"estado" | "cidade" | null>(null);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [endereco, setEndereco] = useState(user?.endereco || "");
  const [site, setSite] = useState(user?.site || "");
  const [descricao, setDescricao] = useState(user?.descricao || "");
  const [salvando, setSalvando] = useState(false);

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

  const selecionarEstado = async (uf: string) => {
    setEstado(uf); setCidade(""); setModalLocal(null); setCarregandoCidades(true);
    try { setCidades(await buscarCidades(uf)); setModalLocal("cidade"); } catch { Alert.alert("Cidades indisponíveis", "Não foi possível carregar as cidades deste estado."); } finally { setCarregandoCidades(false); }
  };

  const salvar = async () => {
    if (!nome.trim() || !empresa.trim()) {
      Alert.alert("Campos obrigatórios", "Informe seu nome e sua empresa.");
      return;
    }
    if (!estado || !cidade.trim()) {
      Alert.alert("Localização obrigatória", "Selecione seu estado e sua cidade.");
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        avatarUrl: avatarUri,
        documento: documento.trim(),
        nome: nome.trim(),
        nomeSocial: nomeSocial.trim(),
        pronomes: pronomes.trim(),
        empresa: empresa.trim(),
        telefone: telefone.trim(),
        categoria: categoria.trim(),
        estado: estado.trim(),
        cidade: cidade.trim(),
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
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil do contratante</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Foto de Perfil */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={escolherFoto}
              activeOpacity={0.8}
              accessibilityLabel="Trocar foto de perfil"
            >
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={15} color={colors.white} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={escolherFoto}>
              <Text style={styles.changePhoto}>Alterar foto de perfil</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.intro}>
            Complete os dados da empresa para transmitir mais confiança aos
            profissionais.
          </Text>

          {/* Formulário */}
          <Modal visible={modalLocal !== null} transparent animationType="slide" onRequestClose={() => setModalLocal(null)}><View style={styles.modalOverlay}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{modalLocal === "estado" ? "Selecione seu estado" : "Selecione sua cidade"}</Text><TouchableOpacity onPress={() => setModalLocal(null)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity></View>{modalLocal === "estado" ? <FlatList data={ESTADOS_BR} keyExtractor={(item) => item.sigla} renderItem={({item}) => <TouchableOpacity style={styles.option} onPress={() => selecionarEstado(item.sigla)}><Text style={styles.optionText}>{item.nome}</Text><Text style={styles.optionUf}>{item.sigla}</Text></TouchableOpacity>} /> : <FlatList data={cidades} keyExtractor={(item) => String(item.id)} renderItem={({item}) => <TouchableOpacity style={styles.option} onPress={() => {setCidade(item.nome); setModalLocal(null);}}><Text style={styles.optionText}>{item.nome}</Text></TouchableOpacity>} />}</View></View></Modal>
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
            <TouchableOpacity style={styles.locationSelect} onPress={() => setModalLocal("estado")}><Ionicons name="map-outline" size={18} color={colors.primaryDark} /><Text style={styles.locationSelectText}>{ESTADOS_BR.find((item) => item.sigla === estado)?.nome || "Selecione seu estado"}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} /></TouchableOpacity>
            <Text style={styles.label}>Cidade</Text>
            <TouchableOpacity style={[styles.locationSelect, !estado && styles.locationDisabled]} disabled={!estado} onPress={() => setModalLocal("cidade")}><Ionicons name="location-outline" size={18} color={colors.primaryDark} /><Text style={styles.locationSelectText}>{carregandoCidades ? "Carregando cidades..." : cidade || "Selecione sua cidade"}</Text><Ionicons name="chevron-down" size={18} color={colors.muted} /></TouchableOpacity>
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
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{descricao.length}/500</Text>
            </View>
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.button, salvando && styles.buttonDisabled]}
            onPress={salvar}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Salvar alterações</Text>
                <Ionicons name="checkmark" size={19} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={icon ? styles.inputWithIcon : styles.singleInputWrapper}>
        {icon && <Ionicons name={icon} size={18} color={colors.primaryDark} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.muted}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "900", color: colors.text },
  headerSpacer: { width: 38 },
  content: { paddingHorizontal: 20, paddingBottom: 45 },
  photoSection: { alignItems: "center", paddingVertical: 16 },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: colors.secondary,
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
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: colors.white,
  },
  changePhoto: {
    marginTop: 10,
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "800",
  },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginBottom: 20,
    textAlign: "center",
  },
  form: { gap: 15 },
  locationSelect: { minHeight: 49, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9 },
  locationSelectText: { flex: 1, color: colors.text, fontSize: 14 },
  locationDisabled: { opacity: 0.55 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(41,36,43,0.45)", justifyContent: "flex-end" },
  modalCard: { maxHeight: "78%", backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  option: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  optionUf: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "800", color: colors.text },
  singleInputWrapper: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  inputWithIcon: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 10,
    backgroundColor: colors.white,
  },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 },
  multiline: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.white,
    padding: 13,
    color: colors.text,
    fontSize: 14,
  },
  counter: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "right",
    marginTop: 2,
  },
  button: {
    height: 50,
    borderRadius: 11,
    backgroundColor: colors.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 26,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontWeight: "900", fontSize: 15 },
});
