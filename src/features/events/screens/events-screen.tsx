import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { completedEventCovers, events as listEvents } from '@/services/api';
import { AppText, Badge, Button, FeedbackState, FilterChip, IconButton, MediaImage, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { realImageUri } from '@/shared/config/image-uri';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AgendaCalendar } from '../components/agenda-calendar';
import { useEventDay } from '../hooks/use-event-day';
import type { Evento } from '../types/event';
import { eventDate, eventDayKey, filterEvents, isEventConcluded, mapEvento, monthKey, normalizeEventText, sortEvents } from '../utils/event-agenda';

const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const fullDateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

function EventRow({ event, feature, archived, albumCover, onPress }: {
  event: Evento; feature: boolean; archived: boolean; albumCover?: string; onPress: () => void;
}) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const date = event.data ? eventDate(event.data) : null;
  const place = [event.local, event.cidade].filter(Boolean).join(' · ');
  const when = [date ? dateFormat.format(date) : 'Data a confirmar', event.horario].filter(Boolean).join(' · ');
  const cover = realImageUri(albumCover) || realImageUri(event.imagemUrl);
  const label = [event.titulo, when, event.categoria, place, event.organizador, event.premium ? 'Premium' : '', event.destaque ? 'Destaque' : '']
    .filter(Boolean).join('. ');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityHint={archived ? 'Abre as fotos e os detalhes do evento concluído' : 'Abre os detalhes do evento'}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: color.surface, borderColor: color.border, borderWidth: 1,
        borderRadius: radius.cardCompact, overflow: 'hidden', opacity: pressed ? 0.76 : 1,
      })}>
      {feature && cover ? <MediaImage uri={cover} icon="calendar-outline" style={{ width: '100%', aspectRatio: 16 / 9 }} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg }}>
        {date ? (
          <View style={{ minWidth: dimensions.control.medium, alignItems: 'center', backgroundColor: color.surfaceSubtle, padding: spacing.xs, borderRadius: radius.control }}>
            <AppText variant="h3" weight="heavy" color="accentText">{date.getDate()}</AppText>
            <AppText variant="caption" color="textSecondary" style={{ textTransform: 'uppercase' }}>{monthFormat.format(date).replace('.', '')}</AppText>
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <AppText variant="label" color="accentText" weight="bold">{event.categoria}</AppText>
          <AppText variant={feature ? 'h3' : 'title'} weight="heavy">{event.titulo}</AppText>
          <AppText variant="bodySmall" weight="semibold">{when}</AppText>
          {place ? <AppText variant="bodySmall" color="textSecondary">{place}</AppText> : null}
          {event.organizador ? <AppText variant="caption" color="textSecondary">{event.organizador}</AppText> : null}
          {archived ? <AppText variant="bodySmall" color="accentText" weight="bold">Ver fotos e detalhes</AppText> : null}
          {event.premium || (event.destaque && !feature) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
              {event.premium ? <Badge label="Premium" tone="accent" icon="star-outline" /> : null}
              {event.destaque && !feature ? <Badge label="Destaque" icon="pin-outline" /> : null}
            </View>
          ) : null}
        </View>
        {!feature && cover ? (
          <MediaImage uri={cover} icon="calendar-outline" iconSize={dimensions.icon.medium}
            style={{ width: dimensions.control.large, height: dimensions.control.large, borderRadius: radius.sm }} />
        ) : <Ionicons name="chevron-forward" size={dimensions.icon.small} color={color.textSecondary} />}
      </View>
    </Pressable>
  );
}

export default function EventsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const inTab = navigation.getState().type === 'tab';
  const { color, dimensions, spacing } = useThemeTokens();
  const [events, setEvents] = useState<Evento[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const request = useRef<symbol | null>(null);
  const [mode, setMode] = useState<'calendar' | 'list' | 'completed'>('calendar');
  const [albumCovers, setAlbumCovers] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);
  const [month, setMonth] = useState(() => eventDate(eventDayKey()));
  const [day, setDay] = useState<string | null>(null);
  const today = useEventDay();

  const load = useCallback(async () => {
    if (request.current) return;
    const id = Symbol();
    request.current = id;
    setLoading(true);
    setFailed(false);
    try {
      const result = await listEvents();
      if (!Array.isArray(result)) throw new Error('Resposta inválida');
      if (request.current === id) setEvents(result.map(mapEvento));
    } catch {
      if (request.current === id) setFailed(true);
    } finally {
      if (request.current === id) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current = null; };
  }, [load]));

  const loadCovers = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const covers = await completedEventCovers();
      if (isActive() && Array.isArray(covers)) setAlbumCovers(new Map(covers.map((item) => [item.eventoId, item.capa])));
    } catch {
      // As capas cadastradas continuam disponíveis mesmo se o álbum não carregar.
    }
  }, []);
  useFocusEffect(useCallback(() => {
    if (mode !== 'completed') return;
    let active = true;
    void loadCovers(() => active);
    return () => { active = false; };
  }, [mode, loadCovers]));

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of events ?? []) {
      const key = normalizeEventText(item.categoria);
      if (key && !map.has(key)) map.set(key, item.categoria.trim());
    }
    return [...map].sort(([, a], [, b]) => a.localeCompare(b, 'pt-BR'));
  }, [events]);

  const filtered = useMemo(() => filterEvents(events ?? [], search, category, premium), [events, search, category, premium]);
  const upcoming = useMemo(() => filtered.filter((item) => !isEventConcluded(item.data, today)), [filtered, today]);
  const monthEvents = useMemo(() => upcoming.filter((item) => item.data.slice(0, 7) === monthKey(month)), [upcoming, month]);
  const eventsByDay = useMemo(() => {
    const result = new Map<string, Evento[]>();
    for (const item of monthEvents) {
      const dayEvents = result.get(item.data);
      if (dayEvents) dayEvents.push(item);
      else result.set(item.data, [item]);
    }
    return result;
  }, [monthEvents]);
  const sorted = useMemo(() => sortEvents(upcoming, today), [upcoming, today]);
  const completed = useMemo(() => sortEvents(filtered.filter((item) => isEventConcluded(item.data, today)), today), [filtered, today]);
  const monthResults = monthEvents.filter((item) => !day || item.data === day)
    .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));
  const featured = sorted.filter((item) => item.destaque);
  const regular = sorted.filter((item) => !item.destaque);
  const sections = mode === 'calendar' ? [{
    key: 'calendar', title: day ? fullDateFormat.format(eventDate(day)) : 'Programação do mês', data: monthResults, feature: false,
  }] : mode === 'completed' ? [{ key: 'completed', title: 'Eventos realizados', data: completed, feature: true }] : [
    { key: 'featured', title: 'Destaques', data: featured, feature: true },
    { key: 'regular', title: featured.length ? 'Mais eventos' : 'Programação', data: regular, feature: false },
  ];
  const total = mode === 'calendar' ? monthResults.length : mode === 'completed' ? completed.length : sorted.length;
  const hasFilters = Boolean(search.trim() || category !== null || premium);
  const resetFilters = () => { setSearch(''); setCategory(null); setPremium(false); };
  const eventCount = `${total} ${total === 1 ? 'evento' : 'eventos'}`;
  const emptyTitle = mode === 'completed' ? (hasFilters ? 'Nenhum evento concluído com esses filtros' : 'Nenhum evento concluído')
    : events?.length === 0 ? 'Nenhum evento publicado'
    : mode === 'calendar' && day ? 'Nenhum evento nesta data'
      : mode === 'calendar' ? 'Nenhum evento neste mês' : 'Nenhum evento encontrado';
  const emptyHint = hasFilters ? 'Ajuste os filtros ou pesquise por outro termo.'
    : mode !== 'completed' && events?.length === 0 ? 'Os próximos eventos publicados aparecerão aqui.'
      : mode === 'calendar' ? 'Escolha outra data ou veja a programação na lista.' : undefined;

  return (
    <ScreenContainer edges={inTab ? ['top', 'left', 'right'] : undefined}>
      <SectionList
        sections={sections.filter((section) => section.data.length > 0)}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center', paddingBottom: spacing['3xl'] }}
        refreshControl={<RefreshControl refreshing={loading && events !== null} onRefresh={() => {
          void load();
          if (mode === 'completed') void loadCovers();
        }}
          tintColor={color.accentText} colors={[color.accentText]} />}
        renderSectionHeader={({ section }) => (
          <View style={{ marginHorizontal: spacing.xl, paddingBottom: spacing.sm, paddingTop: spacing.lg }}>
            <SectionHeader title={section.title} />
          </View>
        )}
        renderItem={({ item, section }) => (
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
            <EventRow event={item} feature={section.feature} archived={section.key === 'completed'}
              albumCover={section.key === 'completed' ? albumCovers.get(item.id) : undefined}
              onPress={() => navigation.navigate('EventDetails', { eventId: item.id })} />
          </View>
        )}
        ListHeaderComponent={(
          <>
            <ScreenHeader kicker="BAIXADA SANTISTA" title="Agenda cultural"
              description="Encontre feiras, shows, exposições e oficinas."
              onBack={inTab ? undefined : () => navigation.goBack()} />
            <View style={{ paddingTop: spacing.lg, gap: spacing.md }}>
              <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <FilterChip label="Calendário" icon="calendar-outline" variant="segment" selected={mode === 'calendar'} onPress={() => setMode('calendar')} />
                  <FilterChip label="Lista" icon="list-outline" variant="segment" selected={mode === 'list'} onPress={() => setMode('list')} />
                  <FilterChip label="Concluídos" icon="images-outline" variant="segment" selected={mode === 'completed'} onPress={() => setMode('completed')} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
                  <TextField label="Buscar eventos" value={search} onChangeText={setSearch} placeholder="Nome, cidade, categoria ou local"
                    autoCorrect={false} returnKeyType="search" containerStyle={{ flex: 1, minWidth: 0 }} />
                  {search ? <IconButton icon="close" variant="outline" accessibilityLabel="Limpar busca" onPress={() => setSearch('')} /> : null}
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
                <FilterChip label="Todas as categorias" selected={category === null} onPress={() => setCategory(null)} />
                {categories.map(([key, label]) => (
                  <FilterChip key={key} label={label} selected={category === key} onPress={() => setCategory(key)} />
                ))}
              </ScrollView>
              <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
                  <FilterChip label="Premium" icon="star-outline" variant="compact" selected={premium} onPress={() => setPremium((current) => !current)} />
                  {hasFilters ? <Button variant="ghost" size="small" onPress={resetFilters}>Limpar filtros</Button> : null}
                </View>
              </View>
              {mode === 'calendar' ? (
                <View style={{ marginHorizontal: spacing.xs }}>
                  <AgendaCalendar month={month} today={today} selected={day} eventsByDay={eventsByDay}
                    onMove={(delta) => { setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1)); setDay(null); }}
                    onSelect={(key) => setDay((current) => current === key ? null : key)}
                    onToday={() => { const key = eventDayKey(); setMonth(eventDate(key)); setDay(key); }} />
                </View>
              ) : null}
              <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
                {events !== null ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                    <AppText variant="bodySmall" color="textSecondary" accessibilityLiveRegion="polite">
                      {eventCount}{mode === 'calendar' ? (day ? ' na data selecionada' : ' no mês') : ''}
                    </AppText>
                    {mode === 'calendar' && day ? <Button variant="outline" size="small" onPress={() => setDay(null)}>Ver mês inteiro</Button> : null}
                  </View>
                ) : null}
                {loading && events === null ? <FeedbackState kind="loading" title="Carregando eventos…" /> : null}
                {failed ? <FeedbackState kind="error" title={events === null ? 'Não foi possível carregar a agenda' : 'Não foi possível atualizar a agenda'}
                  description={events === null ? 'Verifique sua conexão e tente novamente.' : 'Exibindo a última programação carregada.'} onRetry={() => void load()} /> : null}
                {total === 0 && events !== null && !failed ? (
                  <FeedbackState kind="empty" title={emptyTitle} description={emptyHint} icon={hasFilters ? 'search-outline' : 'calendar-outline'} />
                ) : null}
              </View>
            </View>
          </>
        )}
      />
    </ScreenContainer>
  );
}
