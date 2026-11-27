import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { ReviewFormModal } from '@/features/reviews/components/review-form-modal';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { useApplications } from '@/providers/applications-provider';
import { useManagement } from '@/providers/management-provider';
import { useReviews } from '@/providers/reviews-provider';
import { useUser } from '@/providers/user-provider';
import { ApiRequestError, meusProjetos, updateApplication, updateProject } from '@/services/api';
import { AppText, Avatar, Badge, Button, FeedbackState, FilterChip, ScreenContainer, ScreenHeader, SectionHeader } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { opportunityBudgetLabel, opportunityStatusLabels } from '../utils/opportunity-form';
import { candidaturaStatus, mapVaga, permiteResponder, vagaStatusLabel } from '../utils/opportunity-management';
import type { Candidato, StatusCandidato, StatusVaga, VagaGerenciada } from './types/management';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'ManageOpportunities'>;

async function readJobs() {
  const items = await meusProjetos();
  if (!Array.isArray(items)) throw new Error('Resposta inválida');
  return items.map(mapVaga);
}

function useManagementList<T>(read: () => Promise<T[]>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const request = useRef<symbol | null>(null);
  const load = useCallback(async () => {
    if (request.current) return;
    const id = Symbol();
    request.current = id;
    setLoading(true);
    setFailed(false);
    try {
      const result = await read();
      if (request.current === id) setItems(result);
    } catch {
      if (request.current === id) setFailed(true);
    } finally {
      if (request.current === id) {
        request.current = null;
        setLoading(false);
      }
    }
  }, [read]);
  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current = null; };
  }, [load]));
  return { items, setItems, failed, loading, load, request };
}

function ManagementList<T extends { id: string }>({
  items, renderItem, header, empty, busy = false, query,
}: {
  items: T[]; renderItem: (item: T) => ReactNode; header?: ReactNode; empty: ReactElement; busy?: boolean;
  query: Pick<ReturnType<typeof useManagementList<T>>, 'items' | 'failed' | 'loading' | 'load'>;
}) {
  const { color, dimensions, spacing } = useThemeTokens();
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <>{renderItem(item)}</>}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      contentContainerStyle={{
        flexGrow: 1, alignSelf: 'center', width: '100%', maxWidth: dimensions.contentMaxWidth,
        padding: spacing.xl, paddingBottom: spacing['3xl'],
      }}
      refreshControl={
        <RefreshControl
          enabled={!busy} refreshing={query.loading && query.items !== null}
          onRefresh={() => { if (!busy) void query.load(); }}
          tintColor={color.accentText} colors={[color.accentText]}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: spacing.md, marginBottom: header ? spacing.lg : 0 }}>
          {header}
          {query.failed ? (
            <FeedbackState
              kind="error" title={query.items === null ? 'Não foi possível carregar' : 'Não foi possível atualizar'}
              description={query.items === null ? 'Verifique sua conexão e tente novamente.' : 'Exibindo a última lista carregada.'}
              onRetry={() => { if (!busy) void query.load(); }}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={query.items === null
        ? query.loading ? <FeedbackState kind="loading" title="Carregando…" /> : undefined
        : empty}
    />
  );
}

export default function ManageOpportunitiesScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useUser();
  const contractor = user?.tipo === 'CONTRATANTE_OPORTUNIDADES';
  const agent = user?.tipo === 'AGENTE';
  return (
    <ScreenContainer>
      <ScreenHeader title={agent ? 'Minhas candidaturas' : 'Minhas vagas'} onBack={() => navigation.goBack()} />
      {contractor ? <ContractorJobs key={user.usuarioId} />
        : agent ? <AgentApplications key={user.usuarioId} />
          : <FeedbackState kind="error" title="Acesso indisponível" description="Esta área é reservada a agentes criativos e contratantes de oportunidades." />}
    </ScreenContainer>
  );
}

function ContractorJobs() {
  const navigation = useNavigation<Navigation>();
  const { color, radius, spacing, dimensions } = useThemeTokens();
  const { vagas: sharedJobs, marcarAvaliado } = useManagement();
  const { adicionarAvaliacao } = useReviews();
  const query = useManagementList(readJobs);
  const jobs = query.items ?? [];
  const [filter, setFilter] = useState<'all' | StatusVaga>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [review, setReview] = useState<{ jobId: string; applicant: Candidato } | null>(null);
  const pending = useRef(false);

  const run = async (key: string, operation: () => Promise<void>) => {
    if (pending.current || query.request.current) return;
    pending.current = true;
    setBusy(key);
    try {
      await operation();
    } catch (error) {
      Alert.alert('Não foi possível concluir a ação', error instanceof Error ? error.message : 'Tente novamente.');
      if (error instanceof ApiRequestError && [404, 409].includes(error.status ?? 0)) void query.load();
    } finally {
      pending.current = false;
      setBusy(null);
    }
  };

  const updateJob = (id: string, update: (job: VagaGerenciada) => VagaGerenciada) => {
    query.setItems((current) => current?.map((job) => job.id === id ? update(job) : job) ?? null);
  };

  const respond = (job: VagaGerenciada, applicant: Candidato, status: 'ACEITA' | 'RECUSADA') => {
    if (!permiteResponder(job, applicant, status) || pending.current) return;
    const label = status === 'ACEITA' ? 'Aceitar' : 'Recusar';
    Alert.alert(`${label} candidatura?`, `${applicant.nome} · ${job.titulo}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: label, style: status === 'RECUSADA' ? 'destructive' : 'default',
        onPress: () => void run(applicant.id, async () => {
          await updateApplication(applicant.id, status);
          updateJob(job.id, (current) => ({
            ...current,
            candidatos: current.candidatos.map((item) => item.id === applicant.id ? { ...item, status } : item),
          }));
        }),
      },
    ]);
  };

  const changeJob = (job: VagaGerenciada, start: boolean) => {
    const label = start ? 'Iniciar trabalho' : 'Concluir trabalho';
    Alert.alert(`${label}?`, job.titulo, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: start ? 'Iniciar' : 'Concluir',
        onPress: () => void run(job.id, async () => {
          await updateProject(job.id, { status: start ? 'EM_ANDAMENTO' : 'CONCLUIDO' });
          updateJob(job.id, (current) => ({ ...current, status: start ? 'EM_ANDAMENTO' : 'CONCLUIDA' }));
        }),
      },
    ]);
  };

  const submitReview = async ({ nota, comentario }: { nota: number; comentario: string }) => {
    if (!review) return;
    await run(review.jobId, async () => {
      await adicionarAvaliacao({ agenteId: review.applicant.agenteId, nota, comentario });
      marcarAvaliado(review.jobId);
      updateJob(review.jobId, (job) => ({ ...job, avaliado: true }));
      setReview(null);
      Alert.alert('Avaliação enviada');
    });
  };

  const available = jobs.filter((job) => filter === 'all' || filter === job.status);
  const pendingCount = jobs.filter((job) => job.status === 'ABERTA' || job.status === 'EM_ANDAMENTO')
    .reduce((count, job) => count + job.candidatos.filter((item) => item.status === 'PENDENTE').length, 0);
  const blocked = busy !== null || query.loading;

  return (
    <>
      <ManagementList
        query={query} items={available} busy={busy !== null}
        header={jobs.length ? (
          <>
            <SectionHeader title="Candidaturas recebidas" description={`${pendingCount} aguardando resposta`} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <FilterChip label="Todas" selected={filter === 'all'} onPress={() => setFilter('all')} />
              {(Object.keys(vagaStatusLabel) as StatusVaga[]).map((status) => (
                <FilterChip key={status} label={vagaStatusLabel[status]} selected={filter === status} onPress={() => setFilter(status)} />
              ))}
            </View>
          </>
        ) : undefined}
        empty={jobs.length ? <FeedbackState kind="empty" title="Nenhuma vaga nesse status" />
          : <FeedbackState kind="empty" title="Nenhuma vaga publicada" description="Suas vagas e as candidaturas recebidas aparecerão aqui." icon="briefcase-outline" />}
        renderItem={(job) => {
          const open = expanded === job.id;
          const hired = job.candidatos.find((item) => item.status === 'ACEITA');
          const reviewed = job.avaliado || sharedJobs.some((item) => item.id === job.id && item.avaliado);
          const canStart = job.status === 'ABERTA' && hired;
          const canFinish = job.status === 'EM_ANDAMENTO' && hired;
          const canReview = job.status === 'CONCLUIDA' && hired && !reviewed;
          return (
            <View style={{ backgroundColor: color.surface, borderColor: color.border, borderWidth: 1, borderRadius: radius.cardCompact, padding: spacing.lg, gap: spacing.md }}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${job.titulo}. ${vagaStatusLabel[job.status]}. Candidaturas: ${job.candidatos.length}`} onPress={() => setExpanded(open ? null : job.id)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: dimensions.touchTarget, opacity: pressed ? 0.75 : 1 })}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <AppText variant="label" color="accentText" weight="bold">{job.categoria}</AppText>
                  <AppText variant="title" weight="bold">{job.titulo}</AppText>
                  <AppText variant="bodySmall" color="textSecondary">
                    {job.candidatos.length} {job.candidatos.length === 1 ? 'candidatura' : 'candidaturas'} · {opportunityBudgetLabel(job.orcamento ?? null)}
                  </AppText>
                  <Badge label={vagaStatusLabel[job.status]} tone={job.status === 'ABERTA' ? 'accent' : job.status === 'EM_ANDAMENTO' ? 'warning' : job.status === 'CONCLUIDA' ? 'success' : 'neutral'} />
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={dimensions.icon.medium} color={color.textSecondary} />
              </Pressable>

              <Button variant="outline" size="small" accessibilityLabel={`Editar vaga ${job.titulo}`} disabled={busy !== null}
                onPress={() => navigation.navigate('EditOpportunity', { opportunityId: job.id })}>Editar vaga</Button>

              {open ? (
                <View style={{ gap: spacing.md }}>
                  {hired && (canStart || canFinish || canReview || reviewed) ? (
                    <View style={{ backgroundColor: color.surfaceSubtle, borderRadius: radius.control, padding: spacing.md, gap: spacing.sm }}>
                      <AppText variant="bodySmall" weight="bold">Candidatura aceita · {hired.nome}</AppText>
                      {canStart || canFinish ? (
                        <Button loading={busy === job.id} disabled={blocked} onPress={() => changeJob(job, Boolean(canStart))}>
                          {canStart ? 'Iniciar trabalho' : 'Concluir trabalho'}
                        </Button>
                      ) : null}
                      {canReview ? <Button disabled={blocked} onPress={() => setReview({ jobId: job.id, applicant: hired })}>Avaliar profissional</Button> : null}
                      {reviewed ? <AppText variant="bodySmall" color="successText">Avaliação enviada</AppText> : null}
                    </View>
                  ) : null}
                  <SectionHeader title="Candidaturas" />
                  {job.candidatos.length === 0 ? <AppText variant="bodySmall" color="textSecondary">Nenhuma candidatura recebida.</AppText> : null}
                  {job.candidatos.map((applicant) => (
                    <View key={applicant.id} style={{ gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderColor: color.border }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                          <Avatar uri={applicant.avatarUrl} style={{ width: dimensions.touchTarget, height: dimensions.touchTarget, borderRadius: radius.pill }} iconSize={dimensions.icon.medium} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText weight="bold">{applicant.nome}</AppText>
                          <AppText variant="bodySmall" color="textSecondary">{applicant.especialidade}</AppText>
                          {applicant.avaliacao > 0 ? <AppText variant="bodySmall" color="textSecondary">Nota média {applicant.avaliacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</AppText> : null}
                        </View>
                      </View>
                      <Badge {...candidaturaStatus[applicant.status]} />
                      {applicant.mensagem ? <AppText>{applicant.mensagem}</AppText> : null}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                        <Button size="small" variant="ghost" accessibilityLabel={`Ver perfil de ${applicant.nome}`}
                          onPress={() => navigation.navigate('PublicProfile', { profileId: applicant.agenteId, profileType: 'AGENTE' })}>Ver perfil</Button>
                        {permiteResponder(job, applicant, 'RECUSADA') ? (
                          <Button size="small" variant="outline" disabled={blocked} accessibilityLabel={`Recusar candidatura de ${applicant.nome}`}
                            onPress={() => respond(job, applicant, 'RECUSADA')}>Recusar</Button>
                        ) : null}
                        {permiteResponder(job, applicant, 'ACEITA') ? (
                          <Button size="small" disabled={blocked} accessibilityLabel={`Aceitar candidatura de ${applicant.nome}`}
                            onPress={() => respond(job, applicant, 'ACEITA')}>Aceitar</Button>
                        ) : null}
                      </View>
                      {busy === applicant.id ? <AppText variant="bodySmall" accessibilityLiveRegion="polite">Enviando resposta…</AppText> : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
      />
      {review ? (
        <ReviewFormModal visible agenteNome={review.applicant.nome} busy={busy !== null}
          onClose={() => { if (!pending.current) setReview(null); }} onSubmit={submitReview} />
      ) : null}
    </>
  );
}

function AgentApplications() {
  const navigation = useNavigation<Navigation>();
  const { color, radius, spacing } = useThemeTokens();
  const query = useApplications();
  const { load } = query;
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const applications = query.items ?? [];
  const [filter, setFilter] = useState<'all' | StatusCandidato>('all');
  return (
    <ManagementList
      query={query} items={applications.filter((item) => filter === 'all' || item.status === filter)}
      header={applications.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <FilterChip label="Todas" selected={filter === 'all'} onPress={() => setFilter('all')} />
          {(Object.keys(candidaturaStatus) as StatusCandidato[]).map((status) => (
            <FilterChip key={status} label={candidaturaStatus[status].label} selected={filter === status} onPress={() => setFilter(status)} />
          ))}
        </View>
      ) : undefined}
      empty={applications.length ? <FeedbackState kind="empty" title="Nenhuma candidatura nesse status" />
        : <FeedbackState kind="empty" title="Nenhuma candidatura enviada" description="Aqui você acompanha as respostas às suas candidaturas." icon="paper-plane-outline" />}
      renderItem={({ projeto, status }) => (
        <View style={{ gap: spacing.sm, padding: spacing.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.cardCompact }}>
          <AppText variant="label" color="accentText" weight="bold">{projeto.categoria}</AppText>
          <AppText variant="title" weight="bold">{projeto.titulo}</AppText>
          <Badge {...candidaturaStatus[status]} />
          <AppText variant="bodySmall" color="textSecondary">Vaga: {opportunityStatusLabels[projeto.status] ?? 'Indisponível'}</AppText>
          <Button size="small" variant="outline" accessibilityLabel={`Ver detalhes de ${projeto.titulo}`}
            onPress={() => navigation.navigate('OpportunityDetails', { opportunityId: projeto.id })}>Ver oportunidade</Button>
        </View>
      )}
    />
  );
}
