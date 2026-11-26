import type { ViewStyle } from 'react-native';

/** Elevações discretas, compatíveis com iOS e Android. */
export const elevation = {
  none: {} satisfies ViewStyle,
  low: {
    shadowColor: '#29242B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  } satisfies ViewStyle,
  medium: {
    shadowColor: '#29242B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
  high: {
    shadowColor: '#29242B',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
} as const;
