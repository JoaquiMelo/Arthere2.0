import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { applyToProject, obterSessao, project } from '@/services/api';
import { colors } from '@/shared/theme/colors';
import type { RootStackParamList } from '@/navigation/app-navigator';

type Route = RouteProp<RootStackParamList, 'OpportunityDetails'>;

export default function OpportunityDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const [projeto, setProjeto] = useState<any>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const [dados, sessao] = await Promise.all([project(route.params.opportunityId), obterSessao()]);
      setProjeto(dados);
      setTipo(sessao?.usuario?.tipo ?? null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar a oportunidade.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [route.params.opportunityId]);

  useEffect(() => { void carregar(); }, [carregar]);

  const candidatar = async () => {
    if (tipo !== 'AGENTE') {
      Alert.alert('Entre como agente criativo', 'Somente agentes criativos podem se candidatar a oportunidades.');
      return;
    }
    setEnviando(true);
    try {
      await applyToProject(projeto.id);
      Alert.alert('Candidatura enviada', 'O contratante poderá analisar sua candidatura.');
    } catch (e) {
      Alert.alert('Não foi possível candidatar-se', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={colors.brandCoral} /><Text style={styles.muted}>Carregando oportunidade...</Text></SafeAreaView>;
  if (!projeto || erro) return <SafeAreaView style={styles.center}><Ionicons name="briefcase-outline" size={42} color={colors.muted} /><Text style={styles.title}>Oportunidade indisponível</Text><Text style={styles.muted}>{erro || 'Este projeto não foi encontrado.'}</Text><TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>VOLTAR</Text></TouchableOpacity></SafeAreaView>;

  const contratante = projeto.contratante;
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); void carregar(); }} />}>
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.brandInk} /></TouchableOpacity>
          <View style={styles.shape} />
          <Text style={styles.kicker}>OPORTUNIDADE CRIATIVA</Text>
          <Text style={styles.heroTitle}>{projeto.titulo}</Text>
          <View style={styles.categoryPill}><Text style={styles.category}>{projeto.categoria}</Text></View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>SOBRE O PROJETO</Text>
          <Text style={styles.description}>{projeto.descricao}</Text>
          <View style={styles.infoRow}><Ionicons name="cash-outline" size={20} color={colors.brandCoral} /><View style={styles.infoCopy}><Text style={styles.infoLabel}>ORÇAMENTO</Text><Text style={styles.infoValue}>{projeto.orcamento == null ? 'A combinar' : 'R$ ' + Number(projeto.orcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text></View></View>
          {!!projeto.dataEvento && <View style={styles.infoRow}><Ionicons name="calendar-outline" size={20} color={colors.brandCoral} /><View style={styles.infoCopy}><Text style={styles.infoLabel}>DATA PREVISTA</Text><Text style={styles.infoValue}>{new Date(projeto.dataEvento).toLocaleDateString('pt-BR')}</Text></View></View>}
          <View style={styles.infoRow}><Ionicons name="checkmark-circle-outline" size={20} color={colors.brandCoral} /><View style={styles.infoCopy}><Text style={styles.infoLabel}>STATUS</Text><Text style={styles.infoValue}>{projeto.status === 'ABERTO' ? 'Recebendo candidaturas' : projeto.status}</Text></View></View>
        </View>

        {contratante && <TouchableOpacity style={styles.contractorCard} onPress={() => navigation.navigate('PublicProfile', { profileType: 'CONTRATANTE', profileId: contratante.id })} activeOpacity={0.8}>
          <View style={styles.contractorAvatar}><Ionicons name="person-outline" size={22} color={colors.brandInk} /></View>
          <View style={styles.contractorCopy}><Text style={styles.infoLabel}>PUBLICADO POR</Text><Text style={styles.contractorName}>{contratante.nomeSocial || contratante.nome || contratante.empresa || 'Contratante'}</Text><Text style={styles.muted}>{contratante.cidade || 'Perfil público do contratante'}</Text></View>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </TouchableOpacity>}

        {tipo === 'AGENTE' && projeto.status === 'ABERTO' ? <TouchableOpacity style={[styles.button, enviando && styles.disabled]} disabled={enviando} onPress={candidatar}><Ionicons name="send-outline" size={18} color={colors.brandPaper} /><Text style={styles.buttonText}>{enviando ? 'ENVIANDO...' : 'CANDIDATAR-ME'}</Text></TouchableOpacity> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brandPaper },
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12, backgroundColor: colors.brandPaper },
  hero: { backgroundColor: colors.brandInk, paddingHorizontal: 22, paddingTop: 76, paddingBottom: 28, overflow: 'hidden' },
  back: { position: 'absolute', top: 16, left: 18, width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandPaper, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  shape: { position: 'absolute', right: -32, top: 8, width: 150, height: 150, borderRadius: 80, backgroundColor: colors.brandCoral, opacity: 0.23 },
  kicker: { color: colors.brandSand, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 12 },
  title: { color: colors.brandInk, fontSize: 25, lineHeight: 31, fontWeight: '900' },
  heroTitle: { color: colors.brandPaper, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  categoryPill: { alignSelf: 'flex-start', backgroundColor: colors.brandSand, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, marginTop: 13 },
  category: { color: colors.brandInk, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  panel: { margin: 16, padding: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  sectionTitle: { color: colors.brandCoral, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 12 },
  description: { color: colors.text, fontSize: 14, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 13, marginTop: 13 },
  infoCopy: { flex: 1 },
  infoLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  infoValue: { color: colors.brandInk, fontSize: 14, fontWeight: '800', marginTop: 3 },
  contractorCard: { marginHorizontal: 16, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  contractorAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandBlue, alignItems: 'center', justifyContent: 'center' },
  contractorCopy: { flex: 1 },
  contractorName: { color: colors.brandInk, fontSize: 14, fontWeight: '900', marginVertical: 3 },
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  button: { marginHorizontal: 16, marginTop: 18, minHeight: 52, paddingHorizontal: 20, borderRadius: 999, backgroundColor: colors.brandInk, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { color: colors.brandPaper, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  disabled: { opacity: 0.55 },
});
