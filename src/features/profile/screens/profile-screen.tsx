import { AppText, Badge, Button, FeedbackState, IconButton, ScreenContainer, SectionHeader } from '@/shared/components';
import { formatarLocalizacao } from '@/shared/config/brazil-location';
import { Avatar, MediaImage } from '@/shared/components/media-image';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { ThemeTokens } from '@/shared/theme/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
} from 'react-native';

import { ReviewList } from '@/features/reviews/components/review-list';
import { useReviews } from '@/providers/reviews-provider';
import { useManagement } from '@/providers/management-provider';
import { useUser } from '@/providers/user-provider';
import ContratanteProfileScreen from './contratante-profile-screen';

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  titulo?: string;
  descricao?: string;
}

export interface AgentePerfil {
  id: string;
  nome: string;
  especialidade: string;
  bio: string;
  cidade: string;
  avatarUrl: string;
  notaMedia: number;
  totalAvaliacoes: number;
  totalProjetos: number;
  portfolio: PortfolioItem[];
}

export default function ProfileScreen() {
  const { user, refresh: refreshUser } = useUser();
  const { refresh: refreshManagement } = useManagement();

  // Perfil, portfólio e dados do contratante são reconsultados ao voltar para a tela.
  useFocusEffect(
    useCallback(() => {
      void Promise.allSettled([refreshUser(), refreshManagement()]);
    }, [refreshUser, refreshManagement]),
  );

  if (!user) {
    return null;
  }

  if (user.tipo === 'CONTRATANTE_EVENTOS' || user.tipo === 'CONTRATANTE_OPORTUNIDADES') {
    return <ContratanteProfileScreen />;
  }

  return <AgenteProfileScreenContent />;
}

function AgenteProfileScreenContent() {
  const navigation = useNavigation<any>();
  const tokens = useThemeTokens();
  const { color, spacing, radius, dimensions } = tokens;
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { user, refresh: refreshUser } = useUser();
  const { refresh: refreshManagement, solicitacoesEvento, loading: loadingEventos } = useManagement();
  const [atualizando, setAtualizando] = useState(false);
  const { avaliacoesPorAgente, mediaPorAgente, carregarAvaliacoes } = useReviews();
  const agenteId = user?.id;
  const [erroAtualizacao, setErroAtualizacao] = useState(false);
  const recarregar = useCallback(async () => {
    setAtualizando(true);
    try {
      const results = await Promise.allSettled([refreshUser(), refreshManagement(), ...(agenteId ? [carregarAvaliacoes(agenteId)] : [])]);
      setErroAtualizacao(results.some((result) => result.status === 'rejected'));
    } finally {
      setAtualizando(false);
    }
  }, [refreshUser, refreshManagement, agenteId, carregarAvaliacoes]);
  const [abaAtiva, setAbaAtiva] = useState<'portfolio' | 'sobre' | 'avaliacoes' | 'eventos'>('portfolio');

  if (!user) {
    return null;
  }

  const agente: AgentePerfil = {
    id: user.id,
    nome: user.nome || 'Seu nome',
    especialidade: user.especialidade || 'Profissional criativo',
    bio: user.bio || 'Adicione uma apresentação sobre seu trabalho.',
    cidade: user.cidade || '',
    avatarUrl: user.avatarUrl || '',
    notaMedia: Number(user.notaMedia ?? 0),
    totalAvaliacoes: Number(user.totalAvaliacoes ?? 0),
    totalProjetos: Number(user.totalProjetos ?? 0),
    portfolio: Array.isArray(user.portfolio) ? user.portfolio.map((item:any) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      titulo: item.titulo ?? undefined,
      descricao: item.descricao ?? undefined,
    })) : [],
  };
  const avaliacoes = avaliacoesPorAgente(agente.id);
  const media = avaliacoes.length ? mediaPorAgente(agente.id) : agente.notaMedia;
  const totalAvaliacoes = avaliacoes.length || agente.totalAvaliacoes;
  const meusEventos = solicitacoesEvento.filter((item) => item.agenteId === user.id);
  const localizacao = formatarLocalizacao(agente.cidade, user.estado);

  const abrirEdicaoPerfil = () => navigation.navigate('EditProfile', { agente });
  const abrirEdicaoPortfolio = () =>
    navigation.navigate('PortfolioCreation', { portfolio: agente.portfolio });

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={color.accentText} colors={[color.accentText]} />}
      >
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <View style={styles.headerCopy}>
              <AppText variant="label" color="accentText" weight="bold">ARTHERE / MEU PERFIL</AppText>
              <AppText variant="h2" weight="heavy" accessibilityRole="header">Seu espaço criativo.</AppText>
            </View>
            <IconButton icon="settings-outline" variant="outline" accessibilityLabel="Abrir configurações" onPress={() => navigation.navigate('Settings')} />
          </View>
          {user.bannerUrl ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Editar capa do perfil" onPress={abrirEdicaoPerfil} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <MediaImage uri={user.bannerUrl} style={styles.coverImage} />
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Adicionar capa ao perfil" onPress={abrirEdicaoPerfil} style={({ pressed }) => [styles.coverEmpty, { opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name="image-outline" size={dimensions.icon.large} color={color.accentText} />
              <AppText weight="semibold">Adicionar capa</AppText>
              <AppText variant="bodySmall" color="textSecondary">Apresente sua identidade visual.</AppText>
            </Pressable>
          )}
          <View style={styles.identity}>
            <Pressable accessibilityRole="button" accessibilityLabel="Editar foto de perfil" onPress={abrirEdicaoPerfil} style={({ pressed }) => [styles.avatarFrame, { opacity: pressed ? 0.8 : 1 }]}>
              <Avatar uri={agente.avatarUrl} style={styles.avatar} iconSize={36} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera-outline" size={dimensions.icon.small} color={color.onAccent} />
              </View>
            </Pressable>
            <View style={styles.identityCopy}>
              <AppText variant="label" color="accentText" weight="semibold">Agente criativo</AppText>
              <AppText variant="h2" weight="heavy" accessibilityRole="header">{agente.nome}</AppText>
              <AppText variant="bodySmall">{agente.especialidade}</AppText>
              {localizacao ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={dimensions.icon.small} color={color.accentText} />
                  <AppText variant="bodySmall" color="textSecondary" style={styles.flexText}>{localizacao}</AppText>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Projetos', value: agente.totalProjetos },
              { label: 'Avaliações', value: totalAvaliacoes },
              { label: 'Nota média', value: totalAvaliacoes > 0 ? media.toFixed(1) : '—' },
            ].map((stat) => (
              <View key={stat.label} style={styles.stat}>
                <AppText variant="h3" weight="bold">{stat.value}</AppText>
                <AppText variant="label" color="textSecondary" style={styles.centerText}>{stat.label}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <Button style={styles.actionButton} onPress={abrirEdicaoPerfil}>Editar perfil</Button>
            <Button variant="secondary" style={styles.actionButton} onPress={abrirEdicaoPortfolio}>Gerenciar portfólio</Button>
          </View>
          <Button variant="outline" fullWidth style={{ borderRadius: radius.control }} onPress={() => navigation.navigate('PublicProfile', { profileType: 'AGENTE', profileId: agente.id })}>Ver meu perfil público</Button>
          {erroAtualizacao ? (
            <View style={styles.inlineError} accessibilityLiveRegion="polite">
              <AppText variant="bodySmall" color="dangerText">Algumas informações não puderam ser atualizadas.</AppText>
              <Button variant="ghost" size="small" onPress={recarregar} disabled={atualizando}>Tentar novamente</Button>
            </View>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabStrip}>
          {([
            ['portfolio', 'Portfólio'],
            ['sobre', 'Sobre'],
            ['avaliacoes', 'Avaliações'],
            ['eventos', 'Eventos'],
          ] as const).map(([id, label]) => (
            <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: abaAtiva === id }} onPress={() => setAbaAtiva(id)}
              style={({ pressed }) => [styles.tab, abaAtiva === id && styles.tabActive, { opacity: pressed ? 0.75 : 1 }]}>
              <AppText variant="bodySmall" color={abaAtiva === id ? 'accentText' : 'textSecondary'} weight={abaAtiva === id ? 'bold' : 'medium'}>{label}</AppText>
            </Pressable>
          ))}
        </ScrollView>

        {abaAtiva === 'portfolio' ? (
          <View style={styles.section}>
            <SectionHeader title="Seus trabalhos" description={agente.portfolio.length === 1 ? '1 trabalho publicado' : `${agente.portfolio.length} trabalhos publicados`} />
            {agente.portfolio.length === 0 ? (
              <FeedbackState kind="empty" title="Seu portfólio começa aqui" description="Publique seus trabalhos para apresentar o que você cria." icon="images-outline" />
            ) : (
              <View style={styles.gallery}>
                {agente.portfolio.map((item) => (
                  <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Gerenciar trabalho: ${item.titulo || 'Trabalho criativo'}`} onPress={abrirEdicaoPortfolio}
                    style={({ pressed }) => [styles.galleryItem, { opacity: pressed ? 0.8 : 1 }]}>
                    <MediaImage uri={item.imageUrl} style={styles.galleryImage} />
                    <AppText variant="bodySmall" weight="semibold">{item.titulo || 'Trabalho criativo'}</AppText>
                    {item.descricao ? <AppText variant="label" color="textSecondary" numberOfLines={2}>{item.descricao}</AppText> : null}
                  </Pressable>
                ))}
              </View>
            )}
            <Button variant="outline" fullWidth style={{ borderRadius: radius.control }} onPress={abrirEdicaoPortfolio}>Adicionar trabalho</Button>
          </View>
        ) : null}

        {abaAtiva === 'sobre' ? (
          <View style={styles.section}>
            <SectionHeader title="Sobre meu trabalho" />
            <AppText color={user.bio?.trim() ? 'textPrimary' : 'textSecondary'}>{agente.bio}</AppText>
            <Button variant="outline" fullWidth style={{ borderRadius: radius.control }} onPress={abrirEdicaoPerfil}>Editar apresentação</Button>
          </View>
        ) : null}

        {abaAtiva === 'eventos' ? (
          <View style={styles.section}>
            <SectionHeader title="Minhas participações" />
            {meusEventos.length ? meusEventos.map((item) => (
              <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Abrir evento ${item.eventoTitulo}`}
                onPress={() => navigation.navigate('EventDetails', { eventId: item.eventId })}
                style={({ pressed }) => [styles.eventRow, { opacity: pressed ? 0.75 : 1 }]}>
                <View style={styles.eventIcon}><Ionicons name="calendar-outline" size={dimensions.icon.large} color={color.accentText} /></View>
                <View style={styles.eventCopy}>
                  <AppText weight="bold">{item.eventoTitulo}</AppText>
                  <Badge label={item.status === 'ACEITA' ? 'Participação aceita' : item.status === 'RECUSADA' ? 'Solicitação recusada' : 'Aguardando resposta'} tone={item.status === 'ACEITA' ? 'success' : item.status === 'RECUSADA' ? 'danger' : 'warning'} />
                </View>
                <Ionicons name="chevron-forward" size={dimensions.icon.medium} color={color.textSecondary} />
              </Pressable>
            )) : <FeedbackState kind={loadingEventos ? 'loading' : 'empty'} title={loadingEventos ? 'Carregando participações…' : 'Nenhuma participação ainda'} description={loadingEventos ? undefined : 'Você ainda não solicitou participação em eventos.'} icon="calendar-outline" />}
          </View>
        ) : null}

        {abaAtiva === 'avaliacoes' ? (
          <View style={styles.section}>
            <SectionHeader title="O que dizem sobre você" />
            <ReviewList avaliacoes={avaliacoes} editorial />
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles({ color, spacing, radius, dimensions }: ThemeTokens) {
  return StyleSheet.create({
    scrollContent: { paddingBottom: spacing['3xl'] },
    hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.md },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    coverImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.cardCompact },
    coverEmpty: { minHeight: 104, padding: spacing.md, borderRadius: radius.cardCompact, borderWidth: 1, borderColor: color.border, backgroundColor: color.surfaceSubtle, gap: spacing.xs, alignItems: 'flex-start', justifyContent: 'center' },
    identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatarFrame: { width: 88, height: 88, position: 'relative' },
    avatar: { width: 88, height: 88, borderRadius: radius.cardCompact },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: color.accent, borderWidth: 2, borderColor: color.background },
    identityCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    flexText: { flex: 1 },
    centerText: { textAlign: 'center' },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm, borderRadius: radius.control, backgroundColor: color.surfaceSubtle },
    stat: { flexGrow: 1, flexBasis: 76, alignItems: 'center', gap: spacing.xs },
    buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    actionButton: { flexGrow: 1, flexBasis: 138, borderRadius: radius.control },
    inlineError: { gap: spacing.xs, padding: spacing.sm, borderWidth: 1, borderColor: color.border, borderRadius: radius.sm },
    tabStrip: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: color.border },
    tabs: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    tab: { minHeight: dimensions.touchTarget, paddingHorizontal: spacing.sm, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: color.accent },
    section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
    gallery: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.xl },
    galleryItem: { width: '48%', gap: spacing.xs },
    galleryImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.control },
    eventRow: { flexDirection: 'row', alignItems: 'center', minHeight: dimensions.control.large, gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border },
    eventIcon: { width: 44, height: 44, borderRadius: radius.control, backgroundColor: color.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
    eventCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  });
}
