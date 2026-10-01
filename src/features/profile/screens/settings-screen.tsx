import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { PaletteName, useTheme } from "@/providers/theme-provider";
import { useUser } from "@/providers/user-provider";

type IconName = keyof typeof Ionicons.glyphMap;

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useUser();
  const { paletteName, palette, setPalette } = useTheme();
  const [paletaAberta, setPaletaAberta] = useState(false);
  const [notificacoes, setNotificacoes] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(false);

  const indisponivel = (titulo: string) =>
    Alert.alert(titulo, "Esta opção estará disponível em breve.");

  const sair = () =>
    Alert.alert("Sair da conta", "Você deseja encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);

  const switchTrack = {
    false: palette.border,
    true: palette.brandCoral,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { borderColor: palette.border, backgroundColor: palette.white },
          ]}
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate("Profile")
          }
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={20} color={palette.brandInk} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={[styles.headerKicker, { color: palette.brandCoral }]}>
            PREFERÊNCIAS
          </Text>
          <Text style={[styles.headerTitle, { color: palette.brandInk }]}>
            Configurações
          </Text>
        </View>

        <View
          style={[styles.headerMark, { backgroundColor: palette.brandInk }]}
        >
          <View
            style={[
              styles.headerMarkShape,
              { backgroundColor: palette.brandBlue },
            ]}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.groupTitle, { color: palette.brandCoral }]}>
          CONTA
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.white, borderColor: palette.border },
          ]}
        >
          <SettingRow
            palette={palette}
            icon="person-outline"
            label="Editar perfil"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <SettingRow
            palette={palette}
            icon="shield-checkmark-outline"
            label="Privacidade e segurança"
            onPress={() => indisponivel("Privacidade e segurança")}
          />
          <SettingRow
            palette={palette}
            icon="notifications-outline"
            label="Notificações"
            last
            right={
              <Switch
                value={notificacoes}
                onValueChange={setNotificacoes}
                trackColor={switchTrack}
                thumbColor={palette.white}
              />
            }
          />
        </View>

        <Text style={[styles.groupTitle, { color: palette.brandCoral }]}>
          APARÊNCIA
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.white, borderColor: palette.border },
          ]}
        >
          <SettingRow
            palette={palette}
            icon="moon-outline"
            label="Modo escuro"
            right={
              <Switch
                value={modoEscuro}
                onValueChange={setModoEscuro}
                trackColor={switchTrack}
                thumbColor={palette.white}
              />
            }
          />
          <SettingRow
            palette={palette}
            icon="color-palette-outline"
            label="Paleta de cores"
            last
            onPress={() => setPaletaAberta(true)}
            right={
              <View style={styles.swatches}>
                <View
                  style={[styles.swatch, { backgroundColor: palette.surface }]}
                />
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: palette.surfaceStrong },
                  ]}
                />
                <View
                  style={[styles.swatch, { backgroundColor: palette.accent }]}
                />
                <View
                  style={[styles.swatch, { backgroundColor: palette.orange }]}
                />
                <View
                  style={[styles.swatch, { backgroundColor: palette.primary }]}
                />
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={palette.muted}
                />
              </View>
            }
          />
        </View>

        <Text style={[styles.groupTitle, { color: palette.brandCoral }]}>
          SUPORTE
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.white, borderColor: palette.border },
          ]}
        >
          <SettingRow
            palette={palette}
            icon="help-circle-outline"
            label="Ajuda e suporte"
            onPress={() => indisponivel("Ajuda e suporte")}
          />
          <SettingRow
            palette={palette}
            icon="document-text-outline"
            label="Termos e políticas"
            onPress={() => indisponivel("Termos e políticas")}
            last
          />
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              borderColor: palette.brandCoral,
              backgroundColor: palette.brandPaper,
            },
          ]}
          onPress={sair}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={palette.brandCoral}
          />
          <Text style={[styles.logoutText, { color: palette.brandCoral }]}>
            SAIR DA CONTA
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: palette.muted }]}>
          ARTHERE · VERSÃO 1.0.0
        </Text>
      </ScrollView>

      <Modal
        visible={paletaAberta}
        transparent
        animationType="slide"
        onRequestClose={() => setPaletaAberta(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: "rgba(41,36,43,0.50)" },
          ]}
        >
          <View
            style={[
              styles.paletteCard,
              {
                backgroundColor: palette.brandPaper,
                borderTopColor: palette.brandCoral,
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: palette.border }]}
            />
            <Text style={[styles.paletteKicker, { color: palette.brandCoral }]}>
              IDENTIDADE
            </Text>
            <Text style={[styles.paletteTitle, { color: palette.brandInk }]}>
              Escolha sua paleta
            </Text>

            {(["Arthere", "Oceano", "Ameixa"] as PaletteName[]).map((nome) => {
              const selecionada = nome === paletteName;
              const cores =
                nome === "Arthere"
                  ? ["#EFE7DA", "#90C8D8", "#F2CE99", "#D88160", "#EB6241"]
                  : nome === "Oceano"
                    ? ["#D9EEF1", "#B9DFE5", "#F2CE99", "#E17A56", "#3F91A3"]
                    : ["#EFE2EB", "#DFC6D7", "#F2CE99", "#D88160", "#8B567D"];

              return (
                <TouchableOpacity
                  key={nome}
                  style={[
                    styles.paletteOption,
                    {
                      borderColor: selecionada
                        ? palette.brandInk
                        : palette.border,
                      backgroundColor: selecionada
                        ? palette.brandSand
                        : palette.white,
                    },
                  ]}
                  onPress={() => {
                    setPalette(nome);
                    setPaletaAberta(false);
                  }}
                >
                  <View style={styles.paletteDots}>
                    {cores.map((cor) => (
                      <View
                        key={cor}
                        style={[styles.paletteDot, { backgroundColor: cor }]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[styles.paletteName, { color: palette.brandInk }]}
                  >
                    {nome}
                  </Text>
                  {selecionada ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={palette.brandInk}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingRow({
  palette,
  icon,
  label,
  onPress,
  right,
  last,
}: {
  palette: (typeof import("@/providers/theme-provider").palettes)[PaletteName];
  icon: IconName;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.row,
        !last && { borderBottomColor: palette.border, borderBottomWidth: 1 },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: palette.surface }]}>
        <Ionicons name={icon} size={18} color={palette.brandInk} />
      </View>
      <Text style={[styles.rowText, { color: palette.brandInk }]}>{label}</Text>
      {right ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={17} color={palette.muted} />
        ) : null)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerCopy: { flex: 1 },
  headerKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 1.5 },
  headerTitle: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerMark: {
    width: 44,
    height: 44,
    overflow: "hidden",
    position: "relative",
  },
  headerMarkShape: {
    position: "absolute",
    width: 38,
    height: 38,
    right: -10,
    bottom: -10,
    borderRadius: 8,
    transform: [{ rotate: "20deg" }],
  },
  content: { paddingHorizontal: 20, paddingTop: 5, paddingBottom: 42 },
  groupTitle: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  card: { borderWidth: 1, paddingHorizontal: 12 },
  row: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 11 },
  rowIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, fontSize: 13, fontWeight: "800" },
  swatches: { flexDirection: "row", alignItems: "center", gap: 4 },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  logoutButton: {
    minHeight: 48,
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  logoutText: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  version: {
    marginTop: 17,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  paletteCard: {
    padding: 20,
    paddingTop: 11,
    borderTopWidth: 2,
  },
  modalHandle: { width: 44, height: 4, alignSelf: "center", marginBottom: 16 },
  paletteKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 1.4 },
  paletteTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 3,
    marginBottom: 15,
  },
  paletteOption: {
    minHeight: 58,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  paletteDots: { flexDirection: "row", gap: 4 },
  paletteDot: { width: 17, height: 17, borderRadius: 9 },
  paletteName: { flex: 1, fontSize: 14, fontWeight: "900" },
});
