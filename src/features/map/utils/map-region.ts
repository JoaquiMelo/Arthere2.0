import type { MapStyleElement, Region } from 'react-native-maps';

export const regionalMap: Region = {
  latitude: -23.96,
  longitude: -46.34,
  latitudeDelta: 0.45,
  longitudeDelta: 0.45,
};

export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#24252B' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#DDD5CE' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#24252B' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#41404A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#182430' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#273530' }] },
];
