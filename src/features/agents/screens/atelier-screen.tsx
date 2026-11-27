import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categoryLabel, mapAgent, matchesAgent } from '@/features/map/utils/map-agents';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser } from '@/providers/user-provider';
import { agents } from '@/services/api';
import {
  AppText, Avatar, Button, FeedbackState, FilterChip, IconButton, ListLoading, MediaImage,
  ScreenContainer, SectionHeader, TextField,
} from '@/shared/components';
import { realImageUri } from '@/shared/config/image-uri';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import type { AgenteCriativo } from '../types/agent';

const priorityCategories = ['design', 'fotografo', 'videomaker'];
const categoryTitles: Record<string, string> = {
  design: 'Designers',
  fotografo: 'Fotógrafos',
  videomaker: 'Videomakers',
  dj: 'DJs',
  artesao: 'Artesãos',
};
const highlightId = 'destaques';
const carouselLimit = 6;

type Shelf = { id: string; title: string; people: AgenteCriativo[] };
type HomeRow = { kind: 'shelf'; shelf: Shelf } | { kind: 'agent'; agent: AgenteCriativo };

function shelfTitle(id: string) {
  return id === highlightId ? 'Destaques' : categoryTitles[id] ?? categoryLabel(id);
}

function AgentCard({ agent, width, onPress }: { agent: AgenteCriativo; width?: number; onPress: () => void }) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [focused, setFocused] = useState(false);
  const work = agent.portfolio.find((entry) => realImageUri(entry.imagemUrl));
  const specialty = agent.especialidades[0];
  const avatarSize = dimensions.control.small;

  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={[`Abrir perfil de ${agent.nome}`, specialty, agent.cidade].filter(Boolean).join('. ')}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        width, borderRadius: radius.card, borderWidth: 1, overflow: 'hidden',
        borderColor: focused ? color.focus : color.border,
        backgroundColor: color.surface, opacity: pressed ? 0.8 : 1,
      })}
    >
      <MediaImage uri={work?.imagemUrl ?? agent.bannerUrl} style={{ width: '100%', aspectRatio: 16 / 9 }} />
      <View style={{ marginTop: -avatarSize / 2, paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.xs }}>
        <Avatar uri={agent.avatarUrl} iconSize={dimensions.icon.medium} style={{
          width: avatarSize, height: avatarSize, borderRadius: radius.pill,
          borderWidth: 2, borderColor: color.surface,
        }} />
        <AppText variant="body" weight="bold">{agent.nome}</AppText>
        <AppText variant="caption" color="accentText" weight="semibold">{specialty}</AppText>
        {agent.cidade ? <AppText variant="caption" color="textSecondary">{agent.cidade}</AppText> : null}
      </View>
    </Pressable>
  );
}

export default function AtelierScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const { width, fontScale } = useWindowDimensions();
  const { left, right } = useSafeAreaInsets();
  const [people, setPeople] = useState<AgenteCriativo[]>([]);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const version = useRef(0);
  const listRef = useRef<FlatList<HomeRow>>(null);

  const load = useCallback(async () => {
    const request = ++version.current;
    setLoading(true);
    setFailed(false);
    try {
      const data = await agents();
      if (version.current === request) {
        setPeople(data.map(mapAgent).filter((item): item is AgenteCriativo => item !== null && item.disponivel !== false));
      }
    } catch {
      if (version.current === request) setFailed(true);
    } finally {
      if (version.current === request) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { version.current += 1; };
  }, [load]));

  const shelves = useMemo<Shelf[]>(() => {
    if (!people.length) return [];
    const byCategory = new Map<string, AgenteCriativo[]>();
    for (const person of people) {
      const group = byCategory.get(person.categoria);
      if (group) group.push(person);
      else byCategory.set(person.categoria, [person]);
    }
    const categories = new Set([...priorityCategories, ...byCategory.keys()]);
    return [
      { id: highlightId, title: shelfTitle(highlightId), people: [...people].sort((a, b) => b.avaliacao - a.avaliacao) },
      ...Array.from(categories).flatMap((id) => {
        const group = byCategory.get(id);
        return group ? [{ id, title: shelfTitle(id), people: group }] : [];
      }),
    ];
  }, [people]);

  const searching = Boolean(query.trim());
  const rows = useMemo<HomeRow[]>(() => {
    if (!searching && scope === null) return shelves.map((shelf) => ({ kind: 'shelf', shelf }));
    const candidates = scope === null ? people : (shelves.find((shelf) => shelf.id === scope)?.people ?? []);
    return candidates.filter((person) => matchesAgent(person, query, null)).map((agent) => ({ kind: 'agent', agent }));
  }, [people, query, scope, searching, shelves]);

  const pickScope = (id: string | null) => {
    setScope(id);
    setFiltersOpen(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };
  const openAgent = (agent: AgenteCriativo) =>
    navigation.navigate('PublicProfile', { profileType: 'AGENTE', profileId: agent.id });

  const settings = (
    <IconButton icon="settings-outline" accessibilityLabel="Abrir configurações" onPress={() => navigation.navigate('Settings')} />
  );
  const header = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
        <View accessible accessibilityRole="header" accessibilityLabel="Arthere">
          <Image alt=""
            source={require('../../../shared/assets/arthere-wordmark.png')}
            accessible={false}
            contentFit="contain"
            style={{ width: 124, height: 35, borderRadius: radius.xs }}
          />
        </View>
        {user ? settings : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button size="small" variant="outline" onPress={() => navigation.navigate('Login')}>Entrar</Button>
            <Button size="small" onPress={() => navigation.navigate('Register')}>Criar conta</Button>
          </View>
        )}
      </View>

      <TextField
        label="Buscar agentes criativos"
        value={query}
        onChangeText={setQuery}
        placeholder="Nome, especialidade ou cidade"
        autoCorrect={false}
        returnKeyType="search"
        trailingAction={
          <>
            {query ? <IconButton icon="close" variant="ghost" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} /> : null}
            <IconButton
              icon="options-outline"
              variant={filtersOpen || scope !== null ? 'primary' : 'outline'}
              accessibilityLabel="Filtrar por área"
              accessibilityState={{ expanded: filtersOpen }}
              onPress={() => setFiltersOpen((open) => !open)}
            />
          </>
        }
      />
      {filtersOpen ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <FilterChip label="Todas as áreas" selected={scope === null} onPress={() => pickScope(null)} />
          {shelves.filter(({ id }) => id !== highlightId).map(({ id, title }) => (
            <FilterChip key={id} label={title} selected={scope === id} onPress={() => pickScope(id)} />
          ))}
        </View>
      ) : null}

      {!user ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <FilterChip icon="home-outline" variant="segment" label="Início" selected onPress={() => {
              setQuery('');
              pickScope(null);
            }} />
            <FilterChip icon="map-outline" variant="segment" label="Mapa" selected={false} onPress={() => navigation.navigate('Map')} />
          </View>
          {settings}
        </View>
      ) : null}

      {scope !== null ? (
        <SectionHeader title={shelfTitle(scope)} action={
          <IconButton icon="arrow-back" variant="outline" accessibilityLabel="Mostrar todas as áreas" onPress={() => pickScope(null)} />
        } />
      ) : searching ? <SectionHeader title="Resultados da busca" /> : null}
      {failed && people.length > 0 ? (
        <FeedbackState kind="error" title="Não foi possível atualizar" onRetry={() => void load()} />
      ) : null}
    </View>
  );

  const shelfWidth = Math.min(width - left - right, dimensions.contentMaxWidth) - 2 * (spacing.lg + spacing.md);
  const cardsInView = shelfWidth >= 280 && fontScale <= 1.35 ? 2 : 1;

  return (
    <ScreenContainer edges={user ? ['top', 'left', 'right'] : undefined}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(item) => item.kind === 'agent' ? `agent-${item.agent.id}` : item.shelf.id}
        ListHeaderComponent={header}
        refreshing={loading && people.length > 0}
        onRefresh={() => void load()}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center',
          padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg,
        }}
        ListEmptyComponent={loading ? <ListLoading label="Buscando agentes…" avatar /> :
          failed && !people.length ? <FeedbackState kind="error" title="Não foi possível carregar os agentes" onRetry={() => void load()} /> :
            <FeedbackState
              kind="empty"
              title={searching || scope !== null ? 'Nenhum agente encontrado' : 'Nenhum agente publicado'}
              description={searching ? 'Experimente outro nome, especialidade ou cidade.' : undefined}
            />}
        renderItem={({ item }) => {
          if (item.kind === 'agent') return <AgentCard agent={item.agent} onPress={() => openAgent(item.agent)} />;
          const { id, title, people: group } = item.shelf;
          const hasMore = group.length > cardsInView;
          const extraSpace = hasMore ? spacing.lg : 0;
          const visibleCards = Math.min(cardsInView, group.length);
          const cardWidth = (shelfWidth - extraSpace - (visibleCards - 1) * spacing.md) / visibleCards;
          return (
            <View style={{
              backgroundColor: id === highlightId ? color.accentSoft : color.surface,
              borderRadius: radius.card, borderWidth: 1, borderColor: color.border, paddingVertical: spacing.md, gap: spacing.sm,
            }}>
              <View style={{ paddingHorizontal: spacing.md }}>
                <SectionHeader title={title} action={hasMore ? (
                  <Button size="small" variant="ghost" accessibilityLabel={`Ver mais em ${title}`} onPress={() => pickScope(id)}>
                    Ver mais
                  </Button>
                ) : undefined} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}
              >
                {group.slice(0, carouselLimit).map((agent) => (
                  <AgentCard key={agent.id} agent={agent} width={cardWidth} onPress={() => openAgent(agent)} />
                ))}
              </ScrollView>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}
