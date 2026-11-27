import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { BackHandler, RefreshControl, ScrollView, SectionList, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { completedEventCovers, events as listEvents } from '@/services/api';
import { AppText, Button, FeedbackState, FilterChip, IconButton, ListLoading, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { useStatusAnnouncement } from '@/shared/hooks/use-status-announcement';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { AgendaCalendar } from '../components/agenda-calendar';
import { CalendarEventRow } from '../components/calendar-event-row';
import { CalendarYearGrid } from '../components/calendar-year-grid';
import { useEventDay } from '../hooks/use-event-day';
import type { Evento } from '../types/event';
import {
  calendarMonthName, eventCountLabel, eventDate, eventDayKey, filterEvents, groupDatedEvents,
  isEventConcluded, mapEvento, monthKey, normalizeEventText, shiftCalendarMonth, sortEvents,
} from '../utils/event-agenda';

const dayFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const modes = [
  ['calendar', 'Calendário'], ['agenda', 'Agenda'], ['featured', 'Destaques'], ['completed', 'Concluídos'],
] as const;

export default function EventsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const inTab = navigation.getState().type === 'tab';
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [events, setEvents] = useState<Evento[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const request = useRef<symbol | null>(null);
  const [mode, setMode] = useState<typeof modes[number][0]>('calendar');
  const [year, setYear] = useState<number | null>(null);
  const [albumCovers, setAlbumCovers] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [onlyMonth, setOnlyMonth] = useState(false);
  const [day, setDay] = useState<string | null>(() => eventDayKey());
  const [month, setMonth] = useState(() => eventDate(day ?? eventDayKey()));
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
  const inYear = year !== null;
  useFocusEffect(useCallback(() => {
    if (!inYear) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setYear(null);
      return true;
    });
    return () => listener.remove();
  }, [inYear]));

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of events ?? []) {
      const key = normalizeEventText(item.categoria);
      if (key && !map.has(key)) map.set(key, item.categoria.trim());
    }
    return [...map].sort(([, a], [, b]) => a.localeCompare(b, 'pt-BR'));
  }, [events]);

  const filtered = useMemo(() => {
    const place = normalizeEventText(city);
    return sortEvents(filterEvents(events ?? [], search, category, premium).filter((item) =>
      (!featuredOnly || item.destaque) && (!place || normalizeEventText(item.cidade).includes(place))), today);
  }, [events, search, category, city, premium, featuredOnly, today]);
  const upcoming = useMemo(() => filtered.filter((item) => !isEventConcluded(item.data, today)), [filtered, today]);
  const byMonth = useMemo(() => groupDatedEvents(filtered, (item) => item.data.slice(0, 7)), [filtered]);
  const selectedMonth = monthKey(month);
  const monthEvents = byMonth.get(selectedMonth);
  const byDay = groupDatedEvents(monthEvents ?? [], (item) => item.data);
  const monthTitle = `${calendarMonthName(month)} ${month.getFullYear()}`;
  const listEventsForMode = mode === 'completed' ? filtered.filter((item) => isEventConcluded(item.data, today))
    : mode === 'featured' ? upcoming.filter((item) => item.destaque) : upcoming;
  const listResults = onlyMonth ? listEventsForMode.filter((item) => item.data.startsWith(selectedMonth)) : listEventsForMode;
  const monthResults = (day ? byDay.get(day) : monthEvents) ?? [];
  const showCovers = !inYear && (mode === 'completed' ||
    (mode === 'calendar' && monthResults.some((item) => isEventConcluded(item.data, today))));
  useFocusEffect(useCallback(() => {
    if (!showCovers) return;
    let active = true;
    void loadCovers(() => active);
    return () => { active = false; };
  }, [showCovers, loadCovers]));

  const sections = inYear ? [] : mode === 'calendar' ? [{ key: 'selected', title: '', data: monthResults }] :
    Array.from(groupDatedEvents(listResults, (item) => item.data.slice(0, 7)), ([key, data]) => ({
      key, title: key ? `${calendarMonthName(eventDate(`${key}-01`))} ${key.slice(0, 4)}` : 'Data a confirmar', data,
    }));
  const total = mode === 'calendar' ? monthResults.length : listResults.length;

  const filterCount = [search.trim(), city.trim(), category, premium, featuredOnly].filter(Boolean).length;
  const resetFilters = () => {
    setSearch('');
    setCity('');
    setCategory(null);
    setPremium(false);
    setFeaturedOnly(false);
    setOnlyMonth(false);
  };

  const selectDay = (key: string) => {
    if (!key.startsWith(selectedMonth)) setMonth(eventDate(key));
    setDay(key);
  };
  const chooseMonth = (date: Date) => {
    setMonth(date);
    setDay(null);
    setMode('calendar');
    setYear(null);
  };
  const selectionLabel = day ? dayFormat.format(eventDate(day)) : monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);
  const countLabel = eventCountLabel(total);
  const activeFiltersLabel = filterCount === 1 ? '1 filtro ativo' : `${filterCount} filtros ativos`;
  useStatusAnnouncement(day && !inYear && mode === 'calendar' && events !== null
    ? `${selectionLabel}. ${countLabel}` : undefined);

  const emptyTitle = mode === 'completed' ? 'Nenhum evento concluído' :
    mode === 'featured' ? 'Nenhum evento em destaque' :
      mode === 'calendar' ? (day ? 'Nenhum evento neste dia' : 'Nenhum evento neste mês') : 'Nenhum evento na agenda';

  return (
    <ScreenContainer edges={inTab ? ['top', 'left', 'right'] : undefined}>
      <SectionList
        sections={sections.filter((section) => section.data.length)}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center', paddingBottom: spacing['3xl'] }}
        refreshControl={<RefreshControl refreshing={loading && events !== null} onRefresh={() => {
          void load();
          if (showCovers) void loadCovers();
        }}
          tintColor={color.accentText} colors={[color.accentText]} />}
        renderSectionHeader={({ section }) => section.title ? (
          <View style={{ marginHorizontal: spacing.lg, paddingBottom: spacing.sm, paddingTop: spacing.lg }}>
            <SectionHeader title={section.title} />
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
            <CalendarEventRow event={item} archived={isEventConcluded(item.data, today)}
              albumCover={isEventConcluded(item.data, today) ? albumCovers.get(item.id) : undefined}
              onPress={() => navigation.navigate('EventDetails', { eventId: item.id })} />
          </View>
        )}
        ListHeaderComponent={(
          <>
            <ScreenHeader title="Calendário"
              style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
              onBack={inYear ? () => setYear(null) : inTab ? undefined : () => navigation.goBack()}
              action={<View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <IconButton icon={inYear ? 'calendar-outline' : 'grid-outline'} variant="outline"
                  accessibilityLabel={inYear ? 'Voltar à programação' : 'Abrir visão anual'}
                  onPress={() => setYear(inYear ? null : month.getFullYear())} />
                <IconButton icon="options-outline" variant={filtersOpen || filterCount || onlyMonth ? 'primary' : 'outline'}
                  accessibilityLabel={filterCount ? `Filtros, ${activeFiltersLabel}` : 'Filtros do calendário'}
                  aria-expanded={filtersOpen} onPress={() => setFiltersOpen((current) => !current)} />
              </View>}
            />
            <View style={{ padding: spacing.lg, paddingBottom: spacing.xs, gap: spacing.md }}>
              {inYear ? null : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {modes.map(([key, label]) => (
                    <FilterChip key={key} label={label} variant="segment" selected={mode === key} onPress={() => setMode(key)} />
                  ))}
                </View>
              )}
              {!filtersOpen && filterCount ? (
                <AppText variant="caption" color="accentText" weight="semibold">
                  {activeFiltersLabel}
                </AppText>
              ) : null}
              {filtersOpen ? (
                <View style={{ backgroundColor: color.surfaceSubtle, borderRadius: radius.card, padding: spacing.md, gap: spacing.md }}>
                  <TextField label="Buscar eventos" value={search} onChangeText={setSearch} placeholder="Nome, categoria ou local"
                    autoCorrect={false} returnKeyType="search" />
                  <TextField label="Cidade" value={city} onChangeText={setCity} placeholder="Ex.: Santos"
                    autoCorrect={false} returnKeyType="search" />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    <FilterChip label="Premium" icon="star-outline" variant="compact" selected={premium} onPress={() => setPremium((value) => !value)} />
                    <FilterChip label="Só destaques" icon="pin-outline" variant="compact" selected={featuredOnly} onPress={() => setFeaturedOnly((value) => !value)} />
                  </View>
                  {categories.length ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ gap: spacing.sm }}>
                      <FilterChip label="Todas as categorias" selected={category === null} onPress={() => setCategory(null)} />
                      {categories.map(([key, label]) => (
                        <FilterChip key={key} label={label} selected={category === key} onPress={() => setCategory(key)} />
                      ))}
                    </ScrollView>
                  ) : null}
                  {filterCount || onlyMonth ? <Button variant="ghost" size="small" onPress={resetFilters}>Limpar filtros</Button> : null}
                </View>
              ) : null}
              {year !== null ? (
                <CalendarYearGrid year={year} selected={month} eventsByMonth={events ? byMonth : null}
                  onMove={(delta) => setYear(year + delta)} onChoose={chooseMonth} />
              ) : mode === 'calendar' ? (
                <>
                  <AgendaCalendar month={month} today={today} selected={day} eventsByDay={byDay}
                    onMove={(delta) => { setMonth((current) => shiftCalendarMonth(current, delta)); setDay(null); }}
                    onSelect={selectDay} onToday={() => selectDay(eventDayKey())} />
                  <View style={{
                    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: color.accentSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                    borderRadius: radius.cardCompact, gap: spacing.xs,
                  }}>
                    <View style={{ flex: 1, minWidth: dimensions.control.large }}>
                      <AppText variant="title" weight="bold" accessibilityRole="header">{selectionLabel}</AppText>
                      {events ? <AppText variant="bodySmall" color="textSecondary" accessibilityLiveRegion="polite">{countLabel}</AppText> : null}
                    </View>
                    {day ? <Button variant="ghost" size="small" onPress={() => setDay(null)}>Ver mês inteiro</Button> : null}
                  </View>
                </>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
                  <FilterChip label={`Só ${monthTitle}`} icon="calendar-outline" variant="compact" selected={onlyMonth} onPress={() => setOnlyMonth((value) => !value)} />
                  {events ? <AppText variant="bodySmall" color="textSecondary" accessibilityLiveRegion="polite">{countLabel}</AppText> : null}
                </View>
              )}
              {loading && events === null ? <ListLoading label="Buscando a programação…" avatar /> : null}
              {failed ? <FeedbackState kind="error" title={events === null ? 'Não foi possível carregar o calendário' : 'Não foi possível atualizar o calendário'}
                description={events === null ? 'Verifique sua conexão e tente novamente.' : 'Exibindo a última programação carregada.'} onRetry={() => void load()} /> : null}
              {!inYear && total === 0 && events !== null && !failed ? (
                <FeedbackState kind="empty" title={emptyTitle} description={filterCount || (mode !== 'calendar' && onlyMonth)
                  ? 'Ajuste os filtros para ver mais eventos.'
                  : mode === 'calendar' && day ? 'Escolha outra data ou veja a programação do mês.' : undefined}
                  icon="calendar-outline" />
              ) : null}
            </View>
          </>
        )}
      />
    </ScreenContainer>
  );
}
