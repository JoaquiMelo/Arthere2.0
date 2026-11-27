import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { useApplications } from '@/providers/applications-provider';
import { useUser } from '@/providers/user-provider';
import { ApiRequestError, listarProjetos, type Projeto } from '@/services/api';
import { AppText, Avatar, Badge, Button, FeedbackState, FilterChip, IconButton, ScreenContainer, ScreenHeader } from '@/shared/components';
import { nomeMunicipio } from '@/shared/config/brazil-location';
import { dimensions, radius, spacing } from '@/shared/theme';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { candidaturaStatus } from '../utils/opportunity-management';

type Remuneracao = 'TODAS' | 'COM_ORCAMENTO' | 'A_COMBINAR';
const PROJETOS_VAZIOS: Projeto[] = [];

function normalizar(valor?: string | null) {
  return (valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

function nomeContratante(projeto: Projeto) {
  return projeto.contratante.empresa?.trim() || projeto.contratante.nomeSocial?.trim() || projeto.contratante.nome.trim();
}

function formatarOrcamento(valor: number | null) {
  if (valor == null) return 'Valor a combinar';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(valor);
}

function formatarData(data?: string | null) {
  if (!data) return null;
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(valor).replace('.', '');
}

export default function OpportunitiesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const tokens = useThemeTokens();
  const consultaAtiva = useRef<symbol | null>(null);
  const { items: candidaturas, loading: verificando, failed: erroCandidaturas, load: carregarCandidaturas, sending, registered, statusByProject, submit } = useApplications();
  const [dados, setDados] = useState<Projeto[] | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [remuneracao, setRemuneracao] = useState<Remuneracao>('TODAS');
  const [somenteMinhaCidade, setSomenteMinhaCidade] = useState(false);
  const projetos = dados ?? PROJETOS_VAZIOS;
  const cidadeUsuario = nomeMunicipio(user?.cidade);
  const filtrarMinhaCidade = somenteMinhaCidade && Boolean(cidadeUsuario);

  const carregar = useCallback(async (porGesto = false) => {
    if (porGesto) setAtualizando(true);
    if (consultaAtiva.current) return;

    const consulta = Symbol();
    consultaAtiva.current = consulta;
    if (!porGesto) setAtualizando(false);
    setErro(false);
    try {
      const lista = await listarProjetos();
      if (!Array.isArray(lista)) throw new Error('Resposta inválida');
      if (consultaAtiva.current === consulta) setDados(lista);
    } catch {
      if (consultaAtiva.current === consulta) setErro(true);
    } finally {
      if (consultaAtiva.current === consulta) {
        consultaAtiva.current = null;
        setAtualizando(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void carregar();
    void carregarCandidaturas();
    return () => { consultaAtiva.current = null; };
  }, [carregar, carregarCandidaturas]));

  const categorias = useMemo(() => {
    const opcoes = new Map<string, string>();
    for (const projeto of projetos) {
      const chave = normalizar(projeto.categoria);
      if (chave && !opcoes.has(chave)) opcoes.set(chave, projeto.categoria.trim());
    }
    return [...opcoes].sort(([, a], [, b]) => a.localeCompare(b, 'pt-BR'));
  }, [projetos]);

  const filtrosAtivos = categoria !== null || remuneracao !== 'TODAS' || filtrarMinhaCidade || busca.trim().length > 0;
  const vazioPorFiltro = filtrosAtivos && projetos.length > 0;

  const projetosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    const cidade = normalizar(cidadeUsuario);
    return projetos.filter((projeto) => {
      if (categoria !== null && normalizar(projeto.categoria) !== categoria) return false;
      if (remuneracao === 'COM_ORCAMENTO' && projeto.orcamento == null) return false;
      if (remuneracao === 'A_COMBINAR' && projeto.orcamento != null) return false;
      if (filtrarMinhaCidade && normalizar(projeto.contratante.cidade) !== cidade) return false;
      if (!termo) return true;
      return [projeto.titulo, projeto.categoria, projeto.descricao, projeto.contratante.nome, projeto.contratante.nomeSocial, projeto.contratante.empresa, projeto.contratante.cidade]
        .some((campo) => normalizar(campo).includes(termo));
    });
  }, [busca, categoria, cidadeUsuario, filtrarMinhaCidade, projetos, remuneracao]);

  const limparFiltros = useCallback(() => {
    setBusca('');
    setCategoria(null);
    setRemuneracao('TODAS');
    setSomenteMinhaCidade(false);
    Keyboard.dismiss();
  }, []);

  const candidatar = async (projeto: Projeto) => {
    if (user?.tipo !== 'AGENTE' || projeto.status !== 'ABERTO') return;

    try {
      await submit(projeto.id);
    } catch (error) {
      Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente em alguns instantes.');
      if (error instanceof ApiRequestError && error.status === 404) void carregar();
    }
  };

  const headerAction = user?.tipo === 'CONTRATANTE_OPORTUNIDADES' ? (
    <View style={styles.headerActions}>
      <IconButton icon="people-outline" accessibilityLabel="Gerenciar vagas e candidaturas" variant="outline" onPress={() => navigation.navigate('ManageOpportunities')} />
      <IconButton icon="add" accessibilityLabel="Criar oportunidade" variant="primary" onPress={() => navigation.navigate('CreateOpportunity')} />
    </View>
  ) : undefined;

  const listHeader = (
    <View>
      <ScreenHeader kicker="TRABALHO E COLABORAÇÃO" title="Oportunidades" description="Descubra projetos da economia criativa e encontre sua próxima colaboração." action={headerAction} style={{ borderBottomWidth: 0 }} />
      <View style={[styles.discovery, { paddingHorizontal: tokens.spacing.xl }]}>
        <View style={[styles.search, { minHeight: tokens.dimensions.control.large, borderColor: tokens.color.border, borderRadius: tokens.radius.control, backgroundColor: tokens.color.surface, paddingLeft: tokens.spacing.lg }]}>
          <Ionicons name="search-outline" size={tokens.dimensions.icon.medium} color={tokens.color.textSecondary} />
          <TextInput
            accessibilityLabel="Buscar oportunidades"
            value={busca}
            onChangeText={setBusca}
            placeholder="Título, categoria, contratante ou cidade"
            placeholderTextColor={tokens.color.textSecondary}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.searchInput, { color: tokens.color.textPrimary, fontSize: tokens.typography.size.body, paddingVertical: tokens.spacing.sm }]}
          />
          {busca ? <IconButton icon="close" accessibilityLabel="Limpar busca" variant="ghost" onPress={() => setBusca('')} /> : null}
        </View>
        <View style={styles.filterHeading}>
          <AppText variant="label" weight="bold">Áreas criativas</AppText>
          {filtrosAtivos ? (
            <Button variant="ghost" size="small" onPress={limparFiltros}>Limpar filtros</Button>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: tokens.spacing.xl, gap: tokens.spacing.sm }} keyboardShouldPersistTaps="handled">
        <FilterChip label="Todas as áreas" selected={categoria === null} onPress={() => setCategoria(null)} />
        {categorias.map(([chave, label]) => (
          <FilterChip key={chave} label={label} selected={categoria === chave} onPress={() => setCategoria(chave)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: tokens.spacing.xl, paddingTop: tokens.spacing.sm, gap: tokens.spacing.sm }} keyboardShouldPersistTaps="handled">
        <FilterChip label="Qualquer valor" selected={remuneracao === 'TODAS'} variant="compact" onPress={() => setRemuneracao('TODAS')} />
        <FilterChip label="Com orçamento" selected={remuneracao === 'COM_ORCAMENTO'} variant="compact" onPress={() => setRemuneracao('COM_ORCAMENTO')} />
        <FilterChip label="A combinar" selected={remuneracao === 'A_COMBINAR'} variant="compact" onPress={() => setRemuneracao('A_COMBINAR')} />
        {cidadeUsuario ? (
          <FilterChip
            label={`Contratante em ${cidadeUsuario}`}
            icon="location-outline"
            selected={filtrarMinhaCidade}
            variant="compact"
            onPress={() => setSomenteMinhaCidade((atual) => !atual)}
          />
        ) : null}
      </ScrollView>

      <View style={[styles.resultSummary, { paddingHorizontal: tokens.spacing.xl, paddingVertical: tokens.spacing.lg }]}>
        <View>
          <AppText variant="title" weight="heavy">Projetos abertos</AppText>
          <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
            {projetosFiltrados.length} {projetosFiltrados.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}
          </AppText>
        </View>
      </View>

      {user?.tipo === 'AGENTE' && erroCandidaturas ? (
        <FeedbackState kind="error" title="Não foi possível verificar suas candidaturas" onRetry={() => void carregarCandidaturas()} />
      ) : null}
      {user?.tipo === 'AGENTE' && !erroCandidaturas && (verificando || candidaturas === null) ? (
        <AppText variant="bodySmall" color="textSecondary" accessibilityLiveRegion="polite" style={{ marginHorizontal: tokens.spacing.xl, marginBottom: tokens.spacing.md }}>
          Verificando suas candidaturas…
        </AppText>
      ) : null}
      {erro && dados !== null ? (
        <View style={[styles.inlineError, { backgroundColor: tokens.color.surfaceSubtle, marginHorizontal: tokens.spacing.xl, borderRadius: tokens.radius.control, padding: tokens.spacing.md }]}>
          <Ionicons name="cloud-offline-outline" size={tokens.dimensions.icon.medium} color={tokens.color.dangerText} />
          <AppText variant="bodySmall" color="dangerText" style={styles.inlineErrorText}>Não foi possível atualizar a lista.</AppText>
          <Button size="small" variant="ghost" onPress={() => void carregar(true)}>Tentar novamente</Button>
        </View>
      ) : null}
    </View>
  );

  if (dados === null && !erro) return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader kicker="TRABALHO E COLABORAÇÃO" title="Oportunidades" description="Buscando projetos criativos para você." action={headerAction} />
      <View style={styles.centerState}><FeedbackState kind="loading" title="Carregando oportunidades" description="Isso pode levar alguns instantes." /></View>
    </ScreenContainer>
  );

  if (dados === null && erro) return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader kicker="TRABALHO E COLABORAÇÃO" title="Oportunidades" description="Projetos e colaborações da economia criativa." action={headerAction} />
      <View style={styles.centerState}>
        <FeedbackState
          kind="error"
          title="Não foi possível carregar"
          description="Verifique sua conexão e tente novamente."
          icon="cloud-offline-outline"
          onRetry={() => void carregar()}
        />
      </View>
    </ScreenContainer>
  );

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <FlatList
        data={projetosFiltrados}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { void carregar(true); void carregarCandidaturas(); }} tintColor={tokens.color.accentText} colors={[tokens.color.accentText]} />}
        contentContainerStyle={projetosFiltrados.length === 0 ? styles.emptyList : { paddingBottom: tokens.spacing['3xl'] }}
        ItemSeparatorComponent={() => <View style={{ height: tokens.spacing.md }} />}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: tokens.spacing.xl, paddingBottom: tokens.spacing['3xl'] }}>
            <FeedbackState
              kind="empty"
              title={vazioPorFiltro ? 'Nenhum projeto com esses filtros' : 'Nenhuma oportunidade aberta'}
              description={vazioPorFiltro ? 'Tente ampliar a busca ou limpar os filtros selecionados.' : 'Novos projetos da comunidade criativa aparecerão aqui.'}
              icon={vazioPorFiltro ? 'search-outline' : 'briefcase-outline'}
            />
            {vazioPorFiltro ? <Button variant="outline" fullWidth onPress={limparFiltros}>Limpar filtros</Button> : null}
          </View>
        }
        renderItem={({ item }) => {
          const data = formatarData(item.dataEvento);
          const status = statusByProject.get(item.id);
          const candidatura = status ? candidaturaStatus[status] : null;
          const contratante = nomeContratante(item);
          const cidadeContratante = nomeMunicipio(item.contratante.cidade);
          const orcamento = formatarOrcamento(item.orcamento);
          const resumoAcessivel = [
            item.titulo,
            item.categoria,
            contratante,
            cidadeContratante && `Contratante em ${cidadeContratante}`,
            orcamento,
            data && `Data prevista: ${data}`,
          ].filter(Boolean).join('. ');
          return (
            <View style={[styles.card, { marginHorizontal: tokens.spacing.xl, padding: tokens.spacing.lg, gap: tokens.spacing.md, borderColor: tokens.color.border, borderRadius: tokens.radius.cardCompact, backgroundColor: tokens.color.surface }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={resumoAcessivel}
                accessibilityHint="Abre os detalhes da oportunidade"
                onPress={() => navigation.navigate('OpportunityDetails', { opportunityId: item.id })}
                style={({ pressed }) => ({ gap: tokens.spacing.md, opacity: pressed ? 0.78 : 1 })}
              >
                <View style={styles.cardTop}>
                  <AppText variant="overline" color="accentText" weight="black" style={styles.category}>{item.categoria}</AppText>
                  <View style={[styles.openIcon, { backgroundColor: tokens.color.surfaceSubtle, borderRadius: tokens.radius.sm }]}><Ionicons name="arrow-forward" size={tokens.dimensions.icon.small} color={tokens.color.accentText} /></View>
                </View>
                <View style={{ gap: tokens.spacing.sm }}>
                  <AppText variant="h3" weight="heavy" numberOfLines={3}>{item.titulo}</AppText>
                  <AppText color="textSecondary" numberOfLines={3}>{item.descricao}</AppText>
                </View>
                <View style={[styles.contractorRow, { paddingTop: tokens.spacing.md, borderTopColor: tokens.color.border }]}>
                  <Avatar uri={item.contratante.avatarUrl} style={styles.avatar} iconSize={tokens.dimensions.icon.medium} />
                  <View style={styles.contractorCopy}>
                    <AppText variant="bodySmall" weight="semibold">{contratante}</AppText>
                    {cidadeContratante ? (
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={tokens.dimensions.icon.small} color={tokens.color.textSecondary} />
                        <AppText variant="caption" color="textSecondary" style={styles.metaText}>Contratante em {cidadeContratante}</AppText>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.projectMeta}>
                  <View style={styles.metaBlock}>
                    <AppText variant="overline" color="textSecondary" weight="bold">REMUNERAÇÃO</AppText>
                    <AppText variant="bodySmall" weight="bold">{orcamento}</AppText>
                  </View>
                  {data ? <View style={styles.metaBlock}><AppText variant="overline" color="textSecondary" weight="bold">DATA PREVISTA</AppText><AppText variant="bodySmall" weight="bold">{data}</AppText></View> : null}
                </View>
              </Pressable>
              {user?.tipo === 'AGENTE' && (candidatura || registered.has(item.id)) ? (
                <View accessibilityLiveRegion="polite">
                  <Badge label={candidatura ? `Candidatura · ${candidatura.label}` : 'Candidatura registrada'} tone={candidatura?.tone ?? 'success'} />
                </View>
              ) : user?.tipo === 'AGENTE' && item.status === 'ABERTO' && candidaturas !== null && !verificando && !erroCandidaturas ? (
                <Button fullWidth loading={sending.has(item.id)} accessibilityLabel={`Candidatar-se à oportunidade ${item.titulo}`}
                  onPress={() => void candidatar(item)}>Candidatar-me</Button>
              ) : null}
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerState: { flex: 1, justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  discovery: { gap: spacing.lg, paddingBottom: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: spacing.md },
  filterHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  resultSummary: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  inlineError: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  inlineErrorText: { flex: 1 },
  emptyList: { flexGrow: 1 },
  card: { borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  category: { flex: 1, textTransform: 'uppercase' },
  openIcon: { width: dimensions.icon.extraLarge, height: dimensions.icon.extraLarge, alignItems: 'center', justifyContent: 'center' },
  contractorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderTopWidth: 1 },
  avatar: { width: dimensions.touchTarget, height: dimensions.touchTarget, borderRadius: radius.pill },
  contractorCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { flexShrink: 1 },
  projectMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  metaBlock: { flexGrow: 1, flexBasis: '45%', gap: spacing.xxs },
});
