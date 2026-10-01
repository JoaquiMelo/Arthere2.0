import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
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
import { useUser } from "@/providers/user-provider";
import { colors } from "@/shared/theme/colors";

const AVATAR_PADRAO = "https://i.pravatar.cc/300?img=68";

interface EventoAnterior {
  id: string;
  titulo: string;
  data: string;
  imagemUrl: string;
}

const MOCK_EVENTOS_ANTERIORES: EventoAnterior[] = [
  {
    id: "1",
    titulo: "Festival Verão de Música",
    data: "Jan 2026",
    imagemUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "2",
    titulo: "Desfile Primavera/Verão",
    data: "Nov 2025",
    imagemUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3",
    titulo: "Gala Corporativa 2025",
    data: "Out 2025",
    imagemUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
  },
];

export default function ContratanteProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useUser();
  const { vagas, eventos } = useManagement();

  const [empresa, setEmpresa] = useState(
    user?.empresa || "Empresa não informada",
  );
  const [editando, setEditando] = useState(false);
  const [rascunhoEmpresa, setRascunhoEmpresa] = useState(empresa);

  const concluidas = vagas.filter((vaga) => vaga.status === "CONCLUIDA").length;
  const emAndamento = vagas.filter(
    (vaga) => vaga.status === "EM_ANDAMENTO",
  ).length;
  const totalCandidaturas = vagas.reduce(
    (soma, vaga) => soma + vaga.candidatos.length,
    0,
  );

  const abrirEdicao = () => {
    setRascunhoEmpresa(empresa);
    setEditando(true);
  };

  const salvarEmpresa = async () => {
    const valor = rascunhoEmpresa.trim();
    if (!valor) return;
    try {
      await updateProfile({ empresa: valor });
      setEmpresa(valor);
      setEditando(false);
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const avatarSource =
    (user as { avatarUrl?: string; avatar?: string } | null)?.avatarUrl ||
    (user as { avatar?: string } | null)?.avatar ||
    AVATAR_PADRAO;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.coverContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
            }}
            style={styles.coverImage}
          />
          <View style={styles.coverOverlay} />

          <View style={styles.coverLabel}>
            <Text style={styles.coverLabelText}>PERFIL · CONTRATANTE</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsIcon}
            onPress={() => navigation.navigate("Settings")}
            accessibilityLabel="Abrir configurações"
          >
            <Ionicons
              name="settings-outline"
              size={19}
              color={colors.brandPaper}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.intro}>
          <Image source={{ uri: avatarSource }} style={styles.avatar} />

          <Text style={styles.name}>
            {user?.nomeSocial || user?.nome || "Contratante"}
          </Text>

          <TouchableOpacity
            style={styles.empresaBadge}
            onPress={abrirEdicao}
            activeOpacity={0.75}
          >
            <Ionicons name="business" size={14} color={colors.brandInk} />
            <Text style={styles.empresa} numberOfLines={1}>
              {empresa}
            </Text>
            <Ionicons name="pencil" size={11} color={colors.brandInk} />
          </TouchableOpacity>

          {user?.cidade ? (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.brandTerracotta}
              />
              <Text style={styles.location}>{user.cidade}</Text>
            </View>
          ) : null}

          <View style={styles.statsCard}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{vagas.length}</Text>
              <Text style={styles.statLabel}>VAGAS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{emAndamento}</Text>
              <Text style={styles.statLabel}>EM ANDAMENTO</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{concluidas}</Text>
              <Text style={styles.statLabel}>CONCLUÍDAS</Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate("ManageOpportunities")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={colors.brandPaper}
              />
              <Text style={styles.manageButtonText}>
                CANDIDATURAS
                {totalCandidaturas > 0 ? ` · ${totalCandidaturas}` : ""}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => navigation.navigate("EditContractorProfile")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={colors.brandInk}
              />
              <Text style={styles.editProfileButtonText}>EDITAR PERFIL</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>PORTFÓLIO DE EVENTOS</Text>
              <Text style={styles.sectionTitle}>Eventos anteriores</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {eventos.length} registros
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryContainer}
          >
            {eventos.map((evento) => (
              <View key={evento.id} style={styles.eventCard}>
                <Image
                  source={{ uri: evento.imagemUrl || "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80" }}
                  style={styles.eventImage}
                />
                <View style={styles.eventOverlay}>
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {evento.titulo}
                  </Text>
                  <Text style={styles.eventDateText}>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(evento.data + "T12:00:00")).replace(".", "")}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addEventCard}
              activeOpacity={0.75}
              onPress={() => navigation.navigate("CreateEvent")}
            >
              <View style={styles.addEventIcon}>
                <Ionicons name="add" size={24} color={colors.brandInk} />
              </View>
              <Text style={styles.addEventText}>ADICIONAR EVENTO</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>PROJETOS PUBLICADOS</Text>
              <Text style={styles.sectionTitle}>Minhas vagas</Text>
            </View>
          </View>

          {vagas.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="folder-open-outline"
                size={30}
                color={colors.brandCoral}
              />
              <Text style={styles.emptyTitle}>Nenhuma vaga publicada</Text>
              <Text style={styles.emptyText}>
                Suas oportunidades aparecerão aqui depois que forem publicadas.
              </Text>
            </View>
          ) : (
            vagas.map((vaga) => (
              <TouchableOpacity
                key={vaga.id}
                style={styles.vagaCard}
                onPress={() => navigation.navigate("ManageOpportunities")}
                activeOpacity={0.75}
              >
                <View style={styles.flex1}>
                  <Text style={styles.vagaCategoria}>{vaga.categoria}</Text>
                  <Text style={styles.vagaTitulo}>{vaga.titulo}</Text>
                  <Text style={styles.vagaMeta}>
                    {vaga.candidatos.length} candidato
                    {vaga.candidatos.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <View style={styles.vagaRight}>
                  <Text style={styles.statusBadge}>
                    {vaga.status === "CONCLUIDA"
                      ? "CONCLUÍDA"
                      : vaga.status === "EM_ANDAMENTO"
                        ? "EM ANDAMENTO"
                        : "ABERTA"}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={15}
                    color={colors.brandInk}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={editando}
        animationType="fade"
        transparent
        onRequestClose={() => setEditando(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editCard}>
            <Text style={styles.editKicker}>PERFIL DO CONTRATANTE</Text>
            <Text style={styles.editTitle}>Nome da empresa</Text>
            <TextInput
              style={styles.editInput}
              value={rascunhoEmpresa}
              onChangeText={setRascunhoEmpresa}
              placeholder="Ex.: Vitrine Eventos"
              placeholderTextColor={colors.muted}
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setEditando(false)}>
                <Text style={styles.cancel}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={salvarEmpresa}>
                <Text style={styles.saveText}>SALVAR</Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.brandPaper}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brandPaper },
  scrollContent: { paddingBottom: 42 },
  coverContainer: {
    height: 178,
    overflow: "hidden",
    backgroundColor: colors.brandInk,
    position: "relative",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  coverImage: { width: "100%", height: "100%" },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(41,36,43,0.50)",
  },
  coverLabel: {
    position: "absolute",
    left: 16,
    bottom: 14,
    backgroundColor: colors.brandInk,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  coverLabelText: {
    color: colors.brandSand,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  settingsIcon: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(246,241,232,0.36)",
    backgroundColor: "rgba(41,36,43,0.60)",
    borderRadius: 19,
  },
  intro: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatar: {
    width: 106,
    height: 106,
    marginTop: -48,
    borderWidth: 4,
    borderColor: colors.brandPaper,
    backgroundColor: colors.white,
    borderRadius: 53,
  },
  name: {
    marginTop: 12,
    color: colors.brandInk,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  empresaBadge: {
    maxWidth: "92%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.brandInk,
    backgroundColor: colors.brandSand,
    borderRadius: 14,
  },
  empresa: {
    flexShrink: 1,
    color: colors.brandInk,
    fontSize: 12,
    fontWeight: "800",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  location: { color: colors.muted, fontSize: 12 },
  statsCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 19,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statNumber: { color: colors.brandInk, fontSize: 18, fontWeight: "900" },
  statLabel: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  statDivider: { width: 1, height: 24, backgroundColor: colors.border },
  actionButtonsRow: {
    width: "100%",
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
  },
  manageButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.brandInk,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
  },
  manageButtonText: {
    color: colors.brandPaper,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  editProfileButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.brandInk,
    backgroundColor: colors.brandSand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
  },
  editProfileButtonText: {
    color: colors.brandInk,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 11,
  },
  sectionKicker: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 2,
  },
  sectionTitle: { color: colors.brandInk, fontSize: 18, fontWeight: "900" },
  sectionSubtitle: { color: colors.muted, fontSize: 9, fontWeight: "700" },
  galleryContainer: { gap: 10, paddingRight: 20 },
  eventCard: {
    width: 158,
    height: 184,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.surface,
    borderRadius: 18,
  },
  eventImage: { width: "100%", height: "100%" },
  eventOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(41,36,43,0.75)",
  },
  eventTitle: {
    color: colors.brandPaper,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
  },
  eventDateText: {
    color: colors.brandSand,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 5,
  },
  addEventCard: {
    width: 118,
    height: 184,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brandInk,
    backgroundColor: colors.brandBlue,
    alignItems: "center",
    borderRadius: 18,
    justifyContent: "center",
    padding: 10,
  },
  addEventIcon: {
    width: 38,
    height: 38,
    backgroundColor: colors.brandPaper,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  addEventText: {
    color: colors.brandInk,
    textAlign: "center",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 9,
  },
  emptyStateContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  emptyTitle: {
    color: colors.brandInk,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 290,
  },
  vagaCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    marginBottom: 9,
    borderRadius: 16,
  },
  flex1: { flex: 1, minWidth: 0 },
  vagaCategoria: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  vagaTitulo: {
    color: colors.brandInk,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900",
    marginTop: 3,
  },
  vagaMeta: { color: colors.muted, fontSize: 10.5, marginTop: 4 },
  vagaRight: { alignItems: "flex-end", gap: 7 },
  statusBadge: {
    color: colors.brandInk,
    backgroundColor: colors.brandSand,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(41,36,43,0.52)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  editCard: {
    backgroundColor: colors.brandPaper,
    borderTopWidth: 2,
    borderTopColor: colors.brandCoral,
    padding: 20,
    borderRadius: 22,
  },
  editKicker: {
    color: colors.brandCoral,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  editTitle: {
    color: colors.brandInk,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 3,
    marginBottom: 13,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 11,
    marginBottom: 5,
  },
  editInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 18,
    marginTop: 18,
  },
  cancel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  save: {
    minHeight: 42,
    paddingHorizontal: 14,
    backgroundColor: colors.brandInk,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveText: {
    color: colors.brandPaper,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
});
