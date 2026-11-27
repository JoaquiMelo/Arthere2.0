import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser } from '@/providers/user-provider';
import { candidatarProjeto, listarProjetos, type Projeto } from '@/services/api';
import { AppText, Avatar, Button, FeedbackState, FilterChip, IconButton, ScreenContainer, ScreenHeader } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

type Remuneracao = 'TODAS' | 'COM_ORCAMENTO' | 'A_COMBINAR';
const TODAS_CATEGORIAS = 'Todas';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Opportunities'>>();
  const { user } = useUser();
  const tokens = useThemeTokens();
  const requestId = useRef(0);
  const carregouAoMenosUmaVez = useRef(false);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState(TODAS_CATEGORIAS);
  const [remuneracao, setRemuneracao] = useState<Remuneracao>('TODAS');
  const [somenteMinhaCidade, setSomenteMinhaCidade] = useState(false);
  const [candidatando, setCandidatando] = useState<Set<string>>(() => new Set());
  const [candidaturasEnviadas, setCandidaturasEnviadas] = useState<Set<string>>(() => new Set());

  const carregar = useCallback(async (modo: 'inicial' | 'atualizar' = 'inicial') => {
    const currentRequest = ++requestId.current;
    if (modo === 'atualizar') setAtualizando(true);
    else if (!carregouAoMenosUmaVez.current) setCarregando(true);
    setErro(null);
    try {
      const lista = await listarProjetos();
      if (currentRequest === requestId.current) setProjetos(lista);
    } catch (error) {
      if (currentRequest === requestId.current) setErro(error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.');
    } finally {
      if (currentRequest === requestId.current) {
        carregouAoMenosUmaVez.current = true;
        setCarregando(false);
        setAtualizando(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void carregar();
    return () => { requestId.current += 1; };
  }, [carregar]));

  const categorias = useMemo(() => [
    TODAS_CATEGORIAS,
    ...Array.from(new Set(projetos.map((item) => item.categoria.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
  ], [projetos]);

  const filtrosAtivos = categoria !== TODAS_CATEGORIAS || remuneracao !== 'TODAS' || somenteMinhaCidade || busca.trim().length > 0;

  const projetosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    const cidadeUsuario = normalizar(user?.cidade);
    return projetos.filter((projeto) => {
      if (categoria !== TODAS_CATEGORIAS && projeto.categoria !== categoria) return false;
      if (remuneracao === 'COM_ORCAMENTO' && projeto.orcamento == null) return false;
      if (remuneracao === 'A_COMBINAR' && projeto.orcamento != null) return false;
      if (somenteMinhaCidade && normalizar(projeto.contratante.cidade) !== cidadeUsuario) return false;
      if (!termo) return true;
      return [projeto.titulo, projeto.categoria, projeto.descricao, projeto.contratante.nome, projeto.contratante.nomeSocial, projeto.contratante.empresa, projeto.contratante.cidade]
        .some((campo) => normalizar(campo).includes(termo));
    });
  }, [busca, categoria, projetos, remuneracao, somenteMinhaCidade, user?.cidade]);

  const limparFiltros = useCallback(() => {
    setBusca('');
    setCategoria(TODAS_CATEGORIAS);
    setRemuneracao('TODAS');
    setSomenteMinhaCidade(false);
    Keyboard.dismiss();
  }, []);

  const candidatar = useCallback(async (projeto: Projeto) => {
    if (!user) {
      Alert.alert('Entre para se candidatar', 'Faça login como agente criativo para enviar sua candidatura.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Entrar', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (user.tipo !== 'AGENTE' || candidatando.has(projeto.id) || candidaturasEnviadas.has(projeto.id)) return;
    setCandidatando((atuais) => new Set(atuais).add(projeto.id));
    try {
      await candidatarProjeto(projeto.id);
      setCandidaturasEnviadas((atuais) => new Set(atuais).add(projeto.id));
      Alert.alert('Candidatura enviada', 'O contratante poderá analisar seu perfil.');
    } catch (error) {
      Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente em alguns instantes.');
    } finally {
      setCandidatando((atuais) => {
        const proximas = new Set(atuais);
        proximas.delete(projeto.id);
        return proximas;
      });
    }
  }, [candidatando, candidaturasEnviadas, navigation, user]);

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
            placeholder="Título, categoria ou contratante"
            placeholderTextColor={tokens.color.textSecondary}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            style={[styles.searchInput, { color: tokens.color.textPrimary, fontSize: tokens.typography.size.body, paddingVertical: tokens.spacing.sm }]}
          />
          {busca ? <IconButton icon="close" accessibilityLabel="Limpar busca" variant="ghost" onPress={() => setBusca('')} /> : null}
        </View>
        <View style={styles.filterHeading}>
          <AppText variant="label" weight="bold">Áreas criativas</AppText>
          {filtrosAtivos ? (
            <Pressable accessibilityRole="button" onPress={limparFiltros} hitSlop={8}>
              <AppText variant="label" color="accentText" weight="bold">Limpar filtros</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: tokens.spacing.xl, gap: tokens.spacing.sm }} keyboardShouldPersistTaps="handled">
        {categorias.map((item) => <FilterChip key={item} label={item} selected={categoria === item} onPress={() => setCategoria(item)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: tokens.spacing.xl, paddingTop: tokens.spacing.sm, gap: tokens.spacing.sm }} keyboardShouldPersistTaps="handled">
        <FilterChip label="Qualquer valor" selected={remuneracao === 'TODAS'} variant="compact" onPress={() => setRemuneracao('TODAS')} />
        <FilterChip label="Com orçamento" selected={remuneracao === 'COM_ORCAMENTO'} variant="compact" onPress={() => setRemuneracao('COM_ORCAMENTO')} />
        <FilterChip label="A combinar" selected={remuneracao === 'A_COMBINAR'} variant="compact" onPress={() => setRemuneracao('A_COMBINAR')} />
        {user?.cidade ? <FilterChip label={`Em ${user.cidade}`} icon="location-outline" selected={somenteMinhaCidade} variant="compact" onPress={() => setSomenteMinhaCidade((atual) => !atual)} /> : null}
      </ScrollView>

      <View style={[styles.resultSummary, { paddingHorizontal: tokens.spacing.xl, paddingVertical: tokens.spacing.lg }]}>
        <View>
          <AppText variant="title" weight="heavy">Projetos abertos</AppText>
          <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
            {projetosFiltrados.length} {projetosFiltrados.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}
          </AppText>
        </View>
      </View>

      {erro && projetos.length > 0 ? (
        <View style={[styles.inlineError, { backgroundColor: tokens.color.surfaceSubtle, marginHorizontal: tokens.spacing.xl, borderRadius: tokens.radius.control, padding: tokens.spacing.md }]}>
          <Ionicons name="cloud-offline-outline" size={tokens.dimensions.icon.medium} color={tokens.color.dangerText} />
          <AppText variant="bodySmall" color="dangerText" style={styles.inlineErrorText}>Não foi possível atualizar a lista.</AppText>
          <Button size="small" variant="ghost" onPress={() => void carregar('atualizar')}>Tentar novamente</Button>
        </View>
      ) : null}
    </View>
  );

  if (carregando && projetos.length === 0) return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader kicker="TRABALHO E COLABORAÇÃO" title="Oportunidades" description="Buscando projetos criativos para você." action={headerAction} />
      <View style={styles.centerState}><FeedbackState kind="loading" title="Carregando oportunidades" description="Isso pode levar alguns instantes." /></View>
    </ScreenContainer>
  );

  if (erro && projetos.length === 0) return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScreenHeader kicker="TRABALHO E COLABORAÇÃO" title="Oportunidades" description="Projetos e colaborações da economia criativa." action={headerAction} />
      <View style={styles.centerState}><FeedbackState kind="error" title="Não foi possível carregar" description={erro} icon="cloud-offline-outline" onRetry={() => void carregar()} /></View>
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
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => void carregar('atualizar')} tintColor={tokens.color.accentText} colors={[tokens.color.accentText]} />}
        contentContainerStyle={projetosFiltrados.length === 0 ? styles.emptyList : { paddingBottom: tokens.spacing['3xl'] }}
        ItemSeparatorComponent={() => <View style={{ height: tokens.spacing.md }} />}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: tokens.spacing.xl, paddingBottom: tokens.spacing['3xl'] }}>
            <FeedbackState kind="empty" title={filtrosAtivos ? 'Nenhum projeto com esses filtros' : 'Nenhuma oportunidade aberta'} description={filtrosAtivos ? 'Tente ampliar a busca ou limpar os filtros selecionados.' : 'Novos projetos da comunidade criativa aparecerão aqui.'} icon={filtrosAtivos ? 'search-outline' : 'briefcase-outline'} />
            {filtrosAtivos ? <Button variant="outline" fullWidth onPress={limparFiltros}>Limpar filtros</Button> : null}
          </View>
        }
        renderItem={({ item }) => {
          const data = formatarData(item.dataEvento);
          const enviando = candidatando.has(item.id);
          const enviada = candidaturasEnviadas.has(item.id);
          return (
            <View style={[styles.card, { marginHorizontal: tokens.spacing.xl, padding: tokens.spacing.lg, gap: tokens.spacing.md, borderColor: tokens.color.border, borderRadius: tokens.radius.cardCompact, backgroundColor: tokens.color.surface }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes da oportunidade ${item.titulo}`}
                accessibilityHint="Abre a descrição completa e os dados da oportunidade"
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
                  <Avatar uri={item.contratante.avatarUrl} style={styles.avatar} iconSize={18} />
                  <View style={styles.contractorCopy}>
                    <AppText variant="bodySmall" weight="semibold" numberOfLines={1}>{nomeContratante(item)}</AppText>
                    {item.contratante.cidade ? (
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={tokens.dimensions.icon.small} color={tokens.color.textSecondary} />
                        <AppText variant="caption" color="textSecondary" numberOfLines={1}>Contratante em {item.contratante.cidade}</AppText>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.projectMeta}>
                  <View style={styles.metaBlock}>
                    <AppText variant="overline" color="textSecondary" weight="bold">REMUNERAÇÃO</AppText>
                    <AppText variant="bodySmall" weight="bold">{formatarOrcamento(item.orcamento)}</AppText>
                  </View>
                  {data ? <View style={styles.metaBlock}><AppText variant="overline" color="textSecondary" weight="bold">DATA PREVISTA</AppText><AppText variant="bodySmall" weight="bold">{data}</AppText></View> : null}
                </View>
              </Pressable>
              {user?.tipo === 'AGENTE' ? (
                <Button variant={enviada ? 'outline' : 'primary'} fullWidth loading={enviando} disabled={enviada} accessibilityLabel={enviada ? `Candidatura enviada para ${item.titulo}` : `Candidatar-se à oportunidade ${item.titulo}`} onPress={() => void candidatar(item)}>
                  {enviada ? 'Candidatura enviada' : 'Candidatar-me'}
                </Button>
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
  headerActions: { flexDirection: 'row', gap: 8 },
  discovery: { gap: 16, paddingBottom: 12 },
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 12 },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  resultSummary: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  inlineErrorText: { flex: 1 },
  emptyList: { flexGrow: 1 },
  card: { borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  category: { flex: 1, textTransform: 'uppercase' },
  openIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  contractorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  contractorCopy: { flex: 1, minWidth: 0, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  projectMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaBlock: { flexGrow: 1, flexBasis: 132, gap: 2 },
});
