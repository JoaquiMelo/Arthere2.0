import { useNavigation, usePreventRemove, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Badge, Button, FeedbackState, ScreenContainer, ScreenHeader, SectionHeader } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';
import { useManagement } from '@/providers/management-provider';
import { deleteProject, meusProjetos, updateProject, type Projeto } from '@/services/api';
import type { RootStackParamList } from '@/navigation/app-navigator';

import { OpportunityFormFields, OpportunityFormLayout } from '../components/opportunity-form-fields';
import {
  emptyOpportunityForm, formFromOpportunity, opportunityDateLabel,
  opportunityStatusLabels, validateOpportunityForm, type OpportunityForm,
} from '../utils/opportunity-form';

export default function EditOpportunityScreen() {
  const navigation = useNavigation();
  const { params: { opportunityId } } = useRoute<RouteProp<RootStackParamList, 'EditOpportunity'>>();
  const { user } = useUser();
  const { refresh } = useManagement();
  const { color, spacing, radius } = useThemeTokens();
  const allowed = user?.tipo === 'CONTRATANTE_OPORTUNIDADES';
  const [original, setOriginal] = useState<Projeto | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [form, setForm] = useState(emptyOpportunityForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError('');
      setSaveError('');
      setOriginal(null);
      setAttempted(false);
      try {
        // A consulta autenticada retorna somente vagas da conta atual.
        const items: (Projeto & { candidaturas?: { status: string }[] })[] = await meusProjetos();
        const item = items.find((vaga) => vaga.id === opportunityId);
        if (!item) throw new Error('Esta vaga não está disponível para edição na sua conta.');
        if (!active) return;
        setOriginal(item);
        setHasAccepted(item.candidaturas?.some((candidatura) => candidatura.status === 'ACEITA') ?? false);
        setForm(formFromOpportunity(item));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Tente novamente.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [allowed, opportunityId, retry, user?.usuarioId]);

  const dirty = !!original && JSON.stringify(form) !== JSON.stringify(formFromOpportunity(original));
  usePreventRemove(allowed && !saved && (dirty || busy), ({ data }) => {
    if (pending.current) {
      Alert.alert('Operação em andamento', 'Aguarde a confirmação da API.');
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

  const setField = (key: keyof OpportunityForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const { errors, payload } = validateOpportunityForm(form, opportunityDateLabel(original?.dataEvento ?? null));

  const salvar = async () => {
    if (!allowed || !original || original.id !== opportunityId || pending.current || !dirty || saved) return;
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setSaveError('');
    pending.current = true;
    setBusy(true);
    try {
      await updateProject(original.id, payload);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Tente novamente.');
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

  const canDelete = !!original && !hasAccepted && (original.status === 'ABERTO' || original.status === 'CANCELADO');

  const excluir = () => {
    if (!allowed || !original || original.id !== opportunityId || !canDelete || pending.current || saved) return;
    const id = original.id;
    Alert.alert(
      'Excluir oportunidade?',
      'A vaga e as candidaturas recebidas serão excluídas permanentemente. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => {
          if (pending.current) return;
          pending.current = true;
          setBusy(true);
          setDeleting(true);
          try {
            await deleteProject(id);
          } catch (err) {
            Alert.alert('Não foi possível excluir', err instanceof Error ? err.message : 'Tente novamente.');
            pending.current = false;
            setBusy(false);
            setDeleting(false);
            return;
          }
          let refreshed = true;
          try { await refresh(); } catch { refreshed = false; }
          pending.current = false;
          setBusy(false);
          setDeleting(false);
          setSaved(true);
          Alert.alert('Oportunidade excluída', refreshed ? 'A vaga foi removida.' : 'A vaga foi removida. Atualize a lista para visualizar os dados.');
        } },
      ],
    );
  };

  if (!allowed) return <ScreenContainer><ScreenHeader title="Editar vaga" onBack={() => navigation.goBack()} /><FeedbackState kind="error" title="Acesso indisponível" description="Somente contratantes de oportunidades podem editar suas vagas." /></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScreenHeader kicker="OPORTUNIDADES" title="Editar vaga" onBack={() => navigation.goBack()} />
      {loading ? <FeedbackState kind="loading" title="Carregando sua vaga…" /> : !original || error ? (
        <FeedbackState kind="error" title="Não foi possível abrir a vaga" description={error} onRetry={() => setRetry((value) => value + 1)} />
      ) : (
        <OpportunityFormLayout>
          <View style={{ padding: spacing.lg, borderRadius: radius.cardCompact, backgroundColor: color.surfaceSubtle, gap: spacing.sm }}>
            <AppText variant="h3" weight="bold">{original.titulo}</AppText>
            <View style={{ alignSelf: 'flex-start' }}><Badge label={opportunityStatusLabels[original.status] ?? original.status} tone={original.status === 'ABERTO' ? 'accent' : 'neutral'} /></View>
            <AppText variant="bodySmall">As candidaturas e o status atual serão preservados.</AppText>
          </View>
          <OpportunityFormFields form={form} setField={setField} busy={busy || saved} errors={attempted ? errors : undefined} />
          {saveError ? <FeedbackState kind="error" title="Não foi possível salvar" description={saveError} /> : null}
          <Button fullWidth loading={busy && !deleting} disabled={!dirty || saved || busy} onPress={salvar}>Salvar alterações</Button>
          <View style={{ borderTopWidth: 1, borderTopColor: color.border, paddingTop: spacing.lg, gap: spacing.md }}>
            <SectionHeader title="Gerenciar publicação" />
            {canDelete ? (
              <>
                <AppText variant="bodySmall" color="textSecondary">A exclusão remove a vaga e suas candidaturas de forma permanente.</AppText>
                <Button fullWidth variant="danger" loading={deleting} disabled={busy || saved} onPress={excluir}>Excluir oportunidade</Button>
              </>
            ) : <AppText variant="bodySmall" color="textSecondary">Vagas em andamento, concluídas ou com contratação aceita não podem ser excluídas, para preservar o histórico profissional.</AppText>}
          </View>
        </OpportunityFormLayout>
      )}
    </ScreenContainer>
  );
}
