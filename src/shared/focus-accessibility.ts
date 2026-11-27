import type { ComponentRef, RefObject } from 'react';
import { AccessibilityInfo, Platform, type Text } from 'react-native';

export function focusAccessibilityHeading(ref: RefObject<ComponentRef<typeof Text> | null>) {
  const heading = ref.current;
  if (!heading || !(Platform.OS === 'ios' || Platform.OS === 'android')) return;
  void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
    if (enabled && ref.current === heading) AccessibilityInfo.sendAccessibilityEvent(heading, 'focus');
  }).catch(() => undefined);
}
