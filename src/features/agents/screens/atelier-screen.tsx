import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser } from '@/providers/user-provider';
import { agents } from '@/services/api';
import { AppText, Avatar, Button, FeedbackState, IconButton, MediaImage, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { mapAgent, matchesAgent } from '@/features/map/utils/map-agents';
import type { AgenteCriativo } from '../types/agent';

export default function AtelierScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [people, setPeople] = useState<AgenteCriativo[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const version = useRef(0);

  const load = useCallback(async () => {
    const request = ++version.current;
    setLoading(true);
    setFailed(false);
    try {
      const data = await agents();
      if (version.current === request) setPeople(data.map(mapAgent).filter((item): item is AgenteCriativo =>
        item !== null && item.disponivel !== false));
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

  const results = useMemo(() => people.filter((person) => matchesAgent(person, query, null)), [people, query]);
  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.lg }}>
      <ScreenHeader kicker="REDE CRIATIVA DA BAIXADA SANTISTA" title="Ateliê"
        description="Conheça agentes criativos da região e explore seus trabalhos."
        action={<IconButton icon="settings-outline" accessibilityLabel="Abrir configurações" onPress={() => navigation.navigate('Settings')} />} />
      {!user ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button onPress={() => navigation.navigate('Register')}>Criar perfil</Button>
          <Button variant="outline" onPress={() => navigation.navigate('Login')}>Entrar</Button>
          <Button variant="outline" onPress={() => navigation.navigate('Map')}>Abrir mapa</Button>
        </View>
      ) : null}
      <TextField label="Buscar agentes criativos" value={query} onChangeText={setQuery}
        placeholder="Nome, área de atuação ou cidade" autoCorrect={false} returnKeyType="search" />
      <SectionHeader title="Agentes criativos" />
      {failed && people.length ? (
        <FeedbackState kind="error" title="Não foi possível atualizar" onRetry={() => void load()} />
      ) : null}
    </View>
  );

  return (
    <ScreenContainer edges={user ? ['top', 'left', 'right'] : undefined}>
      <FlatList data={results} keyExtractor={(item) => item.id} ListHeaderComponent={header}
        refreshing={loading && people.length > 0} onRefresh={() => void load()}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={{
          width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing['3xl'],
        }}
        ListEmptyComponent={loading ? <FeedbackState kind="loading" title="Buscando agentes…" /> :
          failed && !people.length ? <FeedbackState kind="error" title="Não foi possível carregar os agentes" onRetry={() => void load()} /> :
            <FeedbackState kind="empty" title={query.trim() ? 'Nenhum agente encontrado' : 'Nenhum agente publicado'}
              description={query.trim() ? 'Experimente outro nome, especialidade ou cidade.' : undefined} />}
        renderItem={({ item }) => {
          const work = item.portfolio.find((entry) => entry.imagemUrl);
          const specialty = item.especialidades[0];
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`Abrir perfil de ${item.nome}. ${specialty}. ${item.cidade}.`}
              onPress={() => navigation.navigate('PublicProfile', { profileType: 'AGENTE', profileId: item.id })}
              style={({ pressed }) => ({
                marginBottom: spacing.lg, borderRadius: radius.card, borderWidth: 1, overflow: 'hidden',
                borderColor: color.border, backgroundColor: color.surface, opacity: pressed ? 0.78 : 1,
              })}>
              {work ? <MediaImage uri={work.imagemUrl} style={{ width: '100%', aspectRatio: 16 / 9 }} /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md }}>
                <Avatar uri={item.avatarUrl} style={{ width: dimensions.control.large, height: dimensions.control.large, borderRadius: radius.control }} />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <AppText variant="label" color="accentText" weight="bold">{specialty}</AppText>
                  <AppText variant="title" weight="heavy">{item.nome}</AppText>
                  <AppText variant="bodySmall" color="textSecondary">{item.cidade}</AppText>
                </View>
              </View>
            </Pressable>
          );
        }} />
    </ScreenContainer>
  );
}
