import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useManagement } from "@/providers/management-provider";
import { useTheme } from "@/providers/theme-provider";
import { useUser } from "@/providers/user-provider";
import type { RootStackParamList } from "../../../navigation/app-navigator";

type Navigation = NativeStackNavigationProp<RootStackParamList, "CreateEvent">;

const CATEGORIAS = [
  "Cultura",
  "Artes Visuais",
  "Música",
  "Fotografia",
  "Literatura",
  "Moda",
  "Design",
  "Dança",
  "Teatro",
  "Gastronomia",
];

const imagemPadrao =
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=900&q=80";

export default function CreateEventScreen() {
  const navigation = useNavigation<Navigation>();
  const { palette } = useTheme();
  const { user } = useUser();
  const { criarEvento } = useManagement();

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [cidade, setCidade] = useState("");
  const [organizador, setOrganizador] = useState(
    user?.empresa || user?.nomeSocial || user?.nome || "",
  );
  const [imagemUrl, setImagemUrl] = useState("");
  const [dataPickerAberto, setDataPickerAberto] = useState(false);
  const [horarioPickerAberto, setHorarioPickerAberto] = useState(false);
  const [premium, setPremium] = useState(false);
  const [destaque, setDestaque] = useState(false);
  const [erro, setErro] = useState("");

  const dataValida = useMemo(() => /^\d{4}-\d{2}-\d{2}$/.test(data), [data]);
  const horarioValido = useMemo(() => /^\d{2}:\d{2}$/.test(horario), [horario]);

  const dataParaDate = () => {
    if (dataValida) {
      const [ano, mes, dia] = data.split("-").map(Number);
      return new Date(ano, mes - 1, dia);
    }
    return new Date();
  };

  const horarioParaDate = () => {
    const [hora, minuto] = horarioValido
      ? horario.split(":").map(Number)
      : [12, 0];
    const date = new Date();
    date.setHours(hora, minuto, 0, 0);
    return date;
  };

  const selecionarData = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setDataPickerAberto(false);
    if (selectedDate) {
      const ano = selectedDate.getFullYear();
      const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dia = String(selectedDate.getDate()).padStart(2, "0");
      setData(ano + "-" + mes + "-" + dia);
      setErro("");
    }
  };

  const selecionarHorario = (
    _event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    setHorarioPickerAberto(false);
    if (selectedTime) {
      const hora = String(selectedTime.getHours()).padStart(2, "0");
      const minuto = String(selectedTime.getMinutes()).padStart(2, "0");
      setHorario(hora + ":" + minuto);
      setErro("");
    }
  };

  const selecionarImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Autorize o acesso à galeria para selecionar a imagem do evento.",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!resultado.canceled && resultado.assets[0]) {
      setImagemUrl(resultado.assets[0].uri);
      setErro("");
    }
  };

  const [publicando, setPublicando] = useState(false);

  const publicar = async () => {
    if (!titulo.trim() || !descricao.trim() || !data || !horario || !local.trim() || !cidade.trim() || !organizador.trim()) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!dataValida) {
      setErro("Use a data no formato AAAA-MM-DD. Ex.: 2026-10-18.");
      return;
    }
    if (!horarioValido) {
      setErro("Use o horário no formato HH:MM. Ex.: 19:30.");
      return;
    }
    setPublicando(true);
    try {
      await criarEvento({
        titulo: titulo.trim(),
        categoria,
        descricao: descricao.trim(),
        local: local.trim(),
        cidade: cidade.trim(),
        data,
        horario,
        organizador: organizador.trim(),
        premium,
        destaque,
        imagemUrl: imagemUrl.trim() || undefined,
      });
      Alert.alert("Evento publicado", "O evento foi salvo no banco de dados e já está disponível na agenda.");
      navigation.goBack();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível publicar o evento.");
    } finally {
      setPublicando(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.backButton,
                {
                  backgroundColor: palette.brandPaper,
                  borderColor: palette.brandInk,
                },
              ]}
            >
              <Ionicons name="arrow-back" size={19} color={palette.brandInk} />
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={[styles.kicker, { color: palette.brandCoral }]}>
                PORTFÓLIO · CONTRATANTE
              </Text>
              <Text style={[styles.title, { color: palette.brandInk }]}>
                Criar evento
              </Text>
              <Text style={[styles.subtitle, { color: palette.muted }]}>
                Cadastre o evento com as informações que aparecerão na agenda da
                Arthere.
              </Text>
            </View>
          </View>

          <View style={[styles.preview, { backgroundColor: palette.brandInk }]}>
            <View
              style={[
                styles.previewShape,
                { backgroundColor: palette.brandCoral },
              ]}
            />
            <Text style={[styles.previewKicker, { color: palette.brandSand }]}>
              NOVO EVENTO
            </Text>
            <Text style={[styles.previewTitle, { color: palette.brandPaper }]}>
              {titulo.trim() || "Nome do seu evento"}
            </Text>
            <Text style={[styles.previewMeta, { color: palette.brandPaper }]}>
              {data || "AAAA-MM-DD"} · {horario || "HH:MM"}
            </Text>
            <Text style={[styles.previewLocation, { color: palette.muted }]}>
              {local.trim() || "Local"} · {cidade.trim() || "Cidade"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionKicker, { color: palette.brandCoral }]}>
              IDENTIDADE
            </Text>
            <Text style={[styles.sectionTitle, { color: palette.brandInk }]}>
              Apresente o evento
            </Text>

            <Text style={[styles.label, { color: palette.muted }]}>
              NOME DO EVENTO *
            </Text>
            <TextInput
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ex.: Festival Criativo da Baixada"
              placeholderTextColor={palette.muted}
              style={[
                styles.input,
                {
                  color: palette.brandInk,
                  borderColor: palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
            />

            <Text style={[styles.label, { color: palette.muted }]}>
              CATEGORIA *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {CATEGORIAS.map((item) => {
                const ativo = categoria === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setCategoria(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: ativo
                          ? palette.brandCoral
                          : palette.brandPaper,
                        borderColor: ativo
                          ? palette.brandCoral
                          : palette.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: ativo ? palette.brandPaper : palette.brandInk,
                        },
                      ]}
                    >
                      {item.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { color: palette.muted }]}>
              DESCRIÇÃO *
            </Text>
            <TextInput
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Conte o que vai acontecer, para quem é e o que torna este encontro especial."
              placeholderTextColor={palette.muted}
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.textarea,
                {
                  color: palette.brandInk,
                  borderColor: palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionKicker, { color: palette.brandCoral }]}>
              DATA E LOCAL
            </Text>
            <Text style={[styles.sectionTitle, { color: palette.brandInk }]}>
              Onde e quando?
            </Text>

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={[styles.label, { color: palette.muted }]}>
                  DATA *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setHorarioPickerAberto(false);
                    setDataPickerAberto(true);
                  }}
                  style={[
                    styles.inputButton,
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.brandPaper,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={palette.brandCoral}
                  />
                  <Text
                    style={[
                      styles.inputButtonText,
                      { color: data ? palette.brandInk : palette.muted },
                    ]}
                  >
                    {data
                      ? data.split("-").reverse().join("/")
                      : "Selecionar data"}
                  </Text>
                </TouchableOpacity>
                <Modal
                  visible={dataPickerAberto}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setDataPickerAberto(false)}
                >
                  <View style={styles.pickerOverlay}>
                    <View
                      style={[
                        styles.pickerCard,
                        {
                          backgroundColor: palette.brandPaper,
                          borderColor: palette.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerTitle,
                          { color: palette.brandInk },
                        ]}
                      >
                        Selecionar data
                      </Text>
                      <DateTimePicker
                        value={dataParaDate()}
                        mode="date"
                        display={Platform.OS === "ios" ? "inline" : "default"}
                        minimumDate={new Date()}
                        onChange={selecionarData}
                      />
                      <TouchableOpacity
                        onPress={() => setDataPickerAberto(false)}
                        style={[
                          styles.pickerDone,
                          { backgroundColor: palette.brandInk },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerDoneText,
                            { color: palette.brandPaper },
                          ]}
                        >
                          CONFIRMAR DATA
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
              <View style={styles.column}>
                <Text style={[styles.label, { color: palette.muted }]}>
                  HORÁRIO *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setDataPickerAberto(false);
                    setHorarioPickerAberto(true);
                  }}
                  style={[
                    styles.inputButton,
                    {
                      borderColor: palette.border,
                      backgroundColor: palette.brandPaper,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="time-outline"
                    size={19}
                    color={palette.brandCoral}
                  />
                  <Text
                    style={[
                      styles.inputButtonText,
                      { color: horario ? palette.brandInk : palette.muted },
                    ]}
                  >
                    {horario || "Selecionar horário"}
                  </Text>
                </TouchableOpacity>
                <Modal
                  visible={horarioPickerAberto}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setHorarioPickerAberto(false)}
                >
                  <View style={styles.pickerOverlay}>
                    <View
                      style={[
                        styles.pickerCard,
                        {
                          backgroundColor: palette.brandPaper,
                          borderColor: palette.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerTitle,
                          { color: palette.brandInk },
                        ]}
                      >
                        Selecionar horário
                      </Text>
                      <DateTimePicker
                        value={horarioParaDate()}
                        mode="time"
                        display="spinner"
                        is24Hour
                        onChange={selecionarHorario}
                      />
                      <TouchableOpacity
                        onPress={() => setHorarioPickerAberto(false)}
                        style={[
                          styles.pickerDone,
                          { backgroundColor: palette.brandInk },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerDoneText,
                            { color: palette.brandPaper },
                          ]}
                        >
                          CONFIRMAR HORÁRIO
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </View>
            </View>

            <Text style={[styles.label, { color: palette.muted }]}>
              LOCAL *
            </Text>
            <TextInput
              value={local}
              onChangeText={setLocal}
              editable={true}
              focusable={true}
              selectTextOnFocus={false}
              autoCorrect={false}
              autoCapitalize="sentences"
              autoComplete="off"
              textContentType="none"
              keyboardType="default"
              importantForAutofill="no"
              placeholder="Ex.: Centro Cultural"
              placeholderTextColor={palette.muted}
              style={[
                styles.input,
                {
                  color: palette.brandInk,
                  borderColor: palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
            />

            <Text style={[styles.label, { color: palette.muted }]}>
              CIDADE *
            </Text>
            <TextInput
              value={cidade}
              onChangeText={setCidade}
              editable={true}
              focusable={true}
              selectTextOnFocus={false}
              autoCorrect={false}
              autoCapitalize="sentences"
              autoComplete="off"
              textContentType="none"
              keyboardType="default"
              importantForAutofill="no"
              placeholder="Ex.: Santos - SP"
              placeholderTextColor={palette.muted}
              style={[
                styles.input,
                {
                  color: palette.brandInk,
                  borderColor: palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionKicker, { color: palette.brandCoral }]}>
              PUBLICAÇÃO
            </Text>
            <Text style={[styles.sectionTitle, { color: palette.brandInk }]}>
              Como o evento será exibido?
            </Text>

            <Text style={[styles.label, { color: palette.muted }]}>
              ORGANIZADOR *
            </Text>
            <TextInput
              value={organizador}
              onChangeText={setOrganizador}
              placeholder="Nome da empresa ou coletivo"
              placeholderTextColor={palette.muted}
              style={[
                styles.input,
                {
                  color: palette.brandInk,
                  borderColor: palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
            />

            <Text style={[styles.label, { color: palette.muted }]}>
              IMAGEM DE CAPA (OPCIONAL)
            </Text>
            <TouchableOpacity
              onPress={selecionarImagem}
              style={[
                styles.imagePicker,
                {
                  borderColor: imagemUrl ? palette.brandCoral : palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
              activeOpacity={0.9}
            >
              {imagemUrl ? (
                <View style={styles.selectedImageWrap}>
                  <Image
                    source={{ uri: imagemUrl }}
                    style={styles.selectedImage}
                  />
                  <View
                    style={[
                      styles.imageChangeBadge,
                      { backgroundColor: palette.brandInk },
                    ]}
                  >
                    <Ionicons
                      name="camera"
                      size={13}
                      color={palette.brandPaper}
                    />
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.imagePickerIcon,
                    { backgroundColor: palette.brandCoral },
                  ]}
                >
                  <Ionicons
                    name="images-outline"
                    size={22}
                    color={palette.brandPaper}
                  />
                </View>
              )}

              <View style={styles.imagePickerCopy}>
                <Text
                  style={[styles.optionTitle, { color: palette.brandInk }]}
                >
                  {imagemUrl
                    ? "Capa selecionada"
                    : "Escolher imagem da galeria"}
                </Text>
                <Text style={[styles.optionText, { color: palette.muted }]}>
                  {imagemUrl
                    ? "Toque para trocar a imagem da capa."
                    : "Escolha uma foto do celular para a capa do evento."}
                </Text>
              </View>

              <View
                style={[
                  styles.imageAction,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.brandPaper,
                  },
                ]}
              >
                <Ionicons
                  name={imagemUrl ? "create-outline" : "add"}
                  size={18}
                  color={palette.brandInk}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPremium((value) => !value)}
              style={[
                styles.option,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: palette.brandGreen },
                ]}
              >
                <Ionicons name="star" size={17} color={palette.brandPaper} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={[styles.optionTitle, { color: palette.brandInk }]}>
                  Evento Premium
                </Text>
                <Text style={[styles.optionText, { color: palette.muted }]}>
                  Marca o evento como premium na agenda.
                </Text>
              </View>
              <Ionicons
                name={premium ? "checkbox" : "square-outline"}
                size={23}
                color={premium ? palette.brandCoral : palette.muted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDestaque((value) => !value)}
              style={[
                styles.option,
                {
                  borderColor: palette.border,
                  backgroundColor: palette.brandPaper,
                },
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: palette.brandCoral },
                ]}
              >
                <Ionicons name="pin" size={17} color={palette.brandPaper} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={[styles.optionTitle, { color: palette.brandInk }]}>
                  Fixar nos destaques
                </Text>
                <Text style={[styles.optionText, { color: palette.muted }]}>
                  Coloca o evento na área de destaque da agenda.
                </Text>
              </View>
              <Ionicons
                name={destaque ? "checkbox" : "square-outline"}
                size={23}
                color={destaque ? palette.brandCoral : palette.muted}
              />
            </TouchableOpacity>
          </View>

          {!!erro && (
            <View
              style={[
                styles.error,
                {
                  backgroundColor: palette.brandSand,
                  borderColor: palette.brandCoral,
                },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={palette.brandCoral}
              />
              <Text style={[styles.errorText, { color: palette.brandInk }]}>
                {erro}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={publicar} disabled={publicando}
            activeOpacity={0.88}
            style={[
              styles.publishButton,
              { backgroundColor: palette.brandInk },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={19}
              color={palette.brandPaper}
            />
            <Text style={[styles.publishText, { color: palette.brandPaper }]}>
              PUBLICAR EVENTO
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={palette.brandPaper}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text style={[styles.cancelText, { color: palette.muted }]}>
              CANCELAR
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 42 },
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, paddingTop: 2 },
  kicker: { fontSize: 8, fontWeight: "900", letterSpacing: 1.4 },
  title: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 3,
  },
  subtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 6 },
  preview: {
    minHeight: 190,
    borderRadius: 20,
    overflow: "hidden",
    padding: 20,
    justifyContent: "flex-end",
    position: "relative",
    marginBottom: 22,
  },
  previewShape: {
    position: "absolute",
    width: 115,
    height: 115,
    borderRadius: 28,
    right: -25,
    top: -20,
    transform: [{ rotate: "22deg" }],
  },
  previewKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },
  previewTitle: {
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "900",
    maxWidth: 300,
    marginTop: 6,
  },
  previewMeta: { fontSize: 11, fontWeight: "800", marginTop: 12 },
  previewLocation: { fontSize: 10, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionKicker: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 3,
  },
  sectionTitle: { fontSize: 19, fontWeight: "900", marginBottom: 10 },
  label: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  inputButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputButtonText: { flex: 1, fontSize: 12.5, fontWeight: "700" },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    elevation: 10,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  pickerTitle: {
    width: "100%",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  pickerDone: {
    width: "100%",
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  pickerDoneText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  textarea: { minHeight: 118, paddingTop: 12, paddingBottom: 12 },
  chips: { gap: 7, paddingBottom: 2 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  twoColumns: { flexDirection: "row", gap: 9 },
  column: { flex: 1 },
  option: {
    minHeight: 70,
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 9,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCopy: { flex: 1 },
  optionTitle: { fontSize: 12, fontWeight: "900" },
  optionText: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },
  imagePicker: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    overflow: "hidden",
  },
  selectedImageWrap: {
    width: 88,
    height: 70,
    borderRadius: 11,
    overflow: "hidden",
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imageChangeBadge: {
    position: "absolute",
    right: 5,
    bottom: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  imageAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerCopy: { flex: 1 },
  error: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 10, lineHeight: 15, fontWeight: "700" },
  publishButton: {
    minHeight: 52,
    borderRadius: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  publishText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  cancelButton: { alignItems: "center", paddingVertical: 16 },
  cancelText: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
});
