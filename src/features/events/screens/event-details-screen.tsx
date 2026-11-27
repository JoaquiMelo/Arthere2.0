import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, Platform, RefreshControl, ScrollView, Share, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { useManagement } from '@/providers/management-provider';
import { useUser } from '@/providers/user-provider';
import { ApiRequestError, event as getEvent } from '@/services/api';
import { AppText, Badge, Button, FeedbackState, IconButton, ListLoading, MediaImage, ScreenContainer, ScreenHeader, SectionHeader } from '@/shared/components';
import { realImageUri } from '@/shared/config/image-uri';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { Evento } from '../types/event';
import { eventDate, eventPoint, isEventConcluded, mapEvento } from '../utils/event-agenda';
import { useEventDay } from '../hooks/use-event-day';
import { EventPhotoGallery } from '../components/event-photo-gallery';
import type { EventData } from '../utils/event-form';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const participation = {
  PENDENTE: { label: 'Aguardando resposta', tone: 'warning' },
  ACEITA: { label: 'Participação aceita', tone: 'success' },
  RECUSADA: { label: 'Solicitação recusada', tone: 'danger' },
} as const;

function EventFact({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: string }) {
  const { color, dimensions, spacing } = useThemeTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Ionicons name={icon} color={color.accentText} size={dimensions.icon.medium} />
      <AppText style={{ flex: 1 }}>{children}</AppText>
    </View>
  );
}

export default function EventDetailsScreen() {
  const { params: { eventId } } = useRoute<RouteProp<RootStackParamList, 'EventDetails'>>();
  return <EventDetails key={eventId} eventId={eventId} />;
}

function EventDetails({ eventId }: { eventId: string }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'EventDetails'>>();
  const { user } = useUser();
  const { solicitacoesEvento, refreshSolicitacoes, enviarSolicitacaoEvento } = useManagement();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const isAgent = user?.tipo === 'AGENTE';
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [missing, setMissing] = useState(false);
  const [checking, setChecking] = useState(isAgent);
  const [requestError, setRequestError] = useState(false);
  const [sending, setSending] = useState(false);
  const eventRequest = useRef<symbol | null>(null);
  const statusRequest = useRef<symbol | null>(null);
  const sendPending = useRef(false);

  const load = useCallback(async () => {
    if (eventRequest.current) return;
    const id = Symbol();
    eventRequest.current = id;
    setLoading(true);
    setFailed(false);
    setMissing(false);
    try {
      const item: EventData = await getEvent(eventId);
      if (item?.id !== eventId) throw new Error('Resposta inválida');
      if (eventRequest.current === id) {
        setEvento(mapEvento({
          ...item, organizador: item.organizador || item.contratante?.nome,
          contratanteId: item.contratanteId ?? item.contratante?.id,
        }));
      }
    } catch (error) {
      if (eventRequest.current !== id) return;
      if (error instanceof ApiRequestError && error.status === 404) {
        setEvento(null);
        setMissing(true);
      }
      setFailed(true);
    } finally {
      if (eventRequest.current === id) {
        eventRequest.current = null;
        setLoading(false);
      }
    }
  }, [eventId]);

  const loadParticipation = useCallback(async () => {
    if (!isAgent || statusRequest.current) return;
    const id = Symbol();
    statusRequest.current = id;
    setChecking(true);
    setRequestError(false);
    try {
      await refreshSolicitacoes();
    } catch {
      if (statusRequest.current === id) setRequestError(true);
    } finally {
      if (statusRequest.current === id) {
        statusRequest.current = null;
        setChecking(false);
      }
    }
  }, [isAgent, refreshSolicitacoes]);

  useFocusEffect(useCallback(() => {
    void load();
    void loadParticipation();
    return () => { eventRequest.current = null; statusRequest.current = null; };
  }, [load, loadParticipation]));

  const status = solicitacoesEvento.find((item) => item.eventId === eventId && item.agenteId === user?.id)?.status;
  const today = useEventDay();
  const concluded = isEventConcluded(evento?.data ?? '', today);
  const owner = evento?.contratanteId;
  const requestParticipation = () => {
    if (user?.tipo !== 'AGENTE' || !evento || !owner || checking || requestError || sendPending.current || isEventConcluded(evento.data)
      || (status && status !== 'RECUSADA')) return;
    Alert.alert('Solicitar participação?', evento.titulo, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Enviar pedido', onPress: async () => {
        if (sendPending.current) return;
        if (isEventConcluded(evento.data)) {
          Alert.alert('Evento concluído', 'As solicitações de participação estão encerradas.');
          return;
        }
        sendPending.current = true;
        setSending(true);
        try {
          await enviarSolicitacaoEvento({
            eventId, eventoTitulo: evento.titulo, agenteId: user.id, agenteNome: user.nomeSocial || user.nome,
            agenteEspecialidade: user.especialidade || 'Profissional criativo',
            mensagem: 'Olá! Gostaria de participar deste evento como agente criativo.',
          });
        } catch (error) {
          if (error instanceof ApiRequestError && error.status === 409) {
            void load();
            void loadParticipation();
          }
          Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente.');
        } finally {
          sendPending.current = false;
          setSending(false);
        }
      } },
    ]);
  };

  const cover = realImageUri(evento?.imagemUrl);
  const date = evento?.data ? dateFormat.format(eventDate(evento.data)) : 'Data a confirmar';
  const place = [evento?.local, evento?.cidade].filter(Boolean).join(' · ');
  const point = eventPoint(evento);
  const isOwner = user?.tipo === 'CONTRATANTE_EVENTOS' && user.id === owner;
  const shareEvent = async () => {
    if (!evento) return;
    try {
      await Share.share({
        message: [evento.titulo, date, evento.horario, place].filter(Boolean).join(' · '),
      });
    } catch {
      Alert.alert('Não foi possível compartilhar', 'Tente novamente em instantes.');
    }
  };
  return (
    <ScreenContainer>
      <ScreenHeader title="Evento" style={{ paddingVertical: spacing.sm }}
        onBack={() => navigation.goBack()} action={evento && Platform.OS !== 'web' ? (
          <IconButton icon="share-outline" variant="outline" accessibilityLabel="Compartilhar evento" onPress={() => void shareEvent()} />
        ) : undefined} />
      {!evento ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
          {failed ? <FeedbackState kind="error" title={missing ? 'Evento indisponível' : 'Não foi possível carregar o evento'}
            description={missing ? 'A publicação pode ter sido removida.' : 'Verifique sua conexão e tente novamente.'}
            onRetry={missing ? undefined : () => void load()} />
            : <ListLoading label="Carregando evento…" avatar />}
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { void load(); void loadParticipation(); }}
          tintColor={color.accentText} colors={[color.accentText]} />}
          contentContainerStyle={{ width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center', padding: spacing.xl, gap: spacing['2xl'] }}>
          <View style={{ borderRadius: radius.card, overflow: 'hidden' }}>
            <MediaImage uri={cover} icon="calendar-outline" style={{ width: '100%', aspectRatio: 16 / 9 }} />
            {evento.premium || evento.destaque ? (
              <View style={{ position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md,
                flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {evento.premium ? <Badge label="Premium" icon="star-outline" tone="warning" /> : null}
                {evento.destaque ? <Badge label="Destaque" icon="pin-outline" tone="accent" /> : null}
              </View>
            ) : null}
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="h1" weight="heavy" accessibilityRole="header">{evento.titulo}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {evento.categoria ? <Badge label={evento.categoria} tone="accent" /> : null}
              <Badge label={concluded ? 'Concluído' : evento.data ? 'Programado' : 'Data a confirmar'}
                icon={concluded ? 'checkmark-circle-outline' : 'calendar-outline'} />
            </View>
          </View>
          {failed ? <FeedbackState kind="error" title="Não foi possível atualizar" description="Exibindo o último conteúdo carregado." onRetry={() => void load()} /> : null}
          <View style={{ borderBottomWidth: 1, borderColor: color.border, paddingBottom: spacing.lg, gap: spacing.sm }}>
            <EventFact icon="calendar-outline">{date}</EventFact>
            {evento.horario ? <EventFact icon="time-outline">{evento.horario}</EventFact> : null}
            {place ? <EventFact icon="location-outline">{place}</EventFact> : null}
            {point ? <Button variant="outline" onPress={() => {
              const destination = encodeURIComponent(`${point.latitude},${point.longitude}`);
              void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`)
                .catch(() => Alert.alert('Não foi possível abrir as direções', 'Tente novamente ou busque pelo endereço informado.'));
            }}>Como chegar</Button> : null}
          </View>
          {evento.descricao ? <View style={{ gap: spacing.sm }}>
            <SectionHeader title="Sobre o evento" />
            <AppText>{evento.descricao}</AppText>
          </View> : null}
          {owner || evento.organizador ? <View style={{ gap: spacing.sm }}>
            <SectionHeader title="Organização" />
            {evento.organizador ? <AppText weight="semibold">{evento.organizador}</AppText> : null}
            {owner ? <Button variant="outline"
              onPress={() => navigation.navigate('PublicProfile', { profileType: 'CONTRATANTE', profileId: owner })}>Ver perfil da organização</Button> : null}
          </View> : null}
          {isOwner ? (
            <View style={{ gap: spacing.sm }}>
              <SectionHeader title="Gerenciar evento" />
              <Button onPress={() => navigation.navigate('EditEvent', { eventId })}>Editar evento</Button>
              <Button variant="outline" onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}>
                Acessar gestão no perfil
              </Button>
            </View>
          ) : null}
          {concluded ? (
            <View style={{ gap: spacing.md }}>
              {isOwner ? <Button variant="outline" onPress={() => navigation.navigate('EventAlbum', { eventId })}>Adicionar ou editar fotos</Button> : null}
              <EventPhotoGallery eventId={eventId} cover={cover} />
            </View>
          ) : null}
          {concluded ? (
            <View style={{ backgroundColor: color.surfaceSubtle, borderRadius: radius.cardCompact, padding: spacing.lg, gap: spacing.sm }}>
              <AppText variant="bodySmall" color="textSecondary">Solicitações de participação encerradas.</AppText>
              {isAgent && status ? <Badge {...participation[status]} /> : null}
              {isAgent && requestError && !status ? <Button variant="ghost" size="small" onPress={() => void loadParticipation()}>Consultar meu histórico</Button> : null}
            </View>
          ) : isAgent && (status || owner) ? (
            <View style={{ backgroundColor: color.surfaceSubtle, borderRadius: radius.cardCompact, padding: spacing.lg, gap: spacing.sm }} accessibilityLiveRegion="polite">
              <SectionHeader title="Participação" />
              {status ? <Badge {...participation[status]} /> : null}
              {checking ? <AppText variant="bodySmall" color="textSecondary">Consultando sua solicitação…</AppText>
                : requestError ? <FeedbackState kind="error" title="Não foi possível verificar sua solicitação" onRetry={() => void loadParticipation()} />
                  : owner && (!status || status === 'RECUSADA') ? (
                    <Button fullWidth loading={sending} onPress={requestParticipation}>
                      {status === 'RECUSADA' ? 'Solicitar novamente' : 'Solicitar participação'}
                    </Button>
                  ) : null}
            </View>
          ) : null}
          {!concluded && !user && owner ? <Button fullWidth onPress={() => navigation.navigate('Login')}>Entrar para solicitar participação</Button> : null}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
