import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { AppText, Button, FeedbackState, ScreenContainer, ScreenHeader, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { useUser } from '@/providers/user-provider';
import { useManagement } from '@/providers/management-provider';
import { criarProjeto } from '@/services/api';

export default function CreateOpportunityScreen() {
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const { refresh } = useManagement();
  const { color, spacing, radius } = useThemeTokens();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);
  const raw = orcamento.trim();
  const amount = raw ? Number(raw.replace(',', '.')) : undefined;
  const invalidAmount = raw !== '' && (!/^\d+([,.]\d{1,2})?$/.test(raw) || !Number.isFinite(amount) || Number(amount) < 0);

  const publicar = async () => {
    if (user?.tipo !== 'CONTRATANTE_OPORTUNIDADES' || pending.current) return;
    setAttempted(true);
    if (!titulo.trim() || !descricao.trim() || !categoria.trim() || invalidAmount) return;
    pending.current = true;
    setBusy(true);
    try {
      await criarProjeto({ titulo: titulo.trim(), descricao: descricao.trim(), categoria: categoria.trim(), orcamento: amount });
    } catch (error) {
      Alert.alert('Não foi possível publicar', error instanceof Error ? error.message : 'Tente novamente.');
      pending.current = false;
      setBusy(false);
      return;
    }
    // A publicação já foi confirmada: falha ao recarregar não deve causar novo POST.
    try {
      await refresh();
    } catch {
      // O perfil e a lista também reconsultam os dados ao receber foco.
    }
    pending.current = false;
    setBusy(false);
    navigation.goBack();
    Alert.alert('Vaga publicada', 'Sua oportunidade está disponível para agentes criativos.');
  };

  if (user?.tipo !== 'CONTRATANTE_OPORTUNIDADES') return <ScreenContainer><FeedbackState kind="error" title="Acesso indisponível" description="Somente contratantes de oportunidades podem publicar vagas." /><Button variant="ghost" onPress={() => navigation.goBack()}>Voltar</Button></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScreenHeader kicker="ARTHERE / OPORTUNIDADES" title="Nova vaga" onBack={busy ? undefined : () => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing['3xl'] }}>
          <View style={{ padding: spacing.lg, borderRadius: radius.cardCompact, backgroundColor: color.accentSoft, gap: spacing.xs }}>
            <AppText variant="h3" weight="bold" color="textPrimary">Encontre o talento certo.</AppText>
            <AppText color="textPrimary" variant="bodySmall">Apresente seu projeto e o tipo de profissional criativo que você procura.</AppText>
          </View>
          <SectionHeader title="Sobre a oportunidade" description="Os campos com asterisco são obrigatórios." />
          <TextField label="Título da vaga *" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Fotógrafo para ensaio" editable={!busy} error={attempted && !titulo.trim() ? 'Informe o título.' : undefined} />
          <TextField label="Categoria *" value={categoria} onChangeText={setCategoria} placeholder="Ex.: Fotografia, música, design" editable={!busy} error={attempted && !categoria.trim() ? 'Informe a categoria.' : undefined} />
          <TextField label="Descrição *" value={descricao} onChangeText={setDescricao} placeholder="Descreva o trabalho, os requisitos e o resultado esperado." multiline numberOfLines={5} textAlignVertical="top" editable={!busy} error={attempted && !descricao.trim() ? 'Descreva o trabalho.' : undefined} />
          <TextField label="Orçamento (R$)" value={orcamento} onChangeText={setOrcamento} placeholder="Ex.: 1500,00" keyboardType="decimal-pad" editable={!busy} helperText="Opcional. Se não preencher, ficará a combinar." error={attempted && invalidAmount ? 'Informe um valor válido, sem separador de milhar.' : undefined} />
          <Button fullWidth loading={busy} onPress={publicar}>Publicar vaga</Button>
          <Button fullWidth variant="outline" disabled={busy} onPress={() => navigation.goBack()}>Cancelar</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
