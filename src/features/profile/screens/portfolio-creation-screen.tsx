import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { AppText, Button, FeedbackState, IconButton, MediaImage, ScreenContainer, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';
import { addPortfolio, deletePortfolio, portfolio as fetchPortfolio, updatePortfolio, uploadImage } from '@/services/api';
import type { RootStackParamList } from '@/navigation/app-navigator';
import type { GalleryWork } from '../components/portfolio-gallery';

type Mode = 'manage' | 'add' | 'edit';
type Draft = { image: string; titulo: string; descricao: string };
const emptyDraft: Draft = { image: '', titulo: '', descricao: '' };

export default function PortfolioCreationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'PortfolioCreation'>>();
  const { user } = useUser();
  const id = user?.tipo === 'AGENTE' ? user.id : undefined;
  const { color, spacing, radius, dimensions } = useThemeTokens();
  const [items, setItems] = useState<GalleryWork[]>([]);
  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'manage');
  const [editId, setEditId] = useState<string | null>(route.params?.itemId ?? null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [urlVisible, setUrlVisible] = useState(false);
  const pending = useRef(false);
  const initialEdit = useRef(route.params?.mode === 'edit' ? route.params.itemId : undefined);
  const request = useRef(0);

  const load = useCallback(async () => {
    if (!id || pending.current) { setLoading(false); return; }
    const version = ++request.current;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPortfolio(id);
      if (version !== request.current) return;
      const list: GalleryWork[] = (data ?? []).map((item) => ({ id: item.id, imageUrl: item.imageUrl, titulo: item.titulo, descricao: item.descricao }));
      setItems(list);
      if (initialEdit.current) {
        const work = list.find((item) => item.id === initialEdit.current);
        initialEdit.current = undefined;
        if (work) {
          setEditId(work.id);
          setDraft({ image: work.imageUrl, titulo: work.titulo ?? '', descricao: work.descricao ?? '' });
          setMode('edit');
        } else {
          setMode('manage');
          setNotice('Este trabalho não está mais disponível.');
        }
      }
    } catch (e) {
      if (version === request.current) setError(e instanceof Error ? e.message : 'Não foi possível carregar os trabalhos.');
    } finally {
      if (version === request.current) setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current += 1; };
  }, [load]));

  const openAdd = () => {
    setDraft(emptyDraft);
    setEditId(null);
    setNotice('');
    setUrlVisible(false);
    setMode('add');
  };
  const openEdit = (work: GalleryWork) => {
    setEditId(work.id);
    setDraft({ image: work.imageUrl, titulo: work.titulo ?? '', descricao: work.descricao ?? '' });
    setNotice('');
    setUrlVisible(false);
    setMode('edit');
  };
  const returnToList = () => {
    setDraft(emptyDraft);
    setEditId(null);
    setUrlVisible(false);
    setMode('manage');
  };

  const chooseImage = async () => {
    if (pending.current) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para escolher a imagem.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85 });
      if (!result.canceled && result.assets?.[0]) {
        const image = result.assets[0].uri;
        setDraft((current) => ({ ...current, image }));
      }
    } catch (e) {
      Alert.alert('Não foi possível selecionar a imagem', e instanceof Error ? e.message : 'Tente novamente.');
    }
  };

  const save = async () => {
    if (!id || pending.current || loading || error || mode === 'manage' || (mode === 'edit' && !editId)) return;
    const image = draft.image.trim();
    if (!image) { Alert.alert('Escolha uma imagem', 'Selecione uma foto ou informe uma URL pública.'); return; }
    const original = items.find((item) => item.id === editId);
    const unchanged = mode === 'edit' && original?.imageUrl === image;
    const local = /^(file|content):/i.test(image);
    if (!unchanged && !local && !/^https?:\/\/[^\s]+$/i.test(image)) {
      Alert.alert('URL inválida', 'Use uma URL pública HTTP ou HTTPS, ou selecione uma imagem.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setNotice('');
    try {
      const imageUrl = local && !unchanged ? await uploadImage(image) : image;
      if (local && !unchanged) setDraft((current) => ({ ...current, image: imageUrl }));
      const payload = { imageUrl, titulo: draft.titulo.trim(), descricao: draft.descricao.trim() };
      const saved = mode === 'edit' && editId
        ? await updatePortfolio(editId, payload)
        : await addPortfolio({ agenteId: id, ...payload });
      const work: GalleryWork = { id: saved.id, imageUrl: saved.imageUrl, titulo: saved.titulo, descricao: saved.descricao };
      setItems((current) => mode === 'edit' ? current.map((item) => item.id === work.id ? work : item) : [work, ...current]);
      setNotice(mode === 'edit' ? 'Alterações salvas.' : 'Trabalho publicado.');
      returnToList();
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const remove = (work: GalleryWork) => {
    if (pending.current) return;
    Alert.alert('Remover trabalho?', 'A obra será retirada do seu portfólio.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        try {
          await deletePortfolio(work.id);
          setItems((current) => current.filter((item) => item.id !== work.id));
          setNotice('Trabalho removido.');
          if (editId === work.id) returnToList();
        } catch (e) {
          Alert.alert('Não foi possível remover', e instanceof Error ? e.message : 'Tente novamente.');
        } finally {
          pending.current = false;
          setBusy(false);
        }
      } },
    ]);
  };

  if (!id) return <ScreenContainer><FeedbackState kind="error" title="Portfólio indisponível" description="Somente agentes criativos podem gerenciar trabalhos." /><Button variant="ghost" onPress={() => navigation.goBack()}>Voltar</Button></ScreenContainer>;

  const title = mode === 'manage' ? 'Seus trabalhos na Arthere' : mode === 'add' ? 'Novo trabalho' : 'Editar trabalho';
  const selected = items.find((item) => item.id === editId);
  return (
    <ScreenContainer>
      <View style={{ padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border }}>
        <IconButton icon="arrow-back" variant="outline" accessibilityLabel="Voltar" disabled={busy} onPress={() => mode === 'manage' ? navigation.goBack() : returnToList()} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="label" color="accentText" weight="bold">ARTHERE / PORTFÓLIO</AppText>
          <AppText variant="h2" weight="heavy" accessibilityRole="header">{title}</AppText>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg }}
          refreshControl={mode === 'manage' ? <RefreshControl refreshing={loading} onRefresh={load} tintColor={color.accentText} colors={[color.accentText]} /> : undefined}>
          {notice ? <AppText color="successText" accessibilityLiveRegion="polite">{notice}</AppText> : null}
          {loading ? <FeedbackState kind="loading" title="Carregando trabalhos…" /> : error ? <FeedbackState kind="error" title="Não foi possível carregar" description={error} onRetry={load} /> : mode === 'manage' ? (
            <>
              <SectionHeader title="Gerencie sua coleção" description={`${items.length} ${items.length === 1 ? 'trabalho publicado' : 'trabalhos publicados'}`} />
              <Button fullWidth style={{ borderRadius: radius.control }} onPress={openAdd} disabled={busy}>Adicionar trabalho</Button>
              {items.length === 0 ? <FeedbackState kind="empty" title="Sua coleção está vazia" description="Adicione uma obra para começar." icon="images-outline" /> : items.map((work) => (
                <View key={work.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: color.border }}>
                  <MediaImage uri={work.imageUrl} style={{ width: 88, height: 96, borderRadius: radius.control }} />
                  <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                    <AppText weight="bold">{work.titulo || 'Trabalho criativo'}</AppText>
                    {work.descricao ? <AppText variant="bodySmall" color="textSecondary" numberOfLines={2}>{work.descricao}</AppText> : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                      <IconButton icon="create-outline" accessibilityLabel={`Editar ${work.titulo || 'trabalho'}`} variant="outline" disabled={busy} onPress={() => openEdit(work)} />
                      <IconButton icon="trash-outline" accessibilityLabel={`Remover ${work.titulo || 'trabalho'}`} variant="ghost" disabled={busy} onPress={() => remove(work)} />
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <>
              <SectionHeader title={mode === 'edit' ? 'Refine sua obra' : 'Apresente sua criação'} description="Escolha uma imagem e descreva o trabalho." />
              <Pressable onPress={chooseImage} disabled={busy} accessibilityRole="button" accessibilityLabel={draft.image ? 'Trocar imagem' : 'Selecionar imagem'} style={({ pressed }) => ({ borderWidth: 1, borderColor: color.border, borderRadius: radius.cardCompact, backgroundColor: color.surface, padding: spacing.sm, gap: spacing.sm, opacity: pressed ? 0.8 : 1 })}>
                {draft.image && !urlVisible ? <MediaImage uri={draft.image} resizeMode="contain" style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.control }} /> : <View style={{ minHeight: 132, justifyContent: 'center', alignItems: 'center', gap: spacing.sm }}><Ionicons name="image-outline" size={dimensions.icon.extraLarge} color={color.accentText} /><AppText weight="semibold">Selecionar imagem</AppText></View>}
                <AppText variant="bodySmall" color="accentText" weight="semibold" style={{ textAlign: 'center' }}>{draft.image ? 'Escolher outra imagem da galeria' : 'Escolher da galeria'}</AppText>
              </Pressable>
              <Button variant="ghost" size="small" disabled={busy} onPress={() => setUrlVisible((current) => !current)}>{urlVisible ? 'Ocultar campo de URL' : 'Usar URL pública'}</Button>
              {urlVisible ? <TextField label="URL da imagem" value={draft.image} onChangeText={(image) => setDraft((current) => ({ ...current, image }))} autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!busy} /> : null}
              <TextField label="Título do trabalho" value={draft.titulo} onChangeText={(titulo) => setDraft((current) => ({ ...current, titulo }))} editable={!busy} />
              <TextField label="Descrição" value={draft.descricao} onChangeText={(descricao) => setDraft((current) => ({ ...current, descricao }))} multiline numberOfLines={4} textAlignVertical="top" editable={!busy} />
              <Button fullWidth style={{ borderRadius: radius.control }} loading={busy} onPress={save}>{mode === 'edit' ? 'Salvar alterações' : 'Publicar trabalho'}</Button>
              {mode === 'edit' && selected ? <Button variant="ghost" disabled={busy} onPress={() => remove(selected)}>Remover trabalho</Button> : null}
              <Button variant="outline" disabled={busy} onPress={returnToList}>Cancelar</Button>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
