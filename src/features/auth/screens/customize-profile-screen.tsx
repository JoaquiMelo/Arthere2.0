import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function CustomizeProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useUser();

  const [nomeEmpresa, setNomeEmpresa] = useState(user?.nome || "");
  const [cidade, setCidade] = useState(user?.cidade || "");
  const [telefone, setTelefone] = useState("");
  const [interessePrincipal, setInteressePrincipal] = useState("Fotografia");
  const [carregando, setCarregando] = useState(false);

  const categorias = ["Fotografia", "Música / DJ", "Videomaker", "Design"];

  const handleSalvarPerfil = async () => {
    if (!nomeEmpresa.trim() || !cidade.trim()) {
      Alert.alert("Atenção", "Preencha o nome de exibição e a cidade.");
      return;
    }

    try {
      setCarregando(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (updateProfile) {
        updateProfile({
          nome: nomeEmpresa,
          cidade,
        });
      }

      navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
    } catch {
      Alert.alert("Erro", "Falha ao salvar preferências de perfil.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Personalize seu Perfil</Text>
        <Text style={styles.subtitle}>Ajuste suas informações para buscar profissionais</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="business-outline" size={20} color={colors.muted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nome da empresa ou Nome Pessoal"
            placeholderTextColor={colors.muted}
            value={nomeEmpresa}
            onChangeText={setNomeEmpresa}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color={colors.muted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Sua Cidade - UF (ex: Santos - SP)"
            placeholderTextColor={colors.muted}
            value={cidade}
            onChangeText={setCidade}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color={colors.muted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Telefone / WhatsApp de Contato"
            placeholderTextColor={colors.muted}
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={styles.sectionTitle}>O que você mais costuma contratar?</Text>
        <View style={styles.chipsContainer}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                interessePrincipal === cat && styles.chipSelected,
              ]}
              onPress={() => setInteressePrincipal(cat)}
            >
              <Text
                style={[
                  styles.chipText,
                  interessePrincipal === cat && styles.chipTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSalvarPerfil} disabled={carregando}>
          {carregando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Concluir e Explorar Artistas</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24 },
  title: { fontSize: 26, fontWeight: "bold", color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 24 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: colors.text, marginTop: 8, marginBottom: 12 },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 32 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipText: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  chipTextSelected: { color: colors.white },
  button: {
    backgroundColor: colors.primaryDark,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});
