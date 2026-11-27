import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { Button, FeedbackState, ScreenContainer, ScreenHeader } from '@/shared/components';
import { useUser } from '@/providers/user-provider';
import { confirmWithHaptic } from '@/shared/feedback';
import { useManagement } from '@/providers/management-provider';
import { criarProjeto } from '@/services/api';
import { OpportunityFormFields, OpportunityFormLayout } from '../components/opportunity-form-fields';
import { emptyOpportunityForm, validateOpportunityForm, type OpportunityForm } from '../utils/opportunity-form';

export default function CreateOpportunityScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { refresh } = useManagement();
  const [form, setForm] = useState(emptyOpportunityForm);
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);
  const allowed = user?.tipo === 'CONTRATANTE_OPORTUNIDADES';
  const dirty = Object.values(form).some((value) => value.trim());
  const { errors, payload } = validateOpportunityForm(form);

  usePreventRemove(allowed && !published && (dirty || busy), ({ data }) => {
    if (pending.current) {
      Alert.alert('Publicação em andamento', 'Aguarde a confirmação.');
      return;
    }
    Alert.alert('Descartar rascunho?', 'Os dados preenchidos serão perdidos.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  useEffect(() => {
    if (published && navigation.isFocused()) navigation.goBack();
  }, [navigation, published]);

  const setField = (key: keyof OpportunityForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const publicar = async () => {
    if (!allowed || pending.current || published) return;
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    Keyboard.dismiss();
    pending.current = true;
    setError('');
    setBusy(true);
    try {
      await criarProjeto(payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Tente novamente.');
      pending.current = false;
      setBusy(false);
      return;
    }
    setPublished(true);
    void refresh().catch(() => undefined);
    confirmWithHaptic();
    Alert.alert('Vaga publicada', 'Sua oportunidade está disponível para agentes criativos.');
  };

  return (
    <ScreenContainer>
      <ScreenHeader kicker="OPORTUNIDADES" title="Nova vaga" onBack={() => navigation.goBack()} />
      {allowed ? (
        <OpportunityFormLayout>
          <OpportunityFormFields form={form} setField={setField} busy={busy} errors={attempted ? errors : undefined} />
          {error ? <FeedbackState kind="error" title="Não foi possível publicar" description={error} /> : null}
          <Button fullWidth loading={busy && !published} disabled={published} onPress={publicar}>Publicar vaga</Button>
        </OpportunityFormLayout>
      ) : (
        <FeedbackState kind="error" title="Acesso indisponível" description="Somente contratantes de oportunidades podem publicar vagas." />
      )}
    </ScreenContainer>
  );
}
