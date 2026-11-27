import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser } from '@/providers/user-provider';
import { ApiRequestError, candidatarProjeto, project, type Projeto } from '@/services/api';
import { AppText, Avatar, Badge, Button, FeedbackState, ScreenContainer, ScreenHeader, SectionHeader } from '@/shared/components';
import { nomeMunicipio } from '@/shared/config/brazil-location';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { opportunityBudgetLabel, opportunityDateLabel, opportunityStatusLabels } from '../utils/opportunity-form';

export default function OpportunityDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'OpportunityDetails'>>();
  const { params: { opportunityId } } = useRoute<RouteProp<RootStackParamList, 'OpportunityDetails'>>();
  const { user } = useUser();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [loaded, setLoaded] = useState<Projeto | null>(null);
  const [failure, setFailure] = useState<{ id: string; notFound: boolean } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [applied, setApplied] = useState<ReadonlySet<string>>(() => new Set());
  const request = useRef<symbol | null>(null);
  const pendingApplication = useRef(false);
  const confirmed = useRef(new Set<string>());

  const load = useCallback(async (byGesture = false) => {
    if (byGesture) setRefreshing(true);
    if (request.current) return;
    const current = Symbol();
    request.current = current;
    if (!byGesture) setRefreshing(false);
    setFailure(null);
    try {
      const result: Projeto = await project(opportunityId);
      if (result?.id !== opportunityId) throw new Error('Resposta inválida');
      if (request.current === current) setLoaded(result);
    } catch (error) {
      if (request.current !== current) return;
      const notFound = error instanceof ApiRequestError && error.status === 404;
      if (notFound) setLoaded(null);
      setFailure({ id: opportunityId, notFound });
    } finally {
      if (request.current === current) {
        request.current = null;
        setRefreshing(false);
      }
    }
  }, [opportunityId]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current = null; };
  }, [load]));

  const opportunity = loaded?.id === opportunityId ? loaded : null;
  const error = failure?.id === opportunityId ? failure : null;
  const applicationKey = user ? `${user.usuarioId}:${opportunityId}` : '';
  const isOpen = opportunity?.status === 'ABERTO';
  const hasApplied = applied.has(applicationKey);

  const apply = async () => {
    if (user?.tipo !== 'AGENTE' || !isOpen || pendingApplication.current || confirmed.current.has(applicationKey)) return;

    pendingApplication.current = true;
    setSending(applicationKey);
    try {
      await candidatarProjeto(opportunityId);
      confirmed.current.add(applicationKey);
      setApplied(new Set(confirmed.current));
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        confirmed.current.add(applicationKey);
        setApplied(new Set(confirmed.current));
      } else {
        Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente.');
        if (error instanceof ApiRequestError && error.status === 404) void load();
      }
    } finally {
      pendingApplication.current = false;
      setSending(null);
    }
  };

  const back = () => navigation.goBack();
  if (!opportunity) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Oportunidade" onBack={back} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {error ? (
            <FeedbackState
              kind="error"
              title={error.notFound ? 'Oportunidade indisponível' : 'Não foi possível carregar'}
              description={error.notFound ? 'Esta publicação pode ter sido removida.' : 'Verifique sua conexão e tente novamente.'}
              onRetry={error.notFound ? undefined : () => void load()}
            />
          ) : <FeedbackState kind="loading" title="Carregando oportunidade…" />}
        </View>
      </ScreenContainer>
    );
  }

  const { contratante } = opportunity;
  const name = contratante?.empresa?.trim() || contratante?.nomeSocial?.trim() || contratante?.nome?.trim() || 'Contratante';
  const city = nomeMunicipio(contratante?.cidade);
  const date = opportunityDateLabel(opportunity.dataEvento);
  const budget = opportunityBudgetLabel(opportunity.orcamento);
  const status = isOpen ? 'Recebendo candidaturas' : opportunityStatusLabels[opportunity.status] ?? 'Indisponível';

  return (
    <ScreenContainer>
      <ScreenHeader title="Oportunidade" onBack={back} />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={color.accentText} colors={[color.accentText]} />}
        contentContainerStyle={{
          width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center',
          padding: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing['2xl'],
        }}
      >
        <View style={{ gap: spacing.sm }}>
          <AppText variant="overline" color="accentText" weight="bold">{opportunity.categoria}</AppText>
          <AppText variant="h1" weight="heavy" accessibilityRole="header">{opportunity.titulo}</AppText>
          <Badge label={status} tone={isOpen ? 'success' : 'neutral'} />
        </View>

        {error ? (
          <FeedbackState kind="error" title="Não foi possível atualizar" description="Exibindo a última versão carregada." onRetry={() => void load(true)} />
        ) : null}

        <View style={{
          backgroundColor: color.surfaceSubtle, borderRadius: radius.cardCompact,
          padding: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg,
        }}>
          <View style={{ flexGrow: 1, flexBasis: '45%', gap: spacing.xs }}>
            <AppText variant="label" color="textSecondary">Orçamento</AppText>
            <AppText variant="title" weight="bold">{budget}</AppText>
          </View>
          {date ? (
            <View style={{ flexGrow: 1, flexBasis: '45%', gap: spacing.xs }}>
              <AppText variant="label" color="textSecondary">Data prevista do trabalho</AppText>
              <AppText variant="title" weight="bold">{date}</AppText>
            </View>
          ) : null}
        </View>

        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Sobre o trabalho" />
          <AppText>{opportunity.descricao}</AppText>
        </View>

        {contratante ? (
          <View style={{ borderTopWidth: 1, borderTopColor: color.border, paddingTop: spacing.lg, gap: spacing.md }}>
            <SectionHeader title="Publicado por" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Avatar
                  uri={contratante.avatarUrl}
                  style={{ width: dimensions.touchTarget, height: dimensions.touchTarget, borderRadius: radius.pill }}
                  iconSize={dimensions.icon.medium}
                />
              </View>
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <AppText weight="bold">{name}</AppText>
                {city ? <AppText variant="bodySmall" color="textSecondary">Contratante em {city}</AppText> : null}
              </View>
            </View>
            <Button
              variant="outline"
              accessibilityLabel={`Ver perfil público de ${name}`}
              onPress={() => navigation.navigate('PublicProfile', { profileType: 'CONTRATANTE', profileId: contratante.id })}
            >
              Ver perfil público
            </Button>
          </View>
        ) : null}

        {isOpen && user?.tipo === 'AGENTE' ? (
          <View style={{ gap: spacing.sm }}>
            {hasApplied ? (
              <View accessibilityLiveRegion="polite" style={{ gap: spacing.xs }}>
                <Badge label="Candidatura registrada" tone="success" icon="checkmark" />
                <AppText variant="bodySmall" color="textSecondary">O contratante pode analisar sua candidatura.</AppText>
              </View>
            ) : (
              <Button fullWidth loading={sending === applicationKey} onPress={() => void apply()}>Candidatar-me</Button>
            )}
          </View>
        ) : null}
        {isOpen && !user ? (
          <Button fullWidth onPress={() => navigation.navigate('Login')}>Entrar para se candidatar</Button>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
