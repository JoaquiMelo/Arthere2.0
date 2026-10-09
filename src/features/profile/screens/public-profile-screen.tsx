import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { publicAgent, publicContractor } from '@/services/api';
import { colors } from '@/shared/theme/colors';
import type { RootStackParamList } from '@/navigation/app-navigator';

type Route = RouteProp<RootStackParamList, 'PublicProfile'>;

export default function PublicProfileScreen() {
  const navigation = useNavigation<any>();
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

  useEffect(() => { void carregar(); }, [carregar]);

  if (carregando) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={colors.brandCoral} /><Text style={styles.muted}>Carregando perfil...</Text></SafeAreaView>;
  }

  if (erro || !perfil) {
    return <SafeAreaView style={styles.center}><Ionicons name="person-circle-outline" size={48} color={colors.muted} /><Text style={styles.title}>Perfil indisponível</Text><Text style={styles.muted}>{erro || 'Este perfil não foi encontrado.'}</Text><TouchableOpacity style={styles.primary} onPress={() => navigation.goBack()}><Text style={styles.primaryText}>VOLTAR</Text></TouchableOpacity></SafeAreaView>;
  }

  const agente = profileType === 'AGENTE';
  const nome = perfil.nomeSocial || perfil.nome || 'Perfil Arthere';
  const cidade = [perfil.cidade, perfil.estado].filter(Boolean).join(', ');
  const portfolio = Array.isArray(perfil.portfolio) ? perfil.portfolio : [];
  const eventos = Array.isArray(perfil.eventos) ? perfil.eventos : [];
  const projetos = Array.isArray(perfil.projetos) ? perfil.projetos : [];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); void carregar(); }} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Voltar"><Ionicons name="arrow-back" size={21} color={colors.brandInk} /></TouchableOpacity>
          <View style={styles.heroShape} />
          <Text style={styles.kicker}>{agente ? 'PROFISSIONAL CRIATIVO' : perfil.usuario?.tipo === 'CONTRATANTE_EVENTOS' ? 'CONTRATANTE DE EVENTOS' : 'CONTRATANTE DE OPORTUNIDADES'}</Text>
          <View style={styles.identity}>
            <Image source={{ uri: perfil.avatarUrl || 'https://i.pravatar.cc/300?img=12' }} style={styles.avatar} />
            <View style={styles.identityCopy}>
              <Text style={styles.name}>{nome}</Text>
              <Text style={styles.subtitle}>{agente ? perfil.especialidade || 'Profissional criativo' : perfil.categoria || 'Contratante independente'}</Text>
              {!!cidade && <View style={styles.location}><Ionicons name="location-outline" size={14} color={colors.brandCoral} /><Text style={styles.muted}>{cidade}</Text></View>}
            </View>
          </View>
        </View>

        {!!(perfil.bio || perfil.descricao || perfil.pronomes) && (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>SOBRE</Text>
            {!!perfil.pronomes && <Text style={styles.muted}>{perfil.pronomes}</Text>}
            <Text style={styles.body}>{perfil.bio || perfil.descricao}</Text>
          </View>
        )}

        {agente ? (
          <View style={styles.panel}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>PORTFÓLIO</Text><Text style={styles.count}>{portfolio.length} trabalhos</Text></View>
            {portfolio.length ? <View style={styles.gallery}>{portfolio.map((item: any) => <View key={item.id} style={styles.work}><Image source={{ uri: item.imageUrl }} style={styles.workImage} /><Text style={styles.workTitle} numberOfLines={2}>{item.titulo || 'Trabalho criativo'}</Text>{!!item.descricao && <Text style={styles.muted} numberOfLines={3}>{item.descricao}</Text>}</View>)}</View> : <Text style={styles.muted}>Este perfil ainda não publicou trabalhos no portfólio.</Text>}
            <View style={styles.statRow}><View style={styles.stat}><Text style={styles.statNumber}>{Number(perfil.totalProjetos || 0)}</Text><Text style={styles.statLabel}>PROJETOS</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{Number(perfil.notaMedia || 0).toFixed(1)}</Text><Text style={styles.statLabel}>NOTA MÉDIA</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{Number(perfil.totalAvaliacoes || 0)}</Text><Text style={styles.statLabel}>AVALIAÇÕES</Text></View></View>
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>EVENTOS PUBLICADOS</Text><Text style={styles.count}>{eventos.length}</Text></View>
              {eventos.length ? eventos.map((item: any) => <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}><View style={[styles.listIcon, { backgroundColor: '#DCEBE3' }]}><Ionicons name="calendar-outline" size={19} color="#648A78" /></View><View style={styles.listCopy}><Text style={styles.itemTitle}>{item.titulo}</Text><Text style={styles.muted}>{item.cidade} · {new Date(item.dataEvento).toLocaleDateString('pt-BR')}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></TouchableOpacity>) : <Text style={styles.muted}>Nenhum evento publicado.</Text>}
            </View>
            <View style={styles.panel}>
              <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>OPORTUNIDADES ABERTAS</Text><Text style={styles.count}>{projetos.length}</Text></View>
              {projetos.length ? projetos.map((item: any) => <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => navigation.navigate('OpportunityDetails', { opportunityId: item.id })}><View style={[styles.listIcon, { backgroundColor: '#EADFF2' }]}><Ionicons name="briefcase-outline" size={19} color="#9275AA" /></View><View style={styles.listCopy}><Text style={styles.itemTitle}>{item.titulo}</Text><Text style={styles.muted}>{item.categoria}{item.orcamento != null ? ' · R$ ' + Number(item.orcamento).toLocaleString('pt-BR') : ''}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></TouchableOpacity>) : <Text style={styles.muted}>Nenhuma oportunidade aberta.</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brandPaper },
  content: { paddingBottom: 32 },
  center: { flex: 1, backgroundColor: colors.brandPaper, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  hero: { backgroundColor: colors.brandInk, paddingHorizontal: 20, paddingTop: 70, paddingBottom: 25, overflow: 'hidden' },
  back: { position: 'absolute', top: 16, left: 18, zIndex: 2, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandPaper },
  heroShape: { position: 'absolute', right: -35, top: 8, width: 145, height: 145, borderRadius: 75, backgroundColor: colors.brandCoral, opacity: 0.25 },
  kicker: { color: colors.brandSand, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 17 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.brandPaper, backgroundColor: colors.white },
  identityCopy: { flex: 1 },
  name: { color: colors.brandPaper, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.brandSand, fontSize: 13, marginTop: 4 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  panel: { marginHorizontal: 16, marginTop: 16, padding: 17, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  sectionTitle: { color: colors.brandInk, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  count: { color: colors.brandCoral, fontSize: 11, fontWeight: '900' },
  body: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 8 },
  gallery: { gap: 12 },
  work: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  workImage: { width: 82, height: 76, borderRadius: 12, backgroundColor: colors.surface },
  workTitle: { flex: 1, color: colors.brandInk, fontSize: 13, fontWeight: '800' },
  statRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, paddingTop: 14, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { color: colors.brandInk, fontSize: 18, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', marginTop: 3, letterSpacing: 0.7 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  listIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listCopy: { flex: 1 },
  itemTitle: { color: colors.brandInk, fontSize: 13, fontWeight: '900', marginBottom: 3 },
  primary: { backgroundColor: colors.brandInk, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 999 },
  primaryText: { color: colors.brandPaper, fontSize: 11, fontWeight: '900' },
});
