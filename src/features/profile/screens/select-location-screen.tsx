import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Keyboard, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { colors } from '@/shared/theme/colors';

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
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mapRef = useRef<MapView>(null);
  const requisicao = useRef(0);
  const elevacao = useRef(new Animated.Value(0)).current;

  const inicial: Ponto | null =
    route.params?.latitude != null && route.params?.longitude != null
      ? { latitude: Number(route.params.latitude), longitude: Number(route.params.longitude) }
      : null;

  const [centro, setCentro] = useState<Ponto>(inicial ?? REGIAO_PADRAO);
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [busca, setBusca] = useState('');
  const [localizando, setLocalizando] = useState(false);

  const levantarPino = (alto: boolean) =>
    Animated.spring(elevacao, { toValue: alto ? -14 : 0, useNativeDriver: true, friction: 7 }).start();

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

  const irPara = (ponto: Ponto, delta = DELTA_ZOOM) =>
    mapRef.current?.animateToRegion({ ...ponto, latitudeDelta: delta, longitudeDelta: delta }, 600);

  const usarMinhaLocalizacao = async (silencioso = false) => {
    setLocalizando(true);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) {
        if (!silencioso) Alert.alert('Permissão necessária', 'Autorize a localização para centralizar o mapa onde você está, ou arraste o mapa até o local.');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      irPara({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude });
    } catch {
      if (!silencioso) Alert.alert('Não foi possível obter a localização', 'Verifique se o GPS está ligado ou arraste o mapa até o local.');
    } finally {
      setLocalizando(false);
    }
  };

  const buscarEndereco = async () => {
    const texto = busca.trim();
    if (!texto) return;
    Keyboard.dismiss();
    try {
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
    if (inicial) descobrirEndereco(inicial);
    else usarMinhaLocalizacao(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={25} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Onde você atende?</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar rua, bairro ou cidade"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          onSubmitEditing={buscarEndereco}
        />
      </View>

      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={inicial ? { ...inicial, latitudeDelta: DELTA_ZOOM, longitudeDelta: DELTA_ZOOM } : REGIAO_PADRAO}
          showsUserLocation
          showsMyLocationButton={false}
          onPanDrag={() => levantarPino(true)}
          onRegionChangeComplete={(regiao) => {
            levantarPino(false);
            const ponto = { latitude: regiao.latitude, longitude: regiao.longitude };
            setCentro(ponto);
            descobrirEndereco(ponto);
          }}
        />

        <View pointerEvents="none" style={styles.pinoArea}>
          <View style={styles.sombra} />
          <Animated.View style={[styles.pino, { transform: [{ translateY: elevacao }] }]}>
            <Ionicons name="location-sharp" size={46} color={colors.primary} />
          </Animated.View>
        </View>

        <TouchableOpacity style={styles.gpsButton} onPress={() => usarMinhaLocalizacao()} accessibilityLabel="Usar minha localização atual">
          {localizando ? <ActivityIndicator color={colors.primaryDark} /> : <Ionicons name="locate" size={22} color={colors.primaryDark} />}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Local escolhido</Text>
        {buscandoEndereco ? (
          <ActivityIndicator style={styles.cardLoading} color={colors.primaryDark} />
        ) : (
          <Text style={styles.cardEndereco} numberOfLines={2}>
            {endereco || 'Endereço não identificado. O ponto no mapa será usado.'}
          </Text>
        )}
        <TouchableOpacity style={[styles.confirmButton, buscandoEndereco && styles.confirmDisabled]} onPress={confirmar} disabled={buscandoEndereco}>
          <Text style={styles.confirmText}>Confirmar local</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  searchBox: { marginHorizontal: 16, marginBottom: 10, minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 8, backgroundColor: colors.white },
  searchInput: { flex: 1, paddingVertical: 11, color: colors.text, fontSize: 14 },
  mapArea: { flex: 1, overflow: 'hidden' },
  pinoArea: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pino: { position: 'absolute', bottom: '50%' },
  sombra: { position: 'absolute', width: 10, height: 4, borderRadius: 5, backgroundColor: 'rgba(41,36,43,0.35)' },
  gpsButton: { position: 'absolute', right: 14, bottom: 14, width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  card: { padding: 18, gap: 8, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  cardEndereco: { color: colors.text, fontSize: 15, fontWeight: '700', minHeight: 40 },
  cardLoading: { alignSelf: 'flex-start', minHeight: 40 },
  confirmButton: { height: 50, marginTop: 6, borderRadius: 9, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  confirmDisabled: { opacity: 0.6 },
  confirmText: { color: colors.white, fontSize: 15, fontWeight: '800' },
});
