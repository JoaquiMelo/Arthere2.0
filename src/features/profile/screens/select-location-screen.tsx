import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import type { ThemeTokens } from '@/shared/theme/tokens';
import { useTheme } from '@/providers/theme-provider';
import { darkMapStyle } from '@/features/map/utils/map-region';
import { AppText, Button, IconButton, ScreenContainer, ScreenHeader } from '@/shared/components';
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion';

type Ponto = { latitude: number; longitude: number };

const REGIAO_PADRAO: Region = { latitude: -23.96, longitude: -46.34, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const DELTA_ZOOM = 0.006;

function montarEndereco(p?: Location.LocationGeocodedAddress) {
  if (!p) return { endereco: '', cidade: '' };
  const rua = p.street ? [p.street, p.streetNumber].filter(Boolean).join(', ') : p.name ?? '';
  const bairro = p.district ?? p.subregion ?? '';
  return {
    endereco: [rua, bairro].filter(Boolean).join(' - '),
    cidade: p.city ?? p.subregion ?? '',
  };
}

export default function SelectLocationScreen() {
  const { isDark, tokens: { color } } = useTheme();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(color), [color]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mapRef = useRef<MapView>(null);
  const requisicao = useRef(0);
  const gpsPending = useRef(false);

  const inicial = useMemo<Ponto | null>(() =>
    route.params?.latitude != null && route.params?.longitude != null
      ? { latitude: Number(route.params.latitude), longitude: Number(route.params.longitude) }
      : null,
  [route.params]);

  const [centro, setCentro] = useState<Ponto>(inicial ?? REGIAO_PADRAO);
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [busca, setBusca] = useState('');
  const [localizando, setLocalizando] = useState(false);

  const descobrirEndereco = useCallback(async (ponto: Ponto) => {
    const id = ++requisicao.current;
    setBuscandoEndereco(true);
    try {
      const [resultado] = await Location.reverseGeocodeAsync(ponto);
      if (id !== requisicao.current) return;
      const dados = montarEndereco(resultado);
      setEndereco(dados.endereco);
      setCidade(dados.cidade);
    } catch {
      if (id === requisicao.current) {
        setEndereco('');
        setCidade('');
      }
    } finally {
      if (id === requisicao.current) setBuscandoEndereco(false);
    }
  }, []);

  const irPara = useCallback((ponto: Ponto, delta = DELTA_ZOOM) =>
    mapRef.current?.animateToRegion({ ...ponto, latitudeDelta: delta, longitudeDelta: delta }, reducedMotion ? 0 : 350),
  [reducedMotion]);

  const usarMinhaLocalizacao = async () => {
    if (gpsPending.current) return;
    gpsPending.current = true;
    setLocalizando(true);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Autorize a localização para centralizar o mapa onde você está, ou arraste o mapa até o local.');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      irPara({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude });
    } catch {
      Alert.alert('Não foi possível obter a localização', 'Verifique se o GPS está ligado ou arraste o mapa até o local.');
    } finally {
      gpsPending.current = false;
      setLocalizando(false);
    }
  };

  const buscarEndereco = async () => {
    const texto = busca.trim();
    if (!texto) return;
    Keyboard.dismiss();
    try {
      if (Platform.OS === 'android' && !(await Location.requestForegroundPermissionsAsync()).granted) {
        Alert.alert('Busca indisponível', 'Autorize a localização para buscar um endereço ou arraste o mapa até o local.');
        return;
      }
      const [achado] = await Location.geocodeAsync(texto);
      if (!achado) {
        Alert.alert('Endereço não encontrado', 'Tente incluir rua, número e cidade.');
        return;
      }
      irPara({ latitude: achado.latitude, longitude: achado.longitude });
    } catch {
      Alert.alert('Busca indisponível', 'Não foi possível buscar agora. Arraste o mapa até o local.');
    }
  };

  useEffect(() => {
    const task = setTimeout(() => {
      if (inicial) descobrirEndereco(inicial);
    }, 0);
    return () => clearTimeout(task);
  }, [descobrirEndereco, inicial]);

  const confirmar = () => {
    navigation.popTo(
      'EditProfile',
      {
        localSelecionado: {
          latitude: Number(centro.latitude.toFixed(6)),
          longitude: Number(centro.longitude.toFixed(6)),
          endereco,
          cidade,
        },
      },
      { merge: true },
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Onde você atende?" onBack={() => navigation.goBack()} />

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={color.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar rua, bairro ou cidade"
          accessibilityLabel="Buscar rua, bairro ou cidade"
          placeholderTextColor={color.textSecondary}
          returnKeyType="search"
          onSubmitEditing={buscarEndereco}
        />
      </View>

      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          customMapStyle={Platform.OS === 'android' && isDark ? darkMapStyle : undefined}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
          initialRegion={inicial ? { ...inicial, latitudeDelta: DELTA_ZOOM, longitudeDelta: DELTA_ZOOM } : REGIAO_PADRAO}
          showsUserLocation
          showsMyLocationButton={false}
          onRegionChangeComplete={(regiao) => {
            const ponto = { latitude: regiao.latitude, longitude: regiao.longitude };
            setCentro(ponto);
            descobrirEndereco(ponto);
          }}
        />

        <View pointerEvents="none" style={styles.pinoArea} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.sombra} />
          <View style={styles.pino}>
            <Ionicons name="location-sharp" size={46} color={color.accentText} />
          </View>
        </View>

        <IconButton icon="locate" variant="outline" style={styles.gpsButton} loading={localizando}
          onPress={() => void usarMinhaLocalizacao()} accessibilityLabel={localizando ? 'Buscando sua localização' : 'Usar minha localização atual'} />
      </View>

      <View style={styles.card}>
        <AppText variant="label" color="textSecondary">Local escolhido</AppText>
        <AppText weight="semibold" accessibilityLiveRegion="polite">
          {buscandoEndereco ? 'Buscando o endereço…' : endereco || 'Endereço não identificado. O ponto no mapa será usado.'}
        </AppText>
        <Button fullWidth onPress={confirmar} disabled={buscandoEndereco || localizando}>Confirmar local</Button>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (color: ThemeTokens['color']) => StyleSheet.create({
  searchBox: { marginHorizontal: 16, marginVertical: 10, minHeight: 48, borderWidth: 1, borderColor: color.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8, backgroundColor: color.surface },
  searchInput: { flex: 1, paddingVertical: 11, color: color.textPrimary, fontSize: 14 },
  mapArea: { flex: 1, overflow: 'hidden' },
  pinoArea: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pino: { position: 'absolute', bottom: '50%' },
  sombra: { position: 'absolute', width: 10, height: 4, borderRadius: 5, backgroundColor: 'rgba(41,36,43,0.35)' },
  gpsButton: { position: 'absolute', right: 14, bottom: 14, backgroundColor: color.surface },
  card: { padding: 18, gap: 8, backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.border },
});
