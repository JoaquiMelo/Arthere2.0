import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function CreatePortfolioScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useUser();

  const [especialidade, setEspecialidade] = useState(user?.especialidade || "");
  const [cidade, setCidade] = useState(user?.cidade || "");
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState<string[]>([
    "https://picsum.photos/seed/p1/300/300",
    "https://picsum.photos/seed/p2/300/300",
  ]);
  const [carregando, setCarregando] = useState(false);

  const handleAdicionarFoto = () => {
    // Simulação de adição de foto
    const novaFoto = `https://picsum.photos/seed/${Date.now()}/300/300`;
    setPortfolio((prev) => [...prev, novaFoto]);
  };

  const handleSalvarPerfil = async () => {
    if (!especialidade.trim() || !cidade.trim()) {
      Alert.alert("Atenção", "Preencha a especialidade e a cidade.");
      return;
    }

    try {
      setCarregando(true);
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (updateProfile) {
        updateProfile({
          especialidade,
          cidade,
          bio,
        });
      }

      navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
    } catch {
      Alert.alert("Erro", "Falha ao salvar dados do portfólio.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Configure seu Portfólio</Text>
        <Text style={styles.subtitle}>Mostre seu talento para os contratantes</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="brush-outline" size={20} color={colors.muted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Especialidade (ex: Fotógrafo, DJ, Videomaker)"
            placeholderTextColor={colors.muted}
            value={especialidade}
            onChangeText={setEspecialidade}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color={colors.muted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Cidade - UF (ex: Santos - SP)"
            placeholderTextColor={colors.muted}
            value={cidade}
            onChangeText={setCidade}
          />
        </View>

        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Fale um pouco sobre seu trabalho e experiência (Bio)"
            placeholderTextColor={colors.muted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Amostras de Portfólio */}
        <Text style={styles.sectionTitle}>Amostras do seu Trabalho</Text>
        <View style={styles.gridContainer}>
          {portfolio.map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.gridImage} />
          ))}
          <TouchableOpacity style={styles.btnAddImage} onPress={handleAdicionarFoto}>
            <Ionicons name="add" size={32} color={colors.primaryDark} />
            <Text style={styles.btnAddText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSalvarPerfil} disabled={carregando}>
          {carregando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Concluir e Ir para o Mapa</Text>
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
  textAreaContainer: { height: 110, alignItems: "flex-start", paddingTop: 12 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  textArea: { textAlignVertical: "top" },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: colors.text, marginTop: 8, marginBottom: 12 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  gridImage: { width: 90, height: 90, borderRadius: 12 },
  btnAddImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
  },
  btnAddText: { fontSize: 11, color: colors.primaryDark, fontWeight: "600", marginTop: 2 },
  button: {
    backgroundColor: colors.primaryDark,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "bold" },
});
