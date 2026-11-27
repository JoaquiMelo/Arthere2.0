import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** Android recebe o mesmo texto pela região ativa da interface. */
export function useStatusAnnouncement(message?: string) {
  useEffect(() => {
    if (Platform.OS === 'ios' && message) {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
    }
  }, [message]);
}
