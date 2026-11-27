import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    let active = true;
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      receivedChange = true;
      setReduced(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !receivedChange) setReduced(enabled);
    }).catch(() => undefined);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
