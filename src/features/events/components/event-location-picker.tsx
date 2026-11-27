import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import { darkMapStyle, regionalMap } from '@/features/map/utils/map-region';
import { useTheme } from '@/providers/theme-provider';
import { AppText, Button, ScreenContainer, ScreenHeader } from '@/shared/components';

const zoom = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

export function EventLocationPicker({ initialPoint, onCancel, onConfirm }: {
  initialPoint: LatLng | null;
  onCancel: () => void;
  onConfirm: (point: LatLng) => void;
}) {
  const { isDark, tokens: { color, spacing } } = useTheme();
  const map = useRef<MapView>(null);
  const active = useRef(true);
  const [point, setPoint] = useState(initialPoint);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const locate = async () => {
    if (pending.current) return;
    pending.current = true;
    setLocating(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active.current) return;
      if (!permission.granted) {
        setError('Autorize a localização para usar o GPS. Você também pode marcar o local no mapa.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!active.current) return;
      const current = { latitude: coords.latitude, longitude: coords.longitude };
      setPoint(current);
      map.current?.animateToRegion({ ...current, ...zoom }, 350);
    } catch {
      if (active.current) setError('Não foi possível obter sua localização. Marque o local no mapa ou tente novamente.');
    } finally {
      pending.current = false;
      if (active.current) setLocating(false);
    }
  };

  return (
    <Modal visible onRequestClose={onCancel} presentationStyle="fullScreen">
      <ScreenContainer accessibilityViewIsModal>
        <ScreenHeader title="Local do evento" description="Toque no mapa para posicionar o pino ou use sua localização atual." onBack={onCancel} />
        <View style={{ flex: 1, backgroundColor: color.surfaceSubtle }}>
          <MapView ref={map} style={StyleSheet.absoluteFill} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialPoint ? { ...initialPoint, ...zoom } : regionalMap}
            customMapStyle={Platform.OS === 'android' && isDark ? darkMapStyle : undefined}
            userInterfaceStyle={isDark ? 'dark' : 'light'} pitchEnabled={false} onPress={({ nativeEvent }) => {
              if (!pending.current) {
                setPoint(nativeEvent.coordinate);
                setError('');
              }
            }}>
            {point ? <Marker coordinate={point} title="Local escolhido" /> : null}
          </MapView>
        </View>
        <View style={{ gap: spacing.sm, padding: spacing.lg }}>
          {error ? <AppText color="dangerText" variant="bodySmall" accessibilityRole="alert">{error}</AppText> : null}
          <Button variant="outline" loading={locating} accessibilityLabel={locating ? 'Buscando sua localização' : undefined}
            onPress={() => void locate()}>Usar minha localização</Button>
          <Button disabled={!point || locating} onPress={() => {
            if (point && !pending.current) onConfirm(point);
          }}>Confirmar local do evento</Button>
        </View>
      </ScreenContainer>
    </Modal>
  );
}
