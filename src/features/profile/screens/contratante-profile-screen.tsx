import { AppText, Badge, Button, FeedbackState, IconButton, ScreenContainer, SectionHeader, TextField } from '@/shared/components';
import { formatarLocalizacao } from '@/shared/config/brazil-location';
import { Avatar, MediaImage } from '@/shared/components/media-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useManagement } from '@/providers/management-provider';
import { useUser } from '@/providers/user-provider';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

function formatDate(value: string) {
  const date = new Date(value.length === 10 ? value + 'T12:00:00' : value);
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ContratanteProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile, refresh: refreshUser } = useUser();
  const { vagas, eventos: todosEventos, refresh: refreshManagement, loading } = useManagement();
  const { color, spacing, radius, dimensions } = useThemeTokens();
  const isEvents = user?.tipo === 'CONTRATANTE_EVENTOS';
  const eventos = todosEventos.filter((evento) => evento.contratanteId === user?.id);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = useState<'publicacoes' | 'gestao' | 'sobre'>('publicacoes');
  const [editando, setEditando] = useState(false);
  const [rascunhoEmpresa, setRascunhoEmpresa] = useState('');
  const [salvando, setSalvando] = useState(false);
  const pending = useRef(false);

  const recarregar = useCallback(async () => {
    setAtualizando(true);
    try {
      const result = await Promise.allSettled([refreshUser(), refreshManagement()]);
      setErro(result.some((item) => item.status === 'rejected'));
    } finally {
      setAtualizando(false);
    }
  }, [refreshUser, refreshManagement]);

  if (!user || (user.tipo !== 'CONTRATANTE_EVENTOS' && user.tipo !== 'CONTRATANTE_OPORTUNIDADES')) return null;

  const empresa = user.empresa?.trim() || '';
  const local = formatarLocalizacao(user.cidade, user.estado);
  const concluidas = vagas.filter((vaga) => vaga.status === 'CONCLUIDA').length;
  const emAndamento = vagas.filter((vaga) => vaga.status === 'EM_ANDAMENTO').length;
  const abertas = vagas.filter((vaga) => vaga.status === 'ABERTA').length;
  const totalCandidaturas = vagas.reduce((soma, vaga) => soma + vaga.candidatos.length, 0);
  const editarPerfil = () => navigation.navigate('EditContractorProfile');
  const abrirEdicao = () => {
    setRascunhoEmpresa(empresa);
    setEditando(true);
  };
  const salvarEmpresa = async () => {
    const valor = rascunhoEmpresa.trim();
    if (!valor || pending.current) return;
    pending.current = true;
    setSalvando(true);
    try {
      await updateProfile({ empresa: valor });
      setEditando(false);
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      pending.current = false;
      setSalvando(false);
    }
  };
  const stats = isEvents
    ? [{ label: 'Eventos publicados', value: eventos.length }]
    : [{ label: 'Vagas abertas', value: abertas }, { label: 'Em andamento', value: emAndamento }, { label: 'Concluídas', value: concluidas }];
  const section = { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['3xl'] }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={color.accentText} colors={[color.accentText]} />}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <AppText variant="label" color="accentText" weight="bold">ARTHERE / MEU PERFIL</AppText>
              <AppText variant="h2" weight="heavy" accessibilityRole="header">{isEvents ? 'Seu espaço cultural.' : 'Conexões que criam.'}</AppText>
            </View>
            <IconButton icon="settings-outline" variant="outline" accessibilityLabel="Abrir configurações" onPress={() => navigation.navigate('Settings')} />
          </View>
          <View style={{ width: '100%', aspectRatio: 16 / 9, minHeight: 156, position: 'relative', alignItems: 'center', justifyContent: 'center', borderRadius: radius.cardCompact, backgroundColor: isEvents ? color.accentSecondary : color.accentSoft }}>
            {user.bannerUrl ? <MediaImage uri={user.bannerUrl} style={{ ...StyleSheet.absoluteFill, width: '100%', height: '100%', borderRadius: radius.cardCompact }} /> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Editar foto de perfil" onPress={editarPerfil} style={({ pressed }) => ({ width: 108, height: 108, borderWidth: 4, borderColor: color.background, borderRadius: radius.sheetCompact, backgroundColor: color.background, opacity: pressed ? 0.85 : 1 })}>
              <Avatar uri={user.avatarUrl} style={{ width: 100, height: 100, borderRadius: radius.card }} iconSize={36} />
              <View style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: color.accent, borderColor: color.background, borderWidth: 2, borderRadius: radius.sm }}><Ionicons name="camera-outline" color={color.onAccent} size={dimensions.icon.small} /></View>
            </Pressable>
            <View style={{ position: 'absolute', right: spacing.sm, bottom: spacing.sm, backgroundColor: color.surface, borderRadius: radius.control }}>
              <IconButton icon={user.bannerUrl ? 'create-outline' : 'image-outline'} variant="outline" accessibilityLabel={user.bannerUrl ? 'Editar capa' : 'Adicionar capa'} onPress={editarPerfil} />
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <Badge label={isEvents ? 'Contratante de eventos' : 'Contratante de oportunidades'} icon={isEvents ? 'calendar-outline' : 'briefcase-outline'} tone="accent" style={{ alignSelf: 'center' }} />
            <AppText variant="h2" weight="heavy" accessibilityRole="header" style={{ textAlign: 'center' }}>{user.nomeSocial || user.nome || 'Contratante'}</AppText>
            {isEvents ? <Button variant="ghost" size="small" onPress={abrirEdicao}>{empresa || 'Informar organização'}</Button> : <AppText variant="bodySmall" color="textSecondary" style={{ textAlign: 'center' }}>{user.categoria || 'Contratante independente'}</AppText>}
            {isEvents && user.categoria ? <AppText variant="bodySmall" color="textSecondary" style={{ textAlign: 'center' }}>{user.categoria}</AppText> : null}
            {local ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}><Ionicons name="location-outline" size={dimensions.icon.small} color={color.accentText} /><AppText variant="bodySmall" color="textSecondary" style={{ flexShrink: 1, textAlign: 'center' }}>{local}</AppText></View> : null}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, backgroundColor: color.surfaceSubtle, padding: spacing.md, borderRadius: radius.control }}>
            {stats.map((stat) => <View key={stat.label} style={{ flexGrow: 1, flexBasis: 76, alignItems: 'center', gap: spacing.xs }}><AppText variant="h3" weight="bold">{stat.value}</AppText><AppText variant="label" color="textSecondary" style={{ textAlign: 'center' }}>{stat.label}</AppText></View>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button style={{ flexGrow: 1, flexBasis: 138, borderRadius: radius.control }} onPress={editarPerfil}>Editar perfil</Button>
            <Button variant="outline" style={{ flexGrow: 1, flexBasis: 138, borderRadius: radius.control }} onPress={() => navigation.navigate('PublicProfile', { profileType: 'CONTRATANTE', profileId: user.id })}>Ver perfil público</Button>
          </View>
          {erro ? <View style={{ gap: spacing.xs }}><AppText color="dangerText" variant="bodySmall" accessibilityLiveRegion="polite">Não foi possível atualizar todas as informações.</AppText><Button variant="ghost" onPress={recarregar} disabled={atualizando}>Tentar novamente</Button></View> : null}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, borderBottomColor: color.border, paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {([['publicacoes', isEvents ? 'Eventos' : 'Vagas'], ['gestao', 'Gestão'], ['sobre', 'Sobre']] as const).map(([key, label]) => (
            <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: aba === key }} onPress={() => setAba(key)} style={({ pressed }) => ({ minHeight: dimensions.touchTarget, flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.sm, borderBottomWidth: 2, borderBottomColor: aba === key ? color.accent : 'transparent', opacity: pressed ? 0.75 : 1 })}>
              <AppText variant="bodySmall" weight={aba === key ? 'bold' : 'medium'} color={aba === key ? 'accentText' : 'textSecondary'}>{label}</AppText>
            </Pressable>
          ))}
        </View>

        {aba === 'publicacoes' && isEvents ? <View style={section}>
          <SectionHeader title="Minha programação" description={`${eventos.length} ${eventos.length === 1 ? 'evento publicado' : 'eventos publicados'}`} />
          {loading && eventos.length === 0 ? <FeedbackState kind="loading" title="Carregando eventos…" /> : eventos.length === 0 ? <FeedbackState kind="empty" title="Sua programação começa aqui" description="Crie um evento para divulgar sua atividade cultural." icon="calendar-outline" /> : eventos.map((evento, index) => (
            <Pressable key={evento.id} accessibilityRole="button" accessibilityLabel={`Abrir evento ${evento.titulo}`} onPress={() => navigation.navigate('EventDetails', { eventId: evento.id })} style={({ pressed }) => ({ gap: spacing.sm, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: color.border, opacity: pressed ? 0.8 : 1 })}>
              <MediaImage uri={evento.imagemUrl} icon="calendar-outline" style={{ width: '100%', aspectRatio: index % 2 === 0 ? 16 / 10 : 4 / 3, borderRadius: radius.cardCompact }} />
              <AppText variant="label" weight="bold" color="accentText">{formatDate(evento.data)}</AppText>
              <AppText variant="title" weight="bold">{evento.titulo}</AppText>
              <AppText variant="bodySmall" color="textSecondary">{[evento.categoria, evento.cidade].filter(Boolean).join(' · ')}</AppText>
            </Pressable>
          ))}
          <Button fullWidth variant="outline" onPress={() => navigation.navigate('CreateEvent')}>Adicionar evento</Button>
        </View> : null}

        {aba === 'publicacoes' && !isEvents ? <View style={section}>
          <SectionHeader title="Minhas oportunidades" description={`${vagas.length} ${vagas.length === 1 ? 'vaga publicada' : 'vagas publicadas'}`} />
          {loading && vagas.length === 0 ? <FeedbackState kind="loading" title="Carregando vagas…" /> : vagas.length === 0 ? <FeedbackState kind="empty" title="Nenhuma vaga publicada" description="As oportunidades que você publicar aparecerão aqui." icon="briefcase-outline" /> : vagas.map((vaga) => (
            <Pressable key={vaga.id} accessibilityRole="button" accessibilityLabel={`Gerenciar vaga ${vaga.titulo}`} onPress={() => navigation.navigate('ManageOpportunities')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border, opacity: pressed ? 0.8 : 1 })}>
              <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                <AppText variant="label" color="accentText" weight="semibold">{vaga.categoria}</AppText>
                <AppText variant="title" weight="bold">{vaga.titulo}</AppText>
                <Badge label={vaga.status === 'CONCLUIDA' ? 'Concluída' : vaga.status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Aberta'} tone={vaga.status === 'CONCLUIDA' ? 'success' : vaga.status === 'EM_ANDAMENTO' ? 'warning' : 'accent'} />
                <AppText variant="bodySmall" color="textSecondary">{vaga.candidatos.length} {vaga.candidatos.length === 1 ? 'candidato' : 'candidatos'}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={dimensions.icon.medium} color={color.textSecondary} />
            </Pressable>
          ))}
          <Button variant="outline" fullWidth onPress={() => navigation.navigate('ManageOpportunities')}>Gerenciar vagas</Button>
        </View> : null}

        {aba === 'gestao' ? <View style={section}>
          <SectionHeader title={isEvents ? 'Gerencie seus eventos' : 'Gerencie contratações'} description={isEvents ? 'Publique atividades e acompanhe as participações.' : 'Acompanhe as candidaturas e o andamento das suas vagas.'} />
          {isEvents ? <>
            <Button fullWidth onPress={() => navigation.navigate('CreateEvent')}>Criar evento</Button>
            <Button variant="outline" fullWidth onPress={() => navigation.navigate('ManageOpportunities')}>Solicitações de participação</Button>
          </> : <Button fullWidth onPress={() => navigation.navigate('ManageOpportunities')}>Candidaturas ({totalCandidaturas})</Button>}
        </View> : null}

        {aba === 'sobre' ? <View style={section}>
          <SectionHeader title={isEvents ? 'Sobre a organização' : 'Apresentação profissional'} />
          <AppText color={user.descricao?.trim() ? 'textPrimary' : 'textSecondary'}>{user.descricao?.trim() || 'Adicione uma apresentação ao seu perfil.'}</AppText>
          {user.site ? <AppText variant="bodySmall" color="textSecondary">{user.site}</AppText> : null}
          <Button variant="outline" fullWidth onPress={editarPerfil}>Editar apresentação</Button>
        </View> : null}
      </ScrollView>
      <Modal visible={editando && isEvents} transparent animationType="none" onRequestClose={() => { if (!salvando) setEditando(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: color.overlay }}>
          <View accessibilityViewIsModal style={{ backgroundColor: color.background, borderRadius: radius.sheetCompact, padding: spacing.xl, gap: spacing.md }}>
            <SectionHeader title="Nome da organização" />
            <TextField label="Organização" value={rascunhoEmpresa} onChangeText={setRascunhoEmpresa} editable={!salvando} />
            <Button loading={salvando} disabled={!rascunhoEmpresa.trim()} onPress={salvarEmpresa}>Salvar</Button>
            <Button variant="outline" disabled={salvando} onPress={() => setEditando(false)}>Cancelar</Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
