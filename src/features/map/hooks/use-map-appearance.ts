import { useMemo } from 'react';
import { Platform } from 'react-native';
import type { MapStyleElement, MapViewProps } from 'react-native-maps';
import { useTheme } from '@/providers/theme-provider';

type MapAppearance = Pick<MapViewProps, 'customMapStyle' | 'userInterfaceStyle'>;

const defaultMapStyle: MapStyleElement[] = [];

export function useMapAppearance(): MapAppearance {
  const { isDark, tokens: { color } } = useTheme();
  return useMemo(() => ({
    userInterfaceStyle: isDark ? 'dark' : 'light',
    // O mapa do Google usa uma lista vazia para restaurar o estilo original.
    customMapStyle: Platform.OS !== 'android' ? undefined : !isDark ? defaultMapStyle : [
      { elementType: 'geometry', stylers: [{ color: color.surfaceElevated }] },
      { elementType: 'labels.text.fill', stylers: [{ color: color.textPrimary }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: color.surfaceElevated }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: color.surfaceStrong }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: color.background }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: color.accentSoft }] },
    ],
  }), [color, isDark]);
}
