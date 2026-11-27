import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { AppText, Avatar, Button, FeedbackState, FilterChip, IconButton, ScreenContainer } from '@/shared/components';
import { useMapAppearance } from '@/features/map/hooks/use-map-appearance';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useChat } from '@/providers/chat-provider';
import { useUser } from '@/providers/user-provider';
import { agents, events } from '@/services/api';
import { AgentProfileCard } from '@/features/agents/components/agent-profile-card';
import { AgentMarker } from '@/features/agents/components/agent-marker';
import type { AgenteCriativo } from '@/features/agents/types/agent';
import type { Evento } from '@/features/events/types/event';
import { useEventDay } from '@/features/events/hooks/use-event-day';
import { eventDate, eventPoint, filterEvents, isEventConcluded, mapEvento, sortEvents } from '@/features/events/utils/event-agenda';
import { mapAgent, matchesAgent, MAP_CATEGORIES, categoryLabel } from '../utils/map-agents';
import { regionalMap as REGIAO_INICIAL } from '../utils/map-region';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
type MapEntry =
  | { kind: 'agent'; item: AgenteCriativo }
  | { kind: 'event'; item: Evento };

export function MapScreen() {
  const navigation = useNavigation<any>();
  const { color, spacing, radius, dimensions, typography, elevation, keyboardAppearance } = useThemeTokens();
  const mapAppearance = useMapAppearance();
  const reducedMotion = useReducedMotion();
  const { user } = useUser();
  const { startConversation } = useChat();
  const mapRef = useRef<MapView>(null);
  const lastRegion = useRef(REGIAO_INICIAL);
  const [initialRegion, setInitialRegion] = useState(REGIAO_INICIAL);
  const requestVersion = useRef(0);
  const eventVersion = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState<'map' | 'list'>('map');
  const [layer, setLayer] = useState<'all' | 'agents' | 'events'>('all');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [agentes, setAgentes] = useState<AgenteCriativo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [conectando, setConectando] = useState(false);
  const chatPending = useRef(false);
  const today = useEventDay();

  const carregarAgentes = useCallback(async () => {
    const version = ++requestVersion.current;
    setCarregando(true);
    setErro(null);
    try {
      const lista = await agents();
      const mapeados = (lista ?? []).map(mapAgent).filter((item: AgenteCriativo | null): item is AgenteCriativo => item !== null);
      if (version === requestVersion.current) setAgentes(mapeados);
    } catch {
      if (version === requestVersion.current) setErro('Não foi possível atualizar os profissionais. Confira sua conexão.');
    } finally {
      if (version === requestVersion.current) setCarregando(false);
    }
  }, []);

  const carregarEventos = useCallback(async () => {
    const version = ++eventVersion.current;
    setLoadingEvents(true);
    setErrorEvents(null);
    try {
      const lista = await events();
      if (version === eventVersion.current) setEventos(lista.map(mapEvento));
    } catch {
      if (version === eventVersion.current) setErrorEvents('Não foi possível atualizar os eventos.');
    } finally {
      if (version === eventVersion.current) setLoadingEvents(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void carregarAgentes();
    void carregarEventos();
    return () => { requestVersion.current += 1; eventVersion.current += 1; };
  }, [carregarAgentes, carregarEventos]));

  const showAgents = layer !== 'events';
  const showEvents = layer !== 'agents';
  const carregandoMapa = (showAgents && carregando) || (showEvents && loadingEvents);
  const erroMapa = [showAgents && erro, showEvents && errorEvents].filter(Boolean).join(' ');
  const atualizar = () => {
    if (showAgents) void carregarAgentes();
    if (showEvents) void carregarEventos();
  };

  const filtrados = useMemo(() => showAgents ? agentes.filter((agente) =>
    matchesAgent(agente, busca, layer === 'agents' ? categoria : null)) : [], [agentes, busca, categoria, layer, showAgents]);
  const resultados = useMemo(() => [...filtrados].sort((a, b) => b.avaliacao - a.avaliacao || a.nome.localeCompare(b.nome, 'pt-BR')), [filtrados]);
  const eventPins = useMemo(() => {
    if (!showEvents) return [];
    const filtered = filterEvents(eventos, busca, null, false);
    return sortEvents(filtered, today).flatMap((event) => {
      const point = eventPoint(event);
      return point ? [{ event, point }] : [];
    });
  }, [busca, eventos, showEvents, today]);
  const entries: MapEntry[] = [
    ...eventPins.map(({ event }): MapEntry => ({ kind: 'event', item: event })),
    ...resultados.map((item): MapEntry => ({ kind: 'agent', item })),
  ];
  const total = entries.length;
  const agenteSelecionado = agentes.find((agente) => agente.id === selecionado) ?? null;
  const categories = useMemo(() => Object.entries(MAP_CATEGORIES).filter(([id]) => id !== 'outros' || agentes.some((a) => a.categoria === id)), [agentes]);

  const trocarModo = (next: 'map' | 'list') => {
    Keyboard.dismiss();
    if (mode !== next) {
      setMapReady(false);
      if (next === 'map') setInitialRegion(lastRegion.current);
      setMode(next);
    }
  };

  const enquadrar = () => {
    if (!mapRef.current || !mapReady) return;
    const pontos = [...filtrados.map(({ latitude, longitude }) => ({ latitude, longitude })), ...eventPins.map(({ point }) => point)];
    if (!pontos.length) {
      mapRef.current.animateToRegion(REGIAO_INICIAL, reducedMotion ? 0 : 250);
    } else if (pontos.every((p) => p.latitude === pontos[0].latitude && p.longitude === pontos[0].longitude)) {
      mapRef.current.animateToRegion({ ...pontos[0], latitudeDelta: 0.05, longitudeDelta: 0.05 }, reducedMotion ? 0 : 250);
    } else {
      mapRef.current.fitToCoordinates(pontos, { edgePadding: { top: 48, right: 48, bottom: 72, left: 48 }, animated: !reducedMotion });
    }
  };

  const abrirChat = async (agente: AgenteCriativo) => {
    if (!user) {
      setSelecionado(null);
      navigation.navigate('Login');
      return;
    }
    if (user.tipo === 'AGENTE' && user.id === agente.id) return;
    if (chatPending.current) return;
    chatPending.current = true;
    setConectando(true);
    try {
      const conversationId = await startConversation(agente);
      setSelecionado(null);
      navigation.navigate('ChatConversation', { conversationId });
    } catch (error) {
      Alert.alert('Não foi possível iniciar a conversa', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      chatPending.current = false;
      setConectando(false);
    }
  };

  const limparFiltros = () => { setBusca(''); setCategoria(null); };
  const abrirAgente = (agente: AgenteCriativo) => { Keyboard.dismiss(); setSelecionado(agente.id); };
  const abrirEvento = (eventId: string) => { Keyboard.dismiss(); navigation.navigate('EventDetails', { eventId }); };

  return (
    <ScreenContainer edges={user ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm }}>
        <View style={styles.brandRow}>
          <View style={{ width: 3, alignSelf: 'stretch', borderRadius: radius.xs, backgroundColor: color.accent }} />
          <View style={styles.flex}>
            <AppText variant="label" color="accentText" weight="bold">ARTHERE / TERRITÓRIO CRIATIVO</AppText>
            <AppText variant="h2" weight="heavy" accessibilityRole="header" style={{ letterSpacing: typography.tracking.tight }}>Mapa cultural</AppText>
          </View>
        </View>
        {!user ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" size="small" onPress={() => navigation.goBack()}>Voltar ao Ateliê</Button>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.md, minHeight: dimensions.control.medium, borderWidth: 1, borderColor: color.controlBorder, backgroundColor: color.surface, borderRadius: radius.control }}>
          <Ionicons name="search-outline" size={dimensions.icon.medium} color={color.accentText} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Nome, cidade ou categoria"
            placeholderTextColor={color.textSecondary}
            keyboardAppearance={keyboardAppearance} selectionColor={color.selection} cursorColor={color.focus}
            accessibilityLabel="Buscar no mapa"
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            autoComplete="off"
            autoCorrect={false}
            style={{ flex: 1, minWidth: 0, paddingVertical: spacing.sm, paddingRight: spacing.sm, color: color.textPrimary, fontSize: typography.size.body }}
          />
          {busca.length > 0 ? <IconButton icon="close" variant="ghost" accessibilityLabel="Limpar busca" onPress={() => setBusca('')} /> : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <FilterChip variant="compact" label="Tudo" selected={layer === 'all'} onPress={() => setLayer('all')} />
        <FilterChip variant="compact" label="Agentes" icon="person-outline" selected={layer === 'agents'} onPress={() => setLayer('agents')} />
        <FilterChip variant="compact" label="Eventos" icon="calendar-outline" selected={layer === 'events'} onPress={() => setLayer('events')} />
      </View>
      {layer === 'agents' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.categoryStrip} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs }}>
        <FilterChip variant="compact" label="Todos" selected={!categoria} onPress={() => setCategoria(null)} />
        {categories.map(([id, item]) => (
          <FilterChip key={id} variant="compact" label={item.label} selected={categoria === id} onPress={() => setCategoria((current) => current === id ? null : id)} />
        ))}
      </ScrollView> : null}

      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
        <AppText variant="bodySmall" weight="semibold" style={{ flex: 1, minWidth: 92 }} accessibilityLiveRegion="polite">
          {carregandoMapa && !total ? 'Buscando…' :
            [showAgents && `${filtrados.length} ${filtrados.length === 1 ? 'agente' : 'agentes'}`,
              showEvents && `${eventPins.length} ${eventPins.length === 1 ? 'evento' : 'eventos'}`].filter(Boolean).join(' · ')}
        </AppText>
        <FilterChip variant="segment" label="Mapa" icon={mode === 'map' ? 'map' : 'map-outline'} selected={mode === 'map'} onPress={() => trocarModo('map')} />
        <FilterChip variant="segment" label="Lista" icon="list-outline" selected={mode === 'list'} onPress={() => trocarModo('list')} />
      </View>

      {mode === 'map' ? (
        <View style={[styles.mapFrame, { marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: color.surfaceSubtle, borderColor: color.border, borderRadius: radius.cardCompact }]}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            {...mapAppearance}
            initialRegion={initialRegion}
            onMapReady={() => setMapReady(true)}
            onRegionChangeComplete={(region) => { lastRegion.current = region; }}
            scrollEnabled
            zoomEnabled
            pitchEnabled={false}
          >
            {filtrados.map((agente) => (
              <AgentMarker key={agente.id} agente={agente} onPress={abrirAgente} />
            ))}
            {eventPins.map(({ event, point }) => {
              const concluded = isEventConcluded(event.data, today);
              return <Marker key={`event:${event.id}`} coordinate={point} title={event.titulo}
                pinColor={concluded ? color.accentSecondary : color.accent}
                accessibilityLabel={`Evento${concluded ? ' concluído' : ''}: ${event.titulo}`} onPress={() => abrirEvento(event.id)} />;
            })}
          </MapView>
          <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: color.surface, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, ...elevation.low }}>
            <View>
              <IconButton icon="scan-outline" accessibilityLabel={total ? 'Enquadrar resultados no mapa' : 'Voltar à região inicial'} variant="ghost" disabled={!mapReady} onPress={enquadrar} />
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: color.border }}>
              <IconButton icon="refresh-outline" accessibilityLabel="Atualizar mapa" variant="ghost" loading={carregandoMapa} onPress={atualizar} />
            </View>
          </View>
          {carregandoMapa && !total ? (
            <View pointerEvents="none" style={[styles.mapNotice, { backgroundColor: color.surface, padding: spacing.md, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, gap: spacing.sm }]}>
              <ActivityIndicator color={color.accentText} />
              <AppText variant="bodySmall">Buscando no mapa…</AppText>
            </View>
          ) : null}
          {erroMapa && !carregandoMapa ? (
            <View style={[styles.mapNotice, { backgroundColor: color.surface, padding: spacing.md, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, gap: spacing.sm }]}>
              <AppText color="dangerText" variant="bodySmall">{erroMapa}</AppText>
              <Button variant="outline" size="small" style={{ borderRadius: radius.control }} onPress={atualizar}>Tentar novamente</Button>
            </View>
          ) : !carregandoMapa && !total ? (
            <View style={[styles.mapNotice, { backgroundColor: color.surface, padding: spacing.md, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, gap: spacing.sm }]}>
              <AppText weight="semibold">Nenhum resultado no mapa</AppText>
              <AppText variant="bodySmall" color="textSecondary">{busca || (layer === 'agents' && categoria) ? 'Experimente outros filtros.' : 'Confira outra camada do mapa ou a agenda.'}</AppText>
              {busca || categoria ? <Button variant="outline" size="small" style={{ borderRadius: radius.control }} onPress={limparFiltros}>Limpar filtros</Button> : null}
            </View>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={({ kind, item }) => `${kind}:${item.id}`}
          refreshing={carregandoMapa}
          onRefresh={atualizar}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 }}
          ListHeaderComponent={total && erroMapa ? (
            <View style={{ paddingVertical: spacing.sm, gap: spacing.xs }}>
              <AppText color="dangerText" variant="bodySmall">{erroMapa}</AppText>
            </View>
          ) : undefined}
          ListEmptyComponent={carregandoMapa ? <FeedbackState kind="loading" title="Buscando no mapa…" /> :
            erroMapa ? <FeedbackState kind="error" title="Resultados indisponíveis" description={erroMapa} onRetry={atualizar} /> :
            <View style={{ gap: spacing.sm }}>
              <FeedbackState kind="empty" icon="search-outline" title="Nenhum resultado encontrado" description="Experimente outra busca ou selecione outra camada do mapa." />
              {busca || categoria ? <Button variant="outline" fullWidth style={{ borderRadius: radius.control }} onPress={limparFiltros}>Limpar filtros</Button> : null}
            </View>}
          renderItem={({ item: entry }) => entry.kind === 'agent'
            ? <AgentResult agente={entry.item} onPress={() => abrirAgente(entry.item)} />
            : <EventResult event={entry.item} concluded={isEventConcluded(entry.item.data, today)} onPress={() => abrirEvento(entry.item.id)} />}
        />
      )}

      <AgentProfileCard
        agente={agenteSelecionado}
        visible={Boolean(agenteSelecionado)}
        onClose={() => setSelecionado(null)}
        onAgendar={() => Alert.alert('Agendamento indisponível', 'O agendamento direto ainda não está disponível. Use a conversa para combinar um projeto.')}
        onChat={abrirChat}
        chatLoading={conectando}
        chatLabel={user ? 'Conversar' : 'Entrar para conversar'}
        canChat={!(user?.tipo === 'AGENTE' && user.id === agenteSelecionado?.id)}
        onVerPerfil={(agente) => {
          setSelecionado(null);
          navigation.navigate('PublicProfile', { profileType: 'AGENTE', profileId: agente.id });
        }}
      />
    </ScreenContainer>
  );
}

function EventResult({ event, concluded, onPress }: { event: Evento; concluded: boolean; onPress: () => void }) {
  const { color, spacing, dimensions } = useThemeTokens();
  const date = event.data ? dateFormat.format(eventDate(event.data)) : '';
  const details = [date, event.local, event.cidade].filter(Boolean).join(' · ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Evento${concluded ? ' concluído' : ''}: ${event.titulo}. ${details}`} onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md,
        minHeight: dimensions.control.large, borderBottomWidth: 1, borderBottomColor: color.border,
        backgroundColor: pressed ? color.surfaceSubtle : 'transparent' })}>
      <Ionicons name="calendar-outline" size={dimensions.icon.large} color={color.accentText} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <AppText variant="label" color="accentText" weight="bold">{concluded ? 'Evento concluído' : 'Evento'} · {event.categoria}</AppText>
        <AppText variant="title" weight="bold">{event.titulo}</AppText>
        <AppText variant="bodySmall" color="textSecondary">{details}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={dimensions.icon.medium} color={color.textSecondary} />
    </Pressable>
  );
}

function AgentResult({ agente, onPress }: { agente: AgenteCriativo; onPress: () => void }) {
  const { color, spacing, radius, dimensions } = useThemeTokens();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir perfil de ${agente.nome}`} onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xs, minHeight: dimensions.control.large, backgroundColor: pressed ? color.surfaceSubtle : 'transparent', borderBottomWidth: 1, borderBottomColor: color.border })}>
      <Avatar uri={agente.avatarUrl} style={{ width: 72, height: 72, borderRadius: radius.control }} iconSize={28} />
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <AppText variant="label" color="accentText" weight="bold">{categoryLabel(agente.categoria)}</AppText>
        <AppText variant="title" weight="bold">{agente.nome}</AppText>
        <AppText variant="bodySmall" color="textSecondary">{agente.especialidades[0]} · {agente.cidade}</AppText>
        <AppText variant="label" color={agente.avaliacao > 0 ? 'accentText' : 'textSecondary'} weight="semibold">{agente.avaliacao > 0 ? `★ ${agente.avaliacao.toFixed(1)}` : 'Sem avaliações'}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={dimensions.icon.medium} color={color.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryStrip: { flexGrow: 0, flexShrink: 0 },
  mapFrame: { flex: 1, minHeight: 0, overflow: 'hidden', borderWidth: 1 },
  mapNotice: { position: 'absolute', bottom: 12, left: 12, right: 12 },
});
