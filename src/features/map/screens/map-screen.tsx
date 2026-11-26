import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { AppText, Avatar, Button, FeedbackState, FilterChip, IconButton, ScreenContainer } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useChat } from '@/providers/chat-provider';
import { useUser } from '@/providers/user-provider';
import { agents } from '@/services/api';
import { AgentProfileCard } from '@/features/agents/components/agent-profile-card';
import type { AgenteCriativo } from '@/features/agents/types/agent';
import { mapAgent, matchesAgent, MAP_CATEGORIES, categoryLabel } from '../utils/map-agents';

const REGIAO_INICIAL: Region = {
  latitude: -23.96,
  longitude: -46.34,
  latitudeDelta: 0.45,
  longitudeDelta: 0.45,
};

export function MapScreen() {
  const navigation = useNavigation<any>();
  const { color, spacing, radius, dimensions, typography, elevation } = useThemeTokens();
  const { user } = useUser();
  const { startConversation } = useChat();
  const mapRef = useRef<MapView>(null);
  const lastRegion = useRef(REGIAO_INICIAL);
  const [initialRegion, setInitialRegion] = useState(REGIAO_INICIAL);
  const requestVersion = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState<'map' | 'list'>('map');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [agentes, setAgentes] = useState<AgenteCriativo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [conectando, setConectando] = useState(false);
  const chatPending = useRef(false);

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

  useFocusEffect(useCallback(() => {
    void carregarAgentes();
    return () => { requestVersion.current += 1; };
  }, [carregarAgentes]));

  const filtrados = useMemo(() => agentes.filter((agente) => matchesAgent(agente, busca, categoria)), [agentes, busca, categoria]);
  const resultados = useMemo(() => [...filtrados].sort((a, b) => b.avaliacao - a.avaliacao || a.nome.localeCompare(b.nome, 'pt-BR')), [filtrados]);
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
    const pontos = filtrados.map(({ latitude, longitude }) => ({ latitude, longitude }));
    if (!pontos.length) {
      mapRef.current.animateToRegion(REGIAO_INICIAL, 250);
    } else if (pontos.every((p) => p.latitude === pontos[0].latitude && p.longitude === pontos[0].longitude)) {
      mapRef.current.animateToRegion({ ...pontos[0], latitudeDelta: 0.05, longitudeDelta: 0.05 }, 250);
    } else {
      mapRef.current.fitToCoordinates(pontos, { edgePadding: { top: 48, right: 48, bottom: 72, left: 48 }, animated: true });
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

  return (
    <ScreenContainer edges={user ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm }}>
        <View style={styles.brandRow}>
          <View style={{ width: 3, alignSelf: 'stretch', borderRadius: radius.xs, backgroundColor: color.accent }} />
          <View style={styles.flex}>
            <AppText variant="label" color="accentText" weight="bold">ARTHERE / TERRITÓRIO CRIATIVO</AppText>
            <AppText variant="h2" weight="heavy" accessibilityRole="header" style={{ letterSpacing: typography.tracking.tight }}>Explore a cena.</AppText>
          </View>
          {user ? <IconButton icon="settings-outline" variant="outline" accessibilityLabel="Abrir configurações" onPress={() => navigation.navigate('Settings')} /> : null}
        </View>
        {!user ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" size="small" style={{ flex: 1, borderRadius: radius.control }} onPress={() => navigation.navigate('Login')}>Entrar</Button>
            <Button size="small" style={{ flex: 1, borderRadius: radius.control }} onPress={() => navigation.navigate('Register')}>Criar perfil</Button>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.md, minHeight: dimensions.control.medium, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, borderRadius: radius.control }}>
          <Ionicons name="search-outline" size={dimensions.icon.medium} color={color.accentText} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Nome, cidade ou área criativa"
            placeholderTextColor={color.textSecondary}
            accessibilityLabel="Buscar profissionais criativos"
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            autoComplete="off"
            autoCorrect={false}
            style={{ flex: 1, minWidth: 0, paddingVertical: spacing.sm, paddingRight: spacing.sm, color: color.textPrimary, fontSize: typography.size.body }}
          />
          {busca.length > 0 ? <IconButton icon="close" variant="ghost" accessibilityLabel="Limpar busca" onPress={() => setBusca('')} /> : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.categoryStrip} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs }}>
        <FilterChip variant="compact" label="Todos" selected={!categoria} onPress={() => setCategoria(null)} />
        {categories.map(([id, item]) => (
          <FilterChip key={id} variant="compact" label={item.label} selected={categoria === id} onPress={() => setCategoria((current) => current === id ? null : id)} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
        <AppText variant="bodySmall" weight="semibold" style={{ flex: 1, minWidth: 92 }} accessibilityLiveRegion="polite">
          {carregando && !agentes.length ? 'Buscando…' : erro && !agentes.length ? 'Não foi possível carregar' : `${filtrados.length} ${filtrados.length === 1 ? 'profissional' : 'profissionais'}`}
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
            initialRegion={initialRegion}
            onMapReady={() => setMapReady(true)}
            onRegionChangeComplete={(region) => { lastRegion.current = region; }}
            scrollEnabled
            zoomEnabled
            pitchEnabled={false}
          >
            {filtrados.map((agente) => (
              <Marker
                key={agente.id}
                identifier={agente.id}
                coordinate={{ latitude: agente.latitude, longitude: agente.longitude }}
                title={agente.nome}
                description={agente.especialidades[0]}
                pinColor={color.accent}
                onPress={() => abrirAgente(agente)}
              />
            ))}
          </MapView>
          <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: color.surface, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, ...elevation.low }}>
            <View>
              <IconButton icon="scan-outline" accessibilityLabel={filtrados.length ? 'Enquadrar profissionais no mapa' : 'Voltar à região inicial'} variant="ghost" disabled={!mapReady} onPress={enquadrar} />
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: color.border }}>
              <IconButton icon="refresh-outline" accessibilityLabel="Atualizar profissionais" variant="ghost" loading={carregando} onPress={() => void carregarAgentes()} />
            </View>
          </View>
          {carregando && !agentes.length ? (
            <View pointerEvents="none" style={[styles.mapNotice, { backgroundColor: color.surface, padding: spacing.md, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, gap: spacing.sm }]}>
              <ActivityIndicator color={color.accentText} />
              <AppText variant="bodySmall">Buscando profissionais…</AppText>
            </View>
          ) : null}
          {erro ? (
            <View style={[styles.mapNotice, { backgroundColor: color.surface, padding: spacing.md, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, gap: spacing.sm }]}>
              <AppText color="dangerText" variant="bodySmall">{erro}</AppText>
              <Button variant="outline" size="small" style={{ borderRadius: radius.control }} onPress={() => void carregarAgentes()}>Tentar novamente</Button>
            </View>
          ) : !carregando && !filtrados.length ? (
            <View style={[styles.mapNotice, { backgroundColor: color.surface, padding: spacing.md, borderRadius: radius.control, borderWidth: 1, borderColor: color.border, gap: spacing.sm }]}>
              <AppText weight="semibold">Nenhum profissional encontrado</AppText>
              <AppText variant="bodySmall" color="textSecondary">{busca || categoria ? 'Experimente outros filtros.' : 'Ainda não há profissionais disponíveis no mapa.'}</AppText>
              {busca || categoria ? <Button variant="outline" size="small" style={{ borderRadius: radius.control }} onPress={limparFiltros}>Limpar filtros</Button> : null}
            </View>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id}
          refreshing={carregando}
          onRefresh={() => void carregarAgentes()}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 }}
          ListHeaderComponent={resultados.length ? (
            <View style={{ paddingVertical: spacing.sm, gap: spacing.xs }}>
              <AppText variant="label" color="textSecondary" weight="medium">Ordenados por avaliação</AppText>
              {erro ? <AppText color="dangerText" variant="bodySmall">{erro}</AppText> : null}
            </View>
          ) : undefined}
          ListEmptyComponent={carregando ? <FeedbackState kind="loading" title="Buscando profissionais…" /> :
            erro ? <FeedbackState kind="error" title="Profissionais indisponíveis" description={erro} onRetry={() => void carregarAgentes()} /> :
            <View style={{ gap: spacing.sm }}>
              <FeedbackState kind="empty" icon="search-outline" title="Nenhum profissional encontrado" description="Experimente outra busca ou remova os filtros." />
              {busca || categoria ? <Button variant="outline" fullWidth style={{ borderRadius: radius.control }} onPress={limparFiltros}>Limpar filtros</Button> : null}
            </View>}
          renderItem={({ item }) => <AgentResult agente={item} onPress={() => abrirAgente(item)} />}
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
