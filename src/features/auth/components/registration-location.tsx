import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { AppText, FeedbackState, IconButton, ScreenContainer, TextField } from '@/shared/components';
import { buscarCidades, ESTADOS_BR, type CidadeBR } from '@/shared/config/brazil-location';
import { useThemeTokens } from '@/shared/theme/use-theme-tokens';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function RegistrationLocation({ state, city, stateError, cityError, onState, onCity }: {
  state: string; city: string; stateError?: string; cityError?: string;
  onState: (state: string) => void; onCity: (city: string) => void;
}) {
  const { color, dimensions, radius, spacing } = useThemeTokens();
  const [picker, setPicker] = useState<'state' | 'city' | null>(null);
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<CidadeBR[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (picker !== 'city' || !state) return;
    let active = true;
    void buscarCidades(state).then((result) => {
      if (active) setCities(result);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [picker, retry, state]);

  const openCities = () => {
    setCities(null);
    setFailed(false);
    setSearch('');
    setPicker('city');
  };
  const field = (label: string, value: string, placeholder: string, onPress: () => void, error?: string, disabled = false) => (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" weight="semibold">{label}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${value || placeholder}`}
        accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
        style={({ pressed }) => ({
          minHeight: dimensions.control.medium, borderWidth: 1, borderColor: error ? color.dangerText : color.border,
          borderRadius: radius.control, backgroundColor: color.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
          flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed || disabled ? 0.65 : 1,
        })}>
        <AppText color={value ? 'textPrimary' : 'textSecondary'} style={{ flex: 1 }}>{value || placeholder}</AppText>
        <Ionicons name="chevron-down" color={color.textSecondary} size={dimensions.icon.small} />
      </Pressable>
      {error ? <AppText variant="caption" color="dangerText" accessibilityRole="alert">{error}</AppText> : null}
    </View>
  );
  const choosingCity = picker === 'city';
  const options = choosingCity
    ? (cities ?? []).filter((item) => normalize(item.nome).includes(normalize(search))).map((item) => ({ key: String(item.id), label: item.nome }))
    : ESTADOS_BR.map(({ sigla, nome }) => ({ key: sigla, label: nome }));

  return (
    <>
      {field('Estado', ESTADOS_BR.find((item) => item.sigla === state)?.nome ?? '', 'Selecione o estado', () => setPicker('state'), stateError)}
      {field('Cidade', city, state ? 'Selecione a cidade' : 'Selecione o estado primeiro', openCities, cityError, !state)}
      {picker ? (
        <Modal visible onRequestClose={() => setPicker(null)}>
          <ScreenContainer>
            <View accessibilityViewIsModal style={{ width: '100%', maxWidth: dimensions.contentMaxWidth, alignSelf: 'center', flex: 1, padding: spacing.xl, gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <AppText variant="h2" weight="heavy" accessibilityRole="header" style={{ flex: 1 }}>
                  {choosingCity ? 'Escolha a cidade' : 'Escolha o estado'}
                </AppText>
                <IconButton icon="close" accessibilityLabel="Fechar seleção" onPress={() => setPicker(null)} />
              </View>
              {choosingCity && failed ? (
                <FeedbackState kind="error" title="Cidades indisponíveis" description="Confira sua conexão e tente novamente."
                  onRetry={() => { setFailed(false); setRetry((value) => value + 1); }} />
              ) : choosingCity && !cities ? (
                <FeedbackState kind="loading" title="Carregando cidades…" />
              ) : (
                <>
                  {choosingCity ? <TextField label="Buscar cidade" value={search} onChangeText={setSearch} autoCorrect={false} /> : null}
                  <FlatList data={options} keyExtractor={(item) => item.key} keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={<FeedbackState kind="empty" title="Nenhuma cidade encontrada" description="Experimente outro nome." />}
                    renderItem={({ item }) => {
                      const selected = choosingCity ? item.label === city : item.key === state;
                      return (
                        <Pressable accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected }}
                          onPress={() => {
                            if (choosingCity) {
                              onCity(item.label);
                              setPicker(null);
                            } else {
                              onState(item.key);
                              openCities();
                            }
                          }} style={({ pressed }) => ({
                            minHeight: dimensions.control.medium, paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
                            borderBottomWidth: 1, borderColor: color.border, flexDirection: 'row', alignItems: 'center',
                            gap: spacing.md, opacity: pressed ? 0.65 : 1,
                          })}>
                          <AppText style={{ flex: 1 }}>{item.label}</AppText>
                          {selected ? <Ionicons name="checkmark" size={dimensions.icon.small} color={color.accentText} /> : null}
                        </Pressable>
                      );
                    }} />
                </>
              )}
            </View>
          </ScreenContainer>
        </Modal>
      ) : null}
    </>
  );
}
