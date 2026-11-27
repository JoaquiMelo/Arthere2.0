import { AppText, Button, FeedbackState, IconButton, ScreenContainer, SectionHeader } from '@/shared/components';
import { formatarLocalizacao } from '@/shared/config/brazil-location';
import { Avatar, MediaImage } from '@/shared/components/media-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { publicAgent, publicContractor } from '@/services/api';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { ThemeTokens } from '@/shared/theme/tokens';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { PortfolioGallery, type GalleryWork } from '../components/portfolio-gallery';
import { eventDate, eventDayKey } from '@/features/events/utils/event-agenda';

type Route = RouteProp<RootStackParamList, 'PublicProfile'>;
const eventDateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function PublicProfileScreen() {
  const navigation = useNavigation<any>();
  const tokens = useThemeTokens();
  const { color, spacing } = tokens;
  const styles = createStyles(tokens);
  const route = useRoute<Route>();
  const { profileType, profileId } = route.params;
  const [perfil, setPerfil] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const dados = profileType === 'AGENTE'
        ? await publicAgent(profileId)
        : await publicContractor(profileId);
      setPerfil(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar este perfil.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [profileType, profileId]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  if (carregando) {
    return <ScreenContainer style={{ justifyContent: 'center' }}><FeedbackState kind="loading" title="Carregando perfil…" /></ScreenContainer>;
  }

  if (erro || !perfil) {
    return <ScreenContainer style={{ justifyContent: 'center', paddingHorizontal: spacing.xl }}>
      <FeedbackState kind="error" icon="person-circle-outline" title="Perfil indisponível" description={erro || 'Este perfil não foi encontrado.'} onRetry={() => { setCarregando(true); void carregar(); }} />
      <Button variant="ghost" onPress={() => navigation.goBack()}>Voltar</Button>
    </ScreenContainer>;
  }

  const agente = profileType === 'AGENTE';
  const contratanteEventos = !agente && perfil.usuario?.tipo === 'CONTRATANTE_EVENTOS';
  const contratanteVagas = !agente && perfil.usuario?.tipo === 'CONTRATANTE_OPORTUNIDADES';
  const nome = perfil.nomeSocial || perfil.nome || 'Perfil Arthere';
  const cidade = formatarLocalizacao(perfil.cidade, perfil.estado);
  const portfolio: GalleryWork[] = Array.isArray(perfil.portfolio) ? perfil.portfolio : [];
  const eventos = Array.isArray(perfil.eventos) ? perfil.eventos : [];
  const projetos = Array.isArray(perfil.projetos) ? perfil.projetos : [];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={atualizando} tintColor={color.accentText} colors={[color.accentText]}
          progressBackgroundColor={color.surface} onRefresh={() => { setAtualizando(true); void carregar(); }} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.topBar}>
            <IconButton icon="arrow-back" variant="outline" accessibilityLabel="Voltar" onPress={() => navigation.goBack()} />
            <AppText variant="label" color="accentText" weight="bold">ARTHERE / PERFIL</AppText>
          </View>
          <View style={[styles.agentCover, contratanteVagas && { backgroundColor: color.accentSoft }]}>
            {perfil.bannerUrl ? <MediaImage uri={perfil.bannerUrl} style={styles.agentBanner} /> : null}
            <View style={styles.agentAvatarFrame}>
              <Avatar uri={perfil.avatarUrl} style={styles.agentAvatar} iconSize={36} />
            </View>
          </View>
          <View style={[styles.identity, styles.agentIdentity]}>
            <View style={styles.agentIdentityCopy}>
              <AppText variant="label" color="accentText" weight="semibold" style={styles.centerText}>{agente ? 'Profissional criativo' : contratanteEventos ? 'Contratante de eventos' : contratanteVagas ? 'Contratante de oportunidades' : 'Contratante'}</AppText>
              <AppText variant="h2" weight="heavy" accessibilityRole="header" style={styles.centerText}>{nome}</AppText>
              {contratanteEventos && perfil.empresa ? <AppText weight="semibold" style={styles.centerText}>{perfil.empresa}</AppText> : null}
              <Text style={[styles.subtitle, styles.centerText]}>{agente ? perfil.especialidade || 'Profissional criativo' : perfil.categoria || (contratanteEventos ? 'Organização cultural' : 'Contratante independente')}</Text>
              {!!cidade && <View style={[styles.location, { justifyContent: 'center' }]}><Ionicons name="location-outline" size={14} color={color.accentText} /><Text style={[styles.muted, styles.centerText]}>{cidade}</Text></View>}
            </View>
          </View>
        </View>

        {!!(perfil.bio || perfil.descricao || perfil.pronomes) && (
          <View style={styles.panel}>
            <SectionHeader title="Sobre" />
            {!!perfil.pronomes && <Text style={styles.muted}>{perfil.pronomes}</Text>}
            <Text style={styles.body}>{perfil.bio || perfil.descricao}</Text>
          </View>
        )}

        {agente ? (
          <View style={styles.panel}>
            <View style={styles.sectionHeader}><AppText variant="h3" weight="bold" accessibilityRole="header">Portfólio</AppText><Text style={styles.count}>{portfolio.length} {portfolio.length === 1 ? 'trabalho' : 'trabalhos'}</Text></View>
            {portfolio.length ? <PortfolioGallery works={portfolio} /> : <Text style={styles.muted}>Este perfil ainda não publicou trabalhos no portfólio.</Text>}
            <View style={styles.statRow}><View style={styles.stat}><Text style={styles.statNumber}>{Number(perfil.totalProjetos || 0)}</Text><Text style={styles.statLabel}>PROJETOS</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{Number(perfil.totalAvaliacoes || 0) > 0 ? Number(perfil.notaMedia || 0).toFixed(1) : '—'}</Text><Text style={styles.statLabel}>NOTA MÉDIA</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{Number(perfil.totalAvaliacoes || 0)}</Text><Text style={styles.statLabel}>AVALIAÇÕES</Text></View></View>
          </View>
        ) : (
          <>
            {!contratanteVagas ? <View style={styles.panel}>
              <View style={styles.sectionHeader}><AppText variant="h3" weight="bold" accessibilityRole="header">Eventos publicados</AppText><Text style={styles.count}>{eventos.length}</Text></View>
              {eventos.length ? eventos.map((item: any) => {
                const date = new Date(item.dataEvento);
                return <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Abrir evento ${item.titulo}`} style={{ gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border }} onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}>
                  <MediaImage uri={item.imagemUrl} icon="calendar-outline" style={{ width: '100%', aspectRatio: 16 / 10, borderRadius: tokens.radius.cardCompact }} />
                  <AppText variant="label" color="accentText" weight="bold">{Number.isNaN(date.getTime()) ? 'Data não informada' : eventDateFormat.format(eventDate(eventDayKey(date)))}</AppText>
                  <AppText variant="title" weight="bold">{item.titulo}</AppText>
                  <AppText variant="bodySmall" color="textSecondary">{[item.categoria, item.cidade].filter(Boolean).join(' · ')}</AppText>
                </TouchableOpacity>;
              }) : <Text style={styles.muted}>Nenhum evento publicado.</Text>}
            </View> : null}
            {!contratanteEventos ? <View style={styles.panel}>
              <View style={styles.sectionHeader}><AppText variant="h3" weight="bold" accessibilityRole="header">Oportunidades abertas</AppText><Text style={styles.count}>{projetos.length}</Text></View>
              {projetos.length ? projetos.map((item: any) => <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Abrir oportunidade ${item.titulo}`} style={styles.listItem} onPress={() => navigation.navigate('OpportunityDetails', { opportunityId: item.id })}><View style={[styles.listIcon, { backgroundColor: color.accentSecondary }]}><Ionicons name="briefcase-outline" size={19} color={color.onAccentSecondary} /></View><View style={styles.listCopy}><Text style={styles.itemTitle}>{item.titulo}</Text><Text style={styles.muted}>{item.categoria}{item.orcamento != null ? ' · R$ ' + Number(item.orcamento).toLocaleString('pt-BR') : ''}</Text></View><Ionicons name="chevron-forward" size={18} color={color.textSecondary} /></TouchableOpacity>) : <Text style={styles.muted}>Nenhuma oportunidade aberta.</Text>}
            </View> : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function createStyles({ color, radius, spacing, typography, dimensions }: ThemeTokens) {
  return StyleSheet.create({
    content: { paddingBottom: spacing['3xl'] },
    hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.md },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    agentIdentity: { flexDirection: 'column', alignItems: 'center', gap: spacing.sm },
    agentCover: { width: '100%', aspectRatio: 16 / 9, minHeight: 156, position: 'relative', alignItems: 'center', justifyContent: 'center', borderRadius: radius.cardCompact, backgroundColor: color.accentSecondary, overflow: 'hidden' },
    agentBanner: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: radius.cardCompact },
    agentAvatarFrame: { width: 108, height: 108, borderWidth: 4, borderColor: color.background, backgroundColor: color.background, borderRadius: radius.sheetCompact },
    agentAvatar: { width: 100, height: 100, borderRadius: radius.card },
    agentIdentityCopy: { width: '100%', alignItems: 'center', gap: spacing.xs },
    centerText: { textAlign: 'center' },
    subtitle: { color: color.textPrimary, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
    location: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    muted: { color: color.textSecondary, fontSize: typography.size.bodySmall, lineHeight: typography.lineHeight.bodySmall, flexShrink: 1 },
    panel: { marginHorizontal: spacing.lg, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: color.border, gap: spacing.sm },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
    count: { color: color.accentText, fontSize: typography.size.label, fontWeight: '600' },
    body: { color: color.textPrimary, fontSize: typography.size.body, lineHeight: typography.lineHeight.body },
    statRow: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: color.surfaceSubtle, borderRadius: radius.control, padding: spacing.md, gap: spacing.sm, marginTop: spacing.md },
    stat: { flexGrow: 1, flexBasis: 82, alignItems: 'center', gap: spacing.xs },
    statNumber: { color: color.textPrimary, fontSize: typography.size.h3, fontWeight: '700' },
    statLabel: { color: color.textSecondary, fontSize: typography.size.label, lineHeight: typography.lineHeight.label, textAlign: 'center' },
    listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: dimensions.touchTarget, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border },
    listIcon: { width: 40, height: 40, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
    listCopy: { flex: 1, minWidth: 0 },
    itemTitle: { color: color.textPrimary, fontSize: typography.size.body, lineHeight: typography.lineHeight.body, fontWeight: '700' },
  });
}
