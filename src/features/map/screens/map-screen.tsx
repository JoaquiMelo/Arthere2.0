import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import type { AgenteCriativo } from '@/features/agents/types/agent';
import { useChat } from '@/providers/chat-provider';
import { colors } from '@/shared/theme/colors';
import { AgentProfileCard } from '../../../features/agents/components/agent-profile-card';
import { CATEGORIAS } from '../../../shared/config/categories';

const REGIAO_INICIAL: Region = {
  latitude: -23.96,
  longitude: -46.34,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const agentesBaixadaSantista: AgenteCriativo[] = [
  {
    id: '1',
    nome: 'Marina Oliveira',
    categoria: 'fotografo',
    disponivel: true,
    avaliacao: 4.9,
    cidade: 'Santos, SP',
    especialidades: ['Fotógrafo'],
    latitude: -23.9608,
    longitude: -46.3339,
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    descricao: 'Fotógrafa de eventos e retratos autorais.',
    portfolio: [{ id: 'marina-1', titulo: 'Retrato editorial', imagemUrl: 'https://picsum.photos/seed/marina-1/300/200' }],
  },
  {
    id: '2',
    nome: 'João Paulo',
    categoria: 'videomaker',
    disponivel: true,
    avaliacao: 4.7,
    cidade: 'São Vicente, SP',
    especialidades: ['Videomaker'],
    latitude: -23.965,
    longitude: -46.38,
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    descricao: 'Videomaker para campanhas, eventos e conteúdo digital.',
    portfolio: [{ id: 'joao-1', titulo: 'Vídeo de campanha', imagemUrl: 'https://picsum.photos/seed/joao-1/300/200' }],
  },
  {
    id: '3',
    nome: 'Beatriz Costa',
    categoria: 'dj',
    disponivel: false,
    avaliacao: 4.8,
    cidade: 'Guarujá, SP',
    especialidades: ['DJ'],
    latitude: -23.99,
    longitude: -46.26,
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    descricao: 'DJ para casamentos, festas e eventos corporativos.',
    portfolio: [{ id: 'beatriz-1', titulo: 'Evento ao vivo', imagemUrl: 'https://picsum.photos/seed/beatriz-1/300/200' }],
  },
  {
    id: '4',
    nome: 'Rafael Souza',
    categoria: 'artesao',
    disponivel: true,
    avaliacao: 4.6,
    cidade: 'Praia Grande, SP',
    especialidades: ['Artesanato'],
    latitude: -24.005,
    longitude: -46.41,
    avatarUrl: 'https://i.pravatar.cc/150?img=33',
    descricao: 'Artesão de peças autorais em madeira para casas e eventos.',
    portfolio: [{ id: 'rafael-1', titulo: 'Coleção em madeira', imagemUrl: 'https://picsum.photos/seed/rafael-1/300/200' }],
  },
];

function CustomPin({
  agente,
  ativo,
  onPress,
}: {
  agente: AgenteCriativo;
  ativo: boolean;
  onPress: (a: AgenteCriativo) => void;
}) {
  const cor = CATEGORIAS[agente.categoria]?.cor ?? CATEGORIAS.design.cor;

  return (
    <Marker
      coordinate={{ latitude: agente.latitude, longitude: agente.longitude }}
      onPress={() => onPress(agente)}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={[styles.pinContainer, ativo && styles.pinActive]}>
        <View style={[styles.pinImageContainer, { borderColor: cor }]}>
          <Image source={{ uri: agente.avatarUrl }} style={styles.pinImage} />
        </View>
        <View style={[styles.pinStatus, { backgroundColor: agente.disponivel ? cor : colors.muted }]} />
        <View style={[styles.pinTail, { borderTopColor: cor }]} />
      </View>
    </Marker>
  );
}

export function MapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { startConversation } = useChat();
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<AgenteCriativo | null>(null);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return agentesBaixadaSantista.filter((agente) => {
      const categoriaOk = !categoria || agente.categoria === categoria;
      const categoriaLabel = CATEGORIAS[agente.categoria]?.label.toLowerCase() ?? '';
      const termoOk =
        !termo ||
        agente.nome.toLowerCase().includes(termo) ||
        agente.cidade.toLowerCase().includes(termo) ||
        categoriaLabel.includes(termo) ||
        agente.especialidades.some((item) => item.toLowerCase().includes(termo));

      return categoriaOk && termoOk;
    });
  }, [busca, categoria]);

  const destaque = [...filtrados].sort((a, b) => b.avaliacao - a.avaliacao).slice(0, 3);

  const abrirChat = (agente: AgenteCriativo) => {
    const conversationId = startConversation(agente);
    setSelecionado(null);
    navigation.navigate('ChatConversation', { conversationId });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        stickyHeaderIndices={[0]}
      >
        <View style={styles.header}>
          <View style={[styles.headerInner, { paddingTop: insets.top + 8 }]}>
            <View style={styles.brandLine}>
              <Text style={styles.brand}></Text>
              <Text style={styles.region}></Text>
            </View>
            <Text style={styles.headerLink}>MAPA</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              hitSlop={6}
              style={({ pressed }) => [styles.loginButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>ENTRAR</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar perfil"
              hitSlop={6}
              style={({ pressed }) => [styles.profileButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.profileButtonText}>CRIAR PERFIL</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>ARTE, ENCONTRO E TERRITÓRIO</Text>

          <View style={styles.heroBrandBlock}>
            <Text style={styles.heroBrand}>ARTHERE</Text>
            <Text style={styles.heroRegion}>Conectando a Baixada Criativa.</Text>
          </View>

          <Text style={styles.heroDescription}>
            Fotógrafos, DJs, videomakers, designers e artesãos abertos a novos projetos. Descubra quem está perto, veja o trabalho e comece a conversa.
          </Text>

          <View style={styles.stats}>
            <View>
              <Text style={styles.statNumber}>{agentesBaixadaSantista.length}</Text>
              <Text style={styles.statLabel}>ARTISTAS</Text>
            </View>
            <View style={styles.statDivider} />
            <View>
              <Text style={styles.statNumber}>{Object.keys(CATEGORIAS).length}</Text>
              <Text style={styles.statLabel}>ÁREAS CRIATIVAS</Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={17} color={colors.muted} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar artista, cidade ou especialidade"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              editable={true}
              autoComplete="off"
              importantForAutofill="no"
            />
            {busca ? (
              <Ionicons name="close" size={18} color={colors.muted} onPress={() => setBusca('')} />
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <FilterChip label="Todos" active={!categoria} onPress={() => setCategoria(null)} />
            {Object.entries(CATEGORIAS).map(([id, item]) => (
              <FilterChip
                key={id}
                label={item.label}
                dot={item.cor}
                active={categoria === id}
                onPress={() => setCategoria(categoria === id ? null : id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapFrame}>
            <MapView
              style={StyleSheet.absoluteFill}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={REGIAO_INICIAL}
              scrollEnabled
            >
              {filtrados.map((agente) => (
                <CustomPin
                  key={agente.id}
                  agente={agente}
                  ativo={selecionado?.id === agente.id}
                  onPress={setSelecionado}
                />
              ))}
            </MapView>

            <View style={styles.mapBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.mapBadgeText}>
                {filtrados.length} {filtrados.length === 1 ? 'ARTISTA' : 'ARTISTAS'} NO MAPA
              </Text>
            </View>
          </View>

          {selecionado ? (
            <View style={styles.profileOverlay}>
              <AgentProfileCard
                agente={selecionado}
                visible
                onClose={() => setSelecionado(null)}
                onAgendar={(agente) => {
                  setSelecionado(null);
                  Alert.alert(`Solicitação de agenda para ${agente.nome}`);
                }}
                onChat={abrirChat}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.featured}>
          <View style={styles.featuredHeading}>
            <Text style={styles.featuredTitle}>Em destaque</Text>
            <Text style={styles.featuredCaption}>SELECIONADOS PELA AVALIAÇÃO</Text>
          </View>

          {destaque.length === 0 ? (
            <Text style={styles.empty}>Nenhum artista encontrado com esses filtros.</Text>
          ) : (
            destaque.map((agente) => (
              <View key={agente.id} style={styles.card}>
                <Image source={{ uri: agente.avatarUrl }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardCategory}>
                      {CATEGORIAS[agente.categoria]?.label.toUpperCase() ?? 'CRIATIVO'}
                    </Text>
                    <Text style={styles.rating}>★ {agente.avaliacao.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.cardName}>{agente.nome}</Text>
                  <Text style={styles.cardCity}>{agente.cidade}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>{agente.descricao}</Text>
                  <Text style={styles.cardAction} onPress={() => setSelecionado(agente)}>
                    VER NO MAPA →
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Arthere</Text>
          <Text style={styles.footerText}>Conectando agentes criativos e contratantes na Baixada Santista.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  active,
  dot,
  onPress,
}: {
  label: string;
  active: boolean;
  dot?: string;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
      ]}
    >
      {dot ? <Text style={{ color: dot }}>• </Text> : null}
      {label.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brandPaper },
  scroll: { flex: 1 },
  content: { paddingBottom: 0 },
  header: {
    backgroundColor: colors.brandPaper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 20,
  },
  headerInner: {
    minHeight: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  brand: {
    fontSize: 35,
    color: colors.brandInk,
    letterSpacing: -1.8,
    lineHeight: 38,
  },
  region: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0,
  },
  headerActions: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLink: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.2,
  },
  loginButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandPaper,
  },
  loginButtonText: {
    color: colors.brandInk,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  profileButton: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.brandInk,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: colors.brandPaper,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 30,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 2.1,
    marginBottom: 17,
  },
  heroBrandBlock: {
    gap: 4,
  },
  heroBrand: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: 44,
    color: colors.brandCoral,
    letterSpacing: -2,
    lineHeight: 48,
  },
  heroRegion: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  heroDescription: {
    marginTop: 22,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 500,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 24,
    paddingTop: 17,
    gap: 20,
  },
  statNumber: {
    fontFamily: 'sans-serif',
    fontWeight: '800',
    color: colors.brandInk,
    fontSize: 31,
    lineHeight: 32,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 2,
  },
  statDivider: { height: 34, width: 1, backgroundColor: colors.border },
  controls: {
    zIndex: 30,
    elevation: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  searchRow: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: {
    flex: 1,
    color: colors.brandInk,
    fontSize: 13,
    paddingVertical: 7,
  },
  chips: { paddingTop: 11, paddingRight: 20, gap: 7 },
  chip: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chipActive: {
    color: colors.brandPaper,
    backgroundColor: colors.brandInk,
    borderColor: colors.brandInk,
  },
  chipInactive: {
    color: colors.muted,
    backgroundColor: colors.brandPaper,
    borderColor: colors.border,
  },
  mapSection: { paddingHorizontal: 20, paddingTop: 28 },
  mapFrame: {
    height: 520,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  mapBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.brandInk,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandCoral,
  },
  mapBadgeText: {
    color: colors.brandPaper,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  profileOverlay: { marginTop: -200, marginHorizontal: 12, zIndex: 5 },
  featured: { paddingHorizontal: 20, paddingTop: 42, paddingBottom: 38 },
  featuredHeading: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 13,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  featuredTitle: {
    fontFamily: 'sans-serif',
    fontWeight: '800',
    fontSize: 30,
    color: colors.brandInk,
  },
  featuredCaption: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 190, backgroundColor: colors.muted },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCategory: { color: colors.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1.2 },
  rating: { color: colors.brandInk, fontSize: 10, fontWeight: '700' },
  cardName: { color: colors.brandInk, fontFamily: 'sans-serif', fontWeight: '800', fontSize: 25, marginTop: 6 },
  cardCity: { color: colors.muted, fontSize: 10, marginTop: 2 },
  cardDescription: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  cardAction: { color: colors.brandCoral, fontSize: 8, fontWeight: '800', letterSpacing: 1.1, marginTop: 15 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 35, fontSize: 13 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 34,
    gap: 7,
  },
  footerBrand: { fontFamily: 'sans-serif', fontWeight: '800', color: colors.brandInk, fontSize: 22 },
  footerText: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  pinContainer: { alignItems: 'center', width: 54, height: 65 },
  pinActive: { transform: [{ scale: 1.16 }] },
  pinImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    backgroundColor: colors.brandPaper,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
  },
  pinImage: { width: 40, height: 40, borderRadius: 20, alignSelf: 'center', marginTop: 2 },
  pinStatus: {
    position: 'absolute',
    right: 2,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.brandPaper,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
