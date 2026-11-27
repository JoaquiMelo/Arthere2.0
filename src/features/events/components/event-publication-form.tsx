import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, usePreventRemove, type NavigationProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { useManagement } from '@/providers/management-provider';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser } from '@/providers/user-provider';
import { createEvent, deleteEvent, event as getEvent, updateEvent, uploadImage } from '@/services/api';
import { AppText, Button, FeedbackState, FilterChip, MediaImage, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { dateKey, eventDate, eventDayKey, isEventConcluded } from '../utils/event-agenda';
import { useEventDay } from '../hooks/use-event-day';
import { categories, formFromEvent, maskDate, maskTime, newEventForm, validateEvent, type EventData, type EventForm } from '../utils/event-form';

export function EventPublicationForm({ eventId }: { eventId?: string }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useUser();
  const { refresh } = useManagement();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const allowed = user?.tipo === 'CONTRATANTE_EVENTOS';
  const ownerId = user?.id;
  const today = useEventDay();
  const organizer = user?.empresa || user?.nomeSocial || user?.nome;
  const [initial, setInitial] = useState(() => newEventForm(organizer));
  const [form, setForm] = useState(initial);
  const [ownedEventId, setOwnedEventId] = useState<string>();
  const [loading, setLoading] = useState(Boolean(eventId));
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState<'save' | 'delete' | 'image' | null>(null);
  const [finished, setFinished] = useState(false);
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const pending = useRef(false);
  const uploaded = useRef<{ local: string; remote: string } | null>(null);

  useEffect(() => {
    if (!allowed || !eventId) return;
    let active = true;
    void (async () => {
      try {
        const item: EventData = await getEvent(eventId);
        if (item?.id !== eventId || item.contratanteId !== ownerId) throw new Error('Este evento não pertence à sua conta.');
        if (!active) return;
        const draft = formFromEvent(item);
        setInitial(draft);
        setForm(draft);
        setOwnedEventId(item.id);
        setAttempted(false);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [allowed, eventId, ownerId, retry]);

  const dirty = Object.keys(form).some((key) => form[key as keyof EventForm] !== initial[key as keyof EventForm]);
  const blocked = busy !== null || finished;
  usePreventRemove(allowed && !finished && (dirty || blocked), ({ data }) => {
    if (pending.current) return;
    Alert.alert('Descartar alterações?', 'Os dados do rascunho serão perdidos.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });
  useEffect(() => {
    if (finished && navigation.isFocused()) navigation.goBack();
  }, [finished, navigation]);

  const setField = <K extends keyof EventForm,>(key: K, value: EventForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const { errors, payload } = validateEvent(form, eventId ? initial : undefined, today);
  const showAlbum = eventId && ownedEventId === eventId && isEventConcluded(initial.data.split('/').reverse().join('-'), today);

  const pickCover = async () => {
    if (pending.current || finished) return;
    pending.current = true;
    setBusy('image');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para escolher a capa.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setField('imagem', result.assets[0].uri);
    } catch (error) {
      Alert.alert('Não foi possível selecionar a capa', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(null);
    }
  };

  const finish = (title: string, message: string) => {
    setFinished(true);
    void refresh().catch(() => undefined);
    Alert.alert(title, message);
  };

  const save = async () => {
    if (!allowed || pending.current || finished || (eventId && (ownedEventId !== eventId || !dirty))) return;
    setAttempted(true);
    if (Object.keys(errors).length) return;
    pending.current = true;
    setBusy('save');
    setError('');
    try {
      const data: Record<string, unknown> = { ...payload };
      if (form.imagem !== initial.imagem) {
        let cover = form.imagem;
        if (/^(file|content|blob|data):/i.test(cover)) {
          if (uploaded.current?.local === cover) cover = uploaded.current.remote;
          else {
            cover = await uploadImage(form.imagem);
            uploaded.current = { local: form.imagem, remote: cover };
          }
        }
        data.imagemUrl = cover || null;
      }
      if (eventId) await updateEvent(eventId, data);
      else await createEvent(data);
      finish(eventId ? 'Evento atualizado' : 'Evento publicado', 'A programação foi salva na agenda.');
    } catch (error) {
      pending.current = false;
      setBusy(null);
      setError(error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const remove = () => {
    if (!allowed || !eventId || ownedEventId !== eventId || pending.current || finished) return;
    Alert.alert('Excluir evento?', `“${initial.titulo}” e todas as solicitações vinculadas, inclusive as aceitas, serão excluídos permanentemente.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir evento', style: 'destructive', onPress: async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy('delete');
        try {
          await deleteEvent(eventId);
          finish('Evento excluído', 'A publicação foi removida da agenda.');
        } catch (error) {
          pending.current = false;
          setBusy(null);
          Alert.alert('Não foi possível excluir', error instanceof Error ? error.message : 'Tente novamente.');
        }
      } },
    ]);
  };

  const pickerDate = eventDate(form.data.split('/').reverse().join('-'));
  const pickerValue = Number.isFinite(pickerDate.getTime()) ? pickerDate : new Date();
  if (picker === 'time') {
    const [hour, minute] = /^([01]\d|2[0-3]):[0-5]\d$/.test(form.horario) ? form.horario.split(':').map(Number) : [12, 0];
    pickerValue.setHours(hour, minute, 0, 0);
  }

  return (
    <ScreenContainer>
      <ScreenHeader kicker="AGENDA CULTURAL" title={eventId ? 'Editar evento' : 'Criar evento'} onBack={() => navigation.goBack()} />
      {!allowed ? <FeedbackState kind="error" title="Acesso indisponível" description="Somente contratantes de eventos podem publicar e editar seus eventos." />
        : loading ? <FeedbackState kind="loading" title="Carregando evento…" />
          : loadError ? <FeedbackState kind="error" title="Não foi possível abrir o evento" description={loadError} onRetry={() => {
            setLoading(true);
            setLoadError('');
            setRetry((value) => value + 1);
          }} />
            : (
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{
                  alignSelf: 'center', maxWidth: dimensions.contentMaxWidth, width: '100%', gap: spacing['2xl'], padding: spacing.xl,
                }}>
                  <View style={{ gap: spacing.md }}>
                    <SectionHeader title="Sobre o evento" description="Os campos com asterisco são obrigatórios." />
                    <TextField label="Nome do evento *" value={form.titulo} onChangeText={(value) => setField('titulo', value)} editable={!blocked} error={attempted ? errors.titulo : undefined} />
                    <TextField label="Categoria *" value={form.categoria} onChangeText={(value) => setField('categoria', value)} editable={!blocked} error={attempted ? errors.categoria : undefined} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.sm }}>
                      {categories.map((category) => <FilterChip key={category} label={category} selected={form.categoria === category} disabled={blocked} onPress={() => setField('categoria', category)} />)}
                    </ScrollView>
                    <TextField label="Descrição *" value={form.descricao} onChangeText={(value) => setField('descricao', value)} editable={!blocked}
                      error={attempted ? errors.descricao : undefined} multiline numberOfLines={4} textAlignVertical="top" />
                  </View>
                  <View style={{ gap: spacing.md, borderTopWidth: 1, borderColor: color.border, paddingTop: spacing.lg }}>
                    <SectionHeader title="Quando e onde" />
                    <TextField label="Data *" value={form.data} onChangeText={(value) => setField('data', maskDate(value))} keyboardType="number-pad"
                      maxLength={10} placeholder="DD/MM/AAAA" editable={!blocked} error={attempted ? errors.data : undefined} />
                    <TextField label={eventId ? 'Horário' : 'Horário *'} value={form.horario} onChangeText={(value) => setField('horario', maskTime(value))}
                      keyboardType="number-pad" maxLength={5} placeholder="HH:MM" editable={!blocked} error={attempted ? errors.horario : undefined} />
                    {Platform.OS !== 'web' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      <Button variant="outline" size="small" disabled={blocked} onPress={() => setPicker('date')}>Escolher data</Button>
                      <Button variant="outline" size="small" disabled={blocked} onPress={() => setPicker('time')}>Escolher horário</Button>
                    </View> : null}
                    {picker ? (
                      <View>
                        <DateTimePicker key={picker} mode={picker} value={pickerValue} is24Hour
                          minimumDate={picker === 'date' && !eventId ? eventDate(eventDayKey()) : undefined}
                          onChange={(event, value) => {
                            if (Platform.OS === 'android') setPicker(null);
                            if (event.type !== 'set' || !value) return;
                            if (picker === 'date') setField('data', dateKey(value).split('-').reverse().join('/'));
                            else setField('horario', maskTime(String(value.getHours()).padStart(2, '0') + String(value.getMinutes()).padStart(2, '0')));
                          }} />
                        {Platform.OS === 'ios' ? <Button variant="ghost" onPress={() => setPicker(null)}>Concluir seleção</Button> : null}
                      </View>
                    ) : null}
                    <TextField label="Local *" value={form.local} onChangeText={(value) => setField('local', value)} editable={!blocked} error={attempted ? errors.local : undefined} />
                    <TextField label="Cidade *" value={form.cidade} onChangeText={(value) => setField('cidade', value)} editable={!blocked} error={attempted ? errors.cidade : undefined} />
                  </View>
                  <View style={{ gap: spacing.md, borderTopWidth: 1, borderColor: color.border, paddingTop: spacing.lg }}>
                    <SectionHeader title="Publicação na agenda" />
                    <TextField label={eventId ? 'Organizador' : 'Organizador *'} value={form.organizador} onChangeText={(value) => setField('organizador', value)}
                      editable={!blocked} error={attempted ? errors.organizador : undefined} />
                    {form.imagem ? <MediaImage uri={form.imagem} icon="image-outline" style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.cardCompact }} /> : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      <Button variant="outline" disabled={blocked} loading={busy === 'image'} onPress={() => void pickCover()}>{form.imagem ? 'Trocar capa' : 'Adicionar capa'}</Button>
                      {form.imagem ? <Button variant="ghost" disabled={blocked} onPress={() => setField('imagem', '')}>Remover capa</Button> : null}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      <FilterChip label="Premium" icon="star-outline" selected={form.premium} disabled={blocked} onPress={() => setField('premium', !form.premium)} />
                      <FilterChip label="Destaque" icon="pin-outline" selected={form.fixado} disabled={blocked} onPress={() => setField('fixado', !form.fixado)} />
                    </View>
                  </View>
                  {error ? <FeedbackState kind="error" title={eventId ? 'Não foi possível salvar' : 'Não foi possível publicar'} description={error} /> : null}
                  <Button fullWidth loading={busy === 'save' && !finished} disabled={blocked || Boolean(eventId && !dirty)} onPress={() => void save()}>
                    {eventId ? 'Salvar alterações' : 'Publicar evento'}
                  </Button>
                  {eventId ? (
                    <View style={{ gap: spacing.md, borderTopWidth: 1, borderColor: color.border, paddingTop: spacing.lg }}>
                      <SectionHeader title="Gerenciar publicação" />
                      {showAlbum ? <Button variant="outline" disabled={blocked} onPress={() => navigation.navigate('EventAlbum', { eventId })}>Editar álbum do evento</Button> : null}
                      <AppText variant="bodySmall" color="textSecondary">Excluir o evento remove seu conteúdo da agenda e apaga as solicitações vinculadas.</AppText>
                      <Button fullWidth variant="danger" loading={busy === 'delete' && !finished} disabled={blocked} onPress={remove}>Excluir evento</Button>
                    </View>
                  ) : null}
                </ScrollView>
              </KeyboardAvoidingView>
            )}
    </ScreenContainer>
  );
}
