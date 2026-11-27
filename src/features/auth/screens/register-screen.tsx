import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { BackHandler, Keyboard, Pressable, View } from 'react-native';
import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser, type TipoUsuario } from '@/providers/user-provider';
import { AppText, Button, SectionHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';
import { ProfileFormLayout } from '../components/profile-form-layout';
import { RegistrationLocation } from '../components/registration-location';

type Role = Exclude<TipoUsuario, 'ADMIN'>;
const roles: { value: Role; title: string; description: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'AGENTE', title: 'Agente criativo', description: 'Mostre seu trabalho e encontre oportunidades.', icon: 'color-palette-outline' },
  { value: 'CONTRATANTE_EVENTOS', title: 'Contratante de eventos', description: 'Publique eventos e gerencie solicitações de participação.', icon: 'calendar-outline' },
  { value: 'CONTRATANTE_OPORTUNIDADES', title: 'Contratante de oportunidades', description: 'Publique vagas e acompanhe candidaturas.', icon: 'briefcase-outline' },
];
const steps = [
  { title: 'Crie sua conta', description: 'Escolha como você quer participar da rede criativa da Baixada Santista.' },
  { title: 'Dados do perfil', description: 'Preencha as informações iniciais do seu tipo de conta.' },
  { title: 'Dados de acesso', description: 'Use um e-mail ao qual você tem acesso.' },
] as const;
type Step = 0 | 1 | 2;

const initial = {
  nome: '', nomeSocial: '', pronomes: '', cpfCnpj: '', email: '', senha: '', confirmarSenha: '',
  especialidade: '', bio: '', empresa: '', categoria: '', areaOportunidades: '', telefone: '', site: '', estado: '', cidade: '', endereco: '',
};
type Field = keyof typeof initial;
type Errors = Partial<Record<Field | 'termos', string>>;

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Register'>>();
  const { register } = useUser();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [role, setRole] = useState<Role>('AGENTE');
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState(initial);
  const [accepted, setAccepted] = useState(false);
  const [moreDetails, setMoreDetails] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const organizer = role === 'CONTRATANTE_EVENTOS';
  const agent = role === 'AGENTE';

  const move = useCallback((next: Step) => {
    Keyboard.dismiss();
    setStep(next);
    setErrors({});
    setFailure('');
  }, []);
  const back = useCallback(() => {
    if (pending.current) return;
    if (step === 2) move(1);
    else if (step === 1) move(0);
    else navigation.goBack();
  }, [move, navigation, step]);
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === 0 && !busy });
  }, [busy, navigation, step]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pending.current) return true;
      if (step === 0) return false;
      back();
      return true;
    });
    return () => subscription.remove();
  }, [back, step]));

  const clearErrors = (...keys: (Field | 'termos')[]) => {
    setErrors((current) => {
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });
    setFailure('');
  };
  const edit = (field: Field, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'senha') clearErrors('senha', 'confirmarSenha');
    else clearErrors(field);
  };
  const field = (key: Field, label: string, props: Partial<ComponentProps<typeof TextField>> = {}) => (
    <TextField {...props} label={label} value={draft[key]} error={errors[key]} editable={!busy}
      onChangeText={(value) => edit(key, key === 'email' ? value.replace(/\s/g, '') : value)} />
  );
  const profileErrors = () => {
    const next: Errors = {};
    if (!draft.nome.trim()) next.nome = 'Informe seu nome completo.';
    if (!draft.estado) next.estado = 'Escolha um estado.';
    if (!draft.cidade) next.cidade = 'Escolha uma cidade.';
    if (agent && !draft.especialidade.trim()) next.especialidade = 'Informe sua área de atuação.';
    if (organizer) {
      if (!draft.cpfCnpj.trim()) next.cpfCnpj = 'Informe o CPF ou CNPJ da organização responsável.';
      if (!draft.empresa.trim()) next.empresa = 'Informe o nome da organização.';
      if (!draft.categoria.trim()) next.categoria = 'Informe o segmento da organização.';
    }
    return next;
  };
  const next = async () => {
    if (pending.current) return;
    if (step === 0) { move(1); return; }
    const profile = profileErrors();
    if (Object.keys(profile).length) {
      if (step === 2) move(1);
      setErrors(profile);
      return;
    }
    if (step === 1) { move(2); return; }

    const email = draft.email.trim().toLowerCase();
    const access: Errors = {};
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) access.email = 'Informe um e-mail válido.';
    if (draft.senha.length < 8) access.senha = 'Use pelo menos 8 caracteres.';
    if (!draft.confirmarSenha || draft.senha !== draft.confirmarSenha) access.confirmarSenha = 'Repita a mesma senha.';
    if (!accepted) access.termos = 'Confirme a leitura e aceitação para continuar.';
    setErrors(access);
    if (Object.keys(access).length) return;
    Keyboard.dismiss();
    pending.current = true;
    setBusy(true);
    setFailure('');
    const optional = (key: Field) => draft[key].trim() || undefined;
    try {
      await register({
        tipo: role, nome: draft.nome.trim(),
        nomeSocial: agent ? undefined : optional('nomeSocial'), pronomes: agent ? undefined : optional('pronomes'),
        email, senha: draft.senha, especialidade: agent ? optional('especialidade') : undefined,
        cpfCnpj: organizer ? optional('cpfCnpj') : undefined, empresa: organizer ? optional('empresa') : undefined,
        categoria: agent ? undefined : optional(organizer ? 'categoria' : 'areaOportunidades'), telefone: agent ? undefined : optional('telefone'),
        descricao: agent ? optional('bio') : undefined, site: organizer ? optional('site') : undefined,
        estado: draft.estado, cidade: draft.cidade, endereco: optional('endereco'),
      });
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <ProfileFormLayout {...steps[step]} kicker={`Etapa ${step + 1} de 3`} step={step} onBack={busy ? undefined : back}>
      {step === 0 ? (
        <>
          <SectionHeader title="Tipo de perfil" />
          <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
            {roles.map(({ value, title, description, icon }) => {
              const selected = value === role;
              return (
                <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${title}. ${description}`}
                  accessibilityState={{ checked: selected }} onPress={() => setRole(value)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: dimensions.control.large,
                    borderWidth: 1, borderColor: selected ? color.accentText : color.border, borderRadius: radius.cardCompact,
                    backgroundColor: selected ? color.accentSoft : color.surface, padding: spacing.lg, opacity: pressed ? 0.78 : 1,
                  })}>
                  <Ionicons name={icon} size={dimensions.icon.medium} color={color.accentText} />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <AppText variant="title" weight="bold">{title}</AppText>
                    <AppText variant="bodySmall" color="textSecondary">{description}</AppText>
                  </View>
                  <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={dimensions.icon.small} color={selected ? color.accentText : color.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : step === 1 ? (
        <>
          <SectionHeader title={roles.find((item) => item.value === role)!.title} />
          {field('nome', 'Nome completo', { autoComplete: 'name', autoCapitalize: 'words' })}
          {agent ? field('especialidade', 'Área de atuação', { placeholder: 'Ex.: Fotografia, design ou música' }) : null}
          {organizer ? (
            <>
              {field('empresa', 'Nome da organização', { autoCapitalize: 'words' })}
              {field('cpfCnpj', 'CPF ou CNPJ da organização', { keyboardType: 'number-pad' })}
              {field('categoria', 'Segmento da organização', { placeholder: 'Ex.: Produção cultural' })}
            </>
          ) : null}
          <RegistrationLocation state={draft.estado} city={draft.cidade} stateError={errors.estado} cityError={errors.cidade}
            onState={(estado) => {
              setDraft((current) => current.estado === estado ? current : { ...current, estado, cidade: '' });
              clearErrors('estado', 'cidade');
            }} onCity={(city) => edit('cidade', city)} />
          <Button variant="outline" accessibilityState={{ expanded: moreDetails }} onPress={() => setMoreDetails((open) => !open)}>
            {moreDetails ? 'Ocultar dados opcionais' : 'Adicionar dados opcionais'}
          </Button>
          {moreDetails ? (
            <>
              {!agent ? field('nomeSocial', 'Nome social', { autoCapitalize: 'words' }) : null}
              {!agent ? field('pronomes', 'Pronomes', { placeholder: 'Ex.: ela/dela' }) : null}
              {!agent && !organizer ? field('areaOportunidades', 'Área das oportunidades', { placeholder: 'Ex.: Design e produção cultural' }) : null}
              {field('endereco', 'Endereço', { placeholder: 'Rua, número e bairro' })}
              {!agent ? field('telefone', 'Telefone de contato', { keyboardType: 'phone-pad', autoComplete: 'tel' }) : null}
              {organizer ? field('site', 'Site da organização', { keyboardType: 'url', autoCapitalize: 'none', autoCorrect: false }) : null}
              {agent ? field('bio', 'Sobre você', { multiline: true, numberOfLines: 4, textAlignVertical: 'top', placeholder: 'Conte o que você faz.' }) : null}
            </>
          ) : null}
        </>
      ) : (
        <>
          {field('email', 'E-mail', { keyboardType: 'email-address', autoComplete: 'email', autoCapitalize: 'none', autoCorrect: false })}
          {field('senha', 'Senha', { secureTextEntry: !passwordVisible, autoComplete: 'new-password', autoCapitalize: 'none', autoCorrect: false, helperText: 'Pelo menos 8 caracteres.' })}
          {field('confirmarSenha', 'Confirmar senha', { secureTextEntry: !passwordVisible, autoComplete: 'new-password', autoCapitalize: 'none', autoCorrect: false })}
          <Button variant="ghost" size="small" disabled={busy} accessibilityState={{ selected: passwordVisible }}
            onPress={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? 'Ocultar senhas' : 'Mostrar senhas'}</Button>
          <View style={{ gap: spacing.xs }}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted, disabled: busy }}
              accessibilityLabel="Li e aceito os termos de uso e a política de privacidade da Arthere."
              disabled={busy} onPress={() => { setAccepted((value) => !value); clearErrors('termos'); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: dimensions.control.medium }}>
              <Ionicons name={accepted ? 'checkbox-outline' : 'square-outline'} color={color.accentText} size={dimensions.icon.medium} />
              <AppText variant="bodySmall" style={{ flex: 1 }}>Li e aceito os termos de uso e a política de privacidade da Arthere.</AppText>
            </Pressable>
            {errors.termos ? <AppText variant="caption" color="dangerText" accessibilityRole="alert">{errors.termos}</AppText> : null}
          </View>
        </>
      )}
      <View style={{ gap: spacing.sm }}>
        {Object.keys(errors).length ? <AppText variant="bodySmall" color="dangerText" accessibilityRole="alert">Revise os campos indicados acima.</AppText> : null}
        {failure ? <AppText variant="bodySmall" color="dangerText" accessibilityRole="alert">{failure}</AppText> : null}
        <Button fullWidth loading={busy} accessibilityLabel={busy ? 'Criando conta' : undefined}
          onPress={() => void next()}>{step === 2 ? 'Criar conta' : 'Continuar'}</Button>
        {step === 0 ? <Button variant="ghost" onPress={() => navigation.popTo('Login')}>Já tenho conta</Button> : null}
      </View>
    </ProfileFormLayout>
  );
}
