import { useNavigation, usePreventRemove, useRoute, type RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { AppText, Button, FeedbackState, FilterChip, MediaImage, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';
import { useManagement } from '@/providers/management-provider';
import { deleteEvent, event as buscarEvento, updateEvent, uploadImage } from '@/services/api';
import type { RootStackParamList } from '@/navigation/app-navigator';

type EventData = {
  id: string; contratanteId: string | null; titulo: string; categoria: string;
  descricao: string; local: string; cidade: string; dataEvento: string;
  horario: string | null; organizador: string | null; imagemUrl: string | null;
  premium: boolean; fixado: boolean;
};
type Form = {
  titulo: string; categoria: string; descricao: string; local: string; cidade: string;
  data: string; horario: string; organizador: string; imagem: string; premium: boolean; fixado: boolean;
};
const initial: Form = { titulo: '', categoria: '', descricao: '', local: '', cidade: '', data: '', horario: '', organizador: '', imagem: '', premium: false, fixado: false };

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return [String(date.getDate()).padStart(2, '0'), String(date.getMonth() + 1).padStart(2, '0'), String(date.getFullYear())].join('/');
}

function parseDate(value: string, time: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  if (Number(year) < 1000) return null;
  const [hour, minute] = (time || '00:00').split(':').map(Number);
  const date = new Date(Number(year), Number(month) - 1, Number(day), hour, minute);
  return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day) && date.getHours() === hour && date.getMinutes() === minute ? date : null;
}

function toForm(item: EventData): Form {
  return { titulo: item.titulo, categoria: item.categoria, descricao: item.descricao, local: item.local, cidade: item.cidade, data: dateLabel(item.dataEvento), horario: item.horario ?? '', organizador: item.organizador ?? '', imagem: item.imagemUrl ?? '', premium: Boolean(item.premium), fixado: Boolean(item.fixado) };
}

export default function EditEventScreen() {
  const navigation = useNavigation();
  const { params: { eventId } } = useRoute<RouteProp<RootStackParamList, 'EditEvent'>>();
  const { user } = useUser();
  const { refresh } = useManagement();
  const { spacing, radius, color } = useThemeTokens();
  const allowed = user?.tipo === 'CONTRATANTE_EVENTOS';
  const ownerId = user?.id;
  const [original, setOriginal] = useState<EventData | null>(null);
  const [form, setForm] = useState<Form>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);
  const completed = useRef(false);
  const pickerPending = useRef(false);

  useEffect(() => {
    if (!allowed || !ownerId) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError('');
      setOriginal(null);
      setAttempted(false);
      try {
        const item: EventData = await buscarEvento(eventId);
        if (item.id !== eventId || item.contratanteId !== ownerId) throw new Error('Este evento não pertence à sua conta.');
        if (!active) return;
        setOriginal(item);
        setForm(toForm(item));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar o evento.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [allowed, ownerId, eventId, retry]);

  const dirty = !!original && JSON.stringify(form) !== JSON.stringify(toForm(original));
  usePreventRemove(!saved && (dirty || busy || picking), ({ data }) => {
    if (pending.current || pickerPending.current) return;
    Alert.alert('Descartar alterações?', 'As mudanças não salvas serão perdidas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  useEffect(() => {
    if (saved && navigation.isFocused()) navigation.goBack();
  }, [saved, navigation]);

  const setField = <K extends keyof Form,>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const horario = form.horario.trim();
  const invalidTime = !!horario && !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
  const parsedDate = invalidTime ? null : parseDate(form.data.trim(), horario);
  const missing = (value: string) => attempted && !value.trim() ? 'Campo obrigatório.' : undefined;
  const blocked = busy || picking || saved;

  const escolherImagem = async () => {
    if (pending.current || pickerPending.current || saved) return;
    pickerPending.current = true;
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para trocar a capa.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85 });
      if (!result.canceled && result.assets[0]) setField('imagem', result.assets[0].uri);
    } catch (err) {
      Alert.alert('Não foi possível selecionar a imagem', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      pickerPending.current = false;
      setPicking(false);
    }
  };

  const salvar = async () => {
    if (!allowed || !original || original.id !== eventId || original.contratanteId !== ownerId || pending.current || pickerPending.current || !dirty || saved || completed.current) return;
    setAttempted(true);
    if (![form.titulo, form.categoria, form.descricao, form.local, form.cidade].every((value) => value.trim()) || !parsedDate || invalidTime) return;
    pending.current = true;
    setBusy(true);
    try {
      const previous = toForm(original);
      const payload: Record<string, unknown> = {
        titulo: form.titulo.trim(), categoria: form.categoria.trim(), descricao: form.descricao.trim(),
        local: form.local.trim(), cidade: form.cidade.trim(), organizador: form.organizador.trim() || null,
        premium: form.premium, fixado: form.fixado,
      };
      if (form.data.trim() !== previous.data || horario !== previous.horario) {
        payload.dataEvento = parsedDate.toISOString();
        payload.horario = horario || null;
      }
      if (form.imagem !== previous.imagem) {
        const persisted = /^(file|content):/i.test(form.imagem) ? await uploadImage(form.imagem) : form.imagem;
        setField('imagem', persisted);
        payload.imagemUrl = persisted || null;
      }
      await updateEvent(eventId, payload);
    } catch (err) {
      Alert.alert('Não foi possível salvar', err instanceof Error ? err.message : 'Tente novamente.');
      pending.current = false;
      setBusy(false);
      return;
    }
    let refreshed = true;
    try { await refresh(); } catch { refreshed = false; }
    completed.current = true;
    pending.current = false;
    setBusy(false);
    setSaved(true);
    Alert.alert('Evento atualizado', refreshed ? 'Suas alterações foram salvas.' : 'O evento foi salvo. Atualize a lista para ver as alterações.');
  };

  const excluir = () => {
    if (!allowed || !original || original.id !== eventId || original.contratanteId !== ownerId || pending.current || pickerPending.current || saved || completed.current) return;
    Alert.alert(
      'Excluir evento?',
      `"${original.titulo}" será removido permanentemente da agenda. Todas as solicitações de participação, inclusive as aceitas, serão excluídas. Alterações não salvas também serão descartadas. Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir evento', style: 'destructive', onPress: async () => {
          if (pending.current || pickerPending.current || completed.current) return;
          pending.current = true;
          setBusy(true);
          setDeleting(true);
          try {
            await deleteEvent(eventId);
          } catch (err) {
            Alert.alert('Não foi possível excluir', err instanceof Error ? err.message : 'Tente novamente.');
            pending.current = false;
            setBusy(false);
            setDeleting(false);
            return;
          }
          completed.current = true;
          let refreshed = true;
          try { await refresh(); } catch { refreshed = false; }
          pending.current = false;
          setBusy(false);
          setDeleting(false);
          setSaved(true);
          Alert.alert('Evento excluído', refreshed ? 'O evento foi removido da agenda.' : 'O evento foi excluído. Atualize a lista para visualizar as alterações.');
        } },
      ],
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader kicker="ARTHERE / EVENTOS" title="Editar evento" onBack={blocked ? undefined : () => navigation.goBack()} />
      {!allowed ? <FeedbackState kind="error" title="Acesso indisponível" description="Somente contratantes de eventos podem editar seus eventos." /> : loading ? <FeedbackState kind="loading" title="Carregando evento…" /> : !original || error || original.contratanteId !== ownerId ? (
        <FeedbackState kind="error" title="Evento indisponível" description={error} onRetry={() => setRetry((value) => value + 1)} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing['3xl'] }}>
            <View style={{ gap: spacing.sm }}>
              <MediaImage uri={form.imagem} icon="calendar-outline" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.cardCompact }} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <Button variant="outline" disabled={blocked} loading={picking} onPress={escolherImagem}>{form.imagem ? 'Trocar capa' : 'Adicionar capa'}</Button>
                {form.imagem ? <Button variant="ghost" disabled={blocked} onPress={() => setField('imagem', '')}>Remover capa</Button> : null}
              </View>
            </View>
            <SectionHeader title="Informações do evento" description="As solicitações de participação existentes serão preservadas." />
            <TextField label="Nome do evento *" value={form.titulo} onChangeText={(value) => setField('titulo', value)} editable={!blocked} error={missing(form.titulo)} />
            <TextField label="Categoria *" value={form.categoria} onChangeText={(value) => setField('categoria', value)} editable={!blocked} error={missing(form.categoria)} />
            <TextField label="Descrição *" value={form.descricao} onChangeText={(value) => setField('descricao', value)} multiline numberOfLines={5} textAlignVertical="top" editable={!blocked} error={missing(form.descricao)} />
            <SectionHeader title="Onde e quando" />
            <TextField label="Data *" value={form.data} onChangeText={(value) => setField('data', value)} placeholder="DD/MM/AAAA" maxLength={10} editable={!blocked} error={attempted && !parsedDate && !invalidTime ? 'Informe uma data válida (DD/MM/AAAA).' : undefined} />
            <TextField label="Horário" value={form.horario} onChangeText={(value) => setField('horario', value)} placeholder="HH:MM" maxLength={5} editable={!blocked} error={attempted && invalidTime ? 'Informe um horário válido (HH:MM).' : undefined} />
            <TextField label="Local *" value={form.local} onChangeText={(value) => setField('local', value)} editable={!blocked} error={missing(form.local)} />
            <TextField label="Cidade *" value={form.cidade} onChangeText={(value) => setField('cidade', value)} editable={!blocked} error={missing(form.cidade)} />
            <SectionHeader title="Publicação" />
            <TextField label="Organizador" value={form.organizador} onChangeText={(value) => setField('organizador', value)} editable={!blocked} />
            <View style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: color.border, paddingTop: spacing.md }}>
              <AppText variant="label" weight="semibold">Exibição na agenda</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <FilterChip variant="compact" label="Premium" selected={form.premium} disabled={blocked} onPress={() => setField('premium', !form.premium)} />
                <FilterChip variant="compact" label="Destaque" selected={form.fixado} disabled={blocked} onPress={() => setField('fixado', !form.fixado)} />
              </View>
            </View>
            <Button fullWidth loading={busy && !deleting} disabled={blocked || !dirty} onPress={salvar}>Salvar alterações</Button>
            <Button fullWidth variant="outline" disabled={blocked} onPress={() => navigation.goBack()}>Cancelar</Button>
            <View style={{ borderTopWidth: 1, borderTopColor: color.border, paddingTop: spacing.lg, gap: spacing.md }}>
              <SectionHeader title="Gerenciar publicação" />
              <AppText variant="bodySmall" color="textSecondary">A exclusão remove permanentemente o evento da agenda e todas as solicitações de participação vinculadas.</AppText>
              <Button fullWidth variant="danger" loading={deleting} disabled={blocked} onPress={excluir}>Excluir evento</Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}
