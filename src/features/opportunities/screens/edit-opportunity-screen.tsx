import { useNavigation, usePreventRemove, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { AppText, Badge, Button, FeedbackState, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';
import { useManagement } from '@/providers/management-provider';
import { meusProjetos, updateProject, type Projeto } from '@/services/api';
import type { RootStackParamList } from '@/navigation/app-navigator';

type Form = { titulo: string; categoria: string; descricao: string; orcamento: string; data: string };
const initial: Form = { titulo: '', categoria: '', descricao: '', orcamento: '', data: '' };
const statusLabels: Record<string, string> = { ABERTO: 'Aberta', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída', CANCELADO: 'Cancelada' };

function dateLabel(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return [String(date.getDate()).padStart(2, '0'), String(date.getMonth() + 1).padStart(2, '0'), String(date.getFullYear())].join('/');
}

function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  if (Number(year) < 1000) return null;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day) ? date : null;
}

function toForm(item: Projeto): Form {
  return { titulo: item.titulo, categoria: item.categoria, descricao: item.descricao, orcamento: item.orcamento == null ? '' : String(item.orcamento).replace('.', ','), data: dateLabel(item.dataEvento) };
}

export default function EditOpportunityScreen() {
  const navigation = useNavigation();
  const { params: { opportunityId } } = useRoute<RouteProp<RootStackParamList, 'EditOpportunity'>>();
  const { user } = useUser();
  const { refresh } = useManagement();
  const { color, spacing, radius } = useThemeTokens();
  const allowed = user?.tipo === 'CONTRATANTE_OPORTUNIDADES';
  const [original, setOriginal] = useState<Projeto | null>(null);
  const [form, setForm] = useState<Form>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError('');
      setOriginal(null);
      setAttempted(false);
      try {
        // A consulta autenticada retorna somente vagas da conta atual.
        const items: Projeto[] = await meusProjetos();
        const item = items.find((vaga) => vaga.id === opportunityId);
        if (!item) throw new Error('Esta vaga não está disponível para edição na sua conta.');
        if (!active) return;
        setOriginal(item);
        setForm(toForm(item));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [allowed, opportunityId, retry, user?.usuarioId]);

  const dirty = !!original && JSON.stringify(form) !== JSON.stringify(toForm(original));
  usePreventRemove(!saved && (dirty || busy), ({ data }) => {
    if (pending.current) {
      Alert.alert('Salvando alterações', 'Aguarde a confirmação da API.');
      return;
    }
    Alert.alert('Descartar alterações?', 'As mudanças não salvas serão perdidas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  useEffect(() => {
    if (saved && navigation.isFocused()) navigation.goBack();
  }, [saved, navigation]);

  const setField = (key: keyof Form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const raw = form.orcamento.trim();
  const amount = raw ? Number(raw.replace(',', '.')) : null;
  const invalidAmount = raw !== '' && (!/^\d+([,.]\d{1,2})?$/.test(raw) || !Number.isFinite(amount) || Number(amount) < 0);
  const dateChanged = !!original && form.data.trim() !== dateLabel(original.dataEvento);
  const parsedDate = form.data.trim() ? parseDate(form.data.trim()) : null;
  const invalidDate = dateChanged && !!form.data.trim() && !parsedDate;

  const salvar = async () => {
    if (!allowed || !original || original.id !== opportunityId || pending.current || !dirty || saved) return;
    setAttempted(true);
    if (!form.titulo.trim() || !form.categoria.trim() || !form.descricao.trim() || invalidAmount || invalidDate) return;
    pending.current = true;
    setBusy(true);
    try {
      await updateProject(original.id, {
        titulo: form.titulo.trim(), categoria: form.categoria.trim(), descricao: form.descricao.trim(),
        orcamento: amount,
        ...(dateChanged ? { dataEvento: parsedDate?.toISOString() ?? null } : {}),
      });
    } catch (err) {
      Alert.alert('Não foi possível salvar', err instanceof Error ? err.message : 'Tente novamente.');
      pending.current = false;
      setBusy(false);
      return;
    }
    let refreshed = true;
    try { await refresh(); } catch { refreshed = false; }
    pending.current = false;
    setBusy(false);
    setSaved(true);
    Alert.alert('Vaga atualizada', refreshed ? 'Suas alterações foram salvas.' : 'Suas alterações foram salvas. Atualize a lista para visualizar os dados.');
  };

  if (!allowed) return <ScreenContainer><ScreenHeader title="Editar vaga" onBack={() => navigation.goBack()} /><FeedbackState kind="error" title="Acesso indisponível" description="Somente contratantes de oportunidades podem editar suas vagas." /></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScreenHeader kicker="ARTHERE / OPORTUNIDADES" title="Editar vaga" onBack={busy ? undefined : () => navigation.goBack()} />
      {loading ? <FeedbackState kind="loading" title="Carregando sua vaga…" /> : !original || error ? (
        <FeedbackState kind="error" title="Não foi possível abrir a vaga" description={error} onRetry={() => setRetry((value) => value + 1)} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing['3xl'] }}>
            <View style={{ padding: spacing.lg, borderRadius: radius.cardCompact, backgroundColor: color.accentSoft, gap: spacing.sm }}>
              <AppText variant="label" weight="semibold" color="textPrimary">OPORTUNIDADE PUBLICADA</AppText>
              <AppText variant="h3" weight="bold">{original.titulo}</AppText>
              <View style={{ alignSelf: 'flex-start' }}><Badge label={statusLabels[original.status] ?? original.status} tone={original.status === 'ABERTO' ? 'accent' : 'neutral'} /></View>
              <AppText variant="bodySmall">As candidaturas e o status atual serão preservados.</AppText>
            </View>
            <SectionHeader title="Informações da vaga" description="Os campos com asterisco são obrigatórios." />
            <TextField label="Título da vaga *" value={form.titulo} onChangeText={(value) => setField('titulo', value)} editable={!busy} error={attempted && !form.titulo.trim() ? 'Informe o título.' : undefined} />
            <TextField label="Categoria *" value={form.categoria} onChangeText={(value) => setField('categoria', value)} editable={!busy} error={attempted && !form.categoria.trim() ? 'Informe a categoria.' : undefined} />
            <TextField label="Descrição *" value={form.descricao} onChangeText={(value) => setField('descricao', value)} multiline numberOfLines={5} textAlignVertical="top" editable={!busy} error={attempted && !form.descricao.trim() ? 'Descreva o trabalho.' : undefined} />
            <SectionHeader title="Condições do trabalho" />
            <TextField label="Orçamento (R$)" value={form.orcamento} onChangeText={(value) => setField('orcamento', value)} keyboardType="decimal-pad" placeholder="Ex.: 1500,00" editable={!busy} helperText="Deixe em branco para negociar o valor." error={attempted && invalidAmount ? 'Informe um valor válido, sem separador de milhar.' : undefined} />
            <TextField label="Data prevista (opcional)" value={form.data} onChangeText={(value) => setField('data', value)} placeholder="DD/MM/AAAA" maxLength={10} editable={!busy} helperText="Data prevista do trabalho, não prazo de candidatura." error={attempted && invalidDate ? 'Informe uma data válida no formato DD/MM/AAAA.' : undefined} />
            <Button fullWidth loading={busy} disabled={!dirty || saved} onPress={salvar}>Salvar alterações</Button>
            <Button fullWidth variant="outline" disabled={busy || saved} onPress={() => navigation.goBack()}>Cancelar</Button>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}
