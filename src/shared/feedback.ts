import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function confirmWithHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }
}
