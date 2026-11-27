import { useRef, type ComponentRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInput } from 'react-native';
import { SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { formatDateInput, type OpportunityForm } from '../utils/opportunity-form';

export function OpportunityFormLayout({ children }: { children: ReactNode }) {
  const { spacing, dimensions } = useThemeTokens();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center',
          padding: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing['2xl'],
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type Props = {
  form: OpportunityForm;
  setField: (key: keyof OpportunityForm, value: string) => void;
  busy: boolean;
  errors?: Partial<Record<keyof OpportunityForm, string>>;
};

export function OpportunityFormFields({ form, setField, busy, errors }: Props) {
  const { spacing, color } = useThemeTokens();
  const categoryInput = useRef<ComponentRef<typeof TextInput>>(null);
  const descriptionInput = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <>
      <View style={{ gap: spacing.lg }}>
        <SectionHeader title="Sobre o trabalho" description="Os campos com asterisco são obrigatórios." />
        <TextField
          label="Título da vaga *" value={form.titulo} onChangeText={(value) => setField('titulo', value)}
          placeholder="Ex.: Fotógrafo para ensaio" editable={!busy} error={errors?.titulo}
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => categoryInput.current?.focus()}
        />
        <TextField
          ref={categoryInput} label="Categoria *" value={form.categoria} onChangeText={(value) => setField('categoria', value)}
          placeholder="Ex.: Fotografia, música, design" editable={!busy} error={errors?.categoria}
          returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => descriptionInput.current?.focus()}
        />
        <TextField
          ref={descriptionInput} label="Descrição *" value={form.descricao} onChangeText={(value) => setField('descricao', value)}
          placeholder="Descreva o trabalho, os requisitos e o resultado esperado."
          multiline numberOfLines={5} textAlignVertical="top" editable={!busy} error={errors?.descricao}
        />
      </View>
      <View style={{ paddingTop: spacing.xl, gap: spacing.lg, borderTopWidth: 1, borderTopColor: color.border }}>
        <SectionHeader title="Condições do trabalho" />
        <TextField
          label="Orçamento (R$)" value={form.orcamento} onChangeText={(value) => setField('orcamento', value)}
          placeholder="Ex.: 1500,00" keyboardType="decimal-pad" editable={!busy}
          helperText="Deixe em branco para combinar o valor." error={errors?.orcamento}
        />
        <TextField
          label="Data prevista (opcional)" value={form.data} onChangeText={(value) => setField('data', formatDateInput(value))}
          placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} editable={!busy}
          helperText="Indique quando o trabalho deve acontecer." error={errors?.data}
        />
      </View>
    </>
  );
}
