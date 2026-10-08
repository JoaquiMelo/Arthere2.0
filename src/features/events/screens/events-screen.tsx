import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import type { RootStackParamList } from "../../../navigation/app-navigator";

type Filtro = "TODOS" | "PREMIUM" | string;

const MESES = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

const MESES_CURTOS = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];
const SEMANAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function dataDoEvento(data: string) {
  return new Date(data + "T12:00:00");
}

function formatarDia(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  })
    .format(dataDoEvento(data))
    .replace(".", "");
}

export default function EventsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Events">>();
  const { palette } = useTheme();
  const { eventos, refresh } = useManagement();

  // Reconsulta eventos toda vez que a tela recebe foco.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const primeiroEvento = eventos[0];
  const dataInicial = primeiroEvento ? dataDoEvento(primeiroEvento.data) : new Date();

  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [busca, setBusca] = useState("");
  const [ano, setAno] = useState(dataInicial.getFullYear());
  const [mes, setMes] = useState(dataInicial.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState(dataInicial.getDate());

  useEffect(() => {
    if (!primeiroEvento) return;
    const data = dataDoEvento(primeiroEvento.data);
    setAno(data.getFullYear());
    setMes(data.getMonth());
    setDiaSelecionado(data.getDate());
  }, [primeiroEvento?.id]);

  const categorias = useMemo(() => {
    const unicas = Array.from(
      new Set(eventos.map((evento) => evento.categoria)),
    );
    return ["TODOS", ...unicas, "PREMIUM"];
  }, [eventos]);

  const eventosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return eventos.filter((evento) => {
      const atendeFiltro =
        filtro === "TODOS"
          ? true
          : filtro === "PREMIUM"
            ? evento.premium
            : evento.categoria === filtro;

      if (!atendeFiltro) return false;
      if (!termo) return true;

      return [
        evento.titulo,
        evento.categoria,
        evento.descricao,
        evento.local,
        evento.cidade,
        evento.organizador,
      ].some((campo) => campo.toLowerCase().includes(termo));
    });
  }, [eventos, busca, filtro]);

  const eventosDoMes = useMemo(
    () =>
      eventosFiltrados.filter((evento) => {
        const data = dataDoEvento(evento.data);
        return data.getFullYear() === ano && data.getMonth() === mes;
      }),
    [ano, mes, eventosFiltrados],
  );

  const eventosDoDia = useMemo(
    () =>
      eventosDoMes.filter(
        (evento) => dataDoEvento(evento.data).getDate() === diaSelecionado,
      ),
    [diaSelecionado, eventosDoMes],
  );

  const eventosDestaque = useMemo(
    () => eventos.filter((evento) => evento.destaque),
    [eventos],
  );

  const diasDoMes = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    return [
      ...Array(primeiroDia).fill(null),
      ...Array.from({ length: totalDias }, (_, index) => index + 1),
    ];
  }, [ano, mes]);

  const eventosPorDia = useMemo(() => {
    const mapa = new Map<number, typeof eventos>();

    eventosDoMes.forEach((evento) => {
      const dia = dataDoEvento(evento.data).getDate();
      const eventos = mapa.get(dia) ?? [];
      eventos.push(evento);
      mapa.set(dia, eventos);
    });

    return mapa;
  }, [eventosDoMes]);

  const moverMes = (delta: number) => {
    const novaData = new Date(ano, mes + delta, 1);
    setAno(novaData.getFullYear());
    setMes(novaData.getMonth());
    setDiaSelecionado(1);
  };

  const abrirEvento = (eventId: string) => {
    navigation.navigate("EventDetails", { eventId });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <View
          style={[styles.miniHeader, { borderBottomColor: palette.border }]}
        >
          <View style={styles.brandLockup}>
            <Text style={[styles.brand, { color: palette.brandInk }]}>
              ARTHERE
            </Text>
            <Text style={[styles.brandSub, { color: palette.muted }]}>
              AGENDA REGIONAL
            </Text>
          </View>
          <Text style={[styles.headerLabel, { color: palette.muted }]}>
            EVENTOS
          </Text>
        </View>

        <View style={[styles.hero, { borderBottomColor: palette.border }]}>
          <Text style={[styles.kicker, { color: palette.muted }]}>
            AGENDA CULTURAL · BAIXADA SANTISTA
          </Text>
          <Text style={[styles.heroTitle, { color: palette.brandInk }]}>
            Encontros que fazem a
          </Text>
          <Text style={[styles.heroTitleAccent, { color: palette.brandCoral }]}>
            cena acontecer.
          </Text>
          <Text style={[styles.heroDescription, { color: palette.muted }]}>
            Feiras, shows, exposições e oficinas para criar, trocar e descobrir
            o que movimenta a região.
          </Text>
        </View>

        <View
          style={[styles.searchSection, { borderBottomColor: palette.border }]}
        >
          <Text style={[styles.searchHint, { color: palette.muted }]}>
            PESQUISAR NA AGENDA
          </Text>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: palette.brandPaper,
                borderColor: palette.brandInk,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={palette.brandInk}
            />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Nome, cidade, categoria ou local"
              placeholderTextColor={palette.muted}
              style={[styles.searchInput, { color: palette.brandInk }]}
              editable={true}
              autoComplete="off"
              importantForAutofill="no"
              returnKeyType="search"
            />
            {!!busca && (
              <TouchableOpacity
                onPress={() => setBusca("")}
                style={styles.clearSearch}
              >
                <Ionicons name="close" size={18} color={palette.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View
          style={[styles.filtersHeader, { borderBottomColor: palette.border }]}
        >
          <Text style={[styles.searchHint, { color: palette.muted }]}>
            FILTRAR EVENTOS
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {categorias.map((item) => {
              const ativo = filtro === item;

              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setFiltro(item)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: ativo
                        ? palette.brandCoral
                        : palette.brandPaper,
                      borderColor: ativo ? palette.brandCoral : palette.border,
                    },
                  ]}
                >
                  {item === "PREMIUM" && (
                    <Ionicons
                      name="star"
                      size={14}
                      color={ativo ? palette.brandPaper : palette.brandGreen}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: ativo ? palette.brandPaper : palette.brandInk },
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View
          style={[styles.calendarArea, { borderColor: palette.brandCoral }]}
        >
          <View style={styles.calendarTop}>
            <View style={styles.calendarHeadline}>
              <Text
                style={[styles.calendarEyebrow, { color: palette.brandCoral }]}
              >
                CALENDÁRIO
              </Text>
              <Text style={[styles.bigMonth, { color: palette.brandCoral }]}>
                {MESES_CURTOS[mes]}
              </Text>
              <Text style={[styles.yearText, { color: palette.brandInk }]}>
                {ano}
              </Text>
            </View>

            <View style={styles.monthControls}>
              <TouchableOpacity
                onPress={() => moverMes(-1)}
                style={[
                  styles.controlButton,
                  { borderColor: palette.brandCoral },
                ]}
              >
                <Text
                  style={[styles.controlText, { color: palette.brandCoral }]}
                >
                  ‹
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moverMes(1)}
                style={[
                  styles.controlButton,
                  { borderColor: palette.brandCoral },
                ]}
              >
                <Text
                  style={[styles.controlText, { color: palette.brandCoral }]}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={[
              styles.weekHeader,
              { borderBottomColor: palette.brandCoral },
            ]}
          >
            {SEMANAS.map((dia) => (
              <Text
                key={dia}
                style={[styles.weekText, { color: palette.brandCoral }]}
              >
                {dia}
              </Text>
            ))}
          </View>

          <View
            style={[
              styles.calendarGrid,
              {
                borderTopColor: palette.brandCoral,
                borderLeftColor: palette.brandCoral,
              },
            ]}
          >
            {diasDoMes.map((dia, index) => {
              if (!dia) {
                return (
                  <View
                    key={"empty-" + index}
                    style={[
                      styles.dayCell,
                      {
                        borderRightColor: palette.brandCoral,
                        borderBottomColor: palette.brandCoral,
                      },
                    ]}
                  />
                );
              }

              const selecionado = dia === diaSelecionado;
              const eventosDoDiaNoCalendario = eventosPorDia.get(dia) ?? [];
              const temEvento = eventosDoDiaNoCalendario.length > 0;
              const eventoPrincipal = eventosDoDiaNoCalendario[0];

              return (
                <TouchableOpacity
                  key={dia}
                  onPress={() => setDiaSelecionado(dia)}
                  style={[
                    styles.dayCell,
                    {
                      borderRightColor: palette.brandCoral,
                      borderBottomColor: palette.brandCoral,
                      backgroundColor: temEvento
                        ? eventoPrincipal?.destaque
                          ? palette.brandGreen
                          : palette.brandCoral
                        : "transparent",
                    },
                    selecionado &&
                      !temEvento && { backgroundColor: palette.brandSand },
                    selecionado &&
                      temEvento && {
                        borderWidth: 2,
                        borderColor: palette.brandInk,
                      },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: temEvento
                          ? palette.brandPaper
                          : selecionado
                            ? palette.brandInk
                            : palette.brandCoral,
                      },
                    ]}
                  >
                    {String(dia).padStart(2, "0")}
                  </Text>

                  {temEvento && (
                    <Text
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      style={[styles.eventName, { color: palette.brandPaper }]}
                    >
                      {eventoPrincipal.titulo}
                      {eventosDoDiaNoCalendario.length > 1
                        ? " +" + (eventosDoDiaNoCalendario.length - 1)
                        : ""}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.calendarFooter}>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: palette.brandCoral },
                  ]}
                />
                <Text style={[styles.legendText, { color: palette.muted }]}>
                  evento
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: palette.brandInk },
                  ]}
                />
                <Text style={[styles.legendText, { color: palette.muted }]}>
                  fixado
                </Text>
              </View>
            </View>

            <Text style={[styles.selectedDate, { color: palette.brandCoral }]}>
              {String(diaSelecionado).padStart(2, "0")} · {MESES_CURTOS[mes]}
            </Text>
          </View>
        </View>

        <View style={styles.agendaSection}>
          <View style={styles.sectionLabelRow}>
            <View>
              <Text style={[styles.sectionLabel, { color: palette.muted }]}>
                PRÓXIMOS
              </Text>
              <Text style={[styles.agendaTitle, { color: palette.brandInk }]}>
                Agenda do mês
              </Text>
            </View>
            <Text style={[styles.eventCount, { color: palette.muted }]}>
              {eventosDoMes.length}{" "}
              {eventosDoMes.length === 1 ? "evento" : "eventos"}
            </Text>
          </View>

          <Text style={[styles.agendaDate, { color: palette.muted }]}>
            {formatarDia(
              `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaSelecionado).padStart(2, "0")}`,
            )}
          </Text>

          {eventosDoDia.length ? (
            eventosDoDia.map((evento) => (
              <TouchableOpacity
                key={evento.id}
                style={[styles.agendaItem, { borderTopColor: palette.border }]}
                onPress={() => abrirEvento(evento.id)}
              >
                <View style={styles.agendaDateBlock}>
                  <Text
                    style={[styles.agendaDay, { color: palette.brandCoral }]}
                  >
                    {String(dataDoEvento(evento.data).getDate()).padStart(
                      2,
                      "0",
                    )}
                  </Text>
                  <Text style={[styles.agendaMeta, { color: palette.muted }]}>
                    {evento.horario}
                  </Text>
                </View>

                <View style={styles.agendaTextBlock}>
                  <View style={styles.agendaTitleRow}>
                    <Text
                      style={[
                        styles.agendaItemTitle,
                        { color: palette.brandInk },
                      ]}
                    >
                      {evento.titulo}
                    </Text>
                    {evento.premium && (
                      <Ionicons
                        name="star"
                        size={14}
                        color={palette.brandGreen}
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.agendaItemMeta, { color: palette.muted }]}
                  >
                    {evento.categoria} · {evento.local} · {evento.cidade}
                  </Text>
                </View>

                <Text style={[styles.agendaArrow, { color: palette.muted }]}>
                  →
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.noAgenda, { borderTopColor: palette.border }]}>
              <Text style={[styles.noAgendaText, { color: palette.muted }]}>
                Nenhum evento nesta data.
              </Text>
            </View>
          )}

          {!!busca && (
            <View
              style={[
                styles.searchResultLine,
                { backgroundColor: palette.brandSand },
              ]}
            >
              <Text
                style={[styles.searchResultText, { color: palette.brandInk }]}
              >
                {eventosFiltrados.length} resultado
                {eventosFiltrados.length === 1 ? "" : "s"} para “{busca}”
              </Text>
            </View>
          )}

          <Text style={[styles.allEventsLabel, { color: palette.muted }]}>
            TODOS OS EVENTOS DA BUSCA
          </Text>

          {eventosFiltrados.map((evento) => (
            <TouchableOpacity
              key={"all-" + evento.id}
              onPress={() => abrirEvento(evento.id)}
              style={[styles.eventListItem, { borderTopColor: palette.border }]}
            >
              <View
                style={[
                  styles.smallDate,
                  {
                    backgroundColor: evento.premium
                      ? palette.brandSand
                      : palette.brandBlue,
                  },
                ]}
              >
                <Text
                  style={[styles.smallDateDay, { color: palette.brandInk }]}
                >
                  {String(dataDoEvento(evento.data).getDate()).padStart(2, "0")}
                </Text>
                <Text
                  style={[styles.smallDateMonth, { color: palette.brandInk }]}
                >
                  {MESES[dataDoEvento(evento.data).getMonth()].slice(0, 3)}
                </Text>
              </View>

              <View style={styles.eventListBody}>
                <View style={styles.agendaTitleRow}>
                  <Text
                    style={[styles.eventListTitle, { color: palette.brandInk }]}
                  >
                    {evento.titulo}
                  </Text>
                  {evento.destaque && (
                    <View
                      style={[
                        styles.fixedTag,
                        { backgroundColor: palette.brandInk },
                      ]}
                    >
                      <Ionicons
                        name="pin"
                        size={11}
                        color={palette.brandPaper}
                      />
                      <Text
                        style={[
                          styles.fixedTagText,
                          { color: palette.brandPaper },
                        ]}
                      >
                        FIXADO
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.eventListMeta, { color: palette.muted }]}>
                  {evento.categoria} · {evento.local} · {evento.cidade}
                </Text>
                <Text
                  style={[styles.eventListTime, { color: palette.brandCoral }]}
                >
                  {evento.horario} · {evento.organizador}
                </Text>
              </View>

              <Text style={[styles.agendaArrow, { color: palette.muted }]}>
                →
              </Text>
            </TouchableOpacity>
          ))}

          {!eventosFiltrados.length && (
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: palette.brandPaper,
                  borderColor: palette.border,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={34}
                color={palette.brandCoral}
              />
              <Text style={[styles.emptyTitle, { color: palette.brandInk }]}>
                Nenhum evento encontrado
              </Text>
              <Text style={[styles.emptyText, { color: palette.muted }]}>
                Tente outro termo ou remova alguns filtros.
              </Text>
            </View>
          )}
        </View>

        {eventosDestaque.length > 0 && (
          <View style={styles.highlightsSection}>
            <View style={styles.sectionLabelRow}>
              <View>
                <Text style={[styles.sectionLabel, { color: palette.muted }]}>
                  EM EVIDÊNCIA
                </Text>
                <Text
                  style={[styles.highlightsTitle, { color: palette.brandInk }]}
                >
                  Destaques fixados
                </Text>
              </View>
              <Ionicons name="pin" size={18} color={palette.brandCoral} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightContent}
            >
              {eventosDestaque.map((evento) => (
                <TouchableOpacity
                  key={"highlight-" + evento.id}
                  activeOpacity={0.92}
                  onPress={() => abrirEvento(evento.id)}
                  style={[
                    styles.featured,
                    { backgroundColor: palette.brandInk },
                  ]}
                >
                  <View style={styles.featuredTop}>
                    <View>
                      <Text
                        style={[
                          styles.featuredKicker,
                          { color: palette.muted },
                        ]}
                      >
                        FIXADO
                      </Text>
                      <Text
                        style={[
                          styles.featuredDay,
                          { color: palette.brandPaper },
                        ]}
                      >
                        {String(dataDoEvento(evento.data).getDate()).padStart(
                          2,
                          "0",
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.featuredDateText,
                          { color: palette.brandPaper },
                        ]}
                      >
                        {MESES[dataDoEvento(evento.data).getMonth()]}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.pinBadge,
                        { backgroundColor: palette.brandCoral },
                      ]}
                    >
                      <Ionicons
                        name="pin"
                        size={13}
                        color={palette.brandPaper}
                      />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.featuredDivider,
                      { backgroundColor: palette.brandCoral },
                    ]}
                  />
                  <Text
                    style={[
                      styles.featuredTitle,
                      { color: palette.brandPaper },
                    ]}
                  >
                    {evento.titulo}
                  </Text>
                  <Text
                    style={[
                      styles.featuredDescription,
                      { color: palette.muted },
                    ]}
                  >
                    {evento.descricao}
                  </Text>

                  <View style={styles.featuredInfoRow}>
                    <Text
                      style={[
                        styles.featuredInfo,
                        { color: palette.brandPaper },
                      ]}
                    >
                      {evento.horario}
                    </Text>
                    <Text
                      style={[
                        styles.featuredInfo,
                        { color: palette.brandPaper },
                      ]}
                    >
                      {evento.local}
                    </Text>
                  </View>

                  <View style={styles.featuredFooter}>
                    <Text
                      style={[
                        styles.featuredLocation,
                        { color: palette.muted },
                      ]}
                    >
                      {evento.cidade}
                    </Text>
                    <View
                      style={[
                        styles.detailButton,
                        { backgroundColor: palette.brandCoral },
                      ]}
                    >
                      <Text
                        style={[
                          styles.detailButtonText,
                          { color: palette.brandPaper },
                        ]}
                      >
                        VER DETALHES →
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 42 },

  miniHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  brandLockup: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  brand: { fontSize: 13, fontWeight: "900", letterSpacing: 0.8 },
  brandSub: { fontSize: 7, fontWeight: "800", letterSpacing: 1.2 },
  headerLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },

  hero: { paddingTop: 24, paddingBottom: 22, borderBottomWidth: 1 },
  kicker: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  heroTitleAccent: { fontSize: 31, lineHeight: 36, fontWeight: "800" },
  heroDescription: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 340,
    marginTop: 12,
  },

  searchSection: { paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1 },
  searchHint: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.15,
    marginBottom: 8,
  },
  searchBox: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, paddingVertical: 11 },
  clearSearch: { padding: 5 },

  filtersHeader: { paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1 },
  filterContent: { paddingRight: 10, gap: 8 },
  filterChip: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1.5,
  },
  filterChipText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.75 },

  calendarArea: {
    marginTop: 20,
    borderRadius: 18,
    overflow: "hidden",
    padding: 11,
    borderWidth: 1.5,
  },
  calendarTop: {
    minHeight: 124,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 5,
    paddingTop: 3,
  },
  calendarHeadline: { flex: 1 },
  calendarEyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.6 },
  bigMonth: {
    fontSize: 76,
    lineHeight: 74,
    fontWeight: "900",
    letterSpacing: -4,
    marginTop: 1,
  },
  yearText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.6,
    marginTop: -1,
  },
  monthControls: { flexDirection: "row", gap: 6, paddingTop: 5 },
  controlButton: {
    width: 38,
    borderRadius: 12,
    height: 38,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  controlText: { fontSize: 25, lineHeight: 28, fontWeight: "400" },

  weekHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 7,
    marginTop: 2,
  },
  weekText: {
    flex: 1,
    textAlign: "center",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  dayCell: {
    width: "14.285%",
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  dayText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.2 },
  eventName: {
    position: "absolute",
    bottom: 6,
    width: "90%",
    fontSize: 6.5,
    lineHeight: 8,
    fontWeight: "900",
    textAlign: "center",
  },
  eventBadge: {
    position: "absolute",
    bottom: 6,
    minWidth: 28,
    maxWidth: "90%",
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
  },
  eventBadgeText: {
    fontSize: 6.5,
    fontWeight: "900",
    letterSpacing: 0.1,
    textAlign: "center",
  },

  calendarFooter: {
    minHeight: 32,
    paddingHorizontal: 4,
    paddingTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendItems: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 5, height: 5, borderRadius: 3 },
  legendText: { fontSize: 8, fontWeight: "700" },
  selectedDate: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },

  agendaSection: { paddingTop: 22 },
  sectionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
  },
  sectionLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  agendaTitle: { fontSize: 22, fontWeight: "600", marginTop: 5 },
  agendaDate: {
    fontSize: 10,
    marginTop: 5,
    marginBottom: 12,
    textTransform: "capitalize",
  },
  eventCount: { fontSize: 9, fontWeight: "700" },
  agendaItem: {
    minHeight: 70,
    borderRadius: 12,
    borderTopWidth: 1,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },
  agendaDateBlock: { width: 58 },
  agendaDay: { fontSize: 22, fontWeight: "900" },
  agendaMeta: { fontSize: 8, marginTop: 2 },
  agendaTextBlock: { flex: 1, paddingRight: 8 },
  agendaTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  agendaItemTitle: { fontSize: 13, fontWeight: "800", flexShrink: 1 },
  agendaItemMeta: { fontSize: 9, marginTop: 4, lineHeight: 13 },
  agendaArrow: { fontSize: 18 },
  noAgenda: { paddingVertical: 16, borderTopWidth: 1 },
  noAgendaText: { fontSize: 10 },

  searchResultLine: { marginTop: 12, padding: 10, borderRadius: 10 },
  searchResultText: { fontSize: 9, fontWeight: "800" },
  allEventsLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 7,
  },

  eventListItem: {
    minHeight: 82,
    borderTopWidth: 1,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallDate: {
    width: 54,
    borderRadius: 12,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  smallDateDay: { fontSize: 22, fontWeight: "900" },
  smallDateMonth: { fontSize: 8, fontWeight: "900", marginTop: 2 },
  eventListBody: { flex: 1 },
  eventListTitle: { fontSize: 13, lineHeight: 17, fontWeight: "800", flex: 1 },
  eventListMeta: { fontSize: 8.5, marginTop: 4, lineHeight: 13 },
  eventListTime: { fontSize: 8.5, fontWeight: "800", marginTop: 5 },
  fixedTag: {
    paddingHorizontal: 6,
    borderRadius: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  fixedTagText: { fontSize: 7, fontWeight: "900", letterSpacing: 0.6 },

  empty: {
    marginTop: 10,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    borderRadius: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "900", marginTop: 11 },
  emptyText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  highlightsSection: { marginTop: 28 },
  highlightsTitle: { fontSize: 22, fontWeight: "600", marginTop: 5 },
  highlightContent: { paddingTop: 13, paddingRight: 16, gap: 12 },
  featured: {
    width: 300,
    paddingVertical: 20,
    paddingHorizontal: 17,
    borderRadius: 20,
    overflow: "hidden",
  },
  featuredTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  featuredKicker: { fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  featuredDay: {
    fontSize: 48,
    lineHeight: 50,
    fontWeight: "700",
    marginTop: 2,
  },
  featuredDateText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  pinBadge: {
    width: 30,
    borderRadius: 15,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredDivider: { height: 2, width: 54, marginTop: 14, marginBottom: 13 },
  featuredTitle: { fontSize: 21, lineHeight: 26, fontWeight: "700" },
  featuredDescription: { fontSize: 10, lineHeight: 15, marginTop: 8 },
  featuredInfoRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 15,
    flexWrap: "wrap",
  },
  featuredInfo: { fontSize: 9, fontWeight: "700" },
  featuredFooter: { marginTop: 18, gap: 12 },
  featuredLocation: { fontSize: 8.5 },
  detailButton: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  detailButtonText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
});
