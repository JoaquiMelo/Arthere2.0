import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { useUser } from '@/providers/user-provider';
import { AppText, Button, IconButton, ScreenContainer, ScreenHeader, TextField } from '@/shared/components';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'Login'>>();
  const { login } = useUser();
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const emailAddress = email.trim().toLowerCase();
  const emailError = !emailAddress ? 'Informe seu e-mail.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(emailAddress) ? 'Informe um e-mail válido.' : undefined;

  const signIn = async () => {
    if (pending.current) return;
    setAttempted(true);
    setError('');
    if (emailError || !password) return;
    pending.current = true;
    setBusy(true);
    try {
      await login(emailAddress, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader kicker="ARTHERE" title="Entrar" onBack={() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Map');
      }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{
          alignSelf: 'center', width: '100%', maxWidth: dimensions.contentMaxWidth, padding: spacing.xl, gap: spacing.xl,
        }}>
          <View style={{ backgroundColor: color.accentSoft, padding: spacing.lg, gap: spacing.xs, borderRadius: radius.card }}>
            <AppText variant="h2" weight="heavy">Seu espaço criativo</AppText>
            <AppText variant="bodySmall">Encontre oportunidades, eventos e profissionais na Baixada Santista.</AppText>
          </View>
          <TextField label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
            keyboardType="email-address" autoComplete="email" editable={!busy} error={attempted ? emailError : undefined} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
            <TextField label="Senha" value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
              autoComplete="current-password" editable={!busy} error={attempted && !password ? 'Informe sua senha.' : undefined}
              containerStyle={{ flex: 1, minWidth: 0 }} onSubmitEditing={() => void signIn()} />
            <IconButton icon={showPassword ? 'eye-off-outline' : 'eye-outline'} size="medium" variant="outline"
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword((current) => !current)} />
          </View>
          {error ? <AppText color="dangerText" accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</AppText> : null}
          <Button fullWidth loading={busy} onPress={() => void signIn()}>Entrar</Button>
          <Button fullWidth variant="outline" disabled={busy} onPress={() => navigation.navigate('Register')}>Criar conta</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
