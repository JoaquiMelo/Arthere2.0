import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import type { RootStackParamList } from '@/navigation/app-navigator';
import { palettes, type PaletteName, useTheme } from '@/providers/theme-provider';
import { useUser } from '@/providers/user-provider';
import { AppText, Button, ScreenContainer, ScreenHeader, SectionHeader } from '@/shared/components';

const paletteNames = Object.keys(palettes) as PaletteName[];

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'Settings'>>();
  const { user, logout } = useUser();
  const { paletteName, tokens, setPalette, paletteSaveFailed } = useTheme();
  const { color, dimensions, radius, spacing } = tokens;
  const [leaving, setLeaving] = useState(false);
  const pending = useRef(false);

  const editProfile = () => {
    if (user?.tipo === 'CONTRATANTE_EVENTOS') navigation.navigate('EditContractorProfile');
    else if (user?.tipo === 'CONTRATANTE_OPORTUNIDADES') navigation.navigate('EditOpportunityContractorProfile');
    else if (user) navigation.navigate('EditProfile');
  };

  const signOut = () => {
    if (pending.current) return;
    Alert.alert('Sair da conta?', 'Você poderá entrar novamente pelo mapa.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        if (pending.current) return;
        pending.current = true;
        setLeaving(true);
        try {
          await logout();
        } catch {
          Alert.alert('Não foi possível sair', 'Tente novamente em instantes.');
        } finally {
          pending.current = false;
          setLeaving(false);
        }
      } },
    ]);
  };

  const version = Constants.expoConfig?.version;
  const role = user?.tipo === 'CONTRATANTE_EVENTOS' ? 'Contratante de eventos'
    : user?.tipo === 'CONTRATANTE_OPORTUNIDADES' ? 'Contratante de oportunidades'
      : user?.tipo === 'AGENTE' ? 'Agente criativo' : 'Conta Arthere';

  return (
    <ScreenContainer>
      <ScreenHeader title="Configurações" onBack={() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('Tabs', { screen: 'Profile' });
      }} />
      <ScrollView contentContainerStyle={{
        width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center',
        padding: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing['2xl'],
      }}>
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Conta" />
          {user ? (
            <View style={{ backgroundColor: color.surfaceSubtle, borderRadius: radius.cardCompact, padding: spacing.lg, gap: spacing.sm }}>
              <AppText variant="title" weight="bold">{user.nomeSocial || user.nome || user.email}</AppText>
              <AppText variant="bodySmall" color="textSecondary">{role}</AppText>
              <Button variant="outline" disabled={leaving} onPress={editProfile}>Editar perfil</Button>
            </View>
          ) : null}
        </View>
        <View style={{ gap: spacing.md }}>
          <SectionHeader title="Aparência" description="Toque em uma paleta para aplicar. A escolha é salva neste dispositivo." />
          {paletteNames.map((name) => {
            const selected = name === paletteName;
            const sample = palettes[name];
            const swatches = [sample.brandInk, sample.brandCoral, sample.brandBlue, sample.brandSand];
            return (
              <Pressable key={name} accessibilityRole="radio" accessibilityLabel={`Paleta ${name}`}
                accessibilityState={{ checked: selected, disabled: leaving }} disabled={leaving} onPress={() => setPalette(name)}
                style={({ pressed }) => ({
                  minHeight: dimensions.control.large, padding: spacing.md, gap: spacing.sm,
                  borderRadius: radius.cardCompact, borderWidth: 1, borderColor: selected ? color.focus : color.border,
                  backgroundColor: selected ? color.surfaceSubtle : color.surface, opacity: pressed ? 0.77 : 1,
                })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <AppText weight="bold" style={{ flex: 1 }}>{name}</AppText>
                  {selected ? <AppText variant="caption" weight="bold" color="accentText">Em uso</AppText> : null}
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={dimensions.icon.medium}
                    color={selected ? color.accentText : color.textSecondary} />
                </View>
                <View style={{ flexDirection: 'row', overflow: 'hidden', borderRadius: radius.xs }}>
                  {swatches.map((backgroundColor, index) => <View key={index} style={{ flex: 1, height: spacing.md, backgroundColor }} />)}
                </View>
              </Pressable>
            );
          })}
          {paletteSaveFailed ? (
            <View accessibilityLiveRegion="polite" style={{ gap: spacing.xs }}>
              <AppText color="dangerText" variant="bodySmall">A paleta foi aplicada, mas não pôde ser salva neste dispositivo.</AppText>
              <Button variant="outline" size="small" onPress={() => setPalette(paletteName)}>Tentar salvar novamente</Button>
            </View>
          ) : null}
        </View>
        <View style={{ borderTopWidth: 1, borderColor: color.border, paddingTop: spacing.lg, gap: spacing.md }}>
          <Button fullWidth variant="danger" loading={leaving} onPress={signOut}>Sair da conta</Button>
          {version ? <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>Arthere · versão {version}</AppText> : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
