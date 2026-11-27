import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { uploadImage } from '@/services/api';

export function useOnboardingPhoto() {
  const [uri, setUri] = useState('');
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const uploaded = useRef<{ local: string; remote: string } | null>(null);

  const pick = async () => {
    if (active.current) return;
    active.current = true;
    setPicking(true);
    setError('');
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setError('Autorize o acesso à galeria para escolher uma foto de perfil.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
    } catch {
      setError('Não foi possível abrir a galeria. Tente novamente.');
    } finally {
      active.current = false;
      setPicking(false);
    }
  };
  const upload = async () => {
    if (!uri) return undefined;
    if (uploaded.current?.local === uri) return uploaded.current.remote;
    const remote = await uploadImage(uri);
    uploaded.current = { local: uri, remote };
    return remote;
  };
  const clear = () => {
    setUri('');
    setError('');
  };

  return { uri, picking, error, active, pick, upload, clear };
}
